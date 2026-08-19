package com.duavero.modules.tenant.service;

import com.duavero.core.exception.BusinessException;
import com.duavero.core.exception.ResourceNotFoundException;
import com.duavero.core.exception.UnauthorizedException;
import com.duavero.core.security.UserPrincipal;
import com.duavero.modules.audit.model.AuditLog;
import com.duavero.modules.audit.repository.AuditLogRepository;
import com.duavero.modules.auth.dto.UserDto;
import com.duavero.modules.auth.model.Role;
import com.duavero.modules.auth.model.User;
import com.duavero.modules.auth.repository.RoleRepository;
import com.duavero.modules.auth.repository.UserRefreshTokenRepository;
import com.duavero.modules.auth.repository.UserRepository;
import com.duavero.modules.auth.service.AuthService;
import com.duavero.modules.subscription.model.PackageLimit;
import com.duavero.modules.subscription.model.Subscription;
import com.duavero.modules.subscription.repository.PackageLimitRepository;
import com.duavero.modules.subscription.repository.SubscriptionRepository;
import com.duavero.modules.auth.model.Permission;
import com.duavero.modules.auth.repository.PermissionRepository;
import com.duavero.modules.tenant.dto.CreateTenantUserRequest;
import com.duavero.modules.tenant.dto.RoleMatrixDto;
import com.duavero.modules.tenant.dto.UpdateUserStatusRequest;
import com.duavero.modules.tenant.model.TenantLimitOverride;
import com.duavero.modules.tenant.repository.TenantLimitOverrideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRefreshTokenRepository refreshTokenRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PackageLimitRepository packageLimitRepository;
    private final TenantLimitOverrideRepository limitOverrideRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<UserDto> getTenantUsers(UserPrincipal currentUser) {
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null) {
            throw new UnauthorizedException("Super Admin must use platform user APIs.");
        }

        return userRepository.findByTenantId(tenantId).stream()
                .map(authService::mapToUserDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto createTenantUser(CreateTenantUserRequest request, UserPrincipal currentUser,
                                    String ipAddress, String userAgent, String correlationId) {
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null) {
            throw new UnauthorizedException("Tenant context is required to create a tenant user.");
        }

        // 1. Security Check: Cannot create SUPER_ADMIN from tenant endpoint
        String roleCode = request.getRoleCode().trim().toUpperCase();
        if ("SUPER_ADMIN".equalsIgnoreCase(roleCode)) {
            throw new BusinessException("Tenant administrators cannot create Super Admin accounts.");
        }

        // 2. Check Email Uniqueness
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("A user with email '" + email + "' already exists.");
        }

        // 3. Enforce Staff Quota Limits
        checkTenantStaffLimit(tenantId);

        // 4. Resolve Target Role
        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "code", roleCode));

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        // 5. Password Handling
        String plainPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword() : "Temp@" + UUID.randomUUID().toString().substring(0, 8);

        String userType = "TENANT_ADMIN".equalsIgnoreCase(roleCode) ? "TENANT_ADMIN" : "TENANT_STAFF";

        User user = User.builder()
                .tenantId(tenantId)
                .email(email)
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .passwordHash(passwordEncoder.encode(plainPassword))
                .userType(userType)
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "ACTIVE")
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        recordAuditLog(tenantId, currentUser.getUserId(), currentUser.getEmail(), "USER_CREATED",
                "User", String.valueOf(savedUser.getId()),
                Map.of("createdEmail", savedUser.getEmail(), "role", roleCode),
                ipAddress, userAgent, correlationId, "SUCCESS");

        return authService.mapToUserDto(savedUser);
    }

    @Transactional
    public UserDto updateUserStatus(Long userId, UpdateUserStatusRequest request, UserPrincipal currentUser,
                                    String ipAddress, String userAgent, String correlationId) {
        Long tenantId = currentUser.getTenantId();
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String newStatus = request.getStatus().trim().toUpperCase();
        user.setStatus(newStatus);

        if (!"ACTIVE".equalsIgnoreCase(newStatus)) {
            refreshTokenRepository.revokeAllByUserId(user.getId());
        }

        User savedUser = userRepository.save(user);

        recordAuditLog(tenantId, currentUser.getUserId(), currentUser.getEmail(), "USER_STATUS_UPDATED",
                "User", String.valueOf(savedUser.getId()),
                Map.of("newStatus", newStatus),
                ipAddress, userAgent, correlationId, "SUCCESS");

        return authService.mapToUserDto(savedUser);
    }

    @Transactional
    public UserDto updateUserRole(Long userId, String roleCode, UserPrincipal currentUser,
                                  String ipAddress, String userAgent, String correlationId) {
        Long tenantId = currentUser.getTenantId();
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String cleanRole = roleCode.trim().toUpperCase();
        if ("SUPER_ADMIN".equalsIgnoreCase(cleanRole)) {
            throw new BusinessException("Cannot assign SUPER_ADMIN role within a tenant.");
        }

        Role role = roleRepository.findByCode(cleanRole)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "code", cleanRole));

        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        if ("TENANT_ADMIN".equalsIgnoreCase(cleanRole)) {
            user.setUserType("TENANT_ADMIN");
        } else {
            user.setUserType("TENANT_STAFF");
        }

        User savedUser = userRepository.save(user);

        recordAuditLog(tenantId, currentUser.getUserId(), currentUser.getEmail(), "ROLE_ASSIGNED",
                "User", String.valueOf(savedUser.getId()),
                Map.of("assignedRole", cleanRole),
                ipAddress, userAgent, correlationId, "SUCCESS");

        return authService.mapToUserDto(savedUser);
    }

    private void checkTenantStaffLimit(Long tenantId) {
        long currentCount = userRepository.countByTenantId(tenantId);

        // Check if there is an active limit override
        Optional<TenantLimitOverride> overrideOpt = limitOverrideRepository.findByTenantIdAndLimitKey(tenantId, "MAX_STAFF_USERS");
        if (overrideOpt.isPresent()) {
            TenantLimitOverride override = overrideOpt.get();
            if (override.getExpiresAt() == null || override.getExpiresAt().isAfter(LocalDateTime.now())) {
                long maxAllowed = override.getOverrideValue();
                if (maxAllowed != -1 && currentCount >= maxAllowed) {
                    throw new BusinessException("Tenant user limit reached (" + maxAllowed + " users allowed). Please upgrade your subscription plan.");
                }
                return;
            }
        }

        // Fall back to package limit
        Optional<Subscription> subOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId);
        if (subOpt.isPresent()) {
            Long pkgId = subOpt.get().getPackageId();
            Optional<PackageLimit> limitOpt = packageLimitRepository.findByPackageIdAndLimitKey(pkgId, "MAX_STAFF_USERS");
            if (limitOpt.isPresent()) {
                long maxAllowed = limitOpt.get().getLimitValue();
                if (maxAllowed != -1 && currentCount >= maxAllowed) {
                    throw new BusinessException("Tenant user limit reached (" + maxAllowed + " users allowed for your plan). Please upgrade your subscription plan.");
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public RoleMatrixDto getRolePermissionMatrix(UserPrincipal currentUser) {
        Long tenantId = currentUser.getTenantId();

        List<Role> roles = roleRepository.findAll().stream()
                .filter(r -> !"SUPER_ADMIN".equalsIgnoreCase(r.getCode()))
                .filter(r -> r.getTenantId() == null || Objects.equals(r.getTenantId(), tenantId))
                .collect(Collectors.toList());

        List<Permission> permissions = permissionRepository.findAll();

        List<RoleMatrixDto.RoleItemDto> roleDtos = roles.stream().map(r -> RoleMatrixDto.RoleItemDto.builder()
                .id(r.getId())
                .code(r.getCode())
                .name(r.getName())
                .description(r.getDescription())
                .systemRole(r.isSystemRole())
                .permissionCodes(r.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet()))
                .build()).collect(Collectors.toList());

        List<RoleMatrixDto.PermissionItemDto> permDtos = permissions.stream().map(p -> RoleMatrixDto.PermissionItemDto.builder()
                .id(p.getId())
                .module(p.getModule())
                .action(p.getAction())
                .code(p.getCode())
                .description(p.getDescription())
                .build()).collect(Collectors.toList());

        return RoleMatrixDto.builder()
                .roles(roleDtos)
                .permissions(permDtos)
                .build();
    }

    @Transactional
    public RoleMatrixDto toggleRolePermission(Long roleId, RoleMatrixDto.TogglePermissionRequest request,
                                              UserPrincipal currentUser, String ipAddress, String userAgent, String correlationId) {
        Long tenantId = currentUser.getTenantId();

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        if ("SUPER_ADMIN".equalsIgnoreCase(role.getCode())) {
            throw new BusinessException("Cannot modify Super Admin platform permissions.");
        }

        Permission permission = permissionRepository.findByCode(request.getPermissionCode())
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "code", request.getPermissionCode()));

        if (request.isEnabled()) {
            role.getPermissions().add(permission);
        } else {
            role.getPermissions().removeIf(p -> p.getCode().equalsIgnoreCase(request.getPermissionCode()));
        }

        roleRepository.save(role);

        recordAuditLog(tenantId, currentUser.getUserId(), currentUser.getEmail(), "ROLE_PERMISSION_TOGGLED",
                "Role", String.valueOf(role.getId()),
                Map.of("roleCode", role.getCode(), "permissionCode", request.getPermissionCode(), "enabled", request.isEnabled()),
                ipAddress, userAgent, correlationId, "SUCCESS");

        return getRolePermissionMatrix(currentUser);
    }

    private void recordAuditLog(Long tenantId, Long userId, String email, String action, String entityName,
                                String entityId, Map<String, Object> details, String ipAddress,
                                String userAgent, String correlationId, String status) {
        try {
            AuditLog logEntity = AuditLog.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .action(action)
                    .entityName(entityName)
                    .entityId(entityId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .correlationId(correlationId)
                    .status(status)
                    .build();
            auditLogRepository.save(logEntity);
        } catch (Exception e) {
            log.error("Failed to write audit log for action: {}", action, e);
        }
    }
}

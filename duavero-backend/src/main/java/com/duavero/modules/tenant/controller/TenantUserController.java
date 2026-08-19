package com.duavero.modules.tenant.controller;

import com.duavero.core.response.ApiResponse;
import com.duavero.core.security.UserPrincipal;
import com.duavero.modules.auth.dto.UserDto;
import com.duavero.modules.tenant.dto.CreateTenantUserRequest;
import com.duavero.modules.tenant.dto.UpdateUserStatusRequest;
import com.duavero.modules.tenant.service.TenantUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tenant/users")
@RequiredArgsConstructor
@Tag(name = "Tenant Users", description = "Tenant Staff, Managers, and Employee RBAC Management")
public class TenantUserController {

    private final TenantUserService tenantUserService;

    @GetMapping
    @PreAuthorize("hasAuthority('USER_VIEW') or hasRole('TENANT_ADMIN')")
    @Operation(summary = "List all users and staff belonging to the authenticated tenant")
    public ResponseEntity<ApiResponse<List<UserDto>>> getTenantUsers(
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        List<UserDto> users = tenantUserService.getTenantUsers(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Tenant users retrieved", users, correlationId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE') or hasRole('TENANT_ADMIN')")
    @Operation(summary = "Create and invite a new staff member or manager in current tenant workspace")
    public ResponseEntity<ApiResponse<UserDto>> createTenantUser(
            @Valid @RequestBody CreateTenantUserRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        UserDto userDto = tenantUserService.createTenantUser(request, currentUser, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("User created successfully in tenant workspace", userDto, correlationId));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('USER_DISABLE') or hasRole('TENANT_ADMIN')")
    @Operation(summary = "Update user status (ACTIVE, INACTIVE, LOCKED, etc.)")
    public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        UserDto userDto = tenantUserService.updateUserStatus(id, request, currentUser, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("User status updated successfully", userDto, correlationId));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority('USER_UPDATE') or hasRole('TENANT_ADMIN')")
    @Operation(summary = "Update user role in tenant workspace")
    public ResponseEntity<ApiResponse<UserDto>> updateUserRole(
            @PathVariable Long id,
            @RequestParam String roleCode,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        UserDto userDto = tenantUserService.updateUserRole(id, roleCode, currentUser, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("User role updated successfully", userDto, correlationId));
    }

    @GetMapping("/roles/matrix")
    @PreAuthorize("hasAuthority('ROLE_PERMISSIONS_MANAGE') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get dynamic RBAC role permission matrix for organization")
    public ResponseEntity<ApiResponse<com.duavero.modules.tenant.dto.RoleMatrixDto>> getRolePermissionMatrix(
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        com.duavero.modules.tenant.dto.RoleMatrixDto matrix = tenantUserService.getRolePermissionMatrix(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Role permissions matrix retrieved", matrix, correlationId));
    }

    @PostMapping("/roles/{roleId}/permissions/toggle")
    @PreAuthorize("hasAuthority('ROLE_PERMISSIONS_MANAGE') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Toggle a specific permission on or off for an organization role")
    public ResponseEntity<ApiResponse<com.duavero.modules.tenant.dto.RoleMatrixDto>> toggleRolePermission(
            @PathVariable Long roleId,
            @RequestBody com.duavero.modules.tenant.dto.RoleMatrixDto.TogglePermissionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        com.duavero.modules.tenant.dto.RoleMatrixDto matrix = tenantUserService.toggleRolePermission(
                roleId, request, currentUser, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Role permission updated successfully", matrix, correlationId));
    }
}

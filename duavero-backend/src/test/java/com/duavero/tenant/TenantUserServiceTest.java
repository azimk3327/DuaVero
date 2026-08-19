package com.duavero.tenant;

import com.duavero.core.exception.BusinessException;
import com.duavero.core.security.UserPrincipal;
import com.duavero.modules.auth.dto.UserDto;
import com.duavero.modules.tenant.dto.CreateTenantUserRequest;
import com.duavero.modules.tenant.dto.UpdateUserStatusRequest;
import com.duavero.modules.tenant.service.TenantUserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TenantUserServiceTest {

    @Autowired
    private TenantUserService tenantUserService;

    @Test
    @DisplayName("Tenant Admin can list their own tenant staff users")
    void testGetTenantUsers() {
        UserPrincipal tenantAdmin = UserPrincipal.builder()
                .userId(1L)
                .tenantId(1L)
                .email("owner@royalsofa.com")
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .build();

        List<UserDto> users = tenantUserService.getTenantUsers(tenantAdmin);

        assertNotNull(users);
        assertFalse(users.isEmpty());
        assertTrue(users.stream().allMatch(u -> Long.valueOf(1L).equals(u.getTenantId())),
                "All returned users must belong strictly to Tenant ID 1");
    }

    @Test
    @DisplayName("Tenant Admin can create a new staff member within their tenant")
    void testCreateTenantUser() {
        UserPrincipal tenantAdmin = UserPrincipal.builder()
                .userId(1L)
                .tenantId(1L)
                .email("owner@royalsofa.com")
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .build();

        CreateTenantUserRequest request = CreateTenantUserRequest.builder()
                .email("newstaff@royalsofa.com")
                .firstName("Rohan")
                .lastName("Verma")
                .phoneNumber("9876543210")
                .roleCode("SALES")
                .status("ACTIVE")
                .build();

        UserDto created = tenantUserService.createTenantUser(request, tenantAdmin, "127.0.0.1", "JUnit", "test-create-user");

        assertNotNull(created);
        assertEquals("newstaff@royalsofa.com", created.getEmail());
        assertEquals(1L, created.getTenantId(), "User must be created in Tenant 1");
        assertTrue(created.getRoles().contains("SALES"));
    }

    @Test
    @DisplayName("Tenant Admin CANNOT create a SUPER_ADMIN account")
    void testTenantAdminCannotCreateSuperAdmin() {
        UserPrincipal tenantAdmin = UserPrincipal.builder()
                .userId(1L)
                .tenantId(1L)
                .email("owner@royalsofa.com")
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .build();

        CreateTenantUserRequest request = CreateTenantUserRequest.builder()
                .email("hacksuperadmin@royalsofa.com")
                .firstName("Hacker")
                .lastName("Admin")
                .roleCode("SUPER_ADMIN")
                .build();

        assertThrows(BusinessException.class, () ->
                tenantUserService.createTenantUser(request, tenantAdmin, "127.0.0.1", "JUnit", "test-hack-superadmin")
        );
    }

    @Test
    @DisplayName("Tenant Admin can update staff status to LOCKED / INACTIVE")
    void testUpdateUserStatus() {
        UserPrincipal tenantAdmin = UserPrincipal.builder()
                .userId(1L)
                .tenantId(1L)
                .email("owner@royalsofa.com")
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .build();

        // Create user first
        UserDto user = tenantUserService.createTenantUser(
                CreateTenantUserRequest.builder()
                        .email("toggleuser@royalsofa.com")
                        .firstName("Test")
                        .lastName("User")
                        .roleCode("EMPLOYEE")
                        .build(),
                tenantAdmin, "127.0.0.1", "JUnit", "test-toggle");

        // Update status
        UserDto updated = tenantUserService.updateUserStatus(
                user.getId(),
                UpdateUserStatusRequest.builder().status("LOCKED").build(),
                tenantAdmin, "127.0.0.1", "JUnit", "test-lock");

        assertEquals("LOCKED", updated.getStatus());
    }
}

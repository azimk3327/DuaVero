package com.duavero.controller;

import com.duavero.core.security.JwtTokenProvider;
import com.duavero.core.security.UserPrincipal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthCheckControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/v1/public/health should return UP status and ApiResponse envelope without authentication")
    void testPublicHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/public/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Correlation-ID"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.platform").value("DuaVero Multi-Tenant SaaS"))
                .andExpect(jsonPath("$.message").value("DuaVero Platform is operational"));
    }

    @Test
    @DisplayName("GET /api/v1/tenant/ping should return 401 Unauthorized when no JWT token is supplied")
    void testTenantPingWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/tenant/ping")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.errorCode").value("ERR_UNAUTHORIZED"));
    }

    @Test
    @DisplayName("GET /api/v1/tenant/ping with valid JWT should resolve TenantContext and return tenantId")
    void testTenantPingWithValidToken() throws Exception {
        UserPrincipal tenantUser = UserPrincipal.builder()
                .userId(10L)
                .tenantId(101L)
                .email("admin@royaldecor.com")
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .permissions(Set.of("QUOTATION_CREATE"))
                .build();

        String token = jwtTokenProvider.generateAccessToken(tenantUser);

        mockMvc.perform(get("/api/v1/tenant/ping")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tenantId").value(101))
                .andExpect(jsonPath("$.data.userId").value(10))
                .andExpect(jsonPath("$.data.userType").value("TENANT_ADMIN"));
    }

    @Test
    @DisplayName("GET /api/v1/super-admin/ping with Super Admin JWT should succeed")
    void testSuperAdminPingWithSuperAdminToken() throws Exception {
        UserPrincipal superAdmin = UserPrincipal.builder()
                .userId(1L)
                .tenantId(null)
                .email("superadmin@duavero.com")
                .userType("SUPER_ADMIN")
                .roles(Set.of("SUPER_ADMIN"))
                .permissions(Set.of("PLATFORM_MANAGE"))
                .build();

        String token = jwtTokenProvider.generateAccessToken(superAdmin);

        mockMvc.perform(get("/api/v1/super-admin/ping")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.scope").value("GLOBAL_SUPER_ADMIN"))
                .andExpect(jsonPath("$.data.isSuperAdminScope").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/super-admin/ping with Tenant User token should return 403 Forbidden")
    void testSuperAdminPingWithTenantUserReturns403() throws Exception {
        UserPrincipal tenantStaff = UserPrincipal.builder()
                .userId(20L)
                .tenantId(101L)
                .email("staff@royaldecor.com")
                .userType("TENANT_STAFF")
                .roles(Set.of("TENANT_STAFF"))
                .permissions(Set.of("QUOTATION_CREATE"))
                .build();

        String token = jwtTokenProvider.generateAccessToken(tenantStaff);

        mockMvc.perform(get("/api/v1/super-admin/ping")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.errorCode").value("ERR_ACCESS_DENIED"));
    }
}

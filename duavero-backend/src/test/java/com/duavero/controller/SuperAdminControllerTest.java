package com.duavero.controller;

import com.duavero.core.security.JwtTokenProvider;
import com.duavero.core.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SuperAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String superAdminToken;
    private String tenantAdminToken;

    @BeforeEach
    void setUp() {
        UserPrincipal superAdmin = UserPrincipal.builder()
                .userId(1L)
                .tenantId(null)
                .email("superadmin@duavero.com")
                .userType("SUPER_ADMIN")
                .roles(Set.of("SUPER_ADMIN"))
                .permissions(Set.of("PLATFORM_MANAGE", "MASTER_TAXONOMY_MANAGE"))
                .active(true)
                .build();
        superAdminToken = jwtTokenProvider.generateAccessToken(superAdmin);

        UserPrincipal tenantAdmin = UserPrincipal.builder()
                .userId(10L)
                .tenantId(1L)
                .email("owner@royalsofa.com")
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .permissions(Set.of("QUOTATION_CREATE"))
                .active(true)
                .build();
        tenantAdminToken = jwtTokenProvider.generateAccessToken(tenantAdmin);
    }

    @Test
    @DisplayName("Super Admin should be able to fetch real-time dashboard metrics")
    void testGetDashboardMetrics() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/dashboard/metrics")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalCategories").isNumber())
                .andExpect(jsonPath("$.data.totalTenants").isNumber());
    }

    @Test
    @DisplayName("Super Admin should fetch dynamic master categories")
    void testGetMasterCategories() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/categories")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("Super Admin should create a new dynamic category")
    void testCreateMasterCategory() throws Exception {
        String categoryJson = """
                {
                    "code": "CUSTOM_UPHOLSTERY",
                    "name": "Custom Upholstery & Cushioning",
                    "description": "Bespoke commercial cushioning and seating covers",
                    "industryType": "FURNISHING",
                    "sortOrder": 15,
                    "active": true
                }
                """;

        mockMvc.perform(post("/api/v1/super-admin/categories")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(categoryJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("CUSTOM_UPHOLSTERY"));
    }

    @Test
    @DisplayName("Super Admin should trigger on-demand scheduler execution")
    void testTriggerScheduler() throws Exception {
        mockMvc.perform(post("/api/v1/super-admin/schedulers/SUBSCRIPTION_EXPIRY_CHECKER/trigger")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"));
    }

    @Test
    @DisplayName("Tenant Admin cannot access Super Admin endpoint (403 Forbidden)")
    void testTenantAdminDeniedOnSuperAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/dashboard/metrics")
                        .header("Authorization", "Bearer " + tenantAdminToken))
                .andExpect(status().isForbidden());
    }
}

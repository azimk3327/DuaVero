package com.duavero.security;

import com.duavero.core.security.JwtTokenProvider;
import com.duavero.core.security.UserPrincipal;
import com.duavero.modules.catalog.model.Product;
import com.duavero.modules.catalog.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CrossTenantSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ProductRepository productRepository;

    private String tenantAToken;
    private String tenantBToken;
    private String employeeNoPermToken;
    private Product tenantBProduct;

    @BeforeEach
    void setUp() {
        // Tenant 1 Admin
        UserPrincipal tenantAUser = UserPrincipal.builder()
                .userId(10L)
                .tenantId(1L)
                .email("owner@royalsofa.com")
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .permissions(Set.of("PRODUCT_VIEW", "PRODUCT_CREATE", "USER_VIEW", "USER_CREATE"))
                .active(true)
                .build();
        tenantAToken = jwtTokenProvider.generateAccessToken(tenantAUser);

        // Tenant 2 Admin
        UserPrincipal tenantBUser = UserPrincipal.builder()
                .userId(20L)
                .tenantId(2L)
                .email("admin@eliteinterior.com")
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .permissions(Set.of("PRODUCT_VIEW", "PRODUCT_CREATE", "USER_VIEW", "USER_CREATE"))
                .active(true)
                .build();
        tenantBToken = jwtTokenProvider.generateAccessToken(tenantBUser);

        // Standard Employee without USER_CREATE or PRODUCT_CREATE permission
        UserPrincipal employee = UserPrincipal.builder()
                .userId(30L)
                .tenantId(1L)
                .email("worker@royalsofa.com")
                .userType("TENANT_STAFF")
                .roles(Set.of("EMPLOYEE"))
                .permissions(Set.of("PRODUCT_VIEW")) // Read only
                .active(true)
                .build();
        employeeNoPermToken = jwtTokenProvider.generateAccessToken(employee);

        // Create a product strictly owned by Tenant 2
        tenantBProduct = Product.builder()
                .tenantId(2L)
                .categoryId(1L)
                .name("Elite Velvet Sectional")
                .slug("elite-velvet-sectional")
                .sku("SKU-ELITE-999")
                .basePrice(new BigDecimal("75000.00"))
                .build();
        tenantBProduct = productRepository.save(tenantBProduct);
    }

    @Test
    @DisplayName("JWT extraction should correctly bind tenant_id to server-side context")
    void testTenantContextBindingFromJwt() {
        UserPrincipal principalA = jwtTokenProvider.extractUserPrincipal(tenantAToken);
        assertEquals(1L, principalA.getTenantId());

        UserPrincipal principalB = jwtTokenProvider.extractUserPrincipal(tenantBToken);
        assertEquals(2L, principalB.getTenantId());
    }

    @Test
    @DisplayName("Tenant A cannot access Super Admin protected endpoints (403 Forbidden)")
    void testTenantCannotAccessSuperAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/tenants")
                        .header("Authorization", "Bearer " + tenantAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Tenant A CANNOT access Tenant B products (Returns 404 ResourceNotFound due to tenant scope)")
    void testTenantACannotAccessTenantBProduct() throws Exception {
        mockMvc.perform(get("/api/v1/tenant/products/" + tenantBProduct.getId())
                        .header("Authorization", "Bearer " + tenantAToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Tenant B CAN access their own product")
    void testTenantBCanAccessOwnProduct() throws Exception {
        mockMvc.perform(get("/api/v1/tenant/products/" + tenantBProduct.getId())
                        .header("Authorization", "Bearer " + tenantBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Elite Velvet Sectional"));
    }

    @Test
    @DisplayName("Forged tenantId in request body is ignored: Product is saved under authenticated tenant")
    void testForgedTenantIdInBodyIsIgnored() throws Exception {
        String requestBody = """
                {
                    "tenantId": 999,
                    "categoryId": 1,
                    "name": "Chesterfield Leather Sofa",
                    "sku": "SKU-CHEST-101",
                    "basePrice": 45000.00
                }
                """;

        mockMvc.perform(post("/api/v1/tenant/products")
                        .header("Authorization", "Bearer " + tenantAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenantId").value(1)); // Authenticated tenant ID 1, not 999!
    }

    @Test
    @DisplayName("Employee without USER_CREATE permission is rejected with 403 Forbidden")
    void testEmployeeWithoutPermissionIsForbidden() throws Exception {
        String requestBody = """
                {
                    "email": "unauthorized@royalsofa.com",
                    "firstName": "Test",
                    "lastName": "User",
                    "roleCode": "EMPLOYEE"
                }
                """;

        mockMvc.perform(post("/api/v1/tenant/users")
                        .header("Authorization", "Bearer " + employeeNoPermToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous access to protected endpoints should be rejected (401 Unauthorized)")
    void testAnonymousAccessRejected() throws Exception {
        mockMvc.perform(get("/api/v1/tenant/products"))
                .andExpect(status().isUnauthorized());
    }
}

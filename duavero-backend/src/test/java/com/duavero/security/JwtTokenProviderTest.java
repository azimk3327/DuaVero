package com.duavero.security;

import com.duavero.core.config.AppProperties;
import com.duavero.core.security.JwtTokenProvider;
import com.duavero.core.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        AppProperties appProperties = new AppProperties();
        appProperties.getSecurity().getJwt().setSecret("testing-super-secret-key-32-chars-minimum-length-needed");
        appProperties.getSecurity().getJwt().setExpirationMinutes(15);
        appProperties.getSecurity().getJwt().setRefreshExpirationDays(7);

        tokenProvider = new JwtTokenProvider(appProperties);
        tokenProvider.init();
    }

    @Test
    @DisplayName("Should generate valid access token and extract tenant user claims")
    void testGenerateAndExtractTenantUserToken() {
        UserPrincipal principal = UserPrincipal.builder()
                .userId(10L)
                .tenantId(101L)
                .email("admin@royaldecor.com")
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .permissions(Set.of("QUOTATION_CREATE", "INVOICE_CREATE"))
                .build();

        String token = tokenProvider.generateAccessToken(principal);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));

        UserPrincipal extracted = tokenProvider.extractUserPrincipal(token);
        assertEquals(10L, extracted.getUserId());
        assertEquals(101L, extracted.getTenantId());
        assertEquals("admin@royaldecor.com", extracted.getEmail());
        assertEquals("TENANT_ADMIN", extracted.getUserType());
        assertTrue(extracted.getRoles().contains("TENANT_ADMIN"));
        assertTrue(extracted.getPermissions().contains("QUOTATION_CREATE"));
        assertFalse(extracted.isSuperAdmin());
    }

    @Test
    @DisplayName("Should generate valid Super Admin token with null tenantId")
    void testGenerateSuperAdminToken() {
        UserPrincipal superAdmin = UserPrincipal.builder()
                .userId(1L)
                .tenantId(null)
                .email("superadmin@duavero.com")
                .userType("SUPER_ADMIN")
                .roles(Set.of("SUPER_ADMIN"))
                .permissions(Set.of("PLATFORM_MANAGE", "TENANT_OVERRIDE"))
                .build();

        String token = tokenProvider.generateAccessToken(superAdmin);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));

        UserPrincipal extracted = tokenProvider.extractUserPrincipal(token);
        assertEquals(1L, extracted.getUserId());
        assertNull(extracted.getTenantId());
        assertEquals("SUPER_ADMIN", extracted.getUserType());
        assertTrue(extracted.isSuperAdmin());
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void testGenerateRefreshToken() {
        String refreshToken = tokenProvider.generateRefreshToken(10L);

        assertNotNull(refreshToken);
        assertTrue(tokenProvider.validateToken(refreshToken));
    }

    @Test
    @DisplayName("Should reject invalid and tampered tokens")
    void testInvalidToken() {
        assertFalse(tokenProvider.validateToken("invalid.token.structure"));
        assertFalse(tokenProvider.validateToken(""));
        assertFalse(tokenProvider.validateToken(null));
    }
}

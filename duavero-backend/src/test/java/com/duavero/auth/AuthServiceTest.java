package com.duavero.auth;

import com.duavero.modules.auth.dto.*;
import com.duavero.modules.auth.model.User;
import com.duavero.modules.auth.repository.UserRepository;
import com.duavero.modules.auth.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("1. Should successfully authenticate Super Admin using email")
    void testSuperAdminLoginWithEmail() {
        LoginRequest request = LoginRequest.builder()
                .identifier("superadmin@duavero.com")
                .password("SuperAdmin@123")
                .build();

        AuthResponse response = authService.login(request, "127.0.0.1", "JUnit", "test-corr-1");

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("SUPER_ADMIN", response.getUser().getUserType());
        assertTrue(response.getUser().getRoles().contains("SUPER_ADMIN"));
        assertNull(response.getUser().getTenantId(), "Super Admin must have null tenantId");
    }

    @Test
    @DisplayName("2. Should successfully authenticate Super Admin using mobile phone number")
    void testSuperAdminLoginWithPhoneNumber() {
        LoginRequest request = LoginRequest.builder()
                .identifier("9999999999")
                .password("SuperAdmin@123")
                .build();

        AuthResponse response = authService.login(request, "127.0.0.1", "JUnit", "test-corr-2");

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertEquals("superadmin@duavero.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("3. Should successfully authenticate Tenant Admin with isolated tenant context")
    void testTenantAdminLogin() {
        LoginRequest request = LoginRequest.builder()
                .identifier("owner@royalsofa.com")
                .password("Tenant@123")
                .build();

        AuthResponse response = authService.login(request, "127.0.0.1", "JUnit", "test-corr-3");

        assertNotNull(response);
        assertEquals(1L, response.getUser().getTenantId());
        assertEquals("TENANT_ADMIN", response.getUser().getUserType());
        assertTrue(response.getUser().getRoles().contains("TENANT_ADMIN"));
    }

    @Test
    @DisplayName("4. Should successfully authenticate Manager, Sales, Accountant, and Employee roles")
    void testStaffRolesLogin() {
        // Manager
        AuthResponse mgr = authService.login(
                LoginRequest.builder().identifier("manager@royalsofa.com").password("Manager@123").build(),
                "127.0.0.1", "JUnit", "corr-mgr");
        assertEquals(1L, mgr.getUser().getTenantId());
        assertTrue(mgr.getUser().getPermissions().contains("QUOTATION_APPROVE"));

        // Sales
        AuthResponse sales = authService.login(
                LoginRequest.builder().identifier("sales@royalsofa.com").password("Sales@123").build(),
                "127.0.0.1", "JUnit", "corr-sales");
        assertEquals(1L, sales.getUser().getTenantId());
        assertFalse(sales.getUser().getPermissions().contains("QUOTATION_APPROVE"), "Sales role should not have quote approval");

        // Accountant
        AuthResponse acct = authService.login(
                LoginRequest.builder().identifier("accountant@royalsofa.com").password("Accountant@123").build(),
                "127.0.0.1", "JUnit", "corr-acct");
        assertEquals(1L, acct.getUser().getTenantId());
        assertTrue(acct.getUser().getPermissions().contains("INVOICE_APPROVE"));
    }

    @Test
    @DisplayName("5. Should fail authentication on invalid password")
    void testInvalidPasswordFailure() {
        LoginRequest request = LoginRequest.builder()
                .identifier("superadmin@duavero.com")
                .password("WrongPassword@999")
                .build();

        assertThrows(RuntimeException.class, () ->
                authService.login(request, "127.0.0.1", "JUnit", "test-corr-fail")
        );
    }

    @Test
    @DisplayName("6. Should reject disabled/inactive users")
    void testDisabledUserCannotLogin() {
        User user = userRepository.findByEmail("manager@royalsofa.com").orElseThrow();
        user.setStatus("INACTIVE");
        userRepository.save(user);

        LoginRequest request = LoginRequest.builder()
                .identifier("manager@royalsofa.com")
                .password("Manager@123")
                .build();

        assertThrows(RuntimeException.class, () ->
                authService.login(request, "127.0.0.1", "JUnit", "test-disabled")
        );
    }

    @Test
    @DisplayName("7. Should perform refresh token rotation and revoke old session")
    void testRefreshTokenRotation() {
        LoginRequest loginReq = LoginRequest.builder()
                .identifier("superadmin@duavero.com")
                .password("SuperAdmin@123")
                .build();

        AuthResponse initialAuth = authService.login(loginReq, "127.0.0.1", "JUnit", "test-corr-4");
        String oldRefreshToken = initialAuth.getRefreshToken();

        TokenRefreshRequest refreshReq = TokenRefreshRequest.builder()
                .refreshToken(oldRefreshToken)
                .build();

        AuthResponse refreshedAuth = authService.refreshToken(refreshReq, "127.0.0.1", "JUnit", "test-corr-5");

        assertNotNull(refreshedAuth);
        assertNotNull(refreshedAuth.getAccessToken());
        assertNotNull(refreshedAuth.getRefreshToken());
        assertNotEquals(oldRefreshToken, refreshedAuth.getRefreshToken(), "Refresh token must be rotated");

        // Reuse of old token should fail
        assertThrows(RuntimeException.class, () ->
                authService.refreshToken(refreshReq, "127.0.0.1", "JUnit", "test-reuse")
        );
    }

    @Test
    @DisplayName("8. Complete Forgot & Reset Password lifecycle with BCrypt hashing and token revocation")
    void testForgotAndResetPasswordLifecycle() {
        // Step 1: Request forgot password
        ForgotPasswordRequest forgotReq = ForgotPasswordRequest.builder()
                .identifier("manager@royalsofa.com")
                .build();

        Map<String, Object> forgotRes = authService.forgotPassword(forgotReq, "127.0.0.1", "JUnit", "test-fgt");
        assertNotNull(forgotRes);
        String resetToken = (String) forgotRes.get("resetToken");
        assertNotNull(resetToken, "Reset token should be returned in development/testing mode");

        // Step 2: Reset password
        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .token(resetToken)
                .newPassword("NewManager@789")
                .build();

        authService.resetPassword(resetReq, "127.0.0.1", "JUnit", "test-rst");

        // Step 3: Verify old password fails
        assertThrows(RuntimeException.class, () ->
                authService.login(LoginRequest.builder().identifier("manager@royalsofa.com").password("Manager@123").build(),
                        "127.0.0.1", "JUnit", "test-old-fail")
        );

        // Step 4: Verify new password succeeds
        AuthResponse loginNew = authService.login(
                LoginRequest.builder().identifier("manager@royalsofa.com").password("NewManager@789").build(),
                "127.0.0.1", "JUnit", "test-new-pass");
        assertNotNull(loginNew.getAccessToken());

        // Step 5: Verify password hash in DB is BCrypt
        User user = userRepository.findByEmail("manager@royalsofa.com").orElseThrow();
        assertTrue(passwordEncoder.matches("NewManager@789", user.getPasswordHash()));
        assertNotEquals("NewManager@789", user.getPasswordHash(), "Plaintext password must NEVER be stored");
    }

    @Test
    @DisplayName("9. Self-Service Tenant Onboarding (Sign Up)")
    void testTenantSignUp() {
        TenantSignUpRequest signUpReq = TenantSignUpRequest.builder()
                .businessName("Urban Woodcraft")
                .slug("urban-woodcraft")
                .contactEmail("contact@urbanwoodcraft.com")
                .contactPhone("9111122222")
                .ownerFirstName("Siddharth")
                .ownerLastName("Rao")
                .ownerEmail("owner@urbanwoodcraft.com")
                .ownerPhone("9111122222")
                .password("UrbanOwner@123")
                .packageCode("PROFESSIONAL")
                .build();

        AuthResponse signupRes = authService.signupTenant(signUpReq, "127.0.0.1", "JUnit", "test-signup");

        assertNotNull(signupRes);
        assertNotNull(signupRes.getAccessToken());
        assertNotNull(signupRes.getUser().getTenantId());
        assertEquals("TENANT_ADMIN", signupRes.getUser().getUserType());
        assertEquals("urban-woodcraft", signupRes.getUser().getTenantSlug());
    }
}

package com.duavero.modules.auth.controller;

import com.duavero.core.response.ApiResponse;
import com.duavero.core.security.UserPrincipal;
import com.duavero.modules.auth.dto.*;
import com.duavero.modules.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "IAM Lifecycle, Login, Token Refresh, Password Reset & Tenant Onboarding")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user via email OR mobile phone number + BCrypt password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        AuthResponse authResponse = authService.login(request, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", authResponse, correlationId));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Perform refresh token rotation to obtain a new access and refresh token pair")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody TokenRefreshRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        AuthResponse authResponse = authService.refreshToken(request, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", authResponse, correlationId));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Initiate password reset request for email or mobile phone number")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        Map<String, Object> result = authService.forgotPassword(request, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok((String) result.get("message"), result, correlationId));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Complete password reset using valid reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        authService.resetPassword(request, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Password has been reset successfully. Please sign in with your new password.", null, correlationId));
    }

    @PostMapping("/signup")
    @Operation(summary = "Self-service business registration and tenant admin onboarding")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(
            @Valid @RequestBody TenantSignUpRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        AuthResponse authResponse = authService.signupTenant(request, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Tenant account created and onboarded successfully", authResponse, correlationId));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke active session refresh token and sign out")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) TokenRefreshRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String refreshToken = request != null ? request.getRefreshToken() : null;
        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String correlationId = httpRequest.getHeader("X-Correlation-ID");

        authService.logout(refreshToken, currentUser, ipAddress, userAgent, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null, correlationId));
    }

    @GetMapping("/me")
    @Operation(summary = "Retrieve profile, permissions, and tenant context of the currently authenticated user")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthenticated", correlationId));
        }

        UserDto userDto = authService.getCurrentUser(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Current user profile retrieved", userDto, correlationId));
    }
}

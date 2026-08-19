package com.duavero.core.security;

import com.duavero.core.context.TenantContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<UserPrincipal> getCurrentUserPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty();
    }

    public static Optional<Long> getCurrentUserId() {
        return getCurrentUserPrincipal()
                .map(UserPrincipal::getUserId)
                .or(() -> Optional.ofNullable(TenantContextHolder.getUserId()));
    }

    public static Optional<Long> getCurrentTenantId() {
        return getCurrentUserPrincipal()
                .map(UserPrincipal::getTenantId)
                .or(() -> Optional.ofNullable(TenantContextHolder.getTenantId()));
    }

    public static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && !(auth.getPrincipal() instanceof String);
    }

    public static boolean isSuperAdmin() {
        return getCurrentUserPrincipal()
                .map(UserPrincipal::isSuperAdmin)
                .orElseGet(TenantContextHolder::isSuperAdminScope);
    }
}

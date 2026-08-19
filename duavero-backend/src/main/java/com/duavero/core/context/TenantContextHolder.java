package com.duavero.core.context;

import org.slf4j.MDC;

import java.util.Set;

public final class TenantContextHolder {

    private static final ThreadLocal<TenantContext> CONTEXT_HOLDER = new ThreadLocal<>();

    private TenantContextHolder() {}

    public static void setContext(TenantContext context) {
        if (context == null) {
            clear();
        } else {
            CONTEXT_HOLDER.set(context);
            if (context.getTenantId() != null) {
                MDC.put("tenantId", String.valueOf(context.getTenantId()));
            } else if (context.isSuperAdminScope()) {
                MDC.put("tenantId", "super-admin");
            } else if (context.isSystemContext()) {
                MDC.put("tenantId", "system");
            }
            if (context.getUserId() != null) {
                MDC.put("userId", String.valueOf(context.getUserId()));
            }
        }
    }

    public static TenantContext getContext() {
        return CONTEXT_HOLDER.get();
    }

    public static void setTenantId(Long tenantId) {
        TenantContext context = getOrCreateContext();
        context.setTenantId(tenantId);
        context.setSuperAdminScope(false);
        if (tenantId != null) {
            MDC.put("tenantId", String.valueOf(tenantId));
        } else {
            MDC.remove("tenantId");
        }
    }

    public static Long getTenantId() {
        TenantContext context = CONTEXT_HOLDER.get();
        return context != null ? context.getTenantId() : null;
    }

    public static Long getRequiredTenantId() {
        Long tenantId = getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("Operation requires an active TenantContext, but none was found");
        }
        return tenantId;
    }

    public static void setUserId(Long userId) {
        TenantContext context = getOrCreateContext();
        context.setUserId(userId);
        if (userId != null) {
            MDC.put("userId", String.valueOf(userId));
        } else {
            MDC.remove("userId");
        }
    }

    public static Long getUserId() {
        TenantContext context = CONTEXT_HOLDER.get();
        return context != null ? context.getUserId() : null;
    }

    public static void setSuperAdminScope(boolean superAdminScope) {
        TenantContext context = getOrCreateContext();
        context.setSuperAdminScope(superAdminScope);
        if (superAdminScope) {
            context.setTenantId(null);
            MDC.put("tenantId", "super-admin");
        }
    }

    public static boolean isSuperAdminScope() {
        TenantContext context = CONTEXT_HOLDER.get();
        return context != null && context.isSuperAdminScope();
    }

    public static void setSystemContext(boolean systemContext) {
        TenantContext context = getOrCreateContext();
        context.setSystemContext(systemContext);
        if (systemContext) {
            MDC.put("tenantId", "system");
        }
    }

    public static boolean isSystemContext() {
        TenantContext context = CONTEXT_HOLDER.get();
        return context != null && context.isSystemContext();
    }

    public static Set<String> getPermissions() {
        TenantContext context = CONTEXT_HOLDER.get();
        return context != null ? context.getPermissions() : Set.of();
    }

    public static boolean hasPermission(String permission) {
        TenantContext context = CONTEXT_HOLDER.get();
        return context != null && context.hasPermission(permission);
    }

    public static void clear() {
        CONTEXT_HOLDER.remove();
        MDC.remove("tenantId");
        MDC.remove("userId");
    }

    private static TenantContext getOrCreateContext() {
        TenantContext context = CONTEXT_HOLDER.get();
        if (context == null) {
            context = new TenantContext();
            CONTEXT_HOLDER.set(context);
        }
        return context;
    }
}

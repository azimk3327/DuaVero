package com.duavero.core.controller;

import com.duavero.core.audit.AuditLoggable;
import com.duavero.core.context.TenantContext;
import com.duavero.core.context.TenantContextHolder;
import com.duavero.core.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Health & Foundation APIs", description = "Endpoints for platform heartbeat and context resolution")
public class HealthCheckController {

    @GetMapping("/public/health")
    @Operation(summary = "Public platform health check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPublicHealth() {
        log.info("Public health check probed");
        Map<String, Object> status = Map.of(
                "status", "UP",
                "platform", "DuaVero Multi-Tenant SaaS",
                "version", "1.0.0",
                "timestamp", Instant.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.ok(status, "DuaVero Platform is operational"));
    }

    @GetMapping("/tenant/ping")
    @Operation(summary = "Tenant authenticated ping verifying TenantContext resolution")
    @AuditLoggable(action = "TENANT_PING", entityName = "TenantContext")
    public ResponseEntity<ApiResponse<TenantContext>> getTenantPing() {
        TenantContext context = TenantContextHolder.getContext();
        log.info("Tenant ping resolved for tenantId: {}", context != null ? context.getTenantId() : "null");
        return ResponseEntity.ok(ApiResponse.ok(context, "Tenant context resolved successfully"));
    }

    @GetMapping("/super-admin/ping")
    @Operation(summary = "Super Admin authenticated ping verifying global platform context")
    @AuditLoggable(action = "SUPER_ADMIN_PING", entityName = "PlatformContext")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSuperAdminPing() {
        log.info("Super Admin ping accessed");
        Map<String, Object> info = Map.of(
                "scope", "GLOBAL_SUPER_ADMIN",
                "isSuperAdminScope", TenantContextHolder.isSuperAdminScope(),
                "timestamp", Instant.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.ok(info, "Super Admin global context verified"));
    }
}

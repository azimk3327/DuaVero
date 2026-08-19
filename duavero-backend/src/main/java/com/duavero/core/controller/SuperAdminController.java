package com.duavero.core.controller;

import com.duavero.core.audit.AuditLoggable;
import com.duavero.core.response.ApiResponse;
import com.duavero.core.service.SuperAdminService;
import com.duavero.modules.audit.model.AuditLog;
import com.duavero.modules.auth.dto.UserDto;
import com.duavero.modules.auth.model.Permission;
import com.duavero.modules.auth.model.Role;
import com.duavero.modules.catalog.dto.AttributeDto;
import com.duavero.modules.catalog.dto.CategoryDto;
import com.duavero.modules.notification.model.NotificationTemplate;
import com.duavero.modules.scheduler.model.SchedulerExecutionLog;
import com.duavero.modules.scheduler.model.SchedulerJob;
import com.duavero.modules.subscription.model.Feature;
import com.duavero.modules.subscription.model.Package;
import com.duavero.modules.tenant.dto.TenantManagementDto;
import com.duavero.modules.tenant.model.SystemConfiguration;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Super Admin Portal", description = "Global platform configuration, tenant lifecycle, master catalog, schedulers & telemetry")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    // ==========================================
    // 1. DASHBOARD METRICS
    // ==========================================
    @GetMapping("/dashboard/metrics")
    @Operation(summary = "Get platform-wide real-time operational KPI metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardMetrics(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Platform metrics retrieved", superAdminService.getDashboardMetrics(), correlationId));
    }

    // ==========================================
    // 2. DYNAMIC MASTER CATEGORIES
    // ==========================================
    @GetMapping("/categories")
    @Operation(summary = "List all dynamic master business categories with attribute schemas")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Categories retrieved", superAdminService.getAllCategories(), correlationId));
    }

    @GetMapping("/categories/{id}")
    @Operation(summary = "Get category details by ID")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategoryById(@PathVariable Long id, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Category retrieved", superAdminService.getCategoryById(id), correlationId));
    }

    @PostMapping("/categories")
    @AuditLoggable(action = "CREATE_MASTER_CATEGORY", entityName = "MasterCategory")
    @Operation(summary = "Create a database-driven master business category")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@Valid @RequestBody CategoryDto dto, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Category created successfully", superAdminService.createCategory(dto), correlationId));
    }

    @PutMapping("/categories/{id}")
    @AuditLoggable(action = "UPDATE_MASTER_CATEGORY", entityName = "MasterCategory")
    @Operation(summary = "Update master category details")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable Long id, @Valid @RequestBody CategoryDto dto, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Category updated successfully", superAdminService.updateCategory(id, dto), correlationId));
    }

    @PatchMapping("/categories/{id}/status")
    @AuditLoggable(action = "TOGGLE_CATEGORY_STATUS", entityName = "MasterCategory")
    @Operation(summary = "Activate or deactivate a master category")
    public ResponseEntity<ApiResponse<Void>> toggleCategoryStatus(
            @PathVariable Long id, @RequestParam boolean active, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        superAdminService.toggleCategoryStatus(id, active);
        return ResponseEntity.ok(ApiResponse.ok("Category status updated", null, correlationId));
    }

    @DeleteMapping("/categories/{id}")
    @AuditLoggable(action = "DELETE_MASTER_CATEGORY", entityName = "MasterCategory")
    @Operation(summary = "Delete or archive a master category")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        superAdminService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.ok("Category deleted successfully", null, correlationId));
    }

    @PostMapping("/categories/{id}/attributes")
    @AuditLoggable(action = "CONFIGURE_CATEGORY_ATTRIBUTES", entityName = "MasterCategory")
    @Operation(summary = "Configure dynamic attributes mapping for a master category")
    public ResponseEntity<ApiResponse<Void>> configureCategoryAttributes(
            @PathVariable Long id, @RequestBody List<CategoryDto.CategoryAttributeDto> attributes, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        superAdminService.configureCategoryAttributes(id, attributes);
        return ResponseEntity.ok(ApiResponse.ok("Category attributes configured successfully", null, correlationId));
    }

    // ==========================================
    // 3. DYNAMIC ATTRIBUTE DEFINITIONS
    // ==========================================
    @GetMapping("/attributes")
    @Operation(summary = "List all dynamic attribute definitions")
    public ResponseEntity<ApiResponse<List<AttributeDto>>> getAttributes(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Attributes retrieved", superAdminService.getAllAttributes(), correlationId));
    }

    @PostMapping("/attributes")
    @AuditLoggable(action = "CREATE_ATTRIBUTE_DEFINITION", entityName = "AttributeDefinition")
    @Operation(summary = "Create a dynamic attribute definition (e.g. Foam Density, Fabric Grade)")
    public ResponseEntity<ApiResponse<AttributeDto>> createAttribute(@Valid @RequestBody AttributeDto dto, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Attribute definition created", superAdminService.createAttribute(dto), correlationId));
    }

    @PutMapping("/attributes/{id}")
    @AuditLoggable(action = "UPDATE_ATTRIBUTE_DEFINITION", entityName = "AttributeDefinition")
    @Operation(summary = "Update a dynamic attribute definition")
    public ResponseEntity<ApiResponse<AttributeDto>> updateAttribute(
            @PathVariable Long id, @Valid @RequestBody AttributeDto dto, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Attribute definition updated", superAdminService.updateAttribute(id, dto), correlationId));
    }

    // ==========================================
    // 4. TENANTS MANAGEMENT
    // ==========================================
    @GetMapping("/tenants")
    @Operation(summary = "List all registered tenants and subscription statuses")
    public ResponseEntity<ApiResponse<List<TenantManagementDto>>> getTenants(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Tenants retrieved", superAdminService.getAllTenants(), correlationId));
    }

    @PostMapping("/tenants")
    @AuditLoggable(action = "CREATE_TENANT", entityName = "Tenant")
    @Operation(summary = "Onboard a new tenant account")
    public ResponseEntity<ApiResponse<TenantManagementDto>> createTenant(
            @Valid @RequestBody TenantManagementDto dto, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Tenant onboarded successfully", superAdminService.createTenant(dto), correlationId));
    }

    @PutMapping("/tenants/{id}")
    @AuditLoggable(action = "UPDATE_TENANT", entityName = "Tenant")
    @Operation(summary = "Update tenant profile and contact details")
    public ResponseEntity<ApiResponse<TenantManagementDto>> updateTenant(
            @PathVariable Long id, @Valid @RequestBody TenantManagementDto dto, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Tenant updated successfully", superAdminService.updateTenant(id, dto), correlationId));
    }

    @PatchMapping("/tenants/{id}/status")
    @AuditLoggable(action = "UPDATE_TENANT_STATUS", entityName = "Tenant")
    @Operation(summary = "Update tenant status (ACTIVE, TRIAL, SUSPENDED, ARCHIVED)")
    public ResponseEntity<ApiResponse<Void>> updateTenantStatus(
            @PathVariable Long id, @RequestParam String status, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        superAdminService.updateTenantStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Tenant status updated", null, correlationId));
    }

    @GetMapping("/tenants/{id}/overrides")
    @Operation(summary = "Retrieve feature and quota limit overrides for a tenant")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTenantOverrides(@PathVariable Long id, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Tenant overrides retrieved", superAdminService.getTenantOverrides(id), correlationId));
    }

    @PostMapping("/tenants/{id}/overrides/features")
    @AuditLoggable(action = "SET_TENANT_FEATURE_OVERRIDE", entityName = "Tenant")
    @Operation(summary = "Grant or revoke a specific feature override for a tenant")
    public ResponseEntity<ApiResponse<Void>> setFeatureOverride(
            @PathVariable Long id, @RequestParam Long featureId, @RequestParam boolean enabled,
            @RequestParam(required = false) LocalDateTime expiresAt, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        superAdminService.setTenantFeatureOverride(id, featureId, enabled, expiresAt);
        return ResponseEntity.ok(ApiResponse.ok("Feature override applied", null, correlationId));
    }

    @PostMapping("/tenants/{id}/overrides/limits")
    @AuditLoggable(action = "SET_TENANT_LIMIT_OVERRIDE", entityName = "Tenant")
    @Operation(summary = "Override a quota resource limit for a tenant")
    public ResponseEntity<ApiResponse<Void>> setLimitOverride(
            @PathVariable Long id, @RequestParam String limitKey, @RequestParam Long limitValue,
            @RequestParam(required = false) LocalDateTime expiresAt, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        superAdminService.setTenantLimitOverride(id, limitKey, limitValue, expiresAt);
        return ResponseEntity.ok(ApiResponse.ok("Limit override applied", null, correlationId));
    }

    // ==========================================
    // 5. USERS & ROLES
    // ==========================================
    @GetMapping("/users")
    @Operation(summary = "List all platform and tenant users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsers(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved", superAdminService.getAllUsers(), correlationId));
    }

    @PostMapping("/users")
    @AuditLoggable(action = "CREATE_USER", entityName = "User")
    @Operation(summary = "Create user account")
    public ResponseEntity<ApiResponse<UserDto>> createUser(
            @RequestParam String email, @RequestParam String phone, @RequestParam String password,
            @RequestParam String firstName, @RequestParam String lastName, @RequestParam String userType,
            @RequestParam(required = false) Long tenantId, @RequestParam String roleCode,
            HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        UserDto userDto = superAdminService.createUser(email, phone, password, firstName, lastName, userType, tenantId, roleCode);
        return ResponseEntity.ok(ApiResponse.ok("User created successfully", userDto, correlationId));
    }

    @PatchMapping("/users/{id}/status")
    @AuditLoggable(action = "UPDATE_USER_STATUS", entityName = "User")
    @Operation(summary = "Activate or suspend user account")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable Long id, @RequestParam String status, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        superAdminService.updateUserStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("User status updated", null, correlationId));
    }

    @GetMapping("/roles")
    @Operation(summary = "List all system RBAC roles")
    public ResponseEntity<ApiResponse<List<Role>>> getRoles(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Roles retrieved", superAdminService.getAllRoles(), correlationId));
    }

    @GetMapping("/permissions")
    @Operation(summary = "List all granular permissions")
    public ResponseEntity<ApiResponse<List<Permission>>> getPermissions(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Permissions retrieved", superAdminService.getAllPermissions(), correlationId));
    }

    // ==========================================
    // 6. PACKAGES & FEATURES
    // ==========================================
    @GetMapping("/packages")
    @Operation(summary = "List all subscription packages")
    public ResponseEntity<ApiResponse<List<Package>>> getPackages(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Packages retrieved", superAdminService.getAllPackages(), correlationId));
    }

    @PostMapping("/packages")
    @AuditLoggable(action = "CREATE_PACKAGE", entityName = "Package")
    @Operation(summary = "Create subscription package tier")
    public ResponseEntity<ApiResponse<Package>> createPackage(@Valid @RequestBody Package pkg, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Package created", superAdminService.createPackage(pkg), correlationId));
    }

    @PutMapping("/packages/{id}")
    @AuditLoggable(action = "UPDATE_PACKAGE", entityName = "Package")
    @Operation(summary = "Update subscription package tier")
    public ResponseEntity<ApiResponse<Package>> updatePackage(
            @PathVariable Long id, @Valid @RequestBody Package pkg, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Package updated", superAdminService.updatePackage(id, pkg), correlationId));
    }

    @GetMapping("/features")
    @Operation(summary = "List platform feature flags")
    public ResponseEntity<ApiResponse<List<Feature>>> getFeatures(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Features retrieved", superAdminService.getAllFeatures(), correlationId));
    }

    @PatchMapping("/features/{id}/toggle")
    @AuditLoggable(action = "TOGGLE_FEATURE", entityName = "Feature")
    @Operation(summary = "Enable or disable feature flag across platform")
    public ResponseEntity<ApiResponse<Void>> toggleFeature(
            @PathVariable Long id, @RequestParam boolean enabled, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        superAdminService.toggleFeature(id, enabled);
        return ResponseEntity.ok(ApiResponse.ok("Feature updated", null, correlationId));
    }

    // ==========================================
    // 7. SCHEDULERS & SHEDLOCK
    // ==========================================
    @GetMapping("/schedulers")
    @Operation(summary = "List background scheduler jobs and cron configurations")
    public ResponseEntity<ApiResponse<List<SchedulerJob>>> getSchedulers(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Scheduler jobs retrieved", superAdminService.getAllSchedulers(), correlationId));
    }

    @PutMapping("/schedulers/{jobCode}")
    @AuditLoggable(action = "UPDATE_SCHEDULER_JOB", entityName = "SchedulerJob")
    @Operation(summary = "Update scheduler job cron, batch size, and enabled state")
    public ResponseEntity<ApiResponse<SchedulerJob>> updateSchedulerJob(
            @PathVariable String jobCode, @Valid @RequestBody SchedulerJob job, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Scheduler job updated", superAdminService.updateSchedulerJob(jobCode, job), correlationId));
    }

    @PostMapping("/schedulers/{jobCode}/trigger")
    @AuditLoggable(action = "TRIGGER_SCHEDULER_JOB", entityName = "SchedulerJob")
    @Operation(summary = "Trigger immediate on-demand scheduler execution")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerSchedulerJob(
            @PathVariable String jobCode, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Job triggered successfully", superAdminService.triggerSchedulerJob(jobCode), correlationId));
    }

    @GetMapping("/schedulers/logs")
    @Operation(summary = "Query scheduler execution telemetry logs")
    public ResponseEntity<ApiResponse<List<SchedulerExecutionLog>>> getSchedulerLogs(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Scheduler logs retrieved", superAdminService.getSchedulerLogs(), correlationId));
    }

    // ==========================================
    // 8. NOTIFICATION TEMPLATES
    // ==========================================
    @GetMapping("/notifications/templates")
    @Operation(summary = "List multi-channel notification templates")
    public ResponseEntity<ApiResponse<List<NotificationTemplate>>> getNotificationTemplates(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Notification templates retrieved", superAdminService.getAllNotificationTemplates(), correlationId));
    }

    @PutMapping("/notifications/templates/{id}")
    @AuditLoggable(action = "UPDATE_NOTIFICATION_TEMPLATE", entityName = "NotificationTemplate")
    @Operation(summary = "Update notification template content")
    public ResponseEntity<ApiResponse<NotificationTemplate>> updateNotificationTemplate(
            @PathVariable Long id, @Valid @RequestBody NotificationTemplate tmpl, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Template updated", superAdminService.updateNotificationTemplate(id, tmpl), correlationId));
    }

    // ==========================================
    // 9. AUDIT LOGS & CONFIGURATIONS
    // ==========================================
    @GetMapping("/audit/logs")
    @Operation(summary = "Query platform-wide immutable security and audit trail")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Audit logs retrieved", superAdminService.getAuditLogs(), correlationId));
    }

    @GetMapping("/configurations")
    @Operation(summary = "List global platform configurations")
    public ResponseEntity<ApiResponse<List<SystemConfiguration>>> getConfigurations(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("System configurations retrieved", superAdminService.getAllConfigurations(), correlationId));
    }

    @PutMapping("/configurations/{configKey}")
    @AuditLoggable(action = "UPDATE_CONFIGURATION", entityName = "SystemConfiguration")
    @Operation(summary = "Update platform configuration key-value")
    public ResponseEntity<ApiResponse<SystemConfiguration>> updateConfiguration(
            @PathVariable String configKey, @RequestParam String configValue, HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Configuration updated", superAdminService.updateConfiguration(configKey, configValue), correlationId));
    }

    // ==========================================
    // 10. REPORTS
    // ==========================================
    @GetMapping("/reports/summary")
    @Operation(summary = "Get platform metadata-driven summary report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReportsSummary(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-ID");
        return ResponseEntity.ok(ApiResponse.ok("Report generated", superAdminService.getReportsSummary(), correlationId));
    }
}

package com.duavero.core.context;

import com.duavero.core.exception.CrossTenantViolationException;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TenantEntityListener {

    @PrePersist
    public void prePersist(BaseTenantEntity entity) {
        Long currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null) {
            if (!TenantContextHolder.isSuperAdminScope() && !TenantContextHolder.isSystemContext()) {
                log.error("Security Violation: Attempted to persist BaseTenantEntity '{}' without active TenantContext",
                        entity.getClass().getSimpleName());
                throw new IllegalStateException("Security Violation: Cannot persist tenant-scoped entity without active TenantContext");
            }
        } else {
            // Always enforce server-derived tenantId regardless of entity state
            entity.setTenantId(currentTenantId);
        }
    }

    @PreUpdate
    public void preUpdate(BaseTenantEntity entity) {
        Long currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId != null && !currentTenantId.equals(entity.getTenantId())) {
            log.error("Cross-Tenant Modification Violation: Active tenant '{}' tried to modify entity '{}' belonging to tenant '{}'",
                    currentTenantId, entity.getClass().getSimpleName(), entity.getTenantId());
            throw new CrossTenantViolationException("Cross-Tenant Modification Violation: Cannot reassign or mutate entity belonging to another tenant");
        }
    }
}

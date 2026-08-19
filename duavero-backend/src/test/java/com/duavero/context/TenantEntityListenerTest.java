package com.duavero.context;

import com.duavero.core.context.BaseTenantEntity;
import com.duavero.core.context.TenantContextHolder;
import com.duavero.core.context.TenantEntityListener;
import com.duavero.core.exception.CrossTenantViolationException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TenantEntityListenerTest {

    private TenantEntityListener listener;

    private static class TestTenantEntity extends BaseTenantEntity {
        // Concrete test subclass
    }

    @BeforeEach
    void setUp() {
        listener = new TenantEntityListener();
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("PrePersist should automatically populate tenant_id from active TenantContext")
    void testPrePersistSetsTenantId() {
        TenantContextHolder.setTenantId(101L);
        TestTenantEntity entity = new TestTenantEntity();

        listener.prePersist(entity);

        assertEquals(101L, entity.getTenantId(), "Entity tenant_id must match active TenantContext");
    }

    @Test
    @DisplayName("PrePersist should throw IllegalStateException when no active TenantContext exists")
    void testPrePersistThrowsWhenNoContext() {
        TestTenantEntity entity = new TestTenantEntity();

        assertThrows(IllegalStateException.class, () -> listener.prePersist(entity),
                "Should reject persistence without active tenant context");
    }

    @Test
    @DisplayName("PrePersist should allow persistence under Super Admin scope")
    void testPrePersistAllowsSuperAdmin() {
        TenantContextHolder.setSuperAdminScope(true);
        TestTenantEntity entity = new TestTenantEntity();

        assertDoesNotThrow(() -> listener.prePersist(entity));
    }

    @Test
    @DisplayName("PrePersist should allow persistence under System Context")
    void testPrePersistAllowsSystemContext() {
        TenantContextHolder.setSystemContext(true);
        TestTenantEntity entity = new TestTenantEntity();

        assertDoesNotThrow(() -> listener.prePersist(entity));
    }

    @Test
    @DisplayName("PreUpdate should throw CrossTenantViolationException when tenant reassignment attempted")
    void testPreUpdateRejectsCrossTenantMutation() {
        TenantContextHolder.setTenantId(101L);

        TestTenantEntity entity = new TestTenantEntity();
        entity.setTenantId(202L); // Belongs to Tenant 202

        assertThrows(CrossTenantViolationException.class, () -> listener.preUpdate(entity),
                "Should block Tenant 101 from updating entity belonging to Tenant 202");
    }

    @Test
    @DisplayName("PreUpdate should succeed when modifying entity within same tenant")
    void testPreUpdateAllowsSameTenantMutation() {
        TenantContextHolder.setTenantId(101L);

        TestTenantEntity entity = new TestTenantEntity();
        entity.setTenantId(101L); // Same tenant

        assertDoesNotThrow(() -> listener.preUpdate(entity));
    }
}

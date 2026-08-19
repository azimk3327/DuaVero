package com.duavero.context;

import com.duavero.core.context.TenantContext;
import com.duavero.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class TenantContextHolderTest {

    @BeforeEach
    @AfterEach
    void cleanup() {
        TenantContextHolder.clear();
        MDC.clear();
    }

    @Test
    @DisplayName("Should set and get tenantId with MDC synchronization")
    void testSetAndGetTenantId() {
        TenantContextHolder.setTenantId(101L);

        assertEquals(101L, TenantContextHolder.getTenantId());
        assertEquals("101", MDC.get("tenantId"));
        assertFalse(TenantContextHolder.isSuperAdminScope());
    }

    @Test
    @DisplayName("Should getRequiredTenantId throw exception when tenantId is null")
    void testGetRequiredTenantIdThrowsWhenNull() {
        assertThrows(IllegalStateException.class, TenantContextHolder::getRequiredTenantId);
    }

    @Test
    @DisplayName("Should configure Super Admin scope properly")
    void testSuperAdminScope() {
        TenantContextHolder.setSuperAdminScope(true);

        assertTrue(TenantContextHolder.isSuperAdminScope());
        assertNull(TenantContextHolder.getTenantId());
        assertEquals("super-admin", MDC.get("tenantId"));
    }

    @Test
    @DisplayName("Should configure System Context properly")
    void testSystemContext() {
        TenantContextHolder.setSystemContext(true);

        assertTrue(TenantContextHolder.isSystemContext());
        assertEquals("system", MDC.get("tenantId"));
    }

    @Test
    @DisplayName("Should set complete TenantContext object")
    void testSetFullContext() {
        TenantContext context = TenantContext.builder()
                .tenantId(202L)
                .userId(55L)
                .userType("TENANT_ADMIN")
                .roles(Set.of("TENANT_ADMIN"))
                .permissions(Set.of("QUOTATION_CREATE", "PRODUCT_CREATE_UPDATE"))
                .superAdminScope(false)
                .build();

        TenantContextHolder.setContext(context);

        assertEquals(202L, TenantContextHolder.getTenantId());
        assertEquals(55L, TenantContextHolder.getUserId());
        assertEquals("202", MDC.get("tenantId"));
        assertEquals("55", MDC.get("userId"));
        assertTrue(TenantContextHolder.hasPermission("QUOTATION_CREATE"));
        assertFalse(TenantContextHolder.hasPermission("PLATFORM_MANAGE"));
    }

    @Test
    @DisplayName("Should clear thread local context and MDC")
    void testClearContext() {
        TenantContextHolder.setTenantId(101L);
        TenantContextHolder.setUserId(50L);

        TenantContextHolder.clear();

        assertNull(TenantContextHolder.getTenantId());
        assertNull(TenantContextHolder.getUserId());
        assertNull(MDC.get("tenantId"));
        assertNull(MDC.get("userId"));
    }

    @Test
    @DisplayName("Should maintain strict thread isolation between concurrent threads")
    void testThreadIsolation() throws InterruptedException {
        TenantContextHolder.setTenantId(100L);

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Long> backgroundTenantId = new AtomicReference<>();

        Thread thread = new Thread(() -> {
            TenantContextHolder.setTenantId(200L);
            backgroundTenantId.set(TenantContextHolder.getTenantId());
            TenantContextHolder.clear();
            latch.countDown();
        });
        thread.start();
        latch.await();

        assertEquals(200L, backgroundTenantId.get(), "Background thread should see tenant 200");
        assertEquals(100L, TenantContextHolder.getTenantId(), "Main thread must remain tenant 100");
    }
}

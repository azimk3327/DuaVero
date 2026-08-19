package com.duavero.core.context;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class TenantFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Before("execution(* com.duavero.modules..*Repository.*(..))")
    public void applyTenantFilter() {
        Long tenantId = TenantContextHolder.getTenantId();
        // Super Admin operations running without a specific tenant context bypass the filter
        if (tenantId != null && !TenantContextHolder.isSuperAdminScope()) {
            try {
                Session session = entityManager.unwrap(Session.class);
                if (session != null && session.isOpen()) {
                    Filter filter = session.enableFilter("tenantFilter");
                    filter.setParameter("tenantId", tenantId);
                    filter.validate();
                }
            } catch (Exception ex) {
                log.debug("Tenant filter not applied or session not unwrappable: {}", ex.getMessage());
            }
        }
    }
}

package com.duavero.core.context;

import org.slf4j.MDC;
import org.springframework.core.task.TaskDecorator;

import java.util.Map;

public class TenantAwareTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        TenantContext tenantContext = TenantContextHolder.getContext();
        Map<String, String> mdcContextMap = MDC.getCopyOfContextMap();

        return () -> {
            try {
                if (tenantContext != null) {
                    TenantContextHolder.setContext(tenantContext);
                }
                if (mdcContextMap != null) {
                    MDC.setContextMap(mdcContextMap);
                }
                runnable.run();
            } finally {
                TenantContextHolder.clear();
                MDC.clear();
            }
        };
    }
}

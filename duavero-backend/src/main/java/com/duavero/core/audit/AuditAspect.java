package com.duavero.core.audit;

import com.duavero.core.context.TenantContextHolder;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Slf4j
@Aspect
@Component
public class AuditAspect {

    @Around("@annotation(com.duavero.core.audit.AuditLoggable) || @within(com.duavero.core.audit.AuditLoggable)")
    public Object auditExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        AuditLoggable annotation = method.getAnnotation(AuditLoggable.class);
        if (annotation == null) {
            annotation = joinPoint.getTarget().getClass().getAnnotation(AuditLoggable.class);
        }

        String action = annotation != null ? annotation.action() : method.getName();
        String entityName = annotation != null ? annotation.entityName() : joinPoint.getTarget().getClass().getSimpleName();
        Long tenantId = TenantContextHolder.getTenantId();
        Long userId = TenantContextHolder.getUserId();
        String correlationId = MDC.get("correlationId");

        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            log.info("AUDIT_TRAIL: action='{}', entity='{}', tenantId={}, userId={}, correlationId='{}', durationMs={}, status=SUCCESS",
                    action, entityName, tenantId, userId, correlationId, (System.currentTimeMillis() - start));
            return result;
        } catch (Throwable ex) {
            log.error("AUDIT_TRAIL: action='{}', entity='{}', tenantId={}, userId={}, correlationId='{}', durationMs={}, status=FAILURE, error='{}'",
                    action, entityName, tenantId, userId, correlationId, (System.currentTimeMillis() - start), ex.getMessage());
            throw ex;
        }
    }
}

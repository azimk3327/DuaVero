package com.duavero.core.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CrossTenantViolationException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus status;

    public CrossTenantViolationException(String message) {
        super(message);
        this.errorCode = ErrorCodes.ERR_CROSS_TENANT_VIOLATION;
        this.status = HttpStatus.FORBIDDEN;
    }
}

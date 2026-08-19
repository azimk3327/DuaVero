package com.duavero.core.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class UnauthorizedException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus status;

    public UnauthorizedException(String message) {
        super(message);
        this.errorCode = ErrorCodes.ERR_UNAUTHORIZED;
        this.status = HttpStatus.UNAUTHORIZED;
    }

    public UnauthorizedException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.status = HttpStatus.UNAUTHORIZED;
    }
}

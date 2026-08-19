package com.duavero.core.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ResourceNotFoundException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus status;

    public ResourceNotFoundException(String message) {
        super(message);
        this.errorCode = ErrorCodes.ERR_RESOURCE_NOT_FOUND;
        this.status = HttpStatus.NOT_FOUND;
    }

    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(String.format("%s with identifier '%s' was not found.", resourceName, identifier));
        this.errorCode = ErrorCodes.ERR_RESOURCE_NOT_FOUND;
        this.status = HttpStatus.NOT_FOUND;
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s with %s '%s' was not found.", resourceName, fieldName, fieldValue));
        this.errorCode = ErrorCodes.ERR_RESOURCE_NOT_FOUND;
        this.status = HttpStatus.NOT_FOUND;
    }
}

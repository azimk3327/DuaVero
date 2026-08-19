package com.duavero.exception;

import com.duavero.core.exception.*;
import com.duavero.core.response.ErrorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        MDC.put("correlationId", "test-corr-id-999");
    }

    @Test
    @DisplayName("Should handle ResourceNotFoundException with HTTP 404")
    void testHandleResourceNotFound() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/tenant/invoices/999");
        ResourceNotFoundException ex = new ResourceNotFoundException("Invoice", 999L);

        ResponseEntity<ErrorResponse> response = handler.handleResourceNotFoundException(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("Resource Not Found", response.getBody().getTitle());
        assertEquals(ErrorCodes.ERR_RESOURCE_NOT_FOUND, response.getBody().getErrorCode());
        assertEquals("/api/v1/tenant/invoices/999", response.getBody().getInstance());
        assertEquals("test-corr-id-999", response.getBody().getCorrelationId());
    }

    @Test
    @DisplayName("Should handle CrossTenantViolationException with HTTP 403")
    void testHandleCrossTenantViolation() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/tenant/products/500");
        CrossTenantViolationException ex = new CrossTenantViolationException("Cross-tenant access attempted");

        ResponseEntity<ErrorResponse> response = handler.handleCrossTenantViolationException(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().getStatus());
        assertEquals(ErrorCodes.ERR_CROSS_TENANT_VIOLATION, response.getBody().getErrorCode());
    }

    @Test
    @DisplayName("Should handle BusinessException with HTTP 400")
    void testHandleBusinessException() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/tenant/quotations");
        BusinessException ex = new BusinessException("Cannot approve quotation with zero line items", ErrorCodes.ERR_BUSINESS_VIOLATION);

        ResponseEntity<ErrorResponse> response = handler.handleBusinessException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals(ErrorCodes.ERR_BUSINESS_VIOLATION, response.getBody().getErrorCode());
    }

    @Test
    @DisplayName("Should handle UnauthorizedException with HTTP 401")
    void testHandleUnauthorizedException() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/tenant/profile");
        UnauthorizedException ex = new UnauthorizedException("Invalid or expired session token");

        ResponseEntity<ErrorResponse> response = handler.handleUnauthorizedException(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(401, response.getBody().getStatus());
        assertEquals(ErrorCodes.ERR_UNAUTHORIZED, response.getBody().getErrorCode());
    }
}

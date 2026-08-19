package com.duavero.logging;

import com.duavero.core.logging.MdcLoggingFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class MdcLoggingFilterTest {

    private MdcLoggingFilter filter;

    @BeforeEach
    void setUp() {
        filter = new MdcLoggingFilter();
        MDC.clear();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    @DisplayName("Should generate correlationId and set in MDC and response headers")
    void testGeneratesCorrelationId() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/public/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> capturedMdcCorrelationId = new AtomicReference<>();
        AtomicReference<String> capturedMethod = new AtomicReference<>();

        FilterChain chain = (req, res) -> {
            capturedMdcCorrelationId.set(MDC.get("correlationId"));
            capturedMethod.set(MDC.get("httpMethod"));
        };

        filter.doFilter(request, response, chain);

        assertNotNull(capturedMdcCorrelationId.get(), "MDC should contain correlationId inside filter chain");
        assertTrue(capturedMdcCorrelationId.get().startsWith("req-"), "Generated correlationId should start with req-");
        assertEquals("GET", capturedMethod.get(), "HTTP method should match request");
        assertEquals(capturedMdcCorrelationId.get(), response.getHeader("X-Correlation-ID"),
                "Response header X-Correlation-ID must match MDC correlationId");

        // After filter chain execution, MDC must be cleared
        assertNull(MDC.get("correlationId"), "MDC must be cleared after filter completion");
    }

    @Test
    @DisplayName("Should propagate incoming X-Correlation-ID request header")
    void testPropagatesExistingCorrelationId() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/tenant/products");
        request.addHeader("X-Correlation-ID", "custom-client-cid-12345");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> capturedMdcCorrelationId = new AtomicReference<>();

        FilterChain chain = (req, res) -> capturedMdcCorrelationId.set(MDC.get("correlationId"));

        filter.doFilter(request, response, chain);

        assertEquals("custom-client-cid-12345", capturedMdcCorrelationId.get());
        assertEquals("custom-client-cid-12345", response.getHeader("X-Correlation-ID"));
    }
}

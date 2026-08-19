package com.duavero.logging;

import com.duavero.core.logging.SensitiveDataMasker;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SensitiveDataMaskerTest {

    @Test
    @DisplayName("Should mask JSON sensitive fields")
    void testMaskJsonSensitiveFields() {
        String json = "{\"email\":\"user@duavero.com\", \"password\":\"P@ssw0rd123\", \"token\":\"eyJhbGciOi...\", \"name\":\"John\"}";
        String masked = SensitiveDataMasker.mask(json);

        assertFalse(masked.contains("P@ssw0rd123"), "Password must not appear in output");
        assertFalse(masked.contains("eyJhbGciOi..."), "Token must not appear in output");
        assertTrue(masked.contains("\"email\":\"user@duavero.com\""), "Non-sensitive email should remain intact");
        assertTrue(masked.contains("\"password\":\"***REDACTED***\""));
        assertTrue(masked.contains("\"token\":\"***REDACTED***\""));
    }

    @Test
    @DisplayName("Should mask key-value sensitive credentials")
    void testMaskKeyValueCredentials() {
        String input = "UserLogin(username=admin, password=secret_password_123, otp=987654)";
        String masked = SensitiveDataMasker.mask(input);

        assertFalse(masked.contains("secret_password_123"));
        assertFalse(masked.contains("987654"));
        assertTrue(masked.contains("username=admin"));
        assertTrue(masked.contains("password=***REDACTED***"));
        assertTrue(masked.contains("otp=***REDACTED***"));
    }

    @Test
    @DisplayName("Should handle null and empty input gracefully")
    void testNullAndEmpty() {
        assertNull(SensitiveDataMasker.mask(null));
        assertEquals("", SensitiveDataMasker.mask(""));
    }
}

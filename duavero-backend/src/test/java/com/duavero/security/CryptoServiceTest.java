package com.duavero.security;

import com.duavero.core.config.AppProperties;
import com.duavero.core.security.CryptoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CryptoServiceTest {

    private CryptoService cryptoService;

    @BeforeEach
    void setUp() {
        AppProperties appProperties = new AppProperties();
        appProperties.getSecurity().getCrypto().setMasterKey("test-master-key-32-chars-long-12");

        cryptoService = new CryptoService(appProperties);
        cryptoService.init();
    }

    @Test
    @DisplayName("Should encrypt plaintext and decrypt back to exact original value")
    void testEncryptAndDecryptRoundtrip() {
        String plainSecret = "rzp_live_secret_key_abcdef1234567890";

        String cipherText = cryptoService.encrypt(plainSecret);

        assertNotNull(cipherText);
        assertNotEquals(plainSecret, cipherText);

        String decrypted = cryptoService.decrypt(cipherText);
        assertEquals(plainSecret, decrypted, "Decrypted text must match original plaintext");
    }

    @Test
    @DisplayName("Should return null when encrypting or decrypting null input")
    void testNullHandling() {
        assertNull(cryptoService.encrypt(null));
        assertNull(cryptoService.decrypt(null));
    }

    @Test
    @DisplayName("Should reject tampered or corrupt ciphertext")
    void testTamperedPayloadThrows() {
        String plainSecret = "secret_payment_gateway_token";
        String cipherText = cryptoService.encrypt(plainSecret);

        // Tamper with one character
        char[] chars = cipherText.toCharArray();
        chars[chars.length - 1] = chars[chars.length - 1] == 'A' ? 'B' : 'A';
        String tampered = new String(chars);

        assertThrows(IllegalStateException.class, () -> cryptoService.decrypt(tampered),
                "Tampered GCM tag should cause decryption failure");
    }
}

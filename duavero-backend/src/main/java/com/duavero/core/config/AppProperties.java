package com.duavero.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Data
@Configuration
@ConfigurationProperties(prefix = "duavero")
public class AppProperties {

    private Security security = new Security();

    @Data
    public static class Security {
        private Jwt jwt = new Jwt();
        private Crypto crypto = new Crypto();
        private Cors cors = new Cors();
    }

    @Data
    public static class Jwt {
        private String secret = "duavero-super-secure-production-ready-jwt-secret-key-32chars-min";
        private long expirationMinutes = 15;
        private long refreshExpirationDays = 7;
        private String issuer = "duavero-platform";
    }

    @Data
    public static class Crypto {
        private String masterKey = "duavero-aes-256-gcm-master-encryption-key-32b";
    }

    @Data
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:4200", "http://localhost:3000");
        private List<String> allowedMethods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        private List<String> allowedHeaders = List.of("*");
        private boolean allowCredentials = true;
        private long maxAgeSeconds = 3600;
    }
}

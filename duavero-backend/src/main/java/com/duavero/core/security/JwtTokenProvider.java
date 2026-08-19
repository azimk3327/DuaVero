package com.duavero.core.security;

import com.duavero.core.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final AppProperties appProperties;
    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = appProperties.getSecurity().getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            // Pad or use SHA-256 to ensure at least 256 bits
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            this.signingKey = Keys.hmacShaKeyFor(padded);
        } else {
            this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        }
    }

    public String generateAccessToken(UserPrincipal principal) {
        Instant now = Instant.now();
        Instant expiry = now.plus(appProperties.getSecurity().getJwt().getExpirationMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(principal.getEmail())
                .issuer(appProperties.getSecurity().getJwt().getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claim("userId", principal.getUserId())
                .claim("tenantId", principal.getTenantId())
                .claim("userType", principal.getUserType())
                .claim("roles", new ArrayList<>(principal.getRoles()))
                .claim("permissions", new ArrayList<>(principal.getPermissions()))
                .signWith(signingKey)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        Instant now = Instant.now();
        Instant expiry = now.plus(appProperties.getSecurity().getJwt().getRefreshExpirationDays(), ChronoUnit.DAYS);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(userId))
                .issuer(appProperties.getSecurity().getJwt().getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claim("type", "REFRESH")
                .signWith(signingKey)
                .compact();
    }

    public Claims parseAndValidateClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException ex) {
            log.warn("JWT token has expired: {}", ex.getMessage());
            throw ex;
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
            throw ex;
        }
    }

    public boolean validateToken(String token) {
        try {
            parseAndValidateClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public UserPrincipal extractUserPrincipal(String token) {
        Claims claims = parseAndValidateClaims(token);
        Long userId = claims.get("userId", Long.class);
        Long tenantId = claims.get("tenantId", Long.class);
        String userType = claims.get("userType", String.class);
        String email = claims.getSubject();

        @SuppressWarnings("unchecked")
        List<String> rolesList = claims.get("roles", List.class);
        Set<String> roles = rolesList != null ? new HashSet<>(rolesList) : Collections.emptySet();

        @SuppressWarnings("unchecked")
        List<String> permissionsList = claims.get("permissions", List.class);
        Set<String> permissions = permissionsList != null ? new HashSet<>(permissionsList) : Collections.emptySet();

        return UserPrincipal.builder()
                .userId(userId)
                .tenantId(tenantId)
                .email(email)
                .userType(userType)
                .roles(roles)
                .permissions(permissions)
                .active(true)
                .build();
    }
}

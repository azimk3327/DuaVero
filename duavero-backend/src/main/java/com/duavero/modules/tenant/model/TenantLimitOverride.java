package com.duavero.modules.tenant.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_limit_overrides")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantLimitOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "limit_key", nullable = false, length = 50)
    private String limitKey;

    @Column(name = "override_value", nullable = false)
    private Long overrideValue;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

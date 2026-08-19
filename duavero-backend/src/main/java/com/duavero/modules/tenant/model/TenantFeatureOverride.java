package com.duavero.modules.tenant.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_feature_overrides")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantFeatureOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "feature_id", nullable = false)
    private Long featureId;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled;

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

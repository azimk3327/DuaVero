package com.duavero.modules.subscription.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "package_limits")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Column(name = "limit_key", nullable = false, length = 50)
    private String limitKey;

    @Column(name = "limit_value", nullable = false)
    private Long limitValue;
}

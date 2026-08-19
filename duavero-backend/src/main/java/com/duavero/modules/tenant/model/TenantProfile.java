package com.duavero.modules.tenant.model;

import com.duavero.core.context.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tenant_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantProfile extends BaseAuditableEntity {

    @Id
    @Column(name = "tenant_id")
    private Long tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "tagline")
    private String tagline;

    @Column(name = "about_text", columnDefinition = "TEXT")
    private String aboutText;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(name = "primary_color", length = 20)
    private String primaryColor = "#0F172A";

    @Column(name = "secondary_color", length = 20)
    private String secondaryColor = "#3B82F6";

    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "postal_code", length = 30)
    private String postalCode;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Column(name = "pan_number", length = 50)
    private String panNumber;

    @Column(name = "website_url")
    private String websiteUrl;

    @Column(name = "is_publicly_listed", nullable = false)
    private boolean publiclyListed = true;
}

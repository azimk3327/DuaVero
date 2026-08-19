package com.duavero.modules.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantManagementDto {
    private Long id;
    @NotBlank(message = "Slug is required")
    private String slug;
    @NotBlank(message = "Business name is required")
    private String businessName;
    @NotBlank(message = "Contact email is required")
    private String contactEmail;
    @NotBlank(message = "Contact phone is required")
    private String contactPhone;
    @Builder.Default
    private String countryCode = "IN";
    @Builder.Default
    private String currencyCode = "INR";
    @Builder.Default
    private String status = "ACTIVE";
    private LocalDateTime trialEndsAt;
    private String tagline;
    private String aboutText;
    private String logoUrl;
    private String bannerUrl;
    private String primaryColor;
    private String secondaryColor;
    private String city;
    private String state;
    private String postalCode;
    private String gstNumber;
    private String panNumber;
    private String websiteUrl;
    private List<Long> enabledCategoryIds;
    private Long userCount;
}

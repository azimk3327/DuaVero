package com.duavero.modules.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    // Note: If client tries to forge tenantId, server MUST ignore it and use TenantContextHolder
    private Long tenantId;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private Long brandId;

    @NotBlank(message = "Product name is required")
    private String name;

    private String sku;

    private String shortDescription;

    private String description;

    @NotNull(message = "Base price is required")
    private BigDecimal basePrice;

    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal taxRatePercentage = new BigDecimal("18.00");

    @Builder.Default
    private int warrantyMonths = 12;

    @Builder.Default
    private String status = "PUBLISHED";
}

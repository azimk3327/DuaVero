package com.duavero.modules.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {

    private Long id;
    private Long tenantId;
    private Long categoryId;
    private Long brandId;
    private String name;
    private String slug;
    private String sku;
    private String shortDescription;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal discountPercentage;
    private BigDecimal taxRatePercentage;
    private int warrantyMonths;
    private boolean available;
    private boolean featured;
    private String status;
    private LocalDateTime createdAt;
}

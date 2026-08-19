package com.duavero.modules.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private Long id;
    private Long parentId;
    @NotBlank(message = "Category code is required")
    private String code;
    @NotBlank(message = "Category name is required")
    private String name;
    private String description;
    private String iconUrl;
    private String imageUrl;
    @Builder.Default
    private String industryType = "FURNISHING";
    private String hsnCode;
    @Builder.Default
    private java.math.BigDecimal defaultTaxRate = new java.math.BigDecimal("18.00");
    private int sortOrder;
    @Builder.Default
    private boolean active = true;
    @Builder.Default
    private boolean deleted = false;
    private List<CategoryAttributeDto> attributes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryAttributeDto {
        private Long attributeId;
        private String attributeCode;
        private String attributeName;
        private String dataType;
        private String unitOfMeasure;
        private String optionsJson;
        private boolean required;
        private boolean filterable;
        private int sortOrder;
    }
}

package com.duavero.modules.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttributeDto {
    private Long id;
    @NotBlank(message = "Attribute code is required")
    private String code;
    @NotBlank(message = "Attribute name is required")
    private String name;
    @NotBlank(message = "Data type is required")
    private String dataType; // TEXT, NUMBER, DECIMAL, DROPDOWN, MULTI_SELECT, BOOLEAN, DATE, MEASUREMENT
    private String unitOfMeasure;
    private String optionsJson;
    private String validationRegex;
    private boolean requiredDefault;
}

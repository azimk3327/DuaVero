package com.duavero.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveQuotationRequest {

    /**
     * Optional adjusted discount percentage if Manager wishes to modify it
     */
    private BigDecimal adjustedDiscountPercentage;

    /**
     * Approval remarks from Manager / Company Admin
     */
    private String remarks;
}

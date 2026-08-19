package com.duavero.modules.quotation.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuotationRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private Long enquiryId;

    private LocalDate issueDate;

    private LocalDate validUntilDate;

    private BigDecimal discountPercentage;

    private String discountApprovalReason;

    private BigDecimal advanceRequiredPercentage;

    private String notes;

    private String termsAndConditions;

    @NotEmpty(message = "At least one item is required in the quotation")
    private List<CreateQuotationItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateQuotationItemRequest {
        private String itemType;
        private Long productId;
        private Long serviceId;
        @NotNull(message = "Item name is required")
        private String itemName;
        private String hsnCode;
        private String description;
        private String specificationsJson;
        @NotNull(message = "Unit price is required")
        private BigDecimal unitPrice;
        @NotNull(message = "Quantity is required")
        private BigDecimal quantity;
        private BigDecimal discountPercentage;
        private BigDecimal taxRatePercentage;
        private int sortOrder;
    }
}

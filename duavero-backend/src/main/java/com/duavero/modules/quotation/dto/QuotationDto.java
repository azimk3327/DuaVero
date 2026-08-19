package com.duavero.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationDto {

    private Long id;
    private Long organizationId;
    private Long customerId;
    private String customerName;
    private Long enquiryId;
    private String quotationNumber;
    private int revisionNumber;
    private String status;
    private LocalDate issueDate;
    private LocalDate validUntilDate;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal discountPercentage;
    private String discountApprovalReason;
    private Long approvedBy;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal advanceRequiredPercentage;
    private BigDecimal advanceAmountDue;
    private BigDecimal remainingBalanceAmount;
    private String notes;
    private String termsAndConditions;
    private String pdfUrl;
    private LocalDateTime createdAt;
    private List<QuotationItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuotationItemDto {
        private Long id;
        private String itemType;
        private Long productId;
        private Long serviceId;
        private String itemName;
        private String hsnCode;
        private String description;
        private String specificationsJson;
        private BigDecimal unitPrice;
        private BigDecimal quantity;
        private BigDecimal discountPercentage;
        private BigDecimal taxRatePercentage;
        private BigDecimal totalPrice;
        private int sortOrder;
    }
}

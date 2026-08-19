package com.duavero.modules.quotation.model;

import com.duavero.core.context.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quotation extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "enquiry_id")
    private Long enquiryId;

    @Column(name = "quotation_number", nullable = false, length = 50)
    private String quotationNumber;

    @Builder.Default
    @Column(name = "revision_number", nullable = false)
    private int revisionNumber = 1;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "DRAFT";

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "valid_until_date", nullable = false)
    private LocalDate validUntilDate;

    @Builder.Default
    @Column(name = "subtotal_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "discount_approval_reason", length = 500)
    private String discountApprovalReason;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Builder.Default
    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "advance_required_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal advanceRequiredPercentage = new BigDecimal("30.00");

    @Builder.Default
    @Column(name = "advance_amount_due", nullable = false, precision = 12, scale = 2)
    private BigDecimal advanceAmountDue = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "remaining_balance_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal remainingBalanceAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Builder.Default
    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<QuotationItem> items = new ArrayList<>();
}

package com.duavero.modules.quotation.service;

import com.duavero.core.exception.BusinessException;
import com.duavero.core.exception.ResourceNotFoundException;
import com.duavero.core.security.UserPrincipal;
import com.duavero.modules.auth.model.User;
import com.duavero.modules.auth.repository.UserRepository;
import com.duavero.modules.quotation.dto.ApproveQuotationRequest;
import com.duavero.modules.quotation.dto.CreateQuotationRequest;
import com.duavero.modules.quotation.dto.QuotationDto;
import com.duavero.modules.quotation.model.Quotation;
import com.duavero.modules.quotation.model.QuotationItem;
import com.duavero.modules.quotation.repository.QuotationItemRepository;
import com.duavero.modules.quotation.repository.QuotationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationService {

    public static final BigDecimal MAX_UNAPPROVED_DISCOUNT_PERCENTAGE = new BigDecimal("20.00");

    private final QuotationRepository quotationRepository;
    private final QuotationItemRepository quotationItemRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<QuotationDto> getAllQuotations(Long tenantId, String status) {
        List<Quotation> quotes;
        if (status != null && !status.isBlank()) {
            quotes = quotationRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.toUpperCase().trim());
        } else {
            quotes = quotationRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }
        return quotes.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuotationDto getQuotationById(Long id, Long tenantId) {
        Quotation quotation = quotationRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", "id", id));
        return mapToDto(quotation);
    }

    @Transactional(readOnly = true)
    public List<QuotationDto> getPendingApprovals(Long tenantId) {
        List<Quotation> pending = quotationRepository.findPendingApprovalQuotations(tenantId);
        return pending.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public QuotationDto createQuotation(CreateQuotationRequest request, UserPrincipal currentUser) {
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null) {
            throw new BusinessException("User must belong to an active organization to create quotations.");
        }

        BigDecimal discountPct = request.getDiscountPercentage() != null ? request.getDiscountPercentage() : BigDecimal.ZERO;
        boolean requiresApproval = discountPct.compareTo(MAX_UNAPPROVED_DISCOUNT_PERCENTAGE) > 0;
        boolean isManagerOrAdmin = currentUser.hasRole("SUPER_ADMIN")
                || currentUser.hasRole("TENANT_ADMIN")
                || currentUser.hasRole("MANAGER")
                || currentUser.hasRole("TENANT_MANAGER")
                || currentUser.hasPermission("QUOTATION_APPROVE");

        String status = "DRAFT";
        if (requiresApproval && !isManagerOrAdmin) {
            if (request.getDiscountApprovalReason() == null || request.getDiscountApprovalReason().trim().isBlank()) {
                throw new BusinessException("Discount of " + discountPct + "% exceeds the maximum automatic limit (20%). A mandatory 'Reason for Extra Discount' must be provided for manager review.");
            }
            status = "PENDING_APPROVAL";
        }

        String quoteNumber = generateQuotationNumber(tenantId);
        LocalDate issueDate = request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now();
        LocalDate validUntilDate = request.getValidUntilDate() != null ? request.getValidUntilDate() : issueDate.plusDays(15);
        BigDecimal advancePct = request.getAdvanceRequiredPercentage() != null ? request.getAdvanceRequiredPercentage() : new BigDecimal("30.00");

        Quotation quotation = Quotation.builder()
                .tenantId(tenantId)
                .customerId(request.getCustomerId())
                .enquiryId(request.getEnquiryId())
                .quotationNumber(quoteNumber)
                .revisionNumber(1)
                .status(status)
                .issueDate(issueDate)
                .validUntilDate(validUntilDate)
                .discountPercentage(discountPct)
                .discountApprovalReason(request.getDiscountApprovalReason())
                .advanceRequiredPercentage(advancePct)
                .notes(request.getNotes())
                .termsAndConditions(request.getTermsAndConditions() != null ? request.getTermsAndConditions()
                        : "1. 30% Advance required with purchase order.\n2. Delivery within 7-10 business days.\n3. GST 18% inclusive as quoted.")
                .build();

        if (isManagerOrAdmin && requiresApproval) {
            quotation.setStatus("APPROVED");
            quotation.setApprovedBy(currentUser.getUserId());
            quotation.setApprovedAt(LocalDateTime.now());
        }

        Quotation savedQuote = quotationRepository.save(quotation);

        // Process line items and compute mathematical sums
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        List<QuotationItem> items = new ArrayList<>();

        for (int i = 0; i < request.getItems().size(); i++) {
            CreateQuotationRequest.CreateQuotationItemRequest itemReq = request.getItems().get(i);
            BigDecimal itemPrice = itemReq.getUnitPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal qty = itemReq.getQuantity().setScale(2, RoundingMode.HALF_UP);
            BigDecimal itemDiscPct = itemReq.getDiscountPercentage() != null ? itemReq.getDiscountPercentage() : BigDecimal.ZERO;
            BigDecimal taxRate = itemReq.getTaxRatePercentage() != null ? itemReq.getTaxRatePercentage() : new BigDecimal("18.00");

            BigDecimal lineGross = itemPrice.multiply(qty);
            BigDecimal lineDiscount = lineGross.multiply(itemDiscPct).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal lineNet = lineGross.subtract(lineDiscount);
            BigDecimal lineTax = lineNet.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineNet.add(lineTax);

            subtotal = subtotal.add(lineNet);
            totalTax = totalTax.add(lineTax);

            QuotationItem item = QuotationItem.builder()
                    .tenantId(tenantId)
                    .quotation(savedQuote)
                    .itemType(itemReq.getItemType() != null ? itemReq.getItemType() : "PRODUCT")
                    .productId(itemReq.getProductId())
                    .serviceId(itemReq.getServiceId())
                    .itemName(itemReq.getItemName())
                    .hsnCode(itemReq.getHsnCode())
                    .description(itemReq.getDescription())
                    .specificationsJson(itemReq.getSpecificationsJson())
                    .unitPrice(itemPrice)
                    .quantity(qty)
                    .discountPercentage(itemDiscPct)
                    .taxRatePercentage(taxRate)
                    .totalPrice(lineTotal)
                    .sortOrder(itemReq.getSortOrder() > 0 ? itemReq.getSortOrder() : i + 1)
                    .build();

            items.add(item);
        }

        quotationItemRepository.saveAll(items);

        // Header Discount & Totals
        BigDecimal headerDiscountAmount = subtotal.multiply(discountPct).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal netSubtotalAfterHeaderDiscount = subtotal.subtract(headerDiscountAmount);
        BigDecimal totalAmount = netSubtotalAfterHeaderDiscount.add(totalTax);
        BigDecimal advanceDue = totalAmount.multiply(advancePct).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal balanceDue = totalAmount.subtract(advanceDue);

        savedQuote.setSubtotalAmount(subtotal);
        savedQuote.setDiscountAmount(headerDiscountAmount);
        savedQuote.setTaxAmount(totalTax);
        savedQuote.setTotalAmount(totalAmount);
        savedQuote.setAdvanceAmountDue(advanceDue);
        savedQuote.setRemainingBalanceAmount(balanceDue);
        savedQuote.setItems(items);

        Quotation finalSaved = quotationRepository.save(savedQuote);
        return mapToDto(finalSaved);
    }

    @Transactional
    public QuotationDto approveQuotation(Long id, Long tenantId, UserPrincipal approver, ApproveQuotationRequest request) {
        Quotation quotation = quotationRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", "id", id));

        if (!"PENDING_APPROVAL".equalsIgnoreCase(quotation.getStatus()) && !"DRAFT".equalsIgnoreCase(quotation.getStatus())) {
            throw new BusinessException("Quotation #" + quotation.getQuotationNumber() + " is already in " + quotation.getStatus() + " status.");
        }

        // Apply optional adjusted discount
        if (request != null && request.getAdjustedDiscountPercentage() != null) {
            BigDecimal newDiscountPct = request.getAdjustedDiscountPercentage();
            quotation.setDiscountPercentage(newDiscountPct);
            recalculateTotals(quotation);
        }

        quotation.setStatus("APPROVED");
        quotation.setApprovedBy(approver.getUserId());
        quotation.setApprovedAt(LocalDateTime.now());
        if (request != null && request.getRemarks() != null) {
            quotation.setNotes((quotation.getNotes() != null ? quotation.getNotes() + "\n" : "") + "[Approval Remarks]: " + request.getRemarks());
        }

        Quotation saved = quotationRepository.save(quotation);
        log.info("Quotation #{} approved by User #{}", saved.getQuotationNumber(), approver.getUserId());
        return mapToDto(saved);
    }

    @Transactional
    public QuotationDto rejectQuotation(Long id, Long tenantId, UserPrincipal approver, String rejectionReason) {
        Quotation quotation = quotationRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", "id", id));

        quotation.setStatus("REJECTED");
        quotation.setRejectionReason(rejectionReason != null ? rejectionReason : "Discount threshold not approved by management.");
        quotation.setApprovedBy(approver.getUserId());
        quotation.setApprovedAt(LocalDateTime.now());

        Quotation saved = quotationRepository.save(quotation);
        log.info("Quotation #{} rejected by User #{} with reason: {}", saved.getQuotationNumber(), approver.getUserId(), rejectionReason);
        return mapToDto(saved);
    }

    private void recalculateTotals(Quotation quote) {
        BigDecimal subtotal = quote.getSubtotalAmount() != null ? quote.getSubtotalAmount() : BigDecimal.ZERO;
        BigDecimal tax = quote.getTaxAmount() != null ? quote.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal discPct = quote.getDiscountPercentage() != null ? quote.getDiscountPercentage() : BigDecimal.ZERO;
        BigDecimal advPct = quote.getAdvanceRequiredPercentage() != null ? quote.getAdvanceRequiredPercentage() : new BigDecimal("30.00");

        BigDecimal discAmount = subtotal.multiply(discPct).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal netSubtotal = subtotal.subtract(discAmount);
        BigDecimal total = netSubtotal.add(tax);
        BigDecimal advance = total.multiply(advPct).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal balance = total.subtract(advance);

        quote.setDiscountAmount(discAmount);
        quote.setTotalAmount(total);
        quote.setAdvanceAmountDue(advance);
        quote.setRemainingBalanceAmount(balance);
    }

    private String generateQuotationNumber(Long tenantId) {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMM"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "QT-" + datePrefix + "-T" + tenantId + "-" + rand;
    }

    private QuotationDto mapToDto(Quotation q) {
        String approvedByName = null;
        if (q.getApprovedBy() != null) {
            approvedByName = userRepository.findById(q.getApprovedBy())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Manager #" + q.getApprovedBy());
        }

        List<QuotationDto.QuotationItemDto> itemDtos = new ArrayList<>();
        List<QuotationItem> items = q.getItems() != null && !q.getItems().isEmpty()
                ? q.getItems()
                : quotationItemRepository.findByQuotationIdOrderBySortOrderAsc(q.getId());

        for (QuotationItem item : items) {
            itemDtos.add(QuotationDto.QuotationItemDto.builder()
                    .id(item.getId())
                    .itemType(item.getItemType())
                    .productId(item.getProductId())
                    .serviceId(item.getServiceId())
                    .itemName(item.getItemName())
                    .hsnCode(item.getHsnCode())
                    .description(item.getDescription())
                    .specificationsJson(item.getSpecificationsJson())
                    .unitPrice(item.getUnitPrice())
                    .quantity(item.getQuantity())
                    .discountPercentage(item.getDiscountPercentage())
                    .taxRatePercentage(item.getTaxRatePercentage())
                    .totalPrice(item.getTotalPrice())
                    .sortOrder(item.getSortOrder())
                    .build());
        }

        return QuotationDto.builder()
                .id(q.getId())
                .organizationId(q.getTenantId())
                .customerId(q.getCustomerId())
                .customerName("Client #" + q.getCustomerId())
                .enquiryId(q.getEnquiryId())
                .quotationNumber(q.getQuotationNumber())
                .revisionNumber(q.getRevisionNumber())
                .status(q.getStatus())
                .issueDate(q.getIssueDate())
                .validUntilDate(q.getValidUntilDate())
                .subtotalAmount(q.getSubtotalAmount())
                .discountAmount(q.getDiscountAmount())
                .discountPercentage(q.getDiscountPercentage())
                .discountApprovalReason(q.getDiscountApprovalReason())
                .approvedBy(q.getApprovedBy())
                .approvedByName(approvedByName)
                .approvedAt(q.getApprovedAt())
                .rejectionReason(q.getRejectionReason())
                .taxAmount(q.getTaxAmount())
                .totalAmount(q.getTotalAmount())
                .advanceRequiredPercentage(q.getAdvanceRequiredPercentage())
                .advanceAmountDue(q.getAdvanceAmountDue())
                .remainingBalanceAmount(q.getRemainingBalanceAmount())
                .notes(q.getNotes())
                .termsAndConditions(q.getTermsAndConditions())
                .pdfUrl(q.getPdfUrl())
                .createdAt(q.getCreatedAt())
                .items(itemDtos)
                .build();
    }
}

package com.duavero.modules.quotation.controller;

import com.duavero.core.audit.AuditLoggable;
import com.duavero.core.exception.UnauthorizedException;
import com.duavero.core.response.ApiResponse;
import com.duavero.core.security.UserPrincipal;
import com.duavero.modules.quotation.dto.ApproveQuotationRequest;
import com.duavero.modules.quotation.dto.CreateQuotationRequest;
import com.duavero.modules.quotation.dto.QuotationDto;
import com.duavero.modules.quotation.service.QuotationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/quotations", "/api/v1/tenant/quotations"})
@RequiredArgsConstructor
@Tag(name = "Quotations & Approval Workflows", description = "Tiered discount validation, manager approvals, and cost estimation")
public class QuotationController {

    private final QuotationService quotationService;

    @GetMapping
    @PreAuthorize("hasAuthority('QUOTATION_VIEW') or hasRole('TENANT_ADMIN') or hasRole('TENANT_STAFF') or hasRole('TENANT_MANAGER') or hasRole('TENANT_EMPLOYEE') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "List all quotations in organization workspace")
    public ResponseEntity<ApiResponse<List<QuotationDto>>> getQuotations(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null && !currentUser.hasRole("SUPER_ADMIN")) {
            throw new UnauthorizedException("Organization context required.");
        }

        List<QuotationDto> quotes = quotationService.getAllQuotations(tenantId != null ? tenantId : 1L, status);
        return ResponseEntity.ok(ApiResponse.ok("Quotations retrieved successfully", quotes, correlationId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('QUOTATION_VIEW') or hasRole('TENANT_ADMIN') or hasRole('TENANT_STAFF') or hasRole('TENANT_MANAGER') or hasRole('TENANT_EMPLOYEE') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get quotation details by ID")
    public ResponseEntity<ApiResponse<QuotationDto>> getQuotationById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        Long tenantId = currentUser.getTenantId() != null ? currentUser.getTenantId() : 1L;
        QuotationDto quotation = quotationService.getQuotationById(id, tenantId);
        return ResponseEntity.ok(ApiResponse.ok("Quotation details retrieved", quotation, correlationId));
    }

    @GetMapping("/approvals/pending")
    @PreAuthorize("hasAuthority('QUOTATION_APPROVE') or hasRole('TENANT_ADMIN') or hasRole('TENANT_MANAGER') or hasRole('MANAGER') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get pending quotation approval queue for Managers & Admins")
    public ResponseEntity<ApiResponse<List<QuotationDto>>> getPendingApprovals(
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        Long tenantId = currentUser.getTenantId() != null ? currentUser.getTenantId() : 1L;
        List<QuotationDto> pending = quotationService.getPendingApprovals(tenantId);
        return ResponseEntity.ok(ApiResponse.ok("Pending quotation approval queue retrieved", pending, correlationId));
    }

    @PostMapping
    @AuditLoggable(action = "CREATE_QUOTATION", entityName = "Quotation")
    @PreAuthorize("hasAuthority('QUOTATION_CREATE') or hasRole('TENANT_ADMIN') or hasRole('TENANT_STAFF') or hasRole('TENANT_MANAGER') or hasRole('TENANT_EMPLOYEE') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create a new quotation with tiered discount enforcement (≤20% automatic vs >20% approval)")
    public ResponseEntity<ApiResponse<QuotationDto>> createQuotation(
            @Valid @RequestBody CreateQuotationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        QuotationDto created = quotationService.createQuotation(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Quotation generated successfully", created, correlationId));
    }

    @PostMapping("/{id}/approve")
    @AuditLoggable(action = "APPROVE_QUOTATION", entityName = "Quotation")
    @PreAuthorize("hasAuthority('QUOTATION_APPROVE') or hasRole('TENANT_ADMIN') or hasRole('TENANT_MANAGER') or hasRole('MANAGER') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Approve a pending quotation discount")
    public ResponseEntity<ApiResponse<QuotationDto>> approveQuotation(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveQuotationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        Long tenantId = currentUser.getTenantId() != null ? currentUser.getTenantId() : 1L;
        QuotationDto approved = quotationService.approveQuotation(id, tenantId, currentUser, request);
        return ResponseEntity.ok(ApiResponse.ok("Quotation approved successfully", approved, correlationId));
    }

    @PostMapping("/{id}/reject")
    @AuditLoggable(action = "REJECT_QUOTATION", entityName = "Quotation")
    @PreAuthorize("hasAuthority('QUOTATION_APPROVE') or hasRole('TENANT_ADMIN') or hasRole('TENANT_MANAGER') or hasRole('MANAGER') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Reject a pending quotation discount with reason")
    public ResponseEntity<ApiResponse<QuotationDto>> rejectQuotation(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Discount rejected by management") String reason,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        Long tenantId = currentUser.getTenantId() != null ? currentUser.getTenantId() : 1L;
        QuotationDto rejected = quotationService.rejectQuotation(id, tenantId, currentUser, reason);
        return ResponseEntity.ok(ApiResponse.ok("Quotation rejected", rejected, correlationId));
    }
}

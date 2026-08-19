package com.duavero.modules.quotation.repository;

import com.duavero.modules.quotation.model.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    List<Quotation> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    Optional<Quotation> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Quotation> findByQuotationNumberAndTenantId(String quotationNumber, Long tenantId);

    List<Quotation> findByTenantIdAndStatusOrderByCreatedAtDesc(Long tenantId, String status);

    @Query("SELECT q FROM Quotation q WHERE q.tenantId = :tenantId AND q.status = 'PENDING_APPROVAL' ORDER BY q.createdAt ASC")
    List<Quotation> findPendingApprovalQuotations(@Param("tenantId") Long tenantId);

    long countByTenantId(Long tenantId);

    long countByTenantIdAndStatus(Long tenantId, String status);
}

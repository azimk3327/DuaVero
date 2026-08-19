package com.duavero.modules.quotation.repository;

import com.duavero.modules.quotation.model.QuotationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationItemRepository extends JpaRepository<QuotationItem, Long> {

    List<QuotationItem> findByQuotationIdOrderBySortOrderAsc(Long quotationId);

    void deleteByQuotationId(Long quotationId);
}

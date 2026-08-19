package com.duavero.modules.catalog.repository;

import com.duavero.modules.catalog.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByTenantId(Long tenantId);

    Optional<Product> findByIdAndTenantId(Long id, Long tenantId);

    boolean existsByTenantIdAndSku(Long tenantId, String sku);

    boolean existsByCategoryId(Long categoryId);

    long countByTenantId(Long tenantId);
}

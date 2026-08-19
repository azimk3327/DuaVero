package com.duavero.modules.tenant.repository;

import com.duavero.modules.tenant.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findBySlug(String slug);

    boolean existsBySlug(String slug);

    long countByStatus(String status);

    @Query("SELECT t FROM Tenant t WHERE t.status = 'ACTIVE' OR t.status = 'TRIAL'")
    List<Tenant> findAllActiveTenants();
}

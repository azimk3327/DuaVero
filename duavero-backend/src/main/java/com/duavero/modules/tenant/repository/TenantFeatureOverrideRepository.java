package com.duavero.modules.tenant.repository;

import com.duavero.modules.tenant.model.TenantFeatureOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantFeatureOverrideRepository extends JpaRepository<TenantFeatureOverride, Long> {

    List<TenantFeatureOverride> findByTenantId(Long tenantId);

    Optional<TenantFeatureOverride> findByTenantIdAndFeatureId(Long tenantId, Long featureId);
}

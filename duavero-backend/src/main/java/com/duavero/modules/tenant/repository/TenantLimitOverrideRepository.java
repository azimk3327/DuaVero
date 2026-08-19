package com.duavero.modules.tenant.repository;

import com.duavero.modules.tenant.model.TenantLimitOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantLimitOverrideRepository extends JpaRepository<TenantLimitOverride, Long> {

    List<TenantLimitOverride> findByTenantId(Long tenantId);

    Optional<TenantLimitOverride> findByTenantIdAndLimitKey(Long tenantId, String limitKey);
}

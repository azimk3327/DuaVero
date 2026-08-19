package com.duavero.modules.tenant.repository;

import com.duavero.modules.tenant.model.TenantProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantProfileRepository extends JpaRepository<TenantProfile, Long> {

    Optional<TenantProfile> findByTenantId(Long tenantId);
}

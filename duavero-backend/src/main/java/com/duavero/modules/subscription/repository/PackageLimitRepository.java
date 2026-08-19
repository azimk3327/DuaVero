package com.duavero.modules.subscription.repository;

import com.duavero.modules.subscription.model.PackageLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageLimitRepository extends JpaRepository<PackageLimit, Long> {

    List<PackageLimit> findByPackageId(Long packageId);

    java.util.Optional<PackageLimit> findByPackageIdAndLimitKey(Long packageId, String limitKey);
}

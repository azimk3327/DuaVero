package com.duavero.modules.subscription.repository;

import com.duavero.modules.subscription.model.Package;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PackageRepository extends JpaRepository<Package, Long> {

    Optional<Package> findByCode(String code);

    List<Package> findByActiveTrueOrderBySortOrderAsc();

    List<Package> findAllByOrderBySortOrderAsc();

    boolean existsByCode(String code);
}

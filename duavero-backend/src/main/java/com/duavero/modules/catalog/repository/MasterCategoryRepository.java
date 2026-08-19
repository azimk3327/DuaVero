package com.duavero.modules.catalog.repository;

import com.duavero.modules.catalog.model.MasterCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterCategoryRepository extends JpaRepository<MasterCategory, Long> {

    Optional<MasterCategory> findByCode(String code);

    List<MasterCategory> findByDeletedFalseAndActiveTrueOrderBySortOrderAsc();

    List<MasterCategory> findByDeletedFalseOrderBySortOrderAsc();

    List<MasterCategory> findByActiveTrueOrderBySortOrderAsc();

    List<MasterCategory> findAllByOrderBySortOrderAsc();

    boolean existsByCode(String code);
}

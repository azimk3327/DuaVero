package com.duavero.modules.catalog.repository;

import com.duavero.modules.catalog.model.CategoryAttribute;
import com.duavero.modules.catalog.model.CategoryAttribute.CategoryAttributeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryAttributeRepository extends JpaRepository<CategoryAttribute, CategoryAttributeId> {

    List<CategoryAttribute> findByCategoryIdOrderBySortOrderAsc(Long categoryId);

    @Modifying
    @Query("DELETE FROM CategoryAttribute ca WHERE ca.category.id = :categoryId")
    void deleteByCategoryId(@Param("categoryId") Long categoryId);
}

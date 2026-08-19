package com.duavero.modules.catalog.repository;

import com.duavero.modules.catalog.model.AttributeDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttributeDefinitionRepository extends JpaRepository<AttributeDefinition, Long> {

    Optional<AttributeDefinition> findByCode(String code);

    boolean existsByCode(String code);
}

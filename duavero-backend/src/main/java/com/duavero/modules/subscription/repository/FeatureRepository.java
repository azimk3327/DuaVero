package com.duavero.modules.subscription.repository;

import com.duavero.modules.subscription.model.Feature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureRepository extends JpaRepository<Feature, Long> {

    Optional<Feature> findByCode(String code);

    List<Feature> findByPlatformEnabledTrue();

    boolean existsByCode(String code);
}

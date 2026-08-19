package com.duavero.modules.subscription.repository;

import com.duavero.modules.subscription.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findFirstByTenantIdOrderByCreatedAtDesc(Long tenantId);
}

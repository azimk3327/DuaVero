package com.duavero.modules.notification.repository;

import com.duavero.modules.notification.model.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {

    Optional<NotificationTemplate> findByEventCodeAndChannelAndTenantId(String eventCode, String channel, Long tenantId);

    List<NotificationTemplate> findByTenantIdIsNull();

    List<NotificationTemplate> findByTenantId(Long tenantId);
}

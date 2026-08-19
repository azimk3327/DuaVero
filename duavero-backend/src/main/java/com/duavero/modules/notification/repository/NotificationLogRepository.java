package com.duavero.modules.notification.repository;

import com.duavero.modules.notification.model.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    List<NotificationLog> findTop50ByOrderByCreatedAtDesc();

    List<NotificationLog> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
}

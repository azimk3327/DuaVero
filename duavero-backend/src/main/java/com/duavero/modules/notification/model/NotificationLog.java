package com.duavero.modules.notification.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "event_code", nullable = false, length = 80)
    private String eventCode;

    @Column(name = "channel", nullable = false, length = 30)
    private String channel;

    @Column(name = "recipient", nullable = false, length = 180)
    private String recipient;

    @Column(name = "subject", length = 255)
    private String subject;

    @Column(name = "status", nullable = false, length = 30)
    private String status; // QUEUED, SENT, FAILED, DELIVERED

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

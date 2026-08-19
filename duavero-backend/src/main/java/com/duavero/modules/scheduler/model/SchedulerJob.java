package com.duavero.modules.scheduler.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "scheduler_jobs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchedulerJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_code", nullable = false, unique = true, length = 80)
    private String jobCode;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "handler_class", nullable = false, length = 255)
    private String handlerClass;

    @Column(name = "cron_expression", nullable = false, length = 50)
    private String cronExpression;

    @Builder.Default
    @Column(name = "is_enabled", nullable = false)
    private boolean enabled = true;

    @Builder.Default
    @Column(name = "batch_size", nullable = false)
    private int batchSize = 100;

    @Builder.Default
    @Column(name = "retry_limit", nullable = false)
    private int retryLimit = 3;

    @Builder.Default
    @Column(name = "timeout_seconds", nullable = false)
    private int timeoutSeconds = 300;

    @Column(name = "last_executed_at")
    private LocalDateTime lastExecutedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

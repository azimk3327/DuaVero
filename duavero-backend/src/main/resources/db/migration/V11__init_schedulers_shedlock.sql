-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V11__init_schedulers_shedlock.sql
-- ============================================================================

-- 1. ShedLock Table (Distributed Lock Storage)
CREATE TABLE IF NOT EXISTS shedlock (
    name VARCHAR(64) NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP(3) NOT NULL,
    locked_at TIMESTAMP(3) NOT NULL,
    locked_by VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Scheduler Job Definitions
CREATE TABLE IF NOT EXISTS scheduler_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_code VARCHAR(80) NOT NULL UNIQUE COMMENT 'e.g. SUBSCRIPTION_EXPIRY_CHECKER, INVOICE_OVERDUE_REMINDER',
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    handler_class VARCHAR(255) NOT NULL COMMENT 'Spring Bean identifier',
    cron_expression VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    batch_size INT NOT NULL DEFAULT 100,
    retry_limit INT NOT NULL DEFAULT 3,
    timeout_seconds INT NOT NULL DEFAULT 300,
    last_executed_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Scheduler Execution Telemetry Logs
CREATE TABLE IF NOT EXISTS scheduler_execution_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_code VARCHAR(80) NOT NULL,
    tenant_id BIGINT NULL COMMENT 'NULL for platform jobs, tenant_id when iterating per-tenant',
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_ms BIGINT NULL,
    status VARCHAR(30) NOT NULL COMMENT 'RUNNING, SUCCESS, FAILED, PARTIAL_SUCCESS, SKIPPED',
    records_processed INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    failure_count INT NOT NULL DEFAULT 0,
    error_summary TEXT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sched_log_job (job_code, start_time),
    INDEX idx_sched_log_tenant (tenant_id, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

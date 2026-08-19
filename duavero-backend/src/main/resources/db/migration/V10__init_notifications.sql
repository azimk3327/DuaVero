-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V10__init_notifications.sql
-- ============================================================================

-- 1. Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL COMMENT 'NULL for system default, tenant_id for tenant override',
    event_code VARCHAR(80) NOT NULL COMMENT 'e.g. QUOTATION_CREATED, INVOICE_GENERATED, SUB_EXPIRING, WELCOME_USER',
    channel VARCHAR(30) NOT NULL COMMENT 'EMAIL, SMS, WHATSAPP, IN_APP',
    subject VARCHAR(255) NULL,
    body_template TEXT NOT NULL COMMENT 'Logic-less Mustache syntax e.g. {{businessName}}',
    allowed_variables_json JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    UNIQUE KEY uk_notif_tmpl (tenant_id, event_code, channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Notification Delivery Logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL,
    event_code VARCHAR(80) NOT NULL,
    channel VARCHAR(30) NOT NULL COMMENT 'EMAIL, SMS, WHATSAPP, IN_APP',
    recipient VARCHAR(180) NOT NULL,
    subject VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED' COMMENT 'QUEUED, SENT, FAILED, DELIVERED',
    error_message TEXT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME NULL,
    INDEX idx_notif_tenant_status (tenant_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V12__init_audit_analytics.sql
-- ============================================================================

-- 1. Analytics Daily Rollups
CREATE TABLE IF NOT EXISTS analytics_daily_rollups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    event_date DATE NOT NULL,
    metric_name VARCHAR(80) NOT NULL COMMENT 'PROFILE_VIEWS, ENQUIRIES_COUNT, QUOTES_ACCEPTED, REVENUE_INR',
    metric_value DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    UNIQUE KEY uk_tenant_metric_date (tenant_id, event_date, metric_name),
    INDEX idx_analytics_date (tenant_id, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

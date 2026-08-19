-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V9__init_excel_bulk_import.sql
-- ============================================================================

-- 1. Excel Import Jobs
CREATE TABLE IF NOT EXISTS excel_import_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(30) NOT NULL DEFAULT 'PRODUCT' COMMENT 'PRODUCT, SERVICE, PRICE_UPDATE',
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED' COMMENT 'QUEUED, PROCESSING, COMPLETED, FAILED',
    total_rows INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    failure_count INT NOT NULL DEFAULT 0,
    error_workbook_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    INDEX idx_import_tenant (tenant_id, created_at),
    CONSTRAINT fk_eij_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Excel Import Row Errors
CREATE TABLE IF NOT EXISTS excel_import_errors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    `row_number` INT NOT NULL,
    field_name VARCHAR(100) NULL,
    rejected_value TEXT NULL,
    error_reason VARCHAR(500) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eie_job FOREIGN KEY (job_id) REFERENCES excel_import_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

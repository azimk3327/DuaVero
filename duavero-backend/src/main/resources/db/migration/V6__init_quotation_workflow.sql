-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V6__init_quotation_workflow.sql
-- ============================================================================

-- 1. Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    enquiry_id BIGINT NULL,
    quotation_number VARCHAR(50) NOT NULL,
    revision_number INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED, CONVERTED',
    issue_date DATE NOT NULL,
    valid_until_date DATE NOT NULL,
    subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    advance_required_percentage DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    advance_amount_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    remaining_balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    terms_and_conditions TEXT NULL,
    rejection_reason VARCHAR(500) NULL,
    pdf_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    UNIQUE KEY uk_tenant_quote_num (tenant_id, quotation_number, revision_number),
    INDEX idx_quote_tenant_status (tenant_id, status),
    CONSTRAINT fk_qt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_qt_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_qt_enquiry FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    quotation_id BIGINT NOT NULL,
    item_type VARCHAR(30) NOT NULL DEFAULT 'PRODUCT' COMMENT 'PRODUCT, SERVICE, CUSTOM',
    product_id BIGINT NULL,
    service_id BIGINT NULL,
    item_name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    specifications_json JSON NULL COMMENT 'Dynamic measurements & materials (e.g. Foam, Fabric, Tile Finish)',
    unit_price DECIMAL(12,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    total_price DECIMAL(12,2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_qi_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Quotation Revisions History
CREATE TABLE IF NOT EXISTS quotation_revisions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    quotation_id BIGINT NOT NULL,
    revision_number INT NOT NULL,
    snapshot_json JSON NOT NULL COMMENT 'Complete frozen state of quote and items at revision time',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    CONSTRAINT fk_qr_quote FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

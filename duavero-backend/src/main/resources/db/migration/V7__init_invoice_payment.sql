-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V7__init_invoice_payment.sql
-- ============================================================================

-- 1. Tenant Concurrency-Safe Invoice Sequences
CREATE TABLE IF NOT EXISTS tenant_invoice_sequences (
    tenant_id BIGINT PRIMARY KEY,
    prefix VARCHAR(30) NOT NULL DEFAULT 'INV-',
    current_number BIGINT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tis_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    quotation_id BIGINT NULL,
    customer_id BIGINT NOT NULL,
    invoice_number VARCHAR(60) NOT NULL,
    invoice_type VARCHAR(30) NOT NULL DEFAULT 'TAX_INVOICE' COMMENT 'TAX_INVOICE, PROFORMA, ADVANCE_RECEIPT',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, VOID',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    advance_paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance_due_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    pdf_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    UNIQUE KEY uk_tenant_inv_num (tenant_id, invoice_number),
    INDEX idx_inv_tenant_status (tenant_id, status),
    CONSTRAINT fk_inv_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_inv_quote FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    invoice_id BIGINT NOT NULL,
    item_type VARCHAR(30) NOT NULL DEFAULT 'PRODUCT' COMMENT 'PRODUCT, SERVICE, CUSTOM',
    item_name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    specifications_json JSON NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    total_price DECIMAL(12,2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Payment Gateway Configurations (AES-256 Encrypted Secrets)
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    provider VARCHAR(30) NOT NULL COMMENT 'RAZORPAY, STRIPE, UPI_QR, BANK_TRANSFER',
    api_key VARCHAR(255) NULL,
    encrypted_api_secret TEXT NULL COMMENT 'AES-256-GCM Encrypted',
    encrypted_webhook_secret TEXT NULL COMMENT 'AES-256-GCM Encrypted',
    account_number VARCHAR(100) NULL,
    ifsc_code VARCHAR(30) NULL,
    bank_name VARCHAR(100) NULL,
    upi_vpa VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tenant_pg_provider (tenant_id, provider),
    CONSTRAINT fk_pg_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Payments
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    invoice_id BIGINT NOT NULL,
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL COMMENT 'CASH, BANK_TRANSFER, UPI, QR, RAZORPAY, STRIPE',
    payment_gateway_tx_id VARCHAR(150) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS' COMMENT 'PENDING, SUCCESS, FAILED, REFUNDED',
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255) NULL,
    INDEX idx_pay_tenant_inv (tenant_id, invoice_id),
    CONSTRAINT fk_pay_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

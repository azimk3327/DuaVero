-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V5__init_customer_crm_enquiry.sql
-- ============================================================================

-- 1. Customers
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(180) NULL,
    phone VARCHAR(30) NOT NULL,
    alt_phone VARCHAR(30) NULL,
    company_name VARCHAR(150) NULL,
    gst_number VARCHAR(50) NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cust_tenant_phone (tenant_id, phone),
    INDEX idx_cust_tenant_email (tenant_id, email),
    CONSTRAINT fk_cust_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    address_type VARCHAR(30) NOT NULL DEFAULT 'SITE_LOCATION' COMMENT 'BILLING, SHIPPING, SITE_LOCATION',
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(30) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_ca_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Customer Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT NULL,
    category_id BIGINT NOT NULL,
    enquiry_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_email VARCHAR(180) NULL,
    site_city VARCHAR(100) NULL,
    requirements_text TEXT NOT NULL,
    dynamic_specs_json JSON NULL,
    attachment_urls_json JSON NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' COMMENT 'NEW, CONTACTED, SITE_VISIT_SCHEDULED, QUOTE_SENT, WON, LOST',
    assigned_to BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enq_tenant_status (tenant_id, status),
    UNIQUE KEY uk_tenant_enquiry_num (tenant_id, enquiry_number),
    CONSTRAINT fk_enq_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_enq_category FOREIGN KEY (category_id) REFERENCES master_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V2__init_tenant_subscription.sql
-- ============================================================================

-- 1. Tenant Custom Domains
CREATE TABLE IF NOT EXISTS tenant_domains (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    custom_domain VARCHAR(255) NOT NULL UNIQUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ssl_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, ACTIVE, FAILED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_td_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tenant Specific Configuration Overrides
CREATE TABLE IF NOT EXISTS tenant_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'STRING' COMMENT 'STRING, NUMBER, BOOLEAN, JSON',
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tenant_config_key (tenant_id, config_key),
    CONSTRAINT fk_tc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Platform Feature Flags
CREATE TABLE IF NOT EXISTS features (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g. QUOTATION_PDF, CRM, ADVANCED_ANALYTICS, EXCEL_IMPORT',
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    is_platform_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Subscription Packages (1m, 3m, 6m, 1y, Custom)
CREATE TABLE IF NOT EXISTS packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE',
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    monthly_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    quarterly_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    half_yearly_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    annual_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Package Features Join Table
CREATE TABLE IF NOT EXISTS package_features (
    package_id BIGINT NOT NULL,
    feature_id BIGINT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (package_id, feature_id),
    CONSTRAINT fk_pf_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    CONSTRAINT fk_pf_feature FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Package Resource Limits
CREATE TABLE IF NOT EXISTS package_limits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_id BIGINT NOT NULL,
    limit_key VARCHAR(50) NOT NULL COMMENT 'MAX_PRODUCTS, MAX_STAFF_USERS, MAX_QUOTES_PER_MONTH, MAX_STORAGE_MB',
    limit_value BIGINT NOT NULL DEFAULT 0 COMMENT '-1 for unlimited',
    UNIQUE KEY uk_pkg_limit (package_id, limit_key),
    CONSTRAINT fk_pl_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    billing_cycle VARCHAR(30) NOT NULL DEFAULT '1_MONTH' COMMENT '1_MONTH, 3_MONTHS, 6_MONTHS, 1_YEAR, CUSTOM',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED',
    started_at DATETIME NOT NULL,
    current_period_start DATETIME NOT NULL,
    current_period_end DATETIME NOT NULL,
    grace_period_ends_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sub_tenant (tenant_id),
    INDEX idx_sub_status_end (status, current_period_end),
    CONSTRAINT fk_sub_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_package FOREIGN KEY (package_id) REFERENCES packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Subscription Invoices
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    invoice_number VARCHAR(60) NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PAID' COMMENT 'PAID, PENDING, FAILED',
    payment_reference VARCHAR(120) NULL,
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_si_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_si_package FOREIGN KEY (package_id) REFERENCES packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tenant Feature & Limit Overrides
CREATE TABLE IF NOT EXISTS tenant_feature_overrides (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    feature_id BIGINT NOT NULL,
    is_enabled BOOLEAN NOT NULL,
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tfo_tenant_feat (tenant_id, feature_id),
    CONSTRAINT fk_tfo_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tfo_feature FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_limit_overrides (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    limit_key VARCHAR(50) NOT NULL,
    override_value BIGINT NOT NULL,
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tlo_tenant_limit (tenant_id, limit_key),
    CONSTRAINT fk_tlo_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

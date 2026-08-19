-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V1__init_platform_iam.sql
-- ============================================================================

-- 1. Platform & Tenant Users Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL COMMENT 'NULL for Super Admin, set for tenant users',
    email VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30) NULL,
    user_type VARCHAR(30) NOT NULL DEFAULT 'TENANT_STAFF' COMMENT 'SUPER_ADMIN, TENANT_ADMIN, TENANT_STAFF, CUSTOMER',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, INVITED, SUSPENDED, DEACTIVATED',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255) NULL,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lockout_until DATETIME NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    UNIQUE KEY uk_user_email_tenant (email, tenant_id),
    INDEX idx_user_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. RBAC Roles Table
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL COMMENT 'NULL for platform standard roles, tenant_id for custom tenant roles',
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    UNIQUE KEY uk_role_code_tenant (code, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Granular Permissions Table
CREATE TABLE permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g. PLATFORM_MANAGE, QUOTATION_CREATE',
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. User Roles Join Table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Role Permissions Join Table
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. User Refresh Tokens Table (Rotation & Invalidation)
CREATE TABLE user_refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_urt_user (user_id),
    CONSTRAINT fk_urt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Platform Global Configuration Table
CREATE TABLE system_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'STRING' COMMENT 'STRING, NUMBER, BOOLEAN, JSON',
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(255) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tenants Table (Multi-Tenancy Foundation)
CREATE TABLE tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE COMMENT 'Subdomain identifier e.g. royal-sofa',
    business_name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(180) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT 'IN',
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'TRIAL' COMMENT 'ONBOARDING, ACTIVE, TRIAL, SUSPENDED, EXPIRED, ARCHIVED',
    trial_ends_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    INDEX idx_tenant_status (status),
    INDEX idx_tenant_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tenant Profiles Table
CREATE TABLE tenant_profiles (
    tenant_id BIGINT PRIMARY KEY,
    tagline VARCHAR(255) NULL,
    about_text TEXT NULL,
    logo_url VARCHAR(500) NULL,
    banner_url VARCHAR(500) NULL,
    primary_color VARCHAR(20) DEFAULT '#0F172A',
    secondary_color VARCHAR(20) DEFAULT '#3B82F6',
    address_line1 VARCHAR(255) NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    postal_code VARCHAR(30) NULL,
    gst_number VARCHAR(50) NULL,
    pan_number VARCHAR(50) NULL,
    website_url VARCHAR(255) NULL,
    business_hours_json JSON NULL,
    social_links_json JSON NULL,
    is_publicly_listed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_tp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Audit Logs Table (Compliance & Security Trail)
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL COMMENT 'NULL for platform admin actions, set for tenant actions',
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NULL,
    details_json JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    correlation_id VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_tenant_created (tenant_id, created_at),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SEED FOUNDATION SYSTEM ROLES & PERMISSIONS
-- ============================================================================

INSERT INTO roles (id, tenant_id, code, name, description, is_system_role) VALUES
(1, NULL, 'SUPER_ADMIN', 'Platform Super Administrator', 'Global administrative access across all tenants and configurations', TRUE),
(2, NULL, 'TENANT_ADMIN', 'Tenant Business Owner / Administrator', 'Full administrative authority within a single tenant account', TRUE),
(3, NULL, 'TENANT_STAFF', 'Tenant Staff Member', 'Operational access for sales, quotes, and billing within a tenant', TRUE),
(4, NULL, 'CUSTOMER', 'End Customer', 'Self-service portal access for reviewing quotes, invoices, and payments', TRUE);

INSERT INTO permissions (id, module, action, code, description) VALUES
(1, 'PLATFORM', 'MANAGE', 'PLATFORM_MANAGE', 'Manage platform settings, master packages, and global entities'),
(2, 'TENANT', 'OVERRIDE', 'TENANT_OVERRIDE', 'Override tenant features and quota limits'),
(3, 'PACKAGE', 'MANAGE', 'PACKAGE_MANAGE', 'Create and modify subscription packages and tiers'),
(4, 'SCHEDULER', 'MANAGE', 'SCHEDULER_MANAGE', 'Configure and trigger background scheduled jobs'),
(5, 'TAXONOMY', 'MANAGE', 'MASTER_TAXONOMY_MANAGE', 'Create master categories and dynamic attribute definitions'),
(6, 'TENANT', 'UPDATE', 'TENANT_PROFILE_UPDATE', 'Update tenant profile, branding, and billing details'),
(7, 'STAFF', 'MANAGE', 'STAFF_MANAGE', 'Invite and manage staff members within tenant workspace'),
(8, 'PRODUCT', 'WRITE', 'PRODUCT_CREATE_UPDATE', 'Create and update products, variants, and services'),
(9, 'PRODUCT', 'IMPORT', 'EXCEL_BULK_IMPORT', 'Perform bulk catalog imports via Excel spreadsheet'),
(10, 'QUOTATION', 'CREATE', 'QUOTATION_CREATE', 'Generate and send quotations with line items'),
(11, 'QUOTATION', 'APPROVE', 'QUOTATION_APPROVE', 'Accept or approve quotations'),
(12, 'INVOICE', 'CREATE', 'INVOICE_CREATE', 'Generate sequential tax invoices from quotations'),
(13, 'PAYMENT', 'RECORD', 'PAYMENT_RECORD', 'Record offline and cash payments against invoices'),
(14, 'PAYMENT', 'ONLINE', 'PAYMENT_EXECUTE_ONLINE', 'Process payment via integrated payment gateways'),
(15, 'ENQUIRY', 'SUBMIT', 'CUSTOMER_ENQUIRY_SUBMIT', 'Submit customer requirement enquiries'),
(16, 'REVIEW', 'SUBMIT', 'REVIEW_SUBMIT', 'Submit verified customer ratings and reviews');

-- Assign Super Admin Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5);

-- Assign Tenant Admin Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 6), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 12), (2, 13);

-- Assign Tenant Staff Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 8), (3, 10), (3, 12), (3, 13);

-- Assign Customer Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(4, 11), (4, 14), (4, 15), (4, 16);

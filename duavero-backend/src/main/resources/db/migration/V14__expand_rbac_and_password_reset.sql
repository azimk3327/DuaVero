-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V14__expand_rbac_and_password_reset.sql
-- ============================================================================

-- 1. Password Reset Tokens Table (Secure Tokenized Account Recovery)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prt_user (user_id),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Expand Platform RBAC Roles
INSERT INTO roles (id, tenant_id, code, name, description, is_system_role) VALUES
(5, NULL, 'TENANT_MANAGER', 'Tenant Branch / Operations Manager', 'Operational control over leads, quotations, customer records and staff supervision', TRUE),
(6, NULL, 'TENANT_EMPLOYEE', 'Tenant Standard Employee', 'Standard operational staff for managing assigned leads, quotes, and catalog items', TRUE),
(7, NULL, 'MANAGER', 'Operations Manager (Alias)', 'Managerial role for operational workflows and quote approvals', TRUE),
(8, NULL, 'SALES', 'Sales Representative', 'Lead generation, customer acquisition, and quotation drafting', TRUE),
(9, NULL, 'QUOTATION_USER', 'Quotation Estimator', 'Quotation drafting, price calculations, and line item estimation', TRUE),
(10, NULL, 'ACCOUNTANT', 'Accountant / Billing Officer', 'Tax invoicing, payment reconciliation, credit notes, and financial reports', TRUE),
(11, NULL, 'INVENTORY_USER', 'Inventory & Catalog Handler', 'Product inventory management, variant updates, and stock tracking', TRUE),
(12, NULL, 'EMPLOYEE', 'Standard Staff (Alias)', 'General operational staff with baseline view and create permissions', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- 3. Expand Granular Permissions
INSERT INTO permissions (id, module, action, code, description) VALUES
(17, 'TENANT', 'VIEW', 'TENANT_VIEW', 'View tenant company profile and configuration details'),
(18, 'TENANT', 'UPDATE', 'TENANT_UPDATE', 'Update tenant profile, branding, and business configuration'),
(19, 'USER', 'VIEW', 'USER_VIEW', 'View tenant employee and user directory'),
(20, 'USER', 'CREATE', 'USER_CREATE', 'Invite and create new users within the tenant workspace'),
(21, 'USER', 'UPDATE', 'USER_UPDATE', 'Update user roles and user profile settings'),
(22, 'USER', 'DISABLE', 'USER_DISABLE', 'Deactivate or lock user accounts within the tenant'),
(23, 'ROLE', 'VIEW', 'ROLE_VIEW', 'View role catalog and permission definitions'),
(24, 'ROLE', 'CREATE', 'ROLE_CREATE', 'Create custom tenant-specific roles'),
(25, 'ROLE', 'UPDATE', 'ROLE_UPDATE', 'Update custom role permissions'),
(26, 'PRODUCT', 'VIEW', 'PRODUCT_VIEW', 'View master and tenant product catalogs'),
(27, 'PRODUCT', 'CREATE', 'PRODUCT_CREATE', 'Create new products and services in catalog'),
(28, 'PRODUCT', 'UPDATE', 'PRODUCT_UPDATE', 'Update products, prices, dynamic attributes, and variants'),
(29, 'PRODUCT', 'DELETE', 'PRODUCT_DELETE', 'Archive or delete products from catalog'),
(30, 'CUSTOMER', 'VIEW', 'CUSTOMER_VIEW', 'View customer CRM profiles and transaction history'),
(31, 'CUSTOMER', 'CREATE', 'CUSTOMER_CREATE', 'Create customer CRM records and addresses'),
(32, 'CUSTOMER', 'UPDATE', 'CUSTOMER_UPDATE', 'Update customer contact info and preferences'),
(33, 'LEAD', 'VIEW', 'LEAD_VIEW', 'View leads and customer enquiry pipelines'),
(34, 'LEAD', 'CREATE', 'LEAD_CREATE', 'Create new sales leads and customer enquiries'),
(35, 'LEAD', 'UPDATE', 'LEAD_UPDATE', 'Update lead status, notes, and assignment'),
(36, 'LEAD', 'DELETE', 'LEAD_DELETE', 'Delete or archive stale sales leads'),
(37, 'QUOTATION', 'VIEW', 'QUOTATION_VIEW', 'View quotations and cost estimates'),
(38, 'QUOTATION', 'UPDATE', 'QUOTATION_UPDATE', 'Edit draft quotations and add revision line items'),
(39, 'INVOICE', 'VIEW', 'INVOICE_VIEW', 'View tax invoices and billing statements'),
(40, 'INVOICE', 'UPDATE', 'INVOICE_UPDATE', 'Update invoice notes, terms, and metadata'),
(41, 'INVOICE', 'APPROVE', 'INVOICE_APPROVE', 'Authorize and finalize tax invoices'),
(42, 'PAYMENT', 'VIEW', 'PAYMENT_VIEW', 'View payment records and transaction logs'),
(43, 'PAYMENT', 'CREATE', 'PAYMENT_CREATE', 'Record offline, UPI, and cash payments against invoices'),
(44, 'PAYMENT', 'APPROVE', 'PAYMENT_APPROVE', 'Reconcile and approve pending payment records'),
(45, 'REPORT', 'VIEW', 'REPORT_VIEW', 'View operational, sales, and financial reports'),
(46, 'REPORT', 'EXPORT', 'REPORT_EXPORT', 'Export reports in Excel / CSV format'),
(47, 'SCHEDULER', 'VIEW', 'SCHEDULER_VIEW', 'View background scheduler jobs and execution logs'),
(48, 'SCHEDULER', 'RUN', 'SCHEDULER_RUN', 'Trigger on-demand execution of scheduler jobs'),
(49, 'AUDIT', 'VIEW', 'AUDIT_VIEW', 'View immutable security and compliance audit logs'),
(50, 'CONFIG', 'VIEW', 'CONFIG_VIEW', 'View system and tenant runtime configurations'),
(51, 'CONFIG', 'UPDATE', 'CONFIG_UPDATE', 'Modify system and tenant configurations')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 4. Map Granular Permissions to TENANT_ADMIN (Full Tenant Authority)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE code IN (
    'TENANT_VIEW', 'TENANT_UPDATE', 'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DISABLE',
    'ROLE_VIEW', 'ROLE_CREATE', 'ROLE_UPDATE', 'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
    'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE', 'LEAD_VIEW', 'LEAD_CREATE', 'LEAD_UPDATE', 'LEAD_DELETE',
    'QUOTATION_VIEW', 'QUOTATION_CREATE', 'QUOTATION_UPDATE', 'QUOTATION_APPROVE',
    'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_APPROVE',
    'PAYMENT_VIEW', 'PAYMENT_CREATE', 'PAYMENT_APPROVE', 'REPORT_VIEW', 'REPORT_EXPORT',
    'AUDIT_VIEW', 'CONFIG_VIEW', 'CONFIG_UPDATE', 'TENANT_PROFILE_UPDATE', 'STAFF_MANAGE', 'EXCEL_BULK_IMPORT'
);

-- 5. Map Permissions to TENANT_MANAGER & MANAGER
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('TENANT_MANAGER', 'MANAGER')
AND p.code IN (
    'TENANT_VIEW', 'USER_VIEW', 'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE',
    'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE',
    'LEAD_VIEW', 'LEAD_CREATE', 'LEAD_UPDATE',
    'QUOTATION_VIEW', 'QUOTATION_CREATE', 'QUOTATION_UPDATE', 'QUOTATION_APPROVE',
    'INVOICE_VIEW', 'PAYMENT_VIEW', 'REPORT_VIEW', 'REPORT_EXPORT'
);

-- 6. Map Permissions to TENANT_EMPLOYEE & EMPLOYEE
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('TENANT_EMPLOYEE', 'EMPLOYEE', 'TENANT_STAFF')
AND p.code IN (
    'TENANT_VIEW', 'PRODUCT_VIEW', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE',
    'LEAD_VIEW', 'LEAD_CREATE', 'LEAD_UPDATE',
    'QUOTATION_VIEW', 'QUOTATION_CREATE', 'QUOTATION_UPDATE',
    'INVOICE_VIEW', 'PAYMENT_VIEW'
);

-- 7. Map Permissions to SALES
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 8, id FROM permissions WHERE code IN (
    'TENANT_VIEW', 'PRODUCT_VIEW', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE',
    'LEAD_VIEW', 'LEAD_CREATE', 'LEAD_UPDATE', 'QUOTATION_VIEW', 'QUOTATION_CREATE'
);

-- 8. Map Permissions to QUOTATION_USER
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 9, id FROM permissions WHERE code IN (
    'TENANT_VIEW', 'PRODUCT_VIEW', 'CUSTOMER_VIEW', 'QUOTATION_VIEW', 'QUOTATION_CREATE', 'QUOTATION_UPDATE'
);

-- 9. Map Permissions to ACCOUNTANT
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 10, id FROM permissions WHERE code IN (
    'TENANT_VIEW', 'CUSTOMER_VIEW', 'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_APPROVE',
    'PAYMENT_VIEW', 'PAYMENT_CREATE', 'PAYMENT_APPROVE', 'REPORT_VIEW', 'REPORT_EXPORT'
);

-- 10. Map Permissions to INVENTORY_USER
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 11, id FROM permissions WHERE code IN (
    'TENANT_VIEW', 'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'EXCEL_BULK_IMPORT'
);

-- 11. Map Permissions to SUPER_ADMIN
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE code IN (
    'PLATFORM_MANAGE', 'TENANT_OVERRIDE', 'PACKAGE_MANAGE', 'SCHEDULER_MANAGE', 'MASTER_TAXONOMY_MANAGE',
    'SCHEDULER_VIEW', 'SCHEDULER_RUN', 'AUDIT_VIEW', 'CONFIG_VIEW', 'CONFIG_UPDATE', 'REPORT_VIEW', 'REPORT_EXPORT'
);

-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V15__expand_quotations_and_organization_rbac.sql
-- ============================================================================

-- 1. Extend Master Categories with HSN Code, Tax Slab, and Soft Delete Safeguard
ALTER TABLE master_categories ADD COLUMN hsn_code VARCHAR(30) NULL;
ALTER TABLE master_categories ADD COLUMN default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00;
ALTER TABLE master_categories ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Extend Quotations with Tiered Approval Fields, Updated By, and Discount Justification
ALTER TABLE quotations ADD COLUMN discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00;
ALTER TABLE quotations ADD COLUMN discount_approval_reason VARCHAR(500) NULL;
ALTER TABLE quotations ADD COLUMN approved_by BIGINT NULL;
ALTER TABLE quotations ADD COLUMN approved_at DATETIME NULL;
ALTER TABLE quotations ADD COLUMN updated_by BIGINT NULL;

-- 3. Extend Quotation Items with HSN Code
ALTER TABLE quotation_items ADD COLUMN hsn_code VARCHAR(30) NULL;

-- 4. Register Granular Permissions for RBAC Matrix & Category Governance
INSERT INTO permissions (id, module, action, code, description) VALUES
(52, 'ROLE', 'MANAGE', 'ROLE_PERMISSIONS_MANAGE', 'Configure dynamic role permissions matrix for organization users'),
(53, 'CATEGORY', 'VIEW', 'CATEGORY_VIEW', 'View master taxonomy categories'),
(54, 'CATEGORY', 'CREATE', 'CATEGORY_CREATE', 'Create master categories and taxonomy definitions'),
(55, 'CATEGORY', 'UPDATE', 'CATEGORY_UPDATE', 'Edit existing master categories and tax slabs'),
(56, 'CATEGORY', 'DELETE', 'CATEGORY_DELETE', 'Soft-delete or archive master categories'),
(57, 'ORGANIZATION', 'VIEW', 'ORGANIZATION_VIEW', 'View organization / company profile and configuration'),
(58, 'ORGANIZATION', 'UPDATE', 'ORGANIZATION_UPDATE', 'Update organization business settings and profile')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 5. Grant Permissions to TENANT_ADMIN / ORGANIZATION_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE code IN (
    'ROLE_PERMISSIONS_MANAGE', 'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',
    'ORGANIZATION_VIEW', 'ORGANIZATION_UPDATE', 'QUOTATION_APPROVE'
)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- 6. Grant Permissions to TENANT_MANAGER / MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('TENANT_MANAGER', 'MANAGER')
AND p.code IN (
    'CATEGORY_VIEW', 'ORGANIZATION_VIEW', 'QUOTATION_APPROVE'
)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- 7. Grant Permissions to EMPLOYEE / SALES
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('TENANT_EMPLOYEE', 'EMPLOYEE', 'SALES', 'QUOTATION_USER')
AND p.code IN (
    'CATEGORY_VIEW', 'ORGANIZATION_VIEW'
)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

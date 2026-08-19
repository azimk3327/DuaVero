# DUAVERO — Complete Database Architecture & Schema Specification

> **Document Status**: APPROVED ARCHITECTURE SPECIFICATION  
> **Status Legend**: `[IMPLEMENTED]` | `[PLANNED]` | `[NOT YET IMPLEMENTED]`  
> *(Current Codebase Status: `[PLANNED]`)*

---

## 1. Database Architecture & Single Shared DB Strategy `[PLANNED]`

DuaVero utilizes **ONE shared MySQL 8.0+ database** across all tenants with strict server-side `tenant_id` isolation.

### 1.1 Key Principles:
- **Single Database Instance**: No separate database or schema per tenant.
- **Flyway Version-Controlled Migrations**: All table definitions, alterations, and seed taxonomies are managed exclusively through versioned SQL scripts located in `src/main/resources/db/migration/`.
- **Zero Manual DDL**: Direct manual table creation via DBeaver / Workbench in UAT/PROD environments is strictly prohibited.
- **Hybrid Relational + JSON**: Core transactional entities are strongly normalized with foreign keys and composite indexes; category-specific dynamic attributes are stored in validated JSON columns (`attributes_json`).
- **Composite Indexing Standard**: Every tenant-owned table features composite indexes starting with `tenant_id` (e.g. `INDEX (tenant_id, status)`, `INDEX (tenant_id, category_id)`).

---

## 2. Table Classification Matrix

| Classification | Description | `tenant_id` Rule | Example Tables |
| :--- | :--- | :--- | :--- |
| **A. Platform / Master** | Global system configuration, master taxonomy, subscription packages, and global scheduler metadata. | **NO `tenant_id`** (System-wide) | `features`, `packages`, `package_features`, `package_limits`, `master_categories`, `attribute_definitions`, `category_attributes`, `service_locations`, `scheduler_jobs`, `system_configurations` |
| **B. Tenant-Owned** | Core business data owned and accessed exclusively by a single tenant. | **Mandatory `tenant_id NOT NULL`** + Composite Indexes | `tenant_profiles`, `tenant_domains`, `tenant_configurations`, `tenant_feature_overrides`, `tenant_limit_overrides`, `tenant_categories`, `tenant_service_areas`, `brands`, `products`, `product_variants`, `services`, `customers`, `customer_addresses`, `enquiries`, `quotations`, `quotation_items`, `quotation_revisions`, `invoices`, `invoice_items`, `payments`, `payment_gateway_configs`, `coupons`, `tenant_coupons`, `reviews_ratings`, `tenant_invoice_sequences`, `excel_import_jobs`, `excel_import_errors` |
| **C. IAM & Security** | Platform and tenant user accounts, RBAC roles, and authentication sessions. | **`tenant_id NULL` for Super Admin**, `NOT NULL` for tenant users | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `user_refresh_tokens` |
| **D. Audit & Telemetry** | Historical compliance logs, scheduler execution telemetry, and notification logs. | **`tenant_id NULL` for platform events**, set for tenant events | `audit_logs`, `scheduler_execution_logs`, `notification_templates`, `notification_logs`, `analytics_daily_rollups` |

---

## 3. Flyway Version-Controlled Migration Plan `[PLANNED]`

All database changes are sequenced into versioned Flyway scripts committed directly to Git:

```
src/main/resources/db/migration/
├── V1__init_platform_iam.sql               (users, roles, permissions, refresh_tokens, system_config)
├── V2__init_tenant_subscription.sql        (tenants, profiles, domains, configs, packages, subscriptions, overrides)
├── V3__init_master_taxonomy.sql            (master_categories, attribute_definitions, category_attributes, locations)
├── V4__init_catalog_product_service.sql    (tenant_categories, brands, products, product_variants, services)
├── V5__init_customer_crm_enquiry.sql       (customers, customer_addresses, enquiries)
├── V6__init_quotation_workflow.sql         (quotations, quotation_items, quotation_revisions)
├── V7__init_invoice_payment.sql            (tenant_invoice_sequences, invoices, invoice_items, payments, payment_configs)
├── V8__init_discounts_reviews.sql          (coupons, tenant_coupons, reviews_ratings)
├── V9__init_excel_bulk_import.sql          (excel_import_jobs, excel_import_errors)
├── V10__init_notifications.sql             (notification_templates, notification_logs)
├── V11__init_schedulers_shedlock.sql       (shedlock, scheduler_jobs, scheduler_execution_logs)
├── V12__init_audit_analytics.sql           (audit_logs, analytics_daily_rollups)
└── V13__seed_initial_taxonomy.sql          (Seed master categories: Sofa, Curtains, Tiles, etc. & dynamic attributes)
```

---

## 4. Complete DDL Schema Specifications

### 4.1 IAM & Security Tables (Flyway: V1)

```sql
-- 1. Platform & Tenant Users
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL COMMENT 'NULL for Super Admin, set for tenant users',
    email VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30) NULL,
    user_type ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_STAFF', 'CUSTOMER') NOT NULL DEFAULT 'TENANT_STAFF',
    status ENUM('ACTIVE', 'INVITED', 'SUSPENDED', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
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

-- 2. RBAC Roles
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL COMMENT 'NULL for platform system standard roles, tenant_id for custom roles',
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_code_tenant (code, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Granular Permissions
CREATE TABLE permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g. QUOTATION_CREATE, PRODUCT_DELETE',
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

-- 6. User Refresh Tokens
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

-- 7. Platform Global Configuration
CREATE TABLE system_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    value_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(255) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.2 Tenant & Subscription Tables (Flyway: V2)

```sql
-- 8. Tenants
CREATE TABLE tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE COMMENT 'Subdomain identifier e.g. royal-sofa',
    business_name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(180) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT 'IN',
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    status ENUM('ONBOARDING', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED', 'ARCHIVED') NOT NULL DEFAULT 'TRIAL',
    trial_ends_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_status (status),
    INDEX idx_tenant_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tenant Profiles & Branding
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
    CONSTRAINT fk_tp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tenant Custom Domains
CREATE TABLE tenant_domains (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    custom_domain VARCHAR(255) NOT NULL UNIQUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ssl_status ENUM('PENDING', 'ACTIVE', 'FAILED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_td_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tenant Specific Configuration Overrides
CREATE TABLE tenant_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    value_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tenant_config_key (tenant_id, config_key),
    CONSTRAINT fk_tc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Platform Feature Flags
CREATE TABLE features (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g. QUOTATION_PDF, CRM, ADVANCED_ANALYTICS, EXCEL_IMPORT',
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    is_platform_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Packages (1m, 3m, 6m, 1y, Custom)
CREATE TABLE packages (
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
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Package Features Join Table
CREATE TABLE package_features (
    package_id BIGINT NOT NULL,
    feature_id BIGINT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (package_id, feature_id),
    CONSTRAINT fk_pf_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    CONSTRAINT fk_pf_feature FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Package Resource Limits
CREATE TABLE package_limits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_id BIGINT NOT NULL,
    limit_key VARCHAR(50) NOT NULL COMMENT 'MAX_PRODUCTS, MAX_STAFF_USERS, MAX_QUOTES_PER_MONTH, MAX_STORAGE_MB',
    limit_value BIGINT NOT NULL DEFAULT 0 COMMENT '-1 for unlimited',
    UNIQUE KEY uk_pkg_limit (package_id, limit_key),
    CONSTRAINT fk_pl_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Subscriptions
CREATE TABLE subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    billing_cycle ENUM('1_MONTH', '3_MONTHS', '6_MONTHS', '1_YEAR', 'CUSTOM') NOT NULL DEFAULT '1_MONTH',
    status ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
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

-- 17. Subscription Invoices
CREATE TABLE subscription_invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    invoice_number VARCHAR(60) NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('PAID', 'PENDING', 'FAILED') NOT NULL DEFAULT 'PAID',
    payment_reference VARCHAR(120) NULL,
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_si_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_si_package FOREIGN KEY (package_id) REFERENCES packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Tenant Feature & Limit Overrides
CREATE TABLE tenant_feature_overrides (
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

CREATE TABLE tenant_limit_overrides (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    limit_key VARCHAR(50) NOT NULL,
    override_value BIGINT NOT NULL,
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tlo_tenant_limit (tenant_id, limit_key),
    CONSTRAINT fk_tlo_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.3 Master Taxonomy & Locations (Flyway: V3)

```sql
-- 19. Master Business Categories
CREATE TABLE master_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT NULL,
    code VARCHAR(80) NOT NULL UNIQUE COMMENT 'e.g. SOFA_REPAIR, SOFA_MFG, CHAIR_REPAIR, CURTAINS, WALLPAPER, TILES, UV_SHEETS, HOME_INTERIOR, OFFICE_INTERIOR',
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    icon_url VARCHAR(500) NULL,
    image_url VARCHAR(500) NULL,
    industry_type VARCHAR(50) NOT NULL DEFAULT 'FURNISHING',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mc_parent FOREIGN KEY (parent_id) REFERENCES master_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Dynamic Attribute Definitions
CREATE TABLE attribute_definitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE COMMENT 'e.g. FABRIC, FOAM_BRAND, FOAM_DENSITY, FOAM_WARRANTY, TILE_FINISH, CURTAIN_WIDTH',
    name VARCHAR(100) NOT NULL,
    data_type ENUM('TEXT', 'NUMBER', 'DECIMAL', 'DROPDOWN', 'MULTI_SELECT', 'BOOLEAN', 'DATE', 'MEASUREMENT') NOT NULL,
    unit_of_measure VARCHAR(30) NULL COMMENT 'e.g. inch, cm, sq.ft, kg, mm, density_d',
    options_json JSON NULL COMMENT 'Array of string options for DROPDOWN/MULTI_SELECT',
    validation_regex VARCHAR(255) NULL,
    is_required_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Category Attributes Mapping
CREATE TABLE category_attributes (
    category_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_filterable BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (category_id, attribute_id),
    CONSTRAINT fk_ca_category FOREIGN KEY (category_id) REFERENCES master_categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_attribute FOREIGN KEY (attribute_id) REFERENCES attribute_definitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Service Locations (Country -> State -> City)
CREATE TABLE service_locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL DEFAULT 'IN',
    country_name VARCHAR(100) NOT NULL DEFAULT 'India',
    state_name VARCHAR(100) NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    area_name VARCHAR(150) NULL,
    postal_code VARCHAR(20) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_loc_lookup (country_code, state_name, city_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.4 Catalog: Products, Variants & Services (Flyway: V4)

```sql
-- 23. Tenant Enabled Categories
CREATE TABLE tenant_categories (
    tenant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    custom_display_name VARCHAR(100) NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, category_id),
    CONSTRAINT fk_tc_tenant_ref FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_category_ref FOREIGN KEY (category_id) REFERENCES master_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Tenant Service Areas
CREATE TABLE tenant_service_areas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uk_tsa_tenant_loc (tenant_id, location_id),
    CONSTRAINT fk_tsa_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tsa_location FOREIGN KEY (location_id) REFERENCES service_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Brands
CREATE TABLE brands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    logo_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_brand_tenant_name (tenant_id, name),
    CONSTRAINT fk_brand_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Products
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    brand_id BIGINT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    sku VARCHAR(80) NULL,
    short_description VARCHAR(500) NULL,
    description TEXT NULL,
    base_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    warranty_months INT NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
    images_json JSON NULL,
    attributes_json JSON NULL COMMENT 'Key-value map of dynamic category specifications',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    INDEX idx_product_tenant_cat (tenant_id, category_id, status),
    UNIQUE KEY uk_tenant_product_sku (tenant_id, sku),
    CONSTRAINT fk_prod_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES master_categories(id),
    CONSTRAINT fk_prod_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. Product Variants
CREATE TABLE product_variants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    variant_name VARCHAR(150) NOT NULL,
    sku VARCHAR(80) NULL,
    price_adjustment DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    attributes_json JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_variant_tenant_prod (tenant_id, product_id),
    UNIQUE KEY uk_tenant_variant_sku (tenant_id, sku),
    CONSTRAINT fk_pv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. Services (e.g. Sofa Refurbishing, Curtain Installation, Wood Polishing)
CREATE TABLE services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    pricing_model ENUM('FIXED', 'PER_SQFT', 'PER_UNIT', 'CUSTOM_QUOTE') NOT NULL DEFAULT 'FIXED',
    base_rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    warranty_months INT NOT NULL DEFAULT 0,
    estimated_duration_hours DECIMAL(6,2) NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_service_tenant_cat (tenant_id, category_id),
    CONSTRAINT fk_serv_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_serv_category FOREIGN KEY (category_id) REFERENCES master_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.5 Customers & CRM (Flyway: V5)

```sql
-- 29. Customers
CREATE TABLE customers (
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

-- 30. Customer Addresses
CREATE TABLE customer_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    address_type ENUM('BILLING', 'SHIPPING', 'SITE_LOCATION') NOT NULL DEFAULT 'SITE_LOCATION',
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(30) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_ca_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 31. Customer Enquiries
CREATE TABLE enquiries (
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
    status ENUM('NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'QUOTE_SENT', 'WON', 'LOST') NOT NULL DEFAULT 'NEW',
    assigned_to BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enq_tenant_status (tenant_id, status),
    UNIQUE KEY uk_tenant_enquiry_num (tenant_id, enquiry_number),
    CONSTRAINT fk_enq_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_enq_category FOREIGN KEY (category_id) REFERENCES master_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.6 Quotations & Line Items (Flyway: V6)

```sql
-- 32. Quotations
CREATE TABLE quotations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    enquiry_id BIGINT NULL,
    quotation_number VARCHAR(50) NOT NULL,
    revision_number INT NOT NULL DEFAULT 1,
    status ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED') NOT NULL DEFAULT 'DRAFT',
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

-- 33. Quotation Items
CREATE TABLE quotation_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    quotation_id BIGINT NOT NULL,
    item_type ENUM('PRODUCT', 'SERVICE', 'CUSTOM') NOT NULL DEFAULT 'PRODUCT',
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

-- 34. Quotation Revisions History
CREATE TABLE quotation_revisions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    quotation_id BIGINT NOT NULL,
    revision_number INT NOT NULL,
    snapshot_json JSON NOT NULL COMMENT 'Complete frozen state of quote and items at revision time',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    CONSTRAINT fk_qr_quote FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.7 Sequential Invoicing & Payments (Flyway: V7)

```sql
-- 35. Tenant Concurrency-Safe Invoice Sequences
CREATE TABLE tenant_invoice_sequences (
    tenant_id BIGINT PRIMARY KEY,
    prefix VARCHAR(30) NOT NULL DEFAULT 'INV-',
    current_number BIGINT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tis_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 36. Invoices
CREATE TABLE invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    quotation_id BIGINT NULL,
    customer_id BIGINT NOT NULL,
    invoice_number VARCHAR(60) NOT NULL,
    invoice_type ENUM('TAX_INVOICE', 'PROFORMA', 'ADVANCE_RECEIPT') NOT NULL DEFAULT 'TAX_INVOICE',
    status ENUM('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID') NOT NULL DEFAULT 'DRAFT',
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

-- 37. Invoice Items
CREATE TABLE invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    invoice_id BIGINT NOT NULL,
    item_type ENUM('PRODUCT', 'SERVICE', 'CUSTOM') NOT NULL DEFAULT 'PRODUCT',
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

-- 38. Payment Gateway Configurations (AES-256 Encrypted Secrets)
CREATE TABLE payment_gateway_configs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    provider ENUM('RAZORPAY', 'STRIPE', 'UPI_QR', 'BANK_TRANSFER') NOT NULL,
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

-- 39. Payments
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    invoice_id BIGINT NOT NULL,
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('CASH', 'BANK_TRANSFER', 'UPI', 'QR', 'RAZORPAY', 'STRIPE') NOT NULL,
    payment_gateway_tx_id VARCHAR(150) NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'SUCCESS',
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255) NULL,
    INDEX idx_pay_tenant_inv (tenant_id, invoice_id),
    CONSTRAINT fk_pay_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.8 Coupons, Discounts & Reviews (Flyway: V8)

```sql
-- 40. Coupons & Discount Campaigns
CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    discount_type ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_discount_amount DECIMAL(10,2) NULL,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    usage_limit INT NULL,
    times_used INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_coupon_tenant_code (tenant_id, code),
    CONSTRAINT fk_coupon_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 41. Verified Customer Reviews & Star Ratings
CREATE TABLE reviews_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    invoice_id BIGINT NULL,
    product_id BIGINT NULL,
    service_id BIGINT NULL,
    rating_stars INT NOT NULL CHECK (rating_stars BETWEEN 1 AND 5),
    review_title VARCHAR(150) NULL,
    review_text TEXT NULL,
    status ENUM('PENDING', 'APPROVED', 'FLAGGED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rev_tenant_status (tenant_id, status),
    CONSTRAINT fk_rev_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.9 Excel Bulk Import Tracking (Flyway: V9)

```sql
-- 42. Excel Import Jobs
CREATE TABLE excel_import_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    entity_type ENUM('PRODUCT', 'SERVICE', 'PRICE_UPDATE') NOT NULL DEFAULT 'PRODUCT',
    status ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    total_rows INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    failure_count INT NOT NULL DEFAULT 0,
    error_workbook_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    INDEX idx_import_tenant (tenant_id, created_at),
    CONSTRAINT fk_eij_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 43. Excel Import Row Errors
CREATE TABLE excel_import_errors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    row_number INT NOT NULL,
    field_name VARCHAR(100) NULL,
    rejected_value TEXT NULL,
    error_reason VARCHAR(500) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eie_job FOREIGN KEY (job_id) REFERENCES excel_import_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.10 Notifications Hub (Flyway: V10)

```sql
-- 44. Safe Notification Templates
CREATE TABLE notification_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL COMMENT 'NULL for system default, tenant_id for tenant override',
    event_code VARCHAR(80) NOT NULL COMMENT 'e.g. QUOTATION_CREATED, INVOICE_GENERATED, SUB_EXPIRING',
    channel ENUM('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP') NOT NULL,
    subject VARCHAR(255) NULL,
    body_template TEXT NOT NULL COMMENT 'Logic-less Mustache syntax e.g. {{businessName}}',
    allowed_variables_json JSON NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_notif_tmpl (tenant_id, event_code, channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 45. Notification Delivery Logs
CREATE TABLE notification_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL,
    event_code VARCHAR(80) NOT NULL,
    channel ENUM('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP') NOT NULL,
    recipient VARCHAR(180) NOT NULL,
    subject VARCHAR(255) NULL,
    status ENUM('QUEUED', 'SENT', 'FAILED', 'DELIVERED') NOT NULL DEFAULT 'QUEUED',
    error_message TEXT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME NULL,
    INDEX idx_notif_tenant_status (tenant_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.11 Schedulers & Distributed Locking (Flyway: V11)

```sql
-- 46. ShedLock Table (Distributed Lock Storage)
CREATE TABLE shedlock (
    name VARCHAR(64) NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP(3) NOT NULL,
    locked_at TIMESTAMP(3) NOT NULL,
    locked_by VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 47. Scheduler Job Definitions
CREATE TABLE scheduler_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_code VARCHAR(80) NOT NULL UNIQUE COMMENT 'e.g. SUBSCRIPTION_EXPIRY_CHECKER, INVOICE_OVERDUE_REMINDER',
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    handler_class VARCHAR(255) NOT NULL COMMENT 'Spring Bean identifier',
    cron_expression VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    batch_size INT NOT NULL DEFAULT 100,
    retry_limit INT NOT NULL DEFAULT 3,
    timeout_seconds INT NOT NULL DEFAULT 300,
    last_executed_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 48. Scheduler Execution Telemetry Logs
CREATE TABLE scheduler_execution_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_code VARCHAR(80) NOT NULL,
    tenant_id BIGINT NULL COMMENT 'NULL for platform jobs, tenant_id when iterating per-tenant',
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_ms BIGINT NULL,
    status ENUM('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL_SUCCESS', 'SKIPPED') NOT NULL,
    records_processed INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    failure_count INT NOT NULL DEFAULT 0,
    error_summary TEXT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sched_log_job (job_code, start_time),
    INDEX idx_sched_log_tenant (tenant_id, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.12 Auditing & Analytics (Flyway: V12)

```sql
-- 49. Immutable Business & Security Audit Logs
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL,
    user_id BIGINT NULL,
    user_email VARCHAR(180) NULL,
    action VARCHAR(80) NOT NULL COMMENT 'e.g. CREATE_PRODUCT, APPROVE_QUOTATION, LOGIN_FAILURE',
    entity_name VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80) NULL,
    old_value_json JSON NULL,
    new_value_json JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    request_id VARCHAR(100) NULL,
    status ENUM('SUCCESS', 'FAILURE') NOT NULL DEFAULT 'SUCCESS',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_tenant_action (tenant_id, action, created_at),
    INDEX idx_audit_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 50. Analytics Daily Rollups
CREATE TABLE analytics_daily_rollups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    event_date DATE NOT NULL,
    metric_name VARCHAR(80) NOT NULL COMMENT 'PROFILE_VIEWS, ENQUIRIES_COUNT, QUOTES_ACCEPTED, REVENUE_INR',
    metric_value DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    UNIQUE KEY uk_tenant_metric_date (tenant_id, event_date, metric_name),
    INDEX idx_analytics_date (tenant_id, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

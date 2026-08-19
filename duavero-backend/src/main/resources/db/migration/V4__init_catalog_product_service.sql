-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V4__init_catalog_product_service.sql
-- ============================================================================

-- 1. Tenant Enabled Categories
CREATE TABLE IF NOT EXISTS tenant_categories (
    tenant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    custom_display_name VARCHAR(100) NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, category_id),
    CONSTRAINT fk_tc_tenant_ref FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_category_ref FOREIGN KEY (category_id) REFERENCES master_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tenant Service Areas
CREATE TABLE IF NOT EXISTS tenant_service_areas (
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

-- 3. Brands
CREATE TABLE IF NOT EXISTS brands (
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

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
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
    status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED' COMMENT 'DRAFT, PUBLISHED, ARCHIVED',
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

-- 5. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
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

-- 6. Services (e.g. Sofa Refurbishing, Curtain Installation, Wood Polishing)
CREATE TABLE IF NOT EXISTS services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    pricing_model VARCHAR(30) NOT NULL DEFAULT 'FIXED' COMMENT 'FIXED, PER_SQFT, PER_UNIT, CUSTOM_QUOTE',
    base_rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    warranty_months INT NOT NULL DEFAULT 0,
    estimated_duration_hours DECIMAL(6,2) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, INACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_service_tenant_cat (tenant_id, category_id),
    CONSTRAINT fk_serv_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_serv_category FOREIGN KEY (category_id) REFERENCES master_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

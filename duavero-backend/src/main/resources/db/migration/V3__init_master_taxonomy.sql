-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V3__init_master_taxonomy.sql
-- ============================================================================

-- 1. Master Business Categories
CREATE TABLE IF NOT EXISTS master_categories (
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
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_mc_parent FOREIGN KEY (parent_id) REFERENCES master_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Dynamic Attribute Definitions
CREATE TABLE IF NOT EXISTS attribute_definitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE COMMENT 'e.g. FABRIC, FOAM_BRAND, FOAM_DENSITY, FOAM_WARRANTY, TILE_FINISH, CURTAIN_WIDTH',
    name VARCHAR(100) NOT NULL,
    data_type VARCHAR(30) NOT NULL COMMENT 'TEXT, NUMBER, DECIMAL, DROPDOWN, MULTI_SELECT, BOOLEAN, DATE, MEASUREMENT',
    unit_of_measure VARCHAR(30) NULL COMMENT 'e.g. inch, cm, sq.ft, kg, mm, density_d',
    options_json JSON NULL COMMENT 'Array of string options for DROPDOWN/MULTI_SELECT',
    validation_regex VARCHAR(255) NULL,
    is_required_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Category Attributes Mapping
CREATE TABLE IF NOT EXISTS category_attributes (
    category_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_filterable BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (category_id, attribute_id),
    CONSTRAINT fk_ca_category FOREIGN KEY (category_id) REFERENCES master_categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_attribute FOREIGN KEY (attribute_id) REFERENCES attribute_definitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Service Locations (Country -> State -> City)
CREATE TABLE IF NOT EXISTS service_locations (
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

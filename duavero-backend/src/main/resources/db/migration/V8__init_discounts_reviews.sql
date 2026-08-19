-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V8__init_discounts_reviews.sql
-- ============================================================================

-- 1. Coupons & Discount Campaigns
CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE' COMMENT 'PERCENTAGE, FIXED_AMOUNT',
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

-- 2. Verified Customer Reviews & Star Ratings
CREATE TABLE IF NOT EXISTS reviews_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    invoice_id BIGINT NULL,
    product_id BIGINT NULL,
    service_id BIGINT NULL,
    rating_stars INT NOT NULL,
    review_title VARCHAR(150) NULL,
    review_text TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'APPROVED' COMMENT 'PENDING, APPROVED, FLAGGED, REJECTED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rev_tenant_status (tenant_id, status),
    CONSTRAINT fk_rev_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

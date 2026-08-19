-- ============================================================================
-- DUAVERO SCHEMA INITIALIZATION — PHASE 1 FOUNDATION
-- V13__seed_initial_taxonomy.sql
-- ============================================================================

-- 1. Master Categories
INSERT INTO master_categories (id, parent_id, code, name, description, industry_type, sort_order, is_active) VALUES
(1, NULL, 'SOFA_REPAIR', 'Sofa Repair', 'Comprehensive sofa repair, re-upholstery, spring replacement, and structural repairs', 'FURNISHING', 1, TRUE),
(2, NULL, 'SOFA_MFG', 'Sofa Manufacturing', 'Custom bespoke sofa manufacturing, modular sectionals, chesterfields, and recliners', 'FURNISHING', 2, TRUE),
(3, NULL, 'CHAIR_REPAIR', 'Chair Repair', 'Office mesh chairs, hydraulic gas-lift fixes, dining chair cushioning, and ergonomic seating', 'FURNISHING', 3, TRUE),
(4, NULL, 'FURNITURE', 'Furniture', 'Solid wood tables, TV consoles, bedroom wardrobes, and bespoke accent furniture', 'FURNISHING', 4, TRUE),
(5, NULL, 'CURTAINS', 'Curtains', 'Custom window drapes, motorized tracks, sheer curtains, and blackout solutions', 'FURNISHING', 5, TRUE),
(6, NULL, 'WALLPAPER', 'Wallpaper', 'Custom digital wall murals, vinyl rolls, textured non-woven wallpapers, and 3D designs', 'FURNISHING', 6, TRUE),
(7, NULL, 'TILES', 'Tiles', 'Vitrified floor tiles, ceramic wall tiles, rustic outdoor tiles, and Moroccan pavers', 'FURNISHING', 7, TRUE),
(8, NULL, 'UV_SHEETS', 'UV Sheets', 'High-gloss UV marble finish sheets, acrylic decorative panels, and wall cladding', 'FURNISHING', 8, TRUE),
(9, NULL, 'OFFICE_INTERIOR', 'Office Interior', 'Commercial workstation design, acoustic wall paneling, conference setups, and glass partitions', 'COMMERCIAL', 9, TRUE),
(10, NULL, 'HOME_INTERIOR', 'Home Interior', 'End-to-end residential turnkey interior design, false ceilings, modular kitchens, and lighting', 'RESIDENTIAL', 10, TRUE),
(11, NULL, 'FLAT_HOME_SERVICES', 'Flat/Home Services', 'Deep cleaning, sofa shampooing, wood polishing, and handyman maintenance services', 'SERVICES', 11, TRUE);

-- 2. Dynamic Attribute Definitions
INSERT INTO attribute_definitions (id, code, name, data_type, unit_of_measure, options_json, is_required_default) VALUES
(1, 'FABRIC', 'Fabric Material', 'DROPDOWN', NULL, '["Velvet", "Jute", "Linen", "Leatherette", "Suede", "Chenille", "Cotton Blend", "Boucle"]', TRUE),
(2, 'FOAM_BRAND', 'Foam Brand', 'DROPDOWN', NULL, '["Sleepwell", "Kurlon", "Duroflex", "Centuary", "MM Foam", "Standard PU", "Feather Feel"]', TRUE),
(3, 'FOAM_DENSITY', 'Foam Density', 'DROPDOWN', 'Density (D)', '["32 Density", "40 Density", "50 Density High Resilient", "Latex 70D", "Memory Foam 60D"]', TRUE),
(4, 'FOAM_WARRANTY', 'Foam Warranty', 'DROPDOWN', 'Years', '["1 Year", "2 Years", "5 Years", "10 Years", "No Warranty"]', FALSE),
(5, 'SEATING_CAPACITY', 'Seating Capacity', 'DROPDOWN', 'Seats', '["1 Seater", "2 Seater", "3 Seater", "3+1+1 (5 Seater)", "3+2 (5 Seater)", "L-Shape 6 Seater", "L-Shape 7 Seater", "U-Shape 9 Seater"]', TRUE),
(6, 'CURTAIN_TYPE', 'Curtain Pleat Style', 'DROPDOWN', NULL, '["Eyelet / Ring", "Pinch Pleated", "American Pleat", "Motorized Track", "Sheer", "Blackout", "Roman Blind", "Roller Blind"]', TRUE),
(7, 'WALLPAPER_MATERIAL', 'Wallpaper Material', 'DROPDOWN', NULL, '["Non-Woven", "Vinyl Coated", "Fabric Backed", "Embossed 3D", "Metallic Gold Foil", "Self Adhesive"]', TRUE),
(8, 'TILE_FINISH', 'Tile Surface Finish', 'DROPDOWN', NULL, '["High Gloss", "Satin Matte", "Full Lappato", "Rustic Carving", "Sugar Finish", "Moroccan Gloss"]', TRUE),
(9, 'UV_SHEET_THICKNESS', 'Panel Thickness', 'DROPDOWN', 'mm', '["1.5 mm", "2.0 mm", "3.0 mm", "4.0 mm", "6.0 mm"]', TRUE),
(10, 'WOOD_TYPE', 'Frame Wood Grade', 'DROPDOWN', NULL, '["Marandi Wood", "Teak Wood (Sagwan)", "Sheesham Wood", "Neem Wood", "Marine Plywood Grade 710", "HDMR Board"]', TRUE);

-- 3. Category Attributes Mapping
INSERT INTO category_attributes (category_id, attribute_id, is_required, is_filterable, sort_order) VALUES
-- Sofa Repair
(1, 1, TRUE, TRUE, 1),
(1, 2, TRUE, TRUE, 2),
(1, 3, TRUE, TRUE, 3),
(1, 4, FALSE, TRUE, 4),
(1, 5, TRUE, TRUE, 5),
-- Sofa Manufacturing
(2, 1, TRUE, TRUE, 1),
(2, 2, TRUE, TRUE, 2),
(2, 3, TRUE, TRUE, 3),
(2, 4, FALSE, TRUE, 4),
(2, 5, TRUE, TRUE, 5),
(2, 10, TRUE, TRUE, 6),
-- Chair Repair
(3, 1, TRUE, TRUE, 1),
(3, 3, FALSE, TRUE, 2),
-- Furniture
(4, 10, TRUE, TRUE, 1),
-- Curtains
(5, 1, TRUE, TRUE, 1),
(5, 6, TRUE, TRUE, 2),
-- Wallpaper
(6, 7, TRUE, TRUE, 1),
-- Tiles
(7, 8, TRUE, TRUE, 1),
-- UV Sheets
(8, 9, TRUE, TRUE, 1);

-- 4. Platform Features
INSERT INTO features (id, code, name, module, description, is_platform_enabled) VALUES
(1, 'QUOTATION_PDF', 'Quotation PDF Generation', 'QUOTATION', 'Generate branded PDF quotations with dynamic line items', TRUE),
(2, 'GST_INVOICING', 'Sequential GST Invoicing', 'INVOICE', 'Sequential automated GST tax invoice generation', TRUE),
(3, 'CRM_ENQUIRIES', 'Customer CRM & Enquiries', 'CRM', 'Lead tracking and enquiry pipeline management', TRUE),
(4, 'EXCEL_BULK_IMPORT', 'Excel Bulk Importer', 'CATALOG', 'Streamed bulk product catalogue import via Excel', TRUE),
(5, 'ADVANCED_ANALYTICS', 'Advanced Business Analytics', 'ANALYTICS', 'Revenue trends, top products, and conversion metrics', TRUE),
(6, 'ONLINE_PAYMENTS', 'Online Payment Gateway', 'PAYMENT', 'Razorpay and digital UPI checkout integrations', TRUE),
(7, 'WHATSAPP_NOTIFICATIONS', 'WhatsApp Alerts', 'NOTIFICATION', 'Automated customer quotation and invoice dispatch via WhatsApp', TRUE),
(8, 'SCHEDULER_AUTOMATION', 'Automated Schedulers', 'SCHEDULER', 'Background automated overdue invoice reminders and expiry checks', TRUE);

-- 5. Subscription Packages
INSERT INTO packages (id, code, name, description, monthly_price, quarterly_price, half_yearly_price, annual_price, currency, is_public, is_active, sort_order) VALUES
(1, 'STARTER', 'Starter Growth', 'Essential multi-tenant foundation for independent shops and single-store fabricators', 1499.00, 3999.00, 7499.00, 13999.00, 'INR', TRUE, TRUE, 1),
(2, 'PROFESSIONAL', 'Professional Studio', 'Advanced capabilities with CRM, PDF quotations, and Excel bulk catalogue management', 3499.00, 9499.00, 17499.00, 31999.00, 'INR', TRUE, TRUE, 2),
(3, 'BUSINESS', 'Business Enterprise', 'Full-suite platform with sequential GST invoicing, Razorpay payments, and automated WhatsApp alerts', 7999.00, 21999.00, 41999.00, 79999.00, 'INR', TRUE, TRUE, 3),
(4, 'ENTERPRISE', 'Custom VIP Enterprise', 'Unlimited volume, custom branding domains, dedicated account manager, and SLA support', 19999.00, 54999.00, 99999.00, 189999.00, 'INR', TRUE, TRUE, 4);

-- 6. Package Features
INSERT INTO package_features (package_id, feature_id, is_enabled) VALUES
-- Starter
(1, 1, TRUE), (1, 3, TRUE),
-- Professional
(2, 1, TRUE), (2, 2, TRUE), (2, 3, TRUE), (2, 4, TRUE), (2, 5, TRUE),
-- Business
(3, 1, TRUE), (3, 2, TRUE), (3, 3, TRUE), (3, 4, TRUE), (3, 5, TRUE), (3, 6, TRUE), (3, 7, TRUE), (3, 8, TRUE),
-- Enterprise
(4, 1, TRUE), (4, 2, TRUE), (4, 3, TRUE), (4, 4, TRUE), (4, 5, TRUE), (4, 6, TRUE), (4, 7, TRUE), (4, 8, TRUE);

-- 7. Package Limits
INSERT INTO package_limits (package_id, limit_key, limit_value) VALUES
(1, 'MAX_PRODUCTS', 50), (1, 'MAX_STAFF_USERS', 2), (1, 'MAX_QUOTES_PER_MONTH', 100), (1, 'MAX_STORAGE_MB', 500),
(2, 'MAX_PRODUCTS', 500), (2, 'MAX_STAFF_USERS', 10), (2, 'MAX_QUOTES_PER_MONTH', 1000), (2, 'MAX_STORAGE_MB', 5000),
(3, 'MAX_PRODUCTS', -1), (3, 'MAX_STAFF_USERS', 50), (3, 'MAX_QUOTES_PER_MONTH', -1), (3, 'MAX_STORAGE_MB', 25000),
(4, 'MAX_PRODUCTS', -1), (4, 'MAX_STAFF_USERS', -1), (4, 'MAX_QUOTES_PER_MONTH', -1), (4, 'MAX_STORAGE_MB', -1);

-- 8. Service Locations
INSERT INTO service_locations (id, country_code, country_name, state_name, city_name, area_name, postal_code, is_active) VALUES
(1, 'IN', 'India', 'Maharashtra', 'Mumbai', 'Andheri West', '400053', TRUE),
(2, 'IN', 'India', 'Maharashtra', 'Mumbai', 'Bandra West', '400050', TRUE),
(3, 'IN', 'India', 'Maharashtra', 'Pune', 'Kothrud', '411038', TRUE),
(4, 'IN', 'India', 'Delhi', 'New Delhi', 'South Extension', '110049', TRUE),
(5, 'IN', 'India', 'Karnataka', 'Bengaluru', 'Indiranagar', '560038', TRUE),
(6, 'IN', 'India', 'Karnataka', 'Bengaluru', 'HSR Layout', '560102', TRUE);

-- 9. Scheduler Jobs
INSERT INTO scheduler_jobs (id, job_code, name, description, handler_class, cron_expression, is_enabled, batch_size, retry_limit, timeout_seconds) VALUES
(1, 'SUBSCRIPTION_EXPIRY_CHECKER', 'Subscription Expiry Sentinel', 'Checks active tenant subscription expiration and shifts expired accounts to grace period', 'SubscriptionExpiryJobHandler', '0 0 1 * * *', TRUE, 100, 3, 300),
(2, 'INVOICE_OVERDUE_REMINDER', 'Invoice Overdue Dispatcher', 'Evaluates past-due customer invoices and dispatches scheduled payment reminders', 'InvoiceReminderJobHandler', '0 0 9 * * *', TRUE, 200, 3, 300),
(3, 'DAILY_ANALYTICS_ROLLUP', 'Daily Metric Aggregator', 'Compiles daily sales volume, quotes converted, and active customer rollups per tenant', 'AnalyticsRollupJobHandler', '0 30 0 * * *', TRUE, 50, 3, 600),
(4, 'EXCEL_IMPORT_CLEANUP', 'Temporary Import File Purger', 'Cleans up processed Excel bulk upload staging files older than 7 days', 'ImportCleanupJobHandler', '0 0 2 * * *', TRUE, 500, 2, 180);

-- 10. Notification Templates
INSERT INTO notification_templates (id, tenant_id, event_code, channel, subject, body_template, allowed_variables_json, is_active) VALUES
(1, NULL, 'QUOTATION_CREATED', 'EMAIL', 'New Quotation {{quotationNumber}} from {{businessName}}', 'Dear {{customerName}},\n\nYour quotation {{quotationNumber}} for total amount {{totalAmount}} is ready.\n\nView details: {{quoteUrl}}\n\nThank you,\n{{businessName}}', '["quotationNumber", "businessName", "customerName", "totalAmount", "quoteUrl"]', TRUE),
(2, NULL, 'INVOICE_GENERATED', 'EMAIL', 'Tax Invoice {{invoiceNumber}} from {{businessName}}', 'Dear {{customerName}},\n\nYour tax invoice {{invoiceNumber}} for {{totalAmount}} has been issued.\n\nDue Date: {{dueDate}}\nPay Online: {{paymentUrl}}', '["invoiceNumber", "businessName", "customerName", "totalAmount", "dueDate", "paymentUrl"]', TRUE),
(3, NULL, 'PAYMENT_RECEIVED', 'EMAIL', 'Payment Receipt for Invoice {{invoiceNumber}}', 'Dear {{customerName}},\n\nWe have received payment of {{paidAmount}} against invoice {{invoiceNumber}} with reference {{paymentReference}}.\n\nRemaining Balance: {{balanceDue}}', '["customerName", "invoiceNumber", "paidAmount", "paymentReference", "balanceDue"]', TRUE),
(4, NULL, 'WELCOME_USER', 'EMAIL', 'Welcome to DuaVero Platform', 'Hello {{firstName}},\n\nYour user account on DuaVero has been activated. Login to your dashboard: {{loginUrl}}\n\nRegards,\nDuaVero Team', '["firstName", "loginUrl"]', TRUE);

-- 11. Platform Global Configurations
INSERT INTO system_configurations (id, config_key, config_value, value_type, is_secret, description) VALUES
(1, 'PLATFORM_NAME', 'DuaVero Enterprise', 'STRING', FALSE, 'Global platform display name'),
(2, 'DEFAULT_CURRENCY', 'INR', 'STRING', FALSE, 'Default transactional currency for India region'),
(3, 'MAX_LOGIN_ATTEMPTS', '5', 'NUMBER', FALSE, 'Failed login lockout threshold'),
(4, 'LOCKOUT_DURATION_MINUTES', '15', 'NUMBER', FALSE, 'Account lockout duration upon exceeding failed attempts'),
(5, 'ALLOW_PUBLIC_REGISTRATION', 'true', 'BOOLEAN', FALSE, 'Permits self-service tenant onboarding from marketplace landing');

-- 12. Seed Demonstration Tenants
INSERT INTO tenants (id, slug, business_name, contact_email, contact_phone, country_code, currency_code, status, trial_ends_at) VALUES
(1, 'royal-sofa', 'Royal Sofa & Furnishings', 'owner@royalsofa.com', '+91 98888 88888', 'IN', 'INR', 'ACTIVE', '2027-12-31 23:59:59'),
(2, 'elite-interior', 'Elite Interior & Curtains', 'admin@eliteinterior.com', '+91 97777 77777', 'IN', 'INR', 'ACTIVE', '2027-12-31 23:59:59');

-- 13. Seed Demonstration Tenant Profiles
INSERT INTO tenant_profiles (tenant_id, tagline, about_text, primary_color, secondary_color, city, state, postal_code, gst_number) VALUES
(1, 'Bespoke Sofas, Re-Upholstery & Luxury Seating', 'Leading sofa repair and custom manufacturing workshop in Mumbai since 2012.', '#0F172A', '#3B82F6', 'Mumbai', 'Maharashtra', '400053', '27AABCR1234F1Z5'),
(2, 'Curtains, Wallpapers & Modern Living Spaces', 'Designer home decor studio specializing in automated drapes and imported wallpapers.', '#1E293B', '#10B981', 'Bengaluru', 'Karnataka', '560038', '29AABCE5678M1Z8');

-- 14. Tenant Enabled Categories
INSERT INTO tenant_categories (tenant_id, category_id, custom_display_name, is_enabled) VALUES
(1, 1, 'Custom Sofa Repair & Re-Upholstery', TRUE),
(1, 2, 'Luxury Bespoke Sofa Manufacturing', TRUE),
(1, 3, 'Ergonomic Office Chair Repair', TRUE),
(2, 5, 'Designer Curtains & Motorized Tracks', TRUE),
(2, 6, 'Imported Luxury Wallpapers', TRUE),
(2, 7, 'Vitrified Floor & Wall Tiles', TRUE);

-- 15. Tenant Invoice Sequences
INSERT INTO tenant_invoice_sequences (tenant_id, prefix, current_number) VALUES
(1, 'RS-INV-', 100),
(2, 'EI-INV-', 200);

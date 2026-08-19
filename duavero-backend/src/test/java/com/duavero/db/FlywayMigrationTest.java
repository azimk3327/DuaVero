package com.duavero.db;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Flyway flyway;

    @Test
    @DisplayName("Verify Flyway migration executed successfully and database is connected")
    void testFlywayMigrationExecution() {
        assertNotNull(flyway, "Flyway bean should be injected");
        assertNotNull(flyway.info().current(), "Current Flyway migration should not be null");
        assertTrue(Integer.parseInt(flyway.info().current().getVersion().getVersion()) >= 15, "Flyway migration V15 should be applied");

        // Verify database connectivity
        Integer testQuery = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assertEquals(1, testQuery, "Database connectivity query SELECT 1 should return 1");
    }

    @Test
    @DisplayName("Verify Phase 1 foundation tables exist in database schema")
    void testFoundationTablesExist() {
        // Query users table
        Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        assertNotNull(userCount);

        // Query roles table and verify seeded roles
        Integer roleCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM roles", Integer.class);
        assertNotNull(roleCount);
        assertTrue(roleCount >= 4, "Should have at least 4 seeded roles");

        Integer superAdminRole = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM roles WHERE code = 'SUPER_ADMIN'", Integer.class);
        assertEquals(1, superAdminRole, "SUPER_ADMIN role must be present in database");

        // Query permissions table and verify seeded permissions
        Integer permCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM permissions", Integer.class);
        assertNotNull(permCount);
        assertTrue(permCount >= 10, "Should have seeded system permissions");

        // Query tenants and audit_logs tables
        Integer tenantCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM tenants", Integer.class);
        assertNotNull(tenantCount);

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM audit_logs", Integer.class);
        assertNotNull(auditCount);
    }
}

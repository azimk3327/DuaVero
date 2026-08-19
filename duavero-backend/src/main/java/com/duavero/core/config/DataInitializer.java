package com.duavero.core.config;

import com.duavero.modules.auth.model.Role;
import com.duavero.modules.auth.model.User;
import com.duavero.modules.auth.repository.RoleRepository;
import com.duavero.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${duavero.bootstrap.admin-email:${DUAVERO_BOOTSTRAP_ADMIN_EMAIL:superadmin@duavero.com}}")
    private String bootstrapAdminEmail;

    @org.springframework.beans.factory.annotation.Value("${duavero.bootstrap.admin-password:${DUAVERO_BOOTSTRAP_ADMIN_PASSWORD:SuperAdmin@123}}")
    private String bootstrapAdminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking platform bootstrap & seed user accounts...");

        // 1. Super Admin Account (Environment-driven Bootstrap & Lead Developer Account)
        initUser(bootstrapAdminEmail, "9999999999", bootstrapAdminPassword, "Platform", "SuperAdmin",
                "SUPER_ADMIN", null, "SUPER_ADMIN");

        initUser("azimk3327@gmail.com", "8650321411", "Admin@123", "Azim", "Khan",
                "SUPER_ADMIN", null, "SUPER_ADMIN");

        // 2. Tenant 1 Admin (Royal Sofa)
        initUser("owner@royalsofa.com", "9888888888", "Tenant@123", "Rajesh", "Sharma",
                "TENANT_ADMIN", 1L, "TENANT_ADMIN");

        // 3. Tenant 1 Manager (Royal Sofa)
        initUser("manager@royalsofa.com", "9888888887", "Manager@123", "Amit", "Verma",
                "TENANT_STAFF", 1L, "TENANT_MANAGER");

        // 4. Tenant 1 Sales (Royal Sofa)
        initUser("sales@royalsofa.com", "9888888886", "Sales@123", "Pooja", "Singh",
                "TENANT_STAFF", 1L, "SALES");

        // 5. Tenant 1 Accountant (Royal Sofa)
        initUser("accountant@royalsofa.com", "9888888885", "Accountant@123", "Suresh", "Gupta",
                "TENANT_STAFF", 1L, "ACCOUNTANT");

        // 6. Tenant 1 Employee (Royal Sofa)
        initUser("employee@royalsofa.com", "9888888884", "Employee@123", "Deepak", "Kumar",
                "TENANT_STAFF", 1L, "TENANT_EMPLOYEE");

        // 7. Tenant 2 Admin (Elite Interior)
        initUser("admin@eliteinterior.com", "9777777777", "Tenant@123", "Ananya", "Patel",
                "TENANT_ADMIN", 2L, "TENANT_ADMIN");

        // 8. Customer Account
        initUser("customer@example.com", "9666666666", "Customer@123", "Vikram", "Malhotra",
                "CUSTOMER", 1L, "CUSTOMER");

        log.info("Platform seed & RBAC users verified and initialized successfully.");
    }

    private void initUser(String email, String phone, String plainPassword, String firstName, String lastName,
                          String userType, Long tenantId, String roleCode) {
        Optional<User> existing = userRepository.findByEmail(email);
        Role role = roleRepository.findByCode(roleCode).orElse(null);

        Set<Role> roles = new HashSet<>();
        if (role != null) {
            roles.add(role);
        }

        if (existing.isEmpty()) {
            User user = User.builder()
                    .email(email)
                    .phoneNumber(phone)
                    .passwordHash(passwordEncoder.encode(plainPassword))
                    .firstName(firstName)
                    .lastName(lastName)
                    .userType(userType)
                    .tenantId(tenantId)
                    .status("ACTIVE")
                    .roles(roles)
                    .build();
            userRepository.save(user);
            log.info("Created seed user: {} ({})", email, userType);
        } else {
            User user = existing.get();
            // Update password hash to ensure consistency
            user.setPasswordHash(passwordEncoder.encode(plainPassword));
            user.setPhoneNumber(phone);
            user.setStatus("ACTIVE");
            if (role != null && (user.getRoles() == null || user.getRoles().isEmpty())) {
                user.setRoles(roles);
            }
            userRepository.save(user);
        }
    }
}

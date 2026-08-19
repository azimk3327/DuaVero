# DuaVero — Multi-Tenant Operating System for Custom Furnishing & Fabrication

DuaVero is an enterprise multi-tenant SaaS platform built with **Spring Boot 3.2.5 (Java 17)**, **MySQL 8.0**, **Redis 7.2**, and **Angular 17+**. It features a single-shared database architecture with strict tenant isolation, Flyway schema migrations, ShedLock distributed schedulers, MDC-based structured audit logging, and granular Role-Based Access Control (RBAC).

---

## 1. Authentication & IAM Architecture

### Common Sign In
A single, common sign-in entry point (`/login`) handles all user types across the platform:
- `SUPER_ADMIN`: Global platform administrator (`tenant_id = NULL`).
- `TENANT_ADMIN`: Company administrator (`tenant_id` mandatory).
- `TENANT_MANAGER` / `MANAGER`: Operations manager with quote approval authority.
- `SALES`: Sales representative handling CRM and quotation estimation.
- `ACCOUNTANT`: Billing officer managing GST tax invoices and payments.
- `TENANT_EMPLOYEE` / `EMPLOYEE`: Operational staff with baseline access.
- `CUSTOMER`: Customer portal user.

User roles and tenant boundaries are strictly determined server-side from the database and encrypted into stateless JWT access tokens. Client-supplied `tenant_id` values in request bodies, headers, or query parameters are never trusted.

---

## 2. Super Admin Bootstrap Mechanism

The initial `SUPER_ADMIN` account is bootstrapped securely on application startup without hardcoding passwords in source code.

### Environment Variables
Configure the following environment variables before starting the backend in production:
```bash
export DUAVERO_BOOTSTRAP_ADMIN_EMAIL="superadmin@duavero.com"
export DUAVERO_BOOTSTRAP_ADMIN_PASSWORD="YourSecurePasswordHere@123"
```

In development mode (`application-dev.yml`), fallback defaults are provided:
```yaml
duavero:
  bootstrap:
    admin-email: ${DUAVERO_BOOTSTRAP_ADMIN_EMAIL:superadmin@duavero.com}
    admin-password: ${DUAVERO_BOOTSTRAP_ADMIN_PASSWORD:SuperAdmin@123}
```

### Bootstrap Lifecycle
1. `DataInitializer` executes on application startup.
2. If no `SUPER_ADMIN` exists, it creates the account with BCrypt password hashing (12 rounds).
3. The password is never logged and never exposed in API responses.
4. After bootstrap, all authentication is strictly database-driven.

---

## 3. Account Recovery & Self-Service Onboarding

- **Forgot Password**: `POST /api/v1/auth/forgot-password` generates a cryptographically random, SHA-256 hashed token with 30-minute expiration. Returns generic success messages to prevent user enumeration.
- **Reset Password**: `POST /api/v1/auth/reset-password` verifies token validity, applies BCrypt hashing to the new password, and invalidates all active user sessions and refresh tokens.
- **Tenant Onboarding (Sign Up)**: `POST /api/v1/auth/signup` registers a new company tenant, provisions profile, assigns subscription plan, and creates the owner `TENANT_ADMIN` account.

---

## 4. Roles & Granular Permissions Catalog

| Role Code | Description | Key Permissions |
|---|---|---|
| `SUPER_ADMIN` | Global platform administrator | `PLATFORM_MANAGE`, `TENANT_OVERRIDE`, `PACKAGE_MANAGE`, `SCHEDULER_MANAGE`, `MASTER_TAXONOMY_MANAGE`, `AUDIT_VIEW`, `CONFIG_UPDATE` |
| `TENANT_ADMIN` | Tenant business administrator | `TENANT_VIEW`, `TENANT_UPDATE`, `USER_VIEW`, `USER_CREATE`, `USER_UPDATE`, `USER_DISABLE`, `PRODUCT_*`, `CUSTOMER_*`, `LEAD_*`, `QUOTATION_*`, `INVOICE_*`, `PAYMENT_*`, `REPORT_*` |
| `TENANT_MANAGER` | Operations / Branch Manager | `TENANT_VIEW`, `USER_VIEW`, `PRODUCT_*`, `CUSTOMER_*`, `LEAD_*`, `QUOTATION_VIEW`, `QUOTATION_CREATE`, `QUOTATION_APPROVE`, `INVOICE_VIEW`, `PAYMENT_VIEW`, `REPORT_VIEW` |
| `SALES` | Sales Representative | `TENANT_VIEW`, `PRODUCT_VIEW`, `CUSTOMER_*`, `LEAD_*`, `QUOTATION_VIEW`, `QUOTATION_CREATE` |
| `QUOTATION_USER` | Cost Estimator | `TENANT_VIEW`, `PRODUCT_VIEW`, `CUSTOMER_VIEW`, `QUOTATION_VIEW`, `QUOTATION_CREATE`, `QUOTATION_UPDATE` |
| `ACCOUNTANT` | Billing & Reconciliation | `TENANT_VIEW`, `CUSTOMER_VIEW`, `INVOICE_VIEW`, `INVOICE_CREATE`, `INVOICE_APPROVE`, `PAYMENT_VIEW`, `PAYMENT_CREATE`, `PAYMENT_APPROVE`, `REPORT_EXPORT` |
| `TENANT_EMPLOYEE` | Standard Staff | `TENANT_VIEW`, `PRODUCT_VIEW`, `CUSTOMER_VIEW`, `LEAD_VIEW`, `QUOTATION_VIEW`, `INVOICE_VIEW`, `PAYMENT_VIEW` |

---

## 5. Verification Commands

```bash
# Backend Automated Test Suite (62 unit and security tests)
cd duavero-backend && mvn clean test

# Frontend Angular Production Build
cd duavero-frontend && npm run build

# Verify Docker Stack
docker compose ps
```

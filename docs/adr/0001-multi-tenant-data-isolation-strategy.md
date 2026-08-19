# ADR-0001: Multi-Tenant Data Isolation Strategy

## Context
DuaVero is a multi-tenant SaaS serving hundreds of furnishing and interior business clients. We need an architecture that ensures 100% data isolation between tenants while optimizing infrastructure costs, operational overhead, and migration simplicity.

## Decision
We adopt a **Shared Database + Shared Schema with `tenant_id` Discriminator Column**, reinforced by:
1. Hibernate dynamic session filters (`@FilterDef`, `@Filter`) automatically appending `WHERE tenant_id = :tenantId`.
2. JPA `TenantEntityListener` injecting the active `tenantId` from `TenantContextHolder` on all persists.
3. Database composite unique keys on `(tenant_id, ...)` to enforce integrity at the storage layer.
4. Architectural preparation for dedicated enterprise databases in future phases if required.

## Consequences
- **Positive**: Single migration run updates all tenants simultaneously; minimal database connection pool overhead; high tenant density per server; cost-effective.
- **Negative**: Requires strict discipline in ORM and custom native query writing to never omit the tenant filter.

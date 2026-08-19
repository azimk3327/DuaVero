# ADR-0004: 5-Tier Configuration Hierarchy & Precedence Model

## Context
DuaVero requires granular control over feature enablement, resource limits, and business behavior across platform, package, tenant, and user levels.

## Decision
We enforce a strict 5-tier evaluation hierarchy:
1. **System Defaults** (Java Code / YAML)
2. **Platform Config** (Super Admin global overrides in `system_configurations`)
3. **Package Config** (Subscription plan features and limits in `package_features` / `package_limits`)
4. **Tenant Config & Overrides** (Tenant self-settings + Super Admin tenant-specific grants in `tenant_feature_overrides`)
5. **User / Role Permissions** (Granular RBAC checks)

Precedence Rule: Tenant overrides supersede Package limits; User permissions gate execution of enabled capabilities.

## Consequences
- **Positive**: Complete business agility; Super Admin can grant bespoke custom limits or beta features to specific tenants without touching code or creating one-off packages.
- **Negative**: Requires a high-speed caching layer (L1 Caffeine + L2 Redis) to avoid multiple database lookups on every request.

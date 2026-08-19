# ADR-0005: Iterative Isolated Multi-Tenant Scheduler Model

## Context
Background scheduled jobs (e.g. subscription expiry checks, invoice reminders, daily analytics rollups) must execute across hundreds of active tenants without cross-tenant context leaks or single-tenant failure cascading.

## Decision
We enforce an **Iterative Isolated Multi-Tenant Scheduler Model**:
1. Schedulers query all active tenant IDs.
2. For each tenant, the engine sets `TenantContextHolder.setTenantId(tenantId)` inside a try-finally block.
3. Isolated business logic executes.
4. Any tenant-specific failure is caught, logged in `scheduler_execution_logs`, and does NOT abort the remaining batch.
5. In the `finally` block, `TenantContextHolder.clear()` is guaranteed.
6. ShedLock on Redis coordinates distributed execution across backend clusters.

## Consequences
- **Positive**: Absolute tenant context isolation; robust failure containment; comprehensive per-tenant execution metrics.
- **Negative**: Long-running batches across thousands of tenants require batch chunking and pagination.

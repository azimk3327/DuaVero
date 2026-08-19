# DUAVERO — Dynamic Multi-Tenant Scheduler & Execution Engine

> **Document Status**: APPROVED ARCHITECTURE SPECIFICATION  
> **Status Legend**: `[IMPLEMENTED]` | `[PLANNED]` | `[NOT YET IMPLEMENTED]`  
> *(Current Codebase Status: `[PLANNED]`)*

---

## 1. Multi-Tenant Execution Architecture & Isolation Loop `[PLANNED]`

Scheduled tasks in DuaVero strictly enforce tenant context boundaries during batch runs. A background job must **NEVER** execute across un-scoped or mixed tenant contexts:

```mermaid
sequenceDiagram
    autonumber
    participant MasterCron as ShedLock Master Cron Trigger
    participant Engine as MultiTenantSchedulerExecutor
    participant TenantRepo as Tenant Repository
    participant Context as TenantContextHolder
    participant JobHandler as TenantJobHandler (e.g. InvoiceReminder)
    participant Telemetry as SchedulerJobTelemetryService

    MasterCron->>Engine: Trigger Scheduled Job (e.g. INVOICE_OVERDUE_REMINDER)
    Engine->>Telemetry: Record Job Start (status=RUNNING)
    Engine->>TenantRepo: Fetch Active Tenants (status=ACTIVE/TRIAL)
    
    loop For Each Tenant in Batch
        Engine->>Context: setTenantId(tenant.getId())
        Engine->>JobHandler: executeForTenant(tenant)
        alt Success
            JobHandler-->>Engine: Processed Count (success=15)
        else Tenant-Level Exception
            JobHandler-->>Engine: Error (failure=1, reason="SMTP Connection Timeout")
            Note over Engine: Log failure for this tenant; DO NOT halt iteration for other tenants
        end
        Engine->>Context: clear() in finally block
    end

    Engine->>Telemetry: Record Job Completion (status=SUCCESS / PARTIAL_SUCCESS, metrics)
```

---

## 2. Distributed Locking with ShedLock & Redis `[PLANNED]`

To guarantee that only a single instance of a scheduled job runs across clustered Spring Boot nodes:

```java
@Scheduled(cron = "#{@schedulerConfigService.getCronExpression('SUBSCRIPTION_EXPIRY_CHECKER')}")
@SchedulerLock(name = "SubscriptionExpiryCheckerLock", lockAtMostFor = "15m", lockAtLeastFor = "30s")
public void runSubscriptionExpiryCheck() {
    schedulerEngine.executeJob("SUBSCRIPTION_EXPIRY_CHECKER");
}
```

---

## 3. Registered System Schedulers Matrix `[PLANNED]`

| Job Code | Description | Default Cron | Scope | Configurable UI Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **SUBSCRIPTION_EXPIRY_CHECKER** | Scans subscriptions expiring in 7, 3, 1 days; sends multi-channel reminders; transitions expired tenants. | `0 0 2 * * ?` (Daily 2 AM) | Platform / All Tenants | Batch Size, Warning Thresholds, Retries |
| **INVOICE_OVERDUE_REMINDER** | Identifies unpaid invoices past due date and dispatches customer reminders. | `0 0 9 * * ?` (Daily 9 AM) | Per-Tenant Iteration | Batch Size, Reminder Frequency |
| **QUOTATION_EXPIRY_CHECKER** | Flags unaccepted quotations past `valid_until_date` as `EXPIRED`. | `0 30 1 * * ?` (Daily 1:30 AM) | Per-Tenant Iteration | Batch Size, Auto-Archive |
| **DAILY_ANALYTICS_ROLLUP** | Aggregates daily views, inquiries, quotes, and revenue into `analytics_daily_rollups`. | `0 15 0 * * ?` (Daily 0:15 AM) | Per-Tenant Iteration | Batch Size, Lookback Window |
| **NOTIFICATION_RETRY_WORKER** | Re-attempts delivery of `QUEUED` or transiently `FAILED` notifications. | `0 */5 * * * ?` (Every 5 mins) | Global Queue | Max Retries, Batch Size |
| **AUDIT_LOG_ARCHIVAL** | Compresses and moves audit logs older than retention period to cold storage. | `0 0 3 1 * ?` (Monthly 1st 3 AM)| Platform System | Retention Days (e.g. 365) |

---

## 4. Execution Telemetry & Super Admin Management UI `[PLANNED]`

### 4.1 Real-Time Telemetry Tracking (`scheduler_execution_logs`)
Every execution records:
- `job_code` & target `tenant_id` (NULL for platform jobs).
- `start_time`, `end_time`, and calculated `duration_ms`.
- `status` (`RUNNING`, `SUCCESS`, `PARTIAL_SUCCESS`, `FAILED`, `SKIPPED`).
- `records_processed`, `success_count`, `failure_count`.
- Sanitized `error_summary`.

### 4.2 Super Admin UI Control Center
1. **Dynamic Reconfiguration**: Update cron expressions, batch sizes, retry counts, and toggle jobs on/off at runtime without restarting servers.
2. **On-Demand "Run Now"**: Super Admin can trigger immediate job execution with optional tenant scoping for targeted troubleshooting.

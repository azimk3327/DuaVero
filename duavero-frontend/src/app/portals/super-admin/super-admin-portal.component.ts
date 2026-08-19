import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  SuperAdminService,
  DashboardMetrics,
  MasterCategoryItem,
  AttributeDefinitionItem,
  TenantItem,
  UserManagementItem,
  PackageItem,
  FeatureItem,
  SchedulerJobItem,
  SchedulerLogItem,
  NotificationTemplateItem,
  AuditLogItem,
  SystemConfigItem
} from '@core/services/super-admin.service';
import { AuthService } from '@core/services/auth.service';

type AdminTab =
  | 'dashboard'
  | 'tenants'
  | 'users'
  | 'roles'
  | 'categories'
  | 'attributes'
  | 'services'
  | 'products'
  | 'packages'
  | 'features'
  | 'feature-overrides'
  | 'limit-overrides'
  | 'notifications'
  | 'schedulers'
  | 'reports'
  | 'audit'
  | 'configurations';

import { CategoryDrawerComponent, CategoryFormData } from '@shared/ui-components/category-drawer.component';

@Component({
  selector: 'app-super-admin-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CategoryDrawerComponent],
  template: `
    <div class="admin-shell">
      <!-- Admin Sidebar with 17 Functional Sections -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <img src="assets/logo/duavero-icon-192.png" alt="DuaVero" class="sidebar-logo" />
          <div>
            <h2 class="sidebar-brand">Super Admin</h2>
            <span class="sidebar-tag">Global Scope (tenant_id = null)</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-title">Core Operations</div>
          <button (click)="activeTab = 'dashboard'" [class.active-nav]="activeTab === 'dashboard'" class="nav-btn">
            <span class="nav-icon">📊</span> 1. Dashboard Metrics
          </button>
          <button (click)="activeTab = 'tenants'" [class.active-nav]="activeTab === 'tenants'" class="nav-btn">
            <span class="nav-icon">🏢</span> 2. Tenants Directory
          </button>
          <button (click)="activeTab = 'users'" [class.active-nav]="activeTab === 'users'" class="nav-btn">
            <span class="nav-icon">👥</span> 3. Platform Users
          </button>
          <button (click)="activeTab = 'roles'" [class.active-nav]="activeTab === 'roles'" class="nav-btn">
            <span class="nav-icon">🛡️</span> 4. Roles & Permissions
          </button>

          <div class="nav-section-title">Dynamic Master Taxonomy</div>
          <button (click)="activeTab = 'categories'" [class.active-nav]="activeTab === 'categories'" class="nav-btn">
            <span class="nav-icon">🏷️</span> 5. Master Categories (Dynamic)
          </button>
          <button (click)="activeTab = 'attributes'" [class.active-nav]="activeTab === 'attributes'" class="nav-btn">
            <span class="nav-icon">⚙️</span> 6. Dynamic Attributes
          </button>
          <button (click)="activeTab = 'services'" [class.active-nav]="activeTab === 'services'" class="nav-btn">
            <span class="nav-icon">🛠️</span> 7. Service Taxonomy
          </button>
          <button (click)="activeTab = 'products'" [class.active-nav]="activeTab === 'products'" class="nav-btn">
            <span class="nav-icon">🛋️</span> 8. Product Catalog
          </button>

          <div class="nav-section-title">Subscriptions & Entitlements</div>
          <button (click)="activeTab = 'packages'" [class.active-nav]="activeTab === 'packages'" class="nav-btn">
            <span class="nav-icon">📦</span> 9. Subscription Packages
          </button>
          <button (click)="activeTab = 'features'" [class.active-nav]="activeTab === 'features'" class="nav-btn">
            <span class="nav-icon">✨</span> 10. Platform Features
          </button>
          <button (click)="activeTab = 'feature-overrides'" [class.active-nav]="activeTab === 'feature-overrides'" class="nav-btn">
            <span class="nav-icon">🎛️</span> 11. Feature Overrides
          </button>
          <button (click)="activeTab = 'limit-overrides'" [class.active-nav]="activeTab === 'limit-overrides'" class="nav-btn">
            <span class="nav-icon">📈</span> 12. Tenant Quota Limits
          </button>

          <div class="nav-section-title">Automation & System</div>
          <button (click)="activeTab = 'notifications'" [class.active-nav]="activeTab === 'notifications'" class="nav-btn">
            <span class="nav-icon">🔔</span> 13. Notification Templates
          </button>
          <button (click)="activeTab = 'schedulers'" [class.active-nav]="activeTab === 'schedulers'" class="nav-btn">
            <span class="nav-icon">⏱️</span> 14. ShedLock Schedulers
          </button>
          <button (click)="activeTab = 'reports'" [class.active-nav]="activeTab === 'reports'" class="nav-btn">
            <span class="nav-icon">📑</span> 15. System Reports
          </button>
          <button (click)="activeTab = 'audit'" [class.active-nav]="activeTab === 'audit'" class="nav-btn">
            <span class="nav-icon">📜</span> 16. Audit Logs
          </button>
          <button (click)="activeTab = 'configurations'" [class.active-nav]="activeTab === 'configurations'" class="nav-btn">
            <span class="nav-icon">🔧</span> 17. System Configuration
          </button>
        </nav>
      </aside>

      <!-- Main Portal Body -->
      <main class="admin-main">
        <!-- Top Status Bar / Action Feedback -->
        <div *ngIf="actionNotification" class="notification-banner">
          <span>{{ actionNotification }}</span>
          <button (click)="actionNotification = null" class="btn-close">✕</button>
        </div>

        <!-- ========================================== -->
        <!-- 1. DASHBOARD TAB -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'dashboard'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">Platform Overview</h1>
              <p class="tab-subtitle">Real-time telemetry across all subscribed tenants & schedulers</p>
            </div>
            <button (click)="loadDashboard()" class="btn-refresh" [disabled]="loading">
              🔄 Refresh Telemetry
            </button>
          </div>

          <div *ngIf="dashboardData" class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon">🏢</div>
              <div class="kpi-content">
                <span class="kpi-label">Active Tenants</span>
                <span class="kpi-value">{{ dashboardData.activeTenants }} / {{ dashboardData.totalTenants }}</span>
                <span class="kpi-trend">+100% Shared DB Isolation</span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon">👥</div>
              <div class="kpi-content">
                <span class="kpi-label">Total Platform Users</span>
                <span class="kpi-value">{{ dashboardData.totalUsers }}</span>
                <span class="kpi-trend">BCrypt Work Factor 12</span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon">🏷️</div>
              <div class="kpi-content">
                <span class="kpi-label">Master Categories</span>
                <span class="kpi-value">{{ dashboardData.totalCategories }}</span>
                <span class="kpi-trend">Dynamic Database Driven</span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon">⏱️</div>
              <div class="kpi-content">
                <span class="kpi-label">Active Schedulers</span>
                <span class="kpi-value">{{ dashboardData.totalSchedulers }}</span>
                <span class="kpi-trend">ShedLock Distributed</span>
              </div>
            </div>
          </div>

          <!-- Recent Tenants & Security Audit Activity -->
          <div class="grid-2col">
            <div class="panel-card">
              <h3 class="panel-title">🏢 Recent Tenant Registrations</h3>
              <div class="table-wrap" *ngIf="dashboardData?.recentTenants?.length">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Tenant Name</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let t of dashboardData?.recentTenants">
                      <td><strong>{{ t.businessName }}</strong></td>
                      <td><code>{{ t.slug }}</code></td>
                      <td><span class="badge" [ngClass]="t.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'">{{ t.status }}</span></td>
                      <td>{{ t.contactEmail }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="panel-card">
              <h3 class="panel-title">📜 Recent Security & Audit Events</h3>
              <div class="activity-feed" *ngIf="dashboardData?.recentAuditLogs?.length">
                <div *ngFor="let log of dashboardData?.recentAuditLogs" class="activity-item">
                  <div class="activity-dot" [ngClass]="log.status === 'SUCCESS' ? 'dot-success' : 'dot-danger'"></div>
                  <div class="activity-info">
                    <div class="activity-header">
                      <span class="activity-action">{{ log.action }}</span>
                      <span class="activity-time">{{ log.createdAt | slice:11:19 }}</span>
                    </div>
                    <span class="activity-desc">Entity: {{ log.entityName }} (ID: {{ log.entityId || 'N/A' }}) • CID: {{ log.correlationId || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 2. TENANTS DIRECTORY -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'tenants'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">Tenants Directory</h1>
              <p class="tab-subtitle">Onboard, manage subscriptions, and toggle tenant statuses</p>
            </div>
            <button (click)="openTenantModal()" class="btn-primary-action">+ Onboard New Tenant</button>
          </div>

          <div class="panel-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Business Name</th>
                  <th>Slug</th>
                  <th>Contact Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of tenants">
                  <td>#{{ t.id }}</td>
                  <td><strong>{{ t.businessName }}</strong></td>
                  <td><code>{{ t.slug }}</code></td>
                  <td>{{ t.contactEmail }}</td>
                  <td>{{ t.contactPhone }}</td>
                  <td>
                    <select
                      [ngModel]="t.status"
                      (ngModelChange)="changeTenantStatus(t.id!, $event)"
                      class="select-status"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="TRIAL">TRIAL</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </td>
                  <td>
                    <button (click)="openOverrides(t)" class="btn-table-action">⚙️ Overrides</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 5. DYNAMIC MASTER CATEGORIES TAB -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'categories'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">Master Business Categories (Dynamic)</h1>
              <p class="tab-subtitle">Database-driven categories for sofa repair, fabrication, curtains, wallpapers, etc.</p>
            </div>
            <button (click)="openCreateCategoryDrawer()" class="btn-primary-action">+ Add Category</button>
          </div>

          <div class="panel-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Category Name</th>
                  <th>HSN Code</th>
                  <th>Tax Slab</th>
                  <th>Active</th>
                  <th>Configured Attributes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of categories">
                  <td><code>{{ cat.code }}</code></td>
                  <td><strong>{{ cat.name }}</strong></td>
                  <td><code class="cron-tag">{{ cat.hsnCode || '9401' }}</code></td>
                  <td><span class="badge badge-info">{{ cat.defaultTaxRate || 18 }}% GST</span></td>
                  <td>
                    <button
                      (click)="toggleCategory(cat.id!, !cat.active)"
                      class="btn-toggle"
                      [ngClass]="cat.active ? 'btn-toggle-on' : 'btn-toggle-off'"
                    >
                      {{ cat.active ? 'Active' : 'Disabled' }}
                    </button>
                  </td>
                  <td>
                    <span class="badge badge-pill" *ngFor="let attr of cat.attributes">
                      {{ attr.attributeName || attr.attributeCode }}
                    </span>
                    <span *ngIf="!cat.attributes?.length" style="color: #64748b; font-size: 0.8rem;">No attributes</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button (click)="openEditCategoryDrawer(cat)" class="btn-table-action" title="Edit Category">✏️ Edit</button>
                      <button (click)="confirmDeleteCategory(cat)" class="btn-table-action" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4);" title="Soft Delete Category">🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 6. DYNAMIC ATTRIBUTES TAB -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'attributes'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">Dynamic Attribute Definitions</h1>
              <p class="tab-subtitle">Custom fields: Fabric Grades, Foam Densities, Warranties, Tile Finishes, Measurements</p>
            </div>
            <button (click)="openAttributeModal()" class="btn-primary-action">+ Create Attribute</button>
          </div>

          <div class="panel-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Attribute Name</th>
                  <th>Data Type</th>
                  <th>Unit</th>
                  <th>Options</th>
                  <th>Required Default</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let attr of attributes">
                  <td><code>{{ attr.code }}</code></td>
                  <td><strong>{{ attr.name }}</strong></td>
                  <td><span class="badge badge-info">{{ attr.dataType }}</span></td>
                  <td>{{ attr.unitOfMeasure || '—' }}</td>
                  <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ attr.optionsJson || '—' }}
                  </td>
                  <td>{{ attr.requiredDefault ? 'Yes' : 'No' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 9. SUBSCRIPTION PACKAGES TAB -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'packages'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">Subscription Packages</h1>
              <p class="tab-subtitle">Tiers: Starter, Professional, Business, Enterprise pricing models</p>
            </div>
            <button (click)="loadPackages()" class="btn-refresh">🔄 Refresh</button>
          </div>

          <div class="package-cards-grid">
            <div *ngFor="let pkg of packages" class="package-card">
              <div class="package-header">
                <span class="package-badge">{{ pkg.code }}</span>
                <h3 class="package-name">{{ pkg.name }}</h3>
                <p class="package-desc">{{ pkg.description }}</p>
              </div>
              <div class="package-pricing">
                <span class="price-monthly">₹{{ pkg.monthlyPrice }}</span>
                <span class="price-cycle">/month</span>
                <div class="price-annual">Annual: ₹{{ pkg.annualPrice }} /yr</div>
              </div>
              <div class="package-footer">
                <span class="badge" [ngClass]="pkg.active ? 'badge-success' : 'badge-danger'">
                  {{ pkg.active ? 'ACTIVE TIER' : 'INACTIVE' }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 10. PLATFORM FEATURES TAB -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'features'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">Platform Features & Flags</h1>
              <p class="tab-subtitle">Enable or disable core capabilities across the entire DuaVero ecosystem</p>
            </div>
          </div>

          <div class="panel-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Feature Code</th>
                  <th>Feature Name</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>Platform Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let feat of features">
                  <td><code>{{ feat.code }}</code></td>
                  <td><strong>{{ feat.name }}</strong></td>
                  <td><span class="badge badge-info">{{ feat.module }}</span></td>
                  <td>{{ feat.description }}</td>
                  <td>
                    <button
                      (click)="toggleFeature(feat.id!, !feat.platformEnabled)"
                      class="btn-toggle"
                      [ngClass]="feat.platformEnabled ? 'btn-toggle-on' : 'btn-toggle-off'"
                    >
                      {{ feat.platformEnabled ? 'Enabled' : 'Disabled' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 14. SCHEDULERS & SHEDLOCK TAB -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'schedulers'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">ShedLock Background Schedulers</h1>
              <p class="tab-subtitle">Distributed cron jobs: Subscription Expiry, Recurring Invoices, Telemetry Rollups</p>
            </div>
            <button (click)="loadSchedulers()" class="btn-refresh">🔄 Refresh Jobs</button>
          </div>

          <div class="panel-card" style="margin-bottom: 24px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Job Code</th>
                  <th>Job Name</th>
                  <th>Cron Expression</th>
                  <th>Batch Size</th>
                  <th>Status</th>
                  <th>Last Execution</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let job of schedulers">
                  <td><code>{{ job.jobCode }}</code></td>
                  <td><strong>{{ job.jobName }}</strong></td>
                  <td><code class="cron-tag">{{ job.cronExpression }}</code></td>
                  <td>{{ job.batchSize }} items</td>
                  <td><span class="badge badge-success">{{ job.enabled ? 'ENABLED' : 'DISABLED' }}</span></td>
                  <td>
                    <span *ngIf="job.lastExecutionAt">{{ job.lastExecutionAt | slice:0:19 }} ({{ job.lastExecutionStatus }})</span>
                    <span *ngIf="!job.lastExecutionAt" style="color: #64748b;">Pending trigger</span>
                  </td>
                  <td>
                    <button
                      id="btn-trigger-{{ job.jobCode }}"
                      (click)="triggerScheduler(job.jobCode)"
                      class="btn-trigger-now"
                    >
                      ⚡ Trigger Run Now
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Scheduler Execution Logs -->
          <div class="panel-card">
            <h3 class="panel-title">⏱️ Recent Scheduler Execution Logs</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Job Code</th>
                  <th>Started At</th>
                  <th>Duration</th>
                  <th>Processed</th>
                  <th>Failed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of schedulerLogs">
                  <td>#{{ log.id }}</td>
                  <td><code>{{ log.jobCode }}</code></td>
                  <td>{{ log.startedAt | slice:0:19 }}</td>
                  <td>{{ log.durationMs }}ms</td>
                  <td><span class="badge badge-success">{{ log.recordsProcessed }}</span></td>
                  <td><span class="badge" [ngClass]="log.recordsFailed > 0 ? 'badge-danger' : 'badge-info'">{{ log.recordsFailed }}</span></td>
                  <td><span class="badge" [ngClass]="log.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'">{{ log.status }}</span></td>
                </tr>
                <tr *ngIf="!schedulerLogs?.length">
                  <td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">
                    No execution logs recorded yet. Trigger a job above to test immediate execution.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 16. AUDIT LOGS TAB -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'audit'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">Immutable Security & Audit Trail</h1>
              <p class="tab-subtitle">Searchable telemetry trail with actors, correlation IDs, and IP addresses</p>
            </div>
            <button (click)="loadAuditLogs()" class="btn-refresh">🔄 Refresh Logs</button>
          </div>

          <div class="panel-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Tenant ID</th>
                  <th>User ID</th>
                  <th>IP Address</th>
                  <th>Correlation ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of auditLogs">
                  <td>{{ a.createdAt | slice:0:19 }}</td>
                  <td><strong>{{ a.action }}</strong></td>
                  <td><span class="badge badge-info">{{ a.entityName }}</span></td>
                  <td>{{ a.entityId || '—' }}</td>
                  <td>{{ a.tenantId ? '#' + a.tenantId : 'GLOBAL' }}</td>
                  <td>{{ a.userId ? '#' + a.userId : 'ANON' }}</td>
                  <td><code>{{ a.ipAddress || '127.0.0.1' }}</code></td>
                  <td><code style="font-size: 0.75rem;">{{ a.correlationId || '—' }}</code></td>
                  <td><span class="badge" [ngClass]="a.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'">{{ a.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 17. SYSTEM CONFIGURATION TAB -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'configurations'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">System Configurations</h1>
              <p class="tab-subtitle">Platform-wide runtime flags, rate limits, and service settings</p>
            </div>
            <button (click)="loadConfigurations()" class="btn-refresh">🔄 Refresh</button>
          </div>

          <div class="panel-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Config Key</th>
                  <th>Current Value</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cfg of configurations">
                  <td><code>{{ cfg.configKey }}</code></td>
                  <td>
                    <input
                      type="text"
                      [(ngModel)]="cfg.configValue"
                      class="form-control-sm"
                    />
                  </td>
                  <td><span class="badge badge-info">{{ cfg.valueType }}</span></td>
                  <td style="color: #94a3b8; font-size: 0.85rem;">{{ cfg.description || '—' }}</td>
                  <td>
                    <button (click)="saveConfig(cfg)" class="btn-table-action">💾 Save</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- FALLBACK TAB CONTENT FOR OTHER MODULES -->
        <!-- ========================================== -->
        <section *ngIf="activeTab === 'users' || activeTab === 'roles' || activeTab === 'services' || activeTab === 'products' || activeTab === 'feature-overrides' || activeTab === 'limit-overrides' || activeTab === 'notifications' || activeTab === 'reports'" class="tab-pane">
          <div class="tab-header">
            <div>
              <h1 class="tab-title">{{ activeTab | uppercase }} Module</h1>
              <p class="tab-subtitle">DuaVero Super Admin Platform Entitlement & Control</p>
            </div>
          </div>
          <div class="panel-card">
            <p style="color: #94a3b8; line-height: 1.6;">
              Module <strong>{{ activeTab }}</strong> is connected to backend endpoints under <code>/api/v1/super-admin/{{ activeTab }}</code>.
            </p>
          </div>
        </section>
      </main>

      <!-- Category Drawer & Delete Safeguard Modal -->
      <app-category-drawer
        *ngIf="showCategoryDrawer"
        [formData]="activeCategoryForm"
        [parentCategories]="categories"
        [availableAttributes]="availableAttributes"
        (save)="handleSaveCategory($event)"
        (close)="showCategoryDrawer = false"
      ></app-category-drawer>

      <!-- Soft Delete Confirmation Dialog -->
      <div *ngIf="categoryToDelete" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1200; padding: 20px;">
        <div class="panel-card" style="max-width: 480px; width: 100%; background: #1e293b; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 26px;">
          <h3 style="font-size: 1.2rem; font-weight: 700; color: #f87171; margin: 0 0 12px;">⚠️ Soft Delete Category Safeguard</h3>
          <p style="color: #cbd5e1; font-size: 0.88rem; line-height: 1.6;">
            Are you sure you want to soft-delete category <strong>{{ categoryToDelete.name }}</strong> (<code>{{ categoryToDelete.code }}</code>)?
            Products linked to this category will be preserved, but the category will be safely archived from active catalogs.
          </p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button (click)="categoryToDelete = null" class="btn-refresh">Cancel</button>
            <button (click)="executeDeleteCategory()" class="btn-table-action" style="background: #ef4444; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700;">Confirm Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: calc(100vh - 68px);
      background: #0b0f19;
    }

    .admin-sidebar {
      width: 280px;
      background: #111827;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .sidebar-logo {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
    }

    .sidebar-brand {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
    }

    .sidebar-tag {
      font-size: 0.68rem;
      color: #38bdf8;
      font-family: monospace;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin: 14px 8px 6px;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: #94a3b8;
      font-size: 0.84rem;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #f1f5f9;
    }

    .active-nav {
      background: rgba(59, 130, 246, 0.15) !important;
      color: #38bdf8 !important;
      font-weight: 600;
      border-left: 3px solid #38bdf8;
    }

    .nav-icon {
      font-size: 1rem;
    }

    .admin-main {
      flex: 1;
      padding: 28px 36px;
      overflow-y: auto;
    }

    .notification-banner {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #86efac;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #86efac;
      cursor: pointer;
      font-size: 1rem;
    }

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .tab-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.02em;
      margin: 0 0 4px;
    }

    .tab-subtitle {
      font-size: 0.88rem;
      color: #94a3b8;
      margin: 0;
    }

    .btn-refresh {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-refresh:hover {
      background: rgba(59, 130, 246, 0.15);
      color: #38bdf8;
      border-color: #38bdf8;
    }

    .btn-primary-action {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #ffffff;
      border: none;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
      transition: all 0.15s ease;
    }

    .btn-primary-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .kpi-icon {
      font-size: 2rem;
      background: rgba(59, 130, 246, 0.12);
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #f8fafc;
      line-height: 1.2;
    }

    .kpi-trend {
      font-size: 0.72rem;
      color: #38bdf8;
      margin-top: 2px;
    }

    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .panel-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px;
    }

    .panel-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 16px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .data-table th {
      text-align: left;
      padding: 10px 12px;
      color: #94a3b8;
      font-weight: 600;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
    }

    .select-status {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #f8fafc;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .btn-table-action {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-toggle {
      padding: 4px 12px;
      border-radius: 14px;
      font-size: 0.75rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-toggle-on {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.4);
    }

    .btn-toggle-off {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }

    .btn-trigger-now {
      background: linear-gradient(135deg, #eab308, #ca8a04);
      color: #000000;
      font-weight: 700;
      border: none;
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(234, 179, 8, 0.3);
      transition: all 0.15s ease;
    }

    .btn-trigger-now:hover {
      transform: scale(1.03);
      box-shadow: 0 4px 12px rgba(234, 179, 8, 0.5);
    }

    .cron-tag {
      background: #1e293b;
      padding: 2px 6px;
      border-radius: 4px;
      color: #f59e0b;
      font-family: monospace;
    }

    .activity-feed {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .activity-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 4px;
      flex-shrink: 0;
    }

    .dot-success {
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }

    .dot-danger {
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
    }

    .activity-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
    }

    .activity-action {
      font-weight: 700;
      font-size: 0.82rem;
      color: #f1f5f9;
    }

    .activity-time {
      font-size: 0.72rem;
      color: #64748b;
    }

    .activity-desc {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .package-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .package-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 24px;
      display: flex;
      flex-direction: column;
    }

    .package-badge {
      font-size: 0.72rem;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
      margin-bottom: 8px;
    }

    .package-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0 0 4px;
    }

    .package-desc {
      font-size: 0.82rem;
      color: #94a3b8;
      margin: 0 0 16px;
    }

    .package-pricing {
      margin: auto 0 20px;
    }

    .price-monthly {
      font-size: 1.8rem;
      font-weight: 800;
      color: #f8fafc;
    }

    .price-cycle {
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .price-annual {
      font-size: 0.75rem;
      color: #38bdf8;
      margin-top: 4px;
    }

    .form-control-sm {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #f8fafc;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.82rem;
      width: 100%;
    }
  `]
})
export class SuperAdminPortalComponent implements OnInit {
  private readonly superAdminService = inject(SuperAdminService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  activeTab: AdminTab = 'dashboard';
  loading = false;
  actionNotification: string | null = null;

  dashboardData: DashboardMetrics | null = null;
  tenants: TenantItem[] = [];
  categories: MasterCategoryItem[] = [];
  attributes: AttributeDefinitionItem[] = [];
  packages: PackageItem[] = [];
  features: FeatureItem[] = [];
  schedulers: SchedulerJobItem[] = [];
  schedulerLogs: SchedulerLogItem[] = [];
  auditLogs: AuditLogItem[] = [];
  configurations: SystemConfigItem[] = [];

  ngOnInit(): void {
    this.loadDashboard();
    this.loadTenants();
    this.loadCategories();
    this.loadAttributes();
    this.loadPackages();
    this.loadFeatures();
    this.loadSchedulers();
    this.loadAuditLogs();
    this.loadConfigurations();
  }

  loadDashboard(): void {
    this.loading = true;
    this.superAdminService.getDashboardMetrics().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.dashboardData = res.data;
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load dashboard:', err);
      }
    });
  }

  loadTenants(): void {
    this.superAdminService.getTenants().subscribe({
      next: (res) => {
        if (res.success) this.tenants = res.data;
      }
    });
  }

  loadCategories(): void {
    this.superAdminService.getCategories().subscribe({
      next: (res) => {
        if (res.success) this.categories = res.data;
      }
    });
  }

  loadAttributes(): void {
    this.superAdminService.getAttributes().subscribe({
      next: (res) => {
        if (res.success) this.attributes = res.data;
      }
    });
  }

  loadPackages(): void {
    this.superAdminService.getPackages().subscribe({
      next: (res) => {
        if (res.success) this.packages = res.data;
      }
    });
  }

  loadFeatures(): void {
    this.superAdminService.getFeatures().subscribe({
      next: (res) => {
        if (res.success) this.features = res.data;
      }
    });
  }

  loadSchedulers(): void {
    this.superAdminService.getSchedulers().subscribe({
      next: (res) => {
        if (res.success) this.schedulers = res.data;
      }
    });
    this.superAdminService.getSchedulerLogs().subscribe({
      next: (res) => {
        if (res.success) this.schedulerLogs = res.data;
      }
    });
  }

  loadAuditLogs(): void {
    this.superAdminService.getAuditLogs().subscribe({
      next: (res) => {
        if (res.success) this.auditLogs = res.data;
      }
    });
  }

  loadConfigurations(): void {
    this.superAdminService.getConfigurations().subscribe({
      next: (res) => {
        if (res.success) this.configurations = res.data;
      }
    });
  }

  changeTenantStatus(tenantId: number, newStatus: string): void {
    this.superAdminService.updateTenantStatus(tenantId, newStatus).subscribe({
      next: () => {
        this.notify(`Tenant #${tenantId} status updated to ${newStatus}`);
        this.loadTenants();
        this.loadDashboard();
      }
    });
  }

  toggleCategory(id: number, active: boolean): void {
    this.superAdminService.toggleCategoryStatus(id, active).subscribe({
      next: () => {
        this.notify(`Category #${id} status updated`);
        this.loadCategories();
      }
    });
  }

  toggleFeature(id: number, enabled: boolean): void {
    this.superAdminService.toggleFeature(id, enabled).subscribe({
      next: () => {
        this.notify(`Feature flag updated`);
        this.loadFeatures();
      }
    });
  }

  triggerScheduler(jobCode: string): void {
    this.superAdminService.triggerScheduler(jobCode).subscribe({
      next: (res) => {
        this.notify(`⚡ Scheduler '${jobCode}' triggered successfully! Status: ${res.data?.status || 'EXECUTED'}`);
        setTimeout(() => this.loadSchedulers(), 500);
      },
      error: (err) => {
        console.error('Failed to trigger scheduler:', err);
        this.notify(`❌ Failed to trigger scheduler: ${err.message || 'Error'}`);
      }
    });
  }

  saveConfig(cfg: SystemConfigItem): void {
    this.superAdminService.updateConfiguration(cfg.configKey, cfg.configValue).subscribe({
      next: () => {
        this.notify(`Configuration '${cfg.configKey}' saved successfully.`);
      }
    });
  }

  openTenantModal(): void {
    const slug = prompt('Enter Tenant Slug (e.g. nova-furnishings):');
    if (!slug) return;
    const name = prompt('Enter Business Name:', 'Nova Furnishings');
    const email = prompt('Enter Contact Email:', `${slug}@example.com`);
    const phone = prompt('Enter Contact Phone:', '9876543210');

    if (slug && name && email && phone) {
      this.superAdminService.createTenant({
        slug,
        businessName: name,
        contactEmail: email,
        contactPhone: phone,
        status: 'ACTIVE'
      }).subscribe({
        next: () => {
          this.notify(`Tenant '${name}' onboarded successfully!`);
          this.loadTenants();
          this.loadDashboard();
        }
      });
    }
  }

  showCategoryDrawer = false;
  activeCategoryForm: CategoryFormData = {
    code: '',
    name: '',
    industryType: 'FURNISHING',
    defaultTaxRate: 18,
    sortOrder: 10,
    active: true,
    selectedAttributeIds: []
  };
  categoryToDelete: MasterCategoryItem | null = null;

  get availableAttributes() {
    return this.attributes.map(a => ({
      id: a.id!,
      code: a.code,
      name: a.name,
      dataType: a.dataType
    }));
  }

  openCreateCategoryDrawer(): void {
    this.activeCategoryForm = {
      code: '',
      name: '',
      industryType: 'FURNISHING',
      defaultTaxRate: 18,
      sortOrder: (this.categories.length + 1) * 10,
      active: true,
      selectedAttributeIds: []
    };
    this.showCategoryDrawer = true;
  }

  openEditCategoryDrawer(cat: MasterCategoryItem): void {
    this.activeCategoryForm = {
      id: cat.id,
      parentId: cat.parentId,
      code: cat.code,
      name: cat.name,
      hsnCode: cat.hsnCode,
      defaultTaxRate: cat.defaultTaxRate || 18,
      industryType: cat.industryType,
      sortOrder: cat.sortOrder,
      description: cat.description,
      active: cat.active,
      selectedAttributeIds: cat.attributes?.map(a => a.attributeId) || []
    };
    this.showCategoryDrawer = true;
  }

  handleSaveCategory(formData: CategoryFormData): void {
    const payload: MasterCategoryItem = {
      id: formData.id,
      parentId: formData.parentId,
      code: formData.code,
      name: formData.name,
      hsnCode: formData.hsnCode,
      defaultTaxRate: formData.defaultTaxRate,
      industryType: formData.industryType || 'FURNISHING',
      sortOrder: formData.sortOrder || 10,
      description: formData.description,
      active: formData.active
    };

    if (formData.id) {
      this.superAdminService.updateCategory(formData.id, payload).subscribe({
        next: () => {
          this.showCategoryDrawer = false;
          this.notify(`Category '${formData.name}' updated successfully!`);
          if (formData.selectedAttributeIds && formData.selectedAttributeIds.length) {
            this.saveCategoryAttributes(formData.id!, formData.selectedAttributeIds);
          } else {
            this.loadCategories();
          }
        },
        error: (err) => {
          this.notify(`Failed to update category: ${err.message || 'Error'}`);
        }
      });
    } else {
      this.superAdminService.createCategory(payload).subscribe({
        next: (res) => {
          this.showCategoryDrawer = false;
          this.notify(`Category '${formData.name}' created!`);
          if (res.data?.id && formData.selectedAttributeIds && formData.selectedAttributeIds.length) {
            this.saveCategoryAttributes(res.data.id, formData.selectedAttributeIds);
          } else {
            this.loadCategories();
          }
        },
        error: (err) => {
          this.notify(`Failed to create category: ${err.message || 'Error'}`);
        }
      });
    }
  }

  private saveCategoryAttributes(categoryId: number, attributeIds: number[]): void {
    const mappings = attributeIds.map((id, idx) => ({
      attributeId: id,
      required: false,
      filterable: true,
      sortOrder: idx + 1
    }));

    this.superAdminService.configureCategoryAttributes(categoryId, mappings).subscribe({
      next: () => this.loadCategories(),
      error: () => this.loadCategories()
    });
  }

  confirmDeleteCategory(cat: MasterCategoryItem): void {
    this.categoryToDelete = cat;
  }

  executeDeleteCategory(): void {
    if (!this.categoryToDelete?.id) return;

    this.superAdminService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.notify(`Category '${this.categoryToDelete?.name}' soft-deleted safely.`);
        this.categoryToDelete = null;
        this.loadCategories();
      },
      error: (err) => {
        this.notify(`Failed to delete category: ${err.message || 'Error'}`);
        this.categoryToDelete = null;
      }
    });
  }

  openAttributeModal(): void {
    const code = prompt('Enter Attribute Code (e.g. WOOD_GRAIN_TYPE):');
    if (!code) return;
    const name = prompt('Enter Attribute Name:', 'Wood Grain Finish');
    const dataType = prompt('Enter Data Type (TEXT, NUMBER, DECIMAL, DROPDOWN, BOOLEAN):', 'DROPDOWN');

    if (code && name && dataType) {
      this.superAdminService.createAttribute({
        code: code.toUpperCase(),
        name,
        dataType: dataType.toUpperCase(),
        requiredDefault: false
      }).subscribe({
        next: () => {
          this.notify(`Dynamic attribute '${name}' created!`);
          this.loadAttributes();
        }
      });
    }
  }

  openOverrides(tenant: TenantItem): void {
    this.superAdminService.getTenantOverrides(tenant.id!).subscribe({
      next: (res) => {
        alert(`Tenant Overrides for ${tenant.businessName}:\n` + JSON.stringify(res.data, null, 2));
      }
    });
  }

  openCategoryAttributesModal(cat: MasterCategoryItem): void {
    alert(`Category ${cat.name} (${cat.code}) has ${cat.attributes?.length || 0} configured dynamic attributes.`);
  }

  private notify(msg: string): void {
    this.actionNotification = msg;
    setTimeout(() => {
      if (this.actionNotification === msg) {
        this.actionNotification = null;
      }
    }, 4000);
  }
}

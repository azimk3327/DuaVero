import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { TenantService, TenantUser, TenantProduct } from '@core/services/tenant.service';
import { SuperAdminService, MasterCategoryItem, AttributeDefinitionItem } from '@core/services/super-admin.service';
import { I18nService } from '@core/services/i18n.service';
import { CategoryDrawerComponent, CategoryFormData, AttributeOption } from '@shared/ui-components/category-drawer.component';
import { RolePermissionMatrixComponent } from './components/role-permission-matrix.component';
import { QuotationManagerComponent } from './components/quotation-manager.component';

@Component({
  selector: 'app-tenant-portal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CategoryDrawerComponent,
    RolePermissionMatrixComponent,
    QuotationManagerComponent
  ],
  template: `
    <div class="portal-container">
      <!-- Top Header & Identity Bar -->
      <header class="portal-header">
        <div class="header-left">
          <div class="company-brand">
            <span class="company-logo">🛋️</span>
            <div>
              <h2 class="company-name">{{ authService.currentSession()?.tenantBusinessName || 'DuaVero Industrial Workspace' }}</h2>
              <span class="company-badge">
                {{ i18n.t('PLATFORM.ORG_WORKSPACE') }}: <code>{{ authService.currentSession()?.tenantSlug || 'org-master' }}</code>
              </span>
            </div>
          </div>
        </div>

        <div class="header-right">
          <!-- Dynamic Multilingual Language Switcher -->
          <div class="lang-switcher">
            <button
              (click)="i18n.setLanguage('en')"
              [class.active-lang]="i18n.currentLanguage() === 'en'"
              class="btn-lang"
              title="Switch to English"
            >
              🇬🇧 EN
            </button>
            <button
              (click)="i18n.setLanguage('hi')"
              [class.active-lang]="i18n.currentLanguage() === 'hi'"
              class="btn-lang"
              title="हिंदी में बदलें"
            >
              🇮🇳 हिंदी
            </button>
          </div>

          <div class="user-pill">
            <div class="user-avatar">{{ getUserInitial() }}</div>
            <div class="user-details">
              <span class="user-email">{{ authService.currentSession()?.email }}</span>
              <span class="user-role-tag">{{ getUserRolesString() }}</span>
            </div>
          </div>

          <button (click)="logout()" class="btn-logout" [title]="i18n.t('NAV.SIGN_OUT')">
            {{ i18n.t('NAV.SIGN_OUT') }} ⎋
          </button>
        </div>
      </header>

      <!-- Granular Permissions Strip -->
      <div class="permissions-strip">
        <span class="perm-label">{{ i18n.t('RBAC.PERMISSIONS_COUNT') }}:</span>
        <div class="perm-chips">
          <span *ngFor="let perm of authService.currentSession()?.permissions" class="perm-chip">
            {{ perm }}
          </span>
          <span *ngIf="!authService.currentSession()?.permissions?.length" class="perm-chip-empty">
            Standard Employee Access
          </span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="portal-nav">
        <button
          (click)="activeTab = 'overview'"
          [class.active]="activeTab === 'overview'"
          class="nav-tab"
        >
          📊 {{ i18n.t('NAV.DASHBOARD') }}
        </button>

        <button
          *ngIf="canViewCategories()"
          (click)="activeTab = 'categories'; loadCategories()"
          [class.active]="activeTab === 'categories'"
          class="nav-tab"
        >
          🏷️ {{ i18n.t('NAV.CATEGORIES') }}
        </button>

        <button
          *ngIf="canViewProducts()"
          (click)="activeTab = 'products'; loadProducts()"
          [class.active]="activeTab === 'products'"
          class="nav-tab"
        >
          🛋️ {{ i18n.t('NAV.PRODUCTS') }}
        </button>

        <button
          *ngIf="canViewQuotes()"
          (click)="activeTab = 'quotations'"
          [class.active]="activeTab === 'quotations'"
          class="nav-tab"
        >
          📝 {{ i18n.t('NAV.QUOTATIONS') }}
        </button>

        <button
          *ngIf="canViewUsers()"
          (click)="activeTab = 'users'; loadUsers()"
          [class.active]="activeTab === 'users'"
          class="nav-tab"
        >
          👥 {{ i18n.t('NAV.STAFF_RBAC') }}
        </button>

        <button
          *ngIf="canViewInvoices()"
          (click)="activeTab = 'invoices'"
          [class.active]="activeTab === 'invoices'"
          class="nav-tab"
        >
          🧾 {{ i18n.t('NAV.INVOICES') }}
        </button>
      </nav>

      <!-- Global Notifications -->
      <div *ngIf="alertMessage" class="alert" [ngClass]="alertType === 'error' ? 'alert-error' : 'alert-success'">
        <span>{{ alertType === 'error' ? '⚠️' : '✅' }} {{ alertMessage }}</span>
        <button (click)="alertMessage = null" class="btn-close-alert">×</button>
      </div>

      <!-- TAB 1: OVERVIEW -->
      <div *ngIf="activeTab === 'overview'" class="tab-content">
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">💰</div>
            <div class="kpi-info">
              <span class="kpi-title">Monthly Enterprise Revenue</span>
              <span class="kpi-val">₹4,85,000</span>
              <span class="kpi-trend positive">+18.4% vs last month</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">📝</div>
            <div class="kpi-info">
              <span class="kpi-title">Active Quotations</span>
              <span class="kpi-val">34 Estimates</span>
              <span class="kpi-trend">6 Awaiting Manager Approval</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">🧾</div>
            <div class="kpi-info">
              <span class="kpi-title">GST Invoices Dispatched</span>
              <span class="kpi-val">₹3,40,000</span>
              <span class="kpi-trend positive">100% Tax Compliant</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">👥</div>
            <div class="kpi-info">
              <span class="kpi-title">Active Staff & Executives</span>
              <span class="kpi-val">{{ staffList.length || 5 }} Members</span>
              <span class="kpi-trend">RBAC Guarded</span>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top: 24px;">
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">
            🛡️ Strict Multi-Organization Isolation & Enterprise Security
          </h3>
          <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6;">
            All operations executed in this workspace are cryptographically bound to <strong>Organization ID: {{ authService.currentTenantId() || 1 }}</strong>.
            Data from other organizations is completely isolated and inaccessible at the database query layer.
          </p>
        </div>
      </div>

      <!-- TAB 2: CATEGORY MASTER (FULL CRUD MODAL / DRAWER) -->
      <div *ngIf="activeTab === 'categories'" class="tab-content">
        <div class="section-toolbar">
          <div>
            <h3>{{ i18n.t('CATEGORIES.TITLE') }}</h3>
            <p>{{ i18n.t('CATEGORIES.SUBTITLE') }}</p>
          </div>
          <button
            *ngIf="canCreateCategories()"
            (click)="openCreateCategoryDrawer()"
            class="btn-action primary"
          >
            {{ i18n.t('CATEGORIES.CREATE_BTN') }}
          </button>
        </div>

        <!-- Master Categories Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ i18n.t('CATEGORIES.CODE') }}</th>
                <th>{{ i18n.t('CATEGORIES.NAME') }}</th>
                <th>{{ i18n.t('CATEGORIES.HSN') }}</th>
                <th>{{ i18n.t('CATEGORIES.TAX_SLAB') }}</th>
                <th>{{ i18n.t('COMMON.STATUS') }}</th>
                <th>{{ i18n.t('CATEGORIES.CUSTOM_ATTRIBUTES') }}</th>
                <th>{{ i18n.t('COMMON.ACTIONS') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cat of categories">
                <td><code class="cat-code">{{ cat.code }}</code></td>
                <td>
                  <strong>{{ cat.name }}</strong>
                  <div class="cat-desc">{{ cat.description || 'Master taxonomy record' }}</div>
                </td>
                <td><code class="hsn-tag">{{ cat.hsnCode || '9401' }}</code></td>
                <td><span class="tax-tag">{{ cat.defaultTaxRate || 18 }}% GST</span></td>
                <td>
                  <span class="status-badge" [class.active]="cat.active" [class.locked]="!cat.active">
                    {{ cat.active ? i18n.t('COMMON.ACTIVE') : i18n.t('COMMON.DISABLED') }}
                  </span>
                </td>
                <td>
                  <span class="attr-pill" *ngFor="let attr of cat.attributes">
                    {{ attr.attributeName || attr.attributeCode }}
                  </span>
                  <span *ngIf="!cat.attributes?.length" style="color: #64748b; font-size: 0.78rem;">—</span>
                </td>
                <td>
                  <div class="action-buttons-group">
                    <button
                      *ngIf="canEditCategories()"
                      (click)="openEditCategoryDrawer(cat)"
                      class="btn-table-action edit"
                      [title]="i18n.t('COMMON.EDIT')"
                    >
                      ✏️ {{ i18n.t('COMMON.EDIT') }}
                    </button>
                    <button
                      *ngIf="canDeleteCategories()"
                      (click)="confirmDeleteCategory(cat)"
                      class="btn-table-action danger"
                      [title]="i18n.t('COMMON.DELETE')"
                    >
                      🗑️ {{ i18n.t('COMMON.DELETE') }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!categories.length">
                <td colspan="7" class="empty-cell">
                  {{ i18n.t('CATEGORIES.NO_CATEGORIES') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: PRODUCTS & CATALOG -->
      <div *ngIf="activeTab === 'products'" class="tab-content">
        <div class="section-toolbar">
          <div>
            <h3>{{ i18n.t('NAV.PRODUCTS') }} & Inventory</h3>
            <p>Products, custom sofa models, upholstery fabrics, and accessories for this company.</p>
          </div>
          <button
            *ngIf="canCreateProducts()"
            (click)="showCreateProductModal = true"
            class="btn-action primary"
          >
            + Add Product
          </button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Base Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of productList">
                <td>
                  <strong>{{ p.name }}</strong>
                  <div style="font-size: 0.75rem; color: #94a3b8;">{{ p.shortDescription || 'Custom furnishing item' }}</div>
                </td>
                <td><code>{{ p.sku || 'N/A' }}</code></td>
                <td><strong style="color: #38bdf8;">₹{{ p.basePrice | number:'1.2-2' }}</strong></td>
                <td><span class="status-badge active">{{ p.status }}</span></td>
                <td>
                  <button
                    *ngIf="canDeleteProducts()"
                    (click)="deleteProduct(p.id)"
                    class="btn-table-action danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              <tr *ngIf="!productList.length">
                <td colspan="5" class="empty-cell">
                  No custom products found in this workspace. Click "+ Add Product" to create one.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Create Product Modal -->
        <div *ngIf="showCreateProductModal" class="modal-overlay">
          <div class="modal-card">
            <h3>Add Product to Catalog</h3>
            <form (ngSubmit)="handleCreateProduct()" class="modal-form">
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" [(ngModel)]="newProductName" name="name" required class="form-control" />
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>SKU</label>
                  <input type="text" [(ngModel)]="newProductSku" name="sku" placeholder="SKU-AUTO" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Base Price (₹) *</label>
                  <input type="number" [(ngModel)]="newProductPrice" name="price" required class="form-control" />
                </div>
              </div>
              <div class="form-group">
                <label>Short Description</label>
                <input type="text" [(ngModel)]="newProductDesc" name="desc" class="form-control" />
              </div>
              <div class="modal-actions">
                <button type="button" (click)="showCreateProductModal = false" class="btn-secondary">Cancel</button>
                <button type="submit" [disabled]="!newProductName || !newProductPrice" class="btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- TAB 4: QUOTATIONS & APPROVAL QUEUE -->
      <div *ngIf="activeTab === 'quotations'" class="tab-content">
        <app-quotation-manager></app-quotation-manager>
      </div>

      <!-- TAB 5: STAFF DIRECTORY & DYNAMIC RBAC MATRIX -->
      <div *ngIf="activeTab === 'users'" class="tab-content">
        <div class="section-toolbar">
          <div>
            <h3>{{ i18n.t('NAV.STAFF_RBAC') }} Directory</h3>
            <p>Manage employees, managers, estimators, accountants, and sales representatives.</p>
          </div>
          <button
            *ngIf="canCreateUsers()"
            (click)="showCreateUserModal = true"
            class="btn-action primary"
          >
            + Invite New Staff Member
          </button>
        </div>

        <!-- Staff List Table -->
        <div class="table-container" style="margin-bottom: 24px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Status</th>
                <th>Permissions Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of staffList">
                <td>
                  <div class="table-user-cell">
                    <strong>{{ u.firstName }} {{ u.lastName }}</strong>
                    <span>{{ u.email }}</span>
                  </div>
                </td>
                <td>
                  <span class="role-badge">{{ u.roles.join(', ') || u.userType }}</span>
                </td>
                <td>
                  <span class="status-badge" [class.active]="u.status === 'ACTIVE'" [class.locked]="u.status !== 'ACTIVE'">
                    {{ u.status }}
                  </span>
                </td>
                <td>
                  <span style="font-size: 0.85rem; color: #94a3b8;">{{ u.permissions.length || 0 }} granted</span>
                </td>
                <td>
                  <button
                    *ngIf="canDisableUsers()"
                    (click)="toggleUserStatus(u)"
                    class="btn-table-action"
                  >
                    {{ u.status === 'ACTIVE' ? 'Lock Account' : 'Activate' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Dynamic Granular RBAC Permissions Matrix -->
        <app-role-permission-matrix *ngIf="canManageRoles()"></app-role-permission-matrix>

        <!-- Invite User Modal -->
        <div *ngIf="showCreateUserModal" class="modal-overlay">
          <div class="modal-card">
            <h3>Invite New Staff Member</h3>
            <form (ngSubmit)="handleCreateUser()" class="modal-form">
              <div class="form-grid">
                <div class="form-group">
                  <label>First Name *</label>
                  <input type="text" [(ngModel)]="newFirstName" name="firstName" required class="form-control" />
                </div>
                <div class="form-group">
                  <label>Last Name *</label>
                  <input type="text" [(ngModel)]="newLastName" name="lastName" required class="form-control" />
                </div>
              </div>

              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="newEmail" name="email" required class="form-control" />
              </div>

              <div class="form-group">
                <label>Mobile Phone</label>
                <input type="text" [(ngModel)]="newPhone" name="phoneNumber" class="form-control" />
              </div>

              <div class="form-group">
                <label>Assign Role *</label>
                <select [(ngModel)]="newRoleCode" name="roleCode" class="form-control">
                  <option value="TENANT_MANAGER">Manager (Operations & Approvals)</option>
                  <option value="SALES">Sales Representative (Quotes & CRM)</option>
                  <option value="QUOTATION_USER">Quotation Estimator (Drafting)</option>
                  <option value="ACCOUNTANT">Accountant (Invoices & Billing)</option>
                  <option value="INVENTORY_USER">Inventory Handler (Products)</option>
                  <option value="EMPLOYEE">Standard Staff (Baseline View)</option>
                </select>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="showCreateUserModal = false" class="btn-secondary">Cancel</button>
                <button type="submit" [disabled]="!newFirstName || !newEmail" class="btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- TAB 6: INVOICES -->
      <div *ngIf="activeTab === 'invoices'" class="tab-content">
        <div class="section-toolbar">
          <div>
            <h3>{{ i18n.t('NAV.INVOICES') }}</h3>
            <p>GST compliant B2B/B2C invoices, payment reconciliation, and ledger entries.</p>
          </div>
          <button *ngIf="canCreateInvoices()" class="btn-action primary">+ Generate Invoice</button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Approval / Dispatch</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inv of mockInvoices">
                <td><strong>{{ inv.id }}</strong></td>
                <td>{{ inv.client }}</td>
                <td><strong style="color: #38bdf8;">{{ inv.total }}</strong></td>
                <td>
                  <span class="status-badge" [class.active]="inv.status === 'PAID'" [class.pending]="inv.status === 'PENDING_APPROVAL'">
                    {{ inv.status }}
                  </span>
                </td>
                <td>
                  <button
                    *ngIf="canApproveInvoices()"
                    [disabled]="inv.status === 'PAID'"
                    (click)="approveInvoice(inv)"
                    class="btn-table-action"
                  >
                    {{ inv.status === 'PAID' ? '✓ Dispatched' : 'Authorize & Dispatch' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CATEGORY DRAWER / UNIFIED FORM PANEL -->
      <app-category-drawer
        *ngIf="showCategoryDrawer"
        [formData]="activeCategoryForm"
        [parentCategories]="categories"
        [availableAttributes]="availableAttributes"
        (save)="handleSaveCategory($event)"
        (close)="showCategoryDrawer = false"
      ></app-category-drawer>

      <!-- SOFT-DELETE SAFEGUARD CONFIRMATION MODAL -->
      <div *ngIf="categoryToDelete" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="color: #f87171;">⚠️ {{ i18n.t('CATEGORIES.DELETE_CONFIRM_TITLE') }}</h3>
            <button (click)="categoryToDelete = null" class="btn-close">✕</button>
          </div>
          <p style="color: #cbd5e1; font-size: 0.88rem; line-height: 1.6;">
            {{ i18n.t('CATEGORIES.DELETE_CONFIRM_MSG') }}
          </p>
          <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 8px; margin: 16px 0;">
            <strong style="color: #f8fafc;">{{ categoryToDelete.name }}</strong> (<code>{{ categoryToDelete.code }}</code>)
          </div>
          <div class="modal-actions">
            <button type="button" (click)="categoryToDelete = null" class="btn-secondary">
              {{ i18n.t('COMMON.CANCEL') }}
            </button>
            <button type="button" (click)="executeDeleteCategory()" class="btn-danger-action">
              🗑️ {{ i18n.t('COMMON.DELETE') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .portal-container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 24px 20px 80px;
    }
    .portal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 18px 24px;
      margin-bottom: 16px;
    }
    .company-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .company-logo {
      font-size: 2rem;
    }
    .company-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 2px;
    }
    .company-badge {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .company-badge code {
      color: #38bdf8;
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .lang-switcher {
      display: flex;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 2px;
    }
    .btn-lang {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-lang.active-lang {
      background: #3b82f6;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 30px;
      padding: 4px 14px 4px 6px;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #fff;
      font-weight: 700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .user-details {
      display: flex;
      flex-direction: column;
    }
    .user-email {
      font-size: 0.82rem;
      font-weight: 600;
      color: #f1f5f9;
    }
    .user-role-tag {
      font-size: 0.7rem;
      color: #60a5fa;
      font-weight: 600;
    }
    .btn-logout {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.25);
    }
    .permissions-strip {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 10px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .perm-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .perm-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .perm-chip {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #93c5fd;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .portal-nav {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 24px;
      overflow-x: auto;
    }
    .nav-tab {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 0.92rem;
      font-weight: 600;
      padding: 12px 18px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .nav-tab:hover {
      color: #f1f5f9;
    }
    .nav-tab.active {
      color: #38bdf8;
      border-bottom-color: #38bdf8;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.88rem;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }
    .alert-success {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #86efac;
    }
    .btn-close-alert {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .kpi-icon {
      font-size: 2.2rem;
    }
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    .kpi-title {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 500;
    }
    .kpi-val {
      font-size: 1.4rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 2px 0;
    }
    .kpi-trend {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .kpi-trend.positive {
      color: #4ade80;
    }
    .card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 24px;
    }
    .section-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .section-toolbar h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 4px;
    }
    .section-toolbar p {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0;
    }
    .btn-action.primary {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 10px 16px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    }
    .table-container {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      background: rgba(15, 23, 42, 0.6);
      padding: 12px 16px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .data-table td {
      padding: 14px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.88rem;
      color: #f1f5f9;
    }
    .cat-code {
      font-family: monospace;
      color: #38bdf8;
      font-weight: 700;
    }
    .cat-desc {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .hsn-tag {
      font-family: monospace;
      background: rgba(15, 23, 42, 0.6);
      padding: 2px 6px;
      border-radius: 4px;
      color: #cbd5e1;
    }
    .tax-tag {
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .attr-pill {
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.72rem;
      color: #cbd5e1;
      margin-right: 4px;
      display: inline-block;
    }
    .action-buttons-group {
      display: flex;
      gap: 6px;
    }
    .btn-table-action {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-table-action.edit:hover {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border-color: #60a5fa;
    }
    .btn-table-action.danger:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border-color: #f87171;
    }
    .btn-danger-action {
      background: #ef4444;
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
    .empty-cell {
      text-align: center;
      color: #94a3b8;
      padding: 24px;
    }
    .table-user-cell {
      display: flex;
      flex-direction: column;
    }
    .table-user-cell span {
      font-size: 0.78rem;
      color: #94a3b8;
    }
    .role-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .status-badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .status-badge.active {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }
    .status-badge.locked {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    .status-badge.pending {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal-card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 30px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .form-control {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 10px 12px;
      color: #f8fafc;
      font-size: 0.88rem;
      outline: none;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 14px;
    }
    .btn-secondary {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #fff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
  `]
})
export class TenantPortalComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly tenantService = inject(TenantService);
  private readonly superAdminService = inject(SuperAdminService);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  activeTab: 'overview' | 'categories' | 'products' | 'quotations' | 'users' | 'invoices' = 'overview';
  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';

  categories: MasterCategoryItem[] = [];
  availableAttributes: AttributeOption[] = [];
  staffList: TenantUser[] = [];
  productList: TenantProduct[] = [];

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

  showCreateUserModal = false;
  newFirstName = '';
  newLastName = '';
  newEmail = '';
  newPhone = '';
  newRoleCode = 'SALES';

  showCreateProductModal = false;
  newProductName = '';
  newProductSku = '';
  newProductPrice = 0;
  newProductDesc = '';

  mockInvoices = [
    { id: 'INV-2026-101', client: 'Deepak Sharma (Villa 4B)', total: '₹1,47,500 (incl. GST)', status: 'PAID' },
    { id: 'INV-2026-102', client: 'Grand Horizon Banquet', total: '₹2,80,000 (incl. GST)', status: 'PENDING_APPROVAL' }
  ];

  ngOnInit(): void {
    this.loadCategories();
    this.loadAttributes();
    this.loadUsers();
    this.loadProducts();
  }

  loadCategories(): void {
    this.superAdminService.getCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories = res.data;
        }
      },
      error: () => {}
    });
  }

  loadAttributes(): void {
    this.superAdminService.getAttributes().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.availableAttributes = res.data
            .filter((a): a is AttributeDefinitionItem & { id: number } => a.id != null)
            .map(a => ({
              id: a.id,
              code: a.code,
              name: a.name,
              dataType: a.dataType
            }));
        }
      },
      error: () => {}
    });
  }

  loadUsers(): void {
    if (this.canViewUsers()) {
      this.tenantService.getTenantUsers().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.staffList = res.data;
          }
        },
        error: () => {}
      });
    }
  }

  loadProducts(): void {
    if (this.canViewProducts()) {
      this.tenantService.getProducts().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.productList = res.data;
          }
        },
        error: () => {}
      });
    }
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
        next: (res) => {
          this.showCategoryDrawer = false;
          this.alertMessage = `Category '${formData.name}' updated successfully!`;
          this.alertType = 'success';
          if (formData.selectedAttributeIds && formData.selectedAttributeIds.length) {
            this.saveCategoryAttributes(formData.id!, formData.selectedAttributeIds);
          } else {
            this.loadCategories();
          }
        },
        error: (err) => {
          this.alertMessage = err.error?.message || 'Failed to update category.';
          this.alertType = 'error';
        }
      });
    } else {
      this.superAdminService.createCategory(payload).subscribe({
        next: (res) => {
          this.showCategoryDrawer = false;
          this.alertMessage = `Category '${formData.name}' created successfully!`;
          this.alertType = 'success';
          if (res.data?.id && formData.selectedAttributeIds && formData.selectedAttributeIds.length) {
            this.saveCategoryAttributes(res.data.id, formData.selectedAttributeIds);
          } else {
            this.loadCategories();
          }
        },
        error: (err) => {
          this.alertMessage = err.error?.message || 'Failed to create category.';
          this.alertType = 'error';
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
        this.alertMessage = `Category '${this.categoryToDelete?.name}' soft-deleted safely.`;
        this.alertType = 'success';
        this.categoryToDelete = null;
        this.loadCategories();
      },
      error: (err) => {
        this.alertMessage = err.error?.message || 'Failed to delete category.';
        this.alertType = 'error';
        this.categoryToDelete = null;
      }
    });
  }

  handleCreateUser(): void {
    this.tenantService.createTenantUser({
      firstName: this.newFirstName,
      lastName: this.newLastName,
      email: this.newEmail,
      phoneNumber: this.newPhone,
      roleCode: this.newRoleCode
    }).subscribe({
      next: (res) => {
        this.showCreateUserModal = false;
        this.alertMessage = `Staff user ${res.data.email} created with role ${this.newRoleCode}!`;
        this.alertType = 'success';
        this.newFirstName = '';
        this.newLastName = '';
        this.newEmail = '';
        this.newPhone = '';
        this.loadUsers();
      },
      error: (err) => {
        this.alertMessage = err.error?.message || 'Failed to create user.';
        this.alertType = 'error';
      }
    });
  }

  toggleUserStatus(user: TenantUser): void {
    const target = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    this.tenantService.updateUserStatus(user.id, target).subscribe({
      next: () => {
        this.alertMessage = `User ${user.email} status set to ${target}.`;
        this.alertType = 'success';
        this.loadUsers();
      },
      error: (err) => {
        this.alertMessage = err.error?.message || 'Failed to update user status.';
        this.alertType = 'error';
      }
    });
  }

  handleCreateProduct(): void {
    this.tenantService.createProduct({
      categoryId: 1,
      name: this.newProductName,
      sku: this.newProductSku,
      basePrice: this.newProductPrice,
      shortDescription: this.newProductDesc
    }).subscribe({
      next: (res) => {
        this.showCreateProductModal = false;
        this.alertMessage = `Product '${res.data.name}' added to catalog!`;
        this.alertType = 'success';
        this.newProductName = '';
        this.newProductSku = '';
        this.newProductPrice = 0;
        this.newProductDesc = '';
        this.loadProducts();
      },
      error: (err) => {
        this.alertMessage = err.error?.message || 'Failed to create product.';
        this.alertType = 'error';
      }
    });
  }

  deleteProduct(id: number): void {
    this.tenantService.deleteProduct(id).subscribe({
      next: () => {
        this.alertMessage = 'Product deleted successfully.';
        this.alertType = 'success';
        this.loadProducts();
      },
      error: (err) => {
        this.alertMessage = err.error?.message || 'Failed to delete product.';
        this.alertType = 'error';
      }
    });
  }

  approveInvoice(inv: any): void {
    inv.status = 'PAID';
    this.alertMessage = `Tax Invoice ${inv.id} authorized and dispatched!`;
    this.alertType = 'success';
  }

  // RBAC Permission Evaluators
  canViewCategories(): boolean {
    return true;
  }

  canCreateCategories(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('CATEGORY_CREATE');
  }

  canEditCategories(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('CATEGORY_UPDATE');
  }

  canDeleteCategories(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('CATEGORY_DELETE');
  }

  canViewUsers(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('USER_VIEW');
  }

  canCreateUsers(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('USER_CREATE');
  }

  canDisableUsers(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('USER_DISABLE');
  }

  canManageRoles(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('ROLE_PERMISSIONS_MANAGE');
  }

  canViewProducts(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('PRODUCT_VIEW');
  }

  canCreateProducts(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('PRODUCT_CREATE');
  }

  canDeleteProducts(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('PRODUCT_DELETE');
  }

  canViewQuotes(): boolean {
    return true;
  }

  canViewInvoices(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('INVOICE_VIEW');
  }

  canCreateInvoices(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('INVOICE_CREATE');
  }

  canApproveInvoices(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('INVOICE_APPROVE');
  }

  getUserInitial(): string {
    const email = this.authService.currentSession()?.email;
    return email ? email.charAt(0).toUpperCase() : 'U';
  }

  getUserRolesString(): string {
    const roles = this.authService.currentSession()?.roles;
    return roles?.join(', ') || this.authService.currentSession()?.userType || 'USER';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

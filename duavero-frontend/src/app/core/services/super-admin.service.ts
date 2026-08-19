import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface DashboardMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalCategories: number;
  totalSchedulers: number;
  totalPackages: number;
  totalAuditLogs: number;
  recentTenants: TenantItem[];
  recentAuditLogs: AuditLogItem[];
}

export interface CategoryAttributeItem {
  attributeId: number;
  attributeCode?: string;
  attributeName?: string;
  dataType?: string;
  required: boolean;
  filterable: boolean;
  sortOrder: number;
}

export interface MasterCategoryItem {
  id?: number;
  parentId?: number | null;
  code: string;
  name: string;
  hsnCode?: string;
  defaultTaxRate?: number;
  description?: string;
  iconUrl?: string;
  imageUrl?: string;
  industryType: string;
  sortOrder: number;
  active: boolean;
  deleted?: boolean;
  attributes?: CategoryAttributeItem[];
}

export interface AttributeDefinitionItem {
  id?: number;
  code: string;
  name: string;
  dataType: string;
  unitOfMeasure?: string;
  optionsJson?: string;
  optionsList?: string[];
  validationRegex?: string;
  requiredDefault: boolean;
}

export interface TenantItem {
  id?: number;
  slug: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  countryCode?: string;
  currencyCode?: string;
  status: string;
  trialEndsAt?: string;
  profile?: {
    tagline?: string;
    aboutText?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
  };
}

export interface UserManagementItem {
  id?: number;
  tenantId?: number | null;
  tenantSlug?: string | null;
  tenantBusinessName?: string | null;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType: string;
  status: string;
  roles: string[];
  permissions: string[];
}

export interface PackageItem {
  id?: number;
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  halfYearlyPrice: number;
  annualPrice: number;
  currency: string;
  publicListed: boolean;
  active: boolean;
  sortOrder: number;
}

export interface FeatureItem {
  id?: number;
  code: string;
  name: string;
  module: string;
  description?: string;
  platformEnabled: boolean;
}

export interface SchedulerJobItem {
  id?: number;
  jobCode: string;
  jobName: string;
  description?: string;
  cronExpression: string;
  enabled: boolean;
  batchSize: number;
  retryLimit: number;
  timeoutSeconds: number;
  lastExecutionAt?: string;
  lastExecutionStatus?: string;
}

export interface SchedulerLogItem {
  id: number;
  jobCode: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: string;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage?: string;
}

export interface NotificationTemplateItem {
  id?: number;
  tenantId?: number | null;
  eventCode: string;
  channel: string;
  subject?: string;
  bodyTemplate: string;
  allowedVariablesJson?: string;
  active: boolean;
}

export interface AuditLogItem {
  id: number;
  tenantId?: number | null;
  userId?: number | null;
  action: string;
  entityName: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  status: string;
  createdAt: string;
}

export interface SystemConfigItem {
  id?: number;
  configKey: string;
  configValue: string;
  description?: string;
  valueType: string;
  secret: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private readonly api = inject(ApiService);
  private readonly root = '/super-admin';

  // 1. Dashboard
  getDashboardMetrics(): Observable<ApiResponse<DashboardMetrics>> {
    return this.api.get<DashboardMetrics>(`${this.root}/dashboard/metrics`);
  }

  // 2. Categories
  getCategories(): Observable<ApiResponse<MasterCategoryItem[]>> {
    return this.api.get<MasterCategoryItem[]>(`${this.root}/categories`);
  }

  getCategory(id: number): Observable<ApiResponse<MasterCategoryItem>> {
    return this.api.get<MasterCategoryItem>(`${this.root}/categories/${id}`);
  }

  createCategory(category: MasterCategoryItem): Observable<ApiResponse<MasterCategoryItem>> {
    return this.api.post<MasterCategoryItem>(`${this.root}/categories`, category);
  }

  updateCategory(id: number, category: MasterCategoryItem): Observable<ApiResponse<MasterCategoryItem>> {
    return this.api.put<MasterCategoryItem>(`${this.root}/categories/${id}`, category);
  }

  toggleCategoryStatus(id: number, active: boolean): Observable<ApiResponse<void>> {
    return this.api.patch<void>(`${this.root}/categories/${id}/status?active=${active}`, {});
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`${this.root}/categories/${id}`);
  }

  configureCategoryAttributes(id: number, attributes: CategoryAttributeItem[]): Observable<ApiResponse<void>> {
    return this.api.post<void>(`${this.root}/categories/${id}/attributes`, attributes);
  }

  // 3. Dynamic Attributes
  getAttributes(): Observable<ApiResponse<AttributeDefinitionItem[]>> {
    return this.api.get<AttributeDefinitionItem[]>(`${this.root}/attributes`);
  }

  createAttribute(attr: AttributeDefinitionItem): Observable<ApiResponse<AttributeDefinitionItem>> {
    return this.api.post<AttributeDefinitionItem>(`${this.root}/attributes`, attr);
  }

  updateAttribute(id: number, attr: AttributeDefinitionItem): Observable<ApiResponse<AttributeDefinitionItem>> {
    return this.api.put<AttributeDefinitionItem>(`${this.root}/attributes/${id}`, attr);
  }

  // 4. Tenants
  getTenants(): Observable<ApiResponse<TenantItem[]>> {
    return this.api.get<TenantItem[]>(`${this.root}/tenants`);
  }

  createTenant(tenant: TenantItem): Observable<ApiResponse<TenantItem>> {
    return this.api.post<TenantItem>(`${this.root}/tenants`, tenant);
  }

  updateTenant(id: number, tenant: TenantItem): Observable<ApiResponse<TenantItem>> {
    return this.api.put<TenantItem>(`${this.root}/tenants/${id}`, tenant);
  }

  updateTenantStatus(id: number, status: string): Observable<ApiResponse<void>> {
    return this.api.patch<void>(`${this.root}/tenants/${id}/status?status=${status}`, {});
  }

  getTenantOverrides(id: number): Observable<ApiResponse<any>> {
    return this.api.get<any>(`${this.root}/tenants/${id}/overrides`);
  }

  setFeatureOverride(tenantId: number, featureId: number, enabled: boolean): Observable<ApiResponse<void>> {
    return this.api.post<void>(`${this.root}/tenants/${tenantId}/overrides/features?featureId=${featureId}&enabled=${enabled}`, {});
  }

  setLimitOverride(tenantId: number, limitKey: string, limitValue: number): Observable<ApiResponse<void>> {
    return this.api.post<void>(`${this.root}/tenants/${tenantId}/overrides/limits?limitKey=${encodeURIComponent(limitKey)}&limitValue=${limitValue}`, {});
  }

  // 5. Users & Roles
  getUsers(): Observable<ApiResponse<UserManagementItem[]>> {
    return this.api.get<UserManagementItem[]>(`${this.root}/users`);
  }

  createUser(payload: any): Observable<ApiResponse<UserManagementItem>> {
    const params = new URLSearchParams(payload).toString();
    return this.api.post<UserManagementItem>(`${this.root}/users?${params}`, {});
  }

  updateUserStatus(id: number, status: string): Observable<ApiResponse<void>> {
    return this.api.patch<void>(`${this.root}/users/${id}/status?status=${status}`, {});
  }

  getRoles(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>(`${this.root}/roles`);
  }

  getPermissions(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>(`${this.root}/permissions`);
  }

  // 6. Packages & Features
  getPackages(): Observable<ApiResponse<PackageItem[]>> {
    return this.api.get<PackageItem[]>(`${this.root}/packages`);
  }

  createPackage(pkg: PackageItem): Observable<ApiResponse<PackageItem>> {
    return this.api.post<PackageItem>(`${this.root}/packages`, pkg);
  }

  updatePackage(id: number, pkg: PackageItem): Observable<ApiResponse<PackageItem>> {
    return this.api.put<PackageItem>(`${this.root}/packages/${id}`, pkg);
  }

  getFeatures(): Observable<ApiResponse<FeatureItem[]>> {
    return this.api.get<FeatureItem[]>(`${this.root}/features`);
  }

  toggleFeature(id: number, enabled: boolean): Observable<ApiResponse<void>> {
    return this.api.patch<void>(`${this.root}/features/${id}/toggle?enabled=${enabled}`, {});
  }

  // 7. Schedulers
  getSchedulers(): Observable<ApiResponse<SchedulerJobItem[]>> {
    return this.api.get<SchedulerJobItem[]>(`${this.root}/schedulers`);
  }

  updateScheduler(jobCode: string, job: SchedulerJobItem): Observable<ApiResponse<SchedulerJobItem>> {
    return this.api.put<SchedulerJobItem>(`${this.root}/schedulers/${jobCode}`, job);
  }

  triggerScheduler(jobCode: string): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.root}/schedulers/${jobCode}/trigger`, {});
  }

  getSchedulerLogs(): Observable<ApiResponse<SchedulerLogItem[]>> {
    return this.api.get<SchedulerLogItem[]>(`${this.root}/schedulers/logs`);
  }

  // 8. Notifications
  getNotificationTemplates(): Observable<ApiResponse<NotificationTemplateItem[]>> {
    return this.api.get<NotificationTemplateItem[]>(`${this.root}/notifications/templates`);
  }

  updateNotificationTemplate(id: number, tmpl: NotificationTemplateItem): Observable<ApiResponse<NotificationTemplateItem>> {
    return this.api.put<NotificationTemplateItem>(`${this.root}/notifications/templates/${id}`, tmpl);
  }

  // 9. Audit & Config
  getAuditLogs(): Observable<ApiResponse<AuditLogItem[]>> {
    return this.api.get<AuditLogItem[]>(`${this.root}/audit/logs`);
  }

  getConfigurations(): Observable<ApiResponse<SystemConfigItem[]>> {
    return this.api.get<SystemConfigItem[]>(`${this.root}/configurations`);
  }

  updateConfiguration(key: string, value: string): Observable<ApiResponse<SystemConfigItem>> {
    return this.api.put<SystemConfigItem>(`${this.root}/configurations/${encodeURIComponent(key)}?configValue=${encodeURIComponent(value)}`, {});
  }

  // 10. Reports
  getReportsSummary(): Observable<ApiResponse<any>> {
    return this.api.get<any>(`${this.root}/reports/summary`);
  }
}

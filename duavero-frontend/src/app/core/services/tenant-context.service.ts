import { Injectable, signal, computed } from '@angular/core';

export interface TenantProfile {
  tenantId: number;
  slug: string;
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  bannerUrl?: string;
  tagline?: string;
  aboutText?: string;
  city?: string;
  state?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantContextService {
  private readonly tenantSignal = signal<TenantProfile | null>(null);

  readonly currentTenant = this.tenantSignal.asReadonly();
  readonly tenantId = computed(() => this.tenantSignal()?.tenantId ?? null);
  readonly tenantSlug = computed(() => this.tenantSignal()?.slug ?? '');

  setTenant(tenant: TenantProfile): void {
    this.tenantSignal.set(tenant);
    this.applyTenantBranding(tenant);
  }

  clearTenant(): void {
    this.tenantSignal.set(null);
    this.resetBranding();
  }

  private applyTenantBranding(tenant: TenantProfile): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (tenant.primaryColor) {
        root.style.setProperty('--tenant-primary', tenant.primaryColor);
      }
      if (tenant.secondaryColor) {
        root.style.setProperty('--tenant-secondary', tenant.secondaryColor);
      }
    }
  }

  private resetBranding(): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.removeProperty('--tenant-primary');
      root.style.removeProperty('--tenant-secondary');
    }
  }
}

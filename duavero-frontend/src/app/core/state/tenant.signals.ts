import { signal, computed } from '@angular/core';
import { TenantProfile } from '../services/tenant-context.service';

export const activeTenantSignal = signal<TenantProfile | null>(null);

export const activeTenantIdSignal = computed(() => activeTenantSignal()?.tenantId ?? null);
export const activeTenantNameSignal = computed(() => activeTenantSignal()?.businessName ?? 'DuaVero');
export const activeTenantSlugSignal = computed(() => activeTenantSignal()?.slug ?? '');

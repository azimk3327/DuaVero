import { signal, computed } from '@angular/core';
import { UserSession } from '../services/auth.service';

export const userSessionSignal = signal<UserSession | null>(null);

export const isAuthenticatedSignal = computed(() => !!userSessionSignal());
export const userRolesSignal = computed(() => userSessionSignal()?.roles ?? []);
export const userPermissionsSignal = computed(() => userSessionSignal()?.permissions ?? []);
export const isSuperAdminSignal = computed(() => userSessionSignal()?.userType === 'SUPER_ADMIN');

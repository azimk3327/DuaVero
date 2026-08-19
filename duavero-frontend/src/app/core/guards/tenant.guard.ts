import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const tenantGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  // Super Admin can access tenant portals in inspection mode, or tenant staff with valid tenantId
  if (authService.isSuperAdmin() || authService.currentTenantId() !== null) {
    return true;
  }

  return router.parseUrl('/unauthorized');
};

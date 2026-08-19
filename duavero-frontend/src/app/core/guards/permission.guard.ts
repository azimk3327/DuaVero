import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredPermissions = route.data['permissions'] as string[] | undefined;

  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  if (authService.isSuperAdmin()) {
    return true;
  }

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  const hasPerm = requiredPermissions.some(p => authService.hasPermission(p));
  if (hasPerm) {
    return true;
  }

  return router.parseUrl('/unauthorized');
};

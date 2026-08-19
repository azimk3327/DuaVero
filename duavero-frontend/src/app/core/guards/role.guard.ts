import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  if (authService.isSuperAdmin()) {
    return true;
  }

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const hasRole = requiredRoles.some(role => authService.hasRole(role));
  if (hasRole) {
    return true;
  }

  return router.parseUrl('/unauthorized');
};

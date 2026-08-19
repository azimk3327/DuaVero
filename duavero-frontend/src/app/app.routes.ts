import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { tenantGuard } from './core/guards/tenant.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./portals/public/public-portal.component').then(m => m.PublicPortalComponent)
  },
  {
    path: 'public',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./portals/public/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./portals/public/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./portals/public/signup.component').then(m => m.SignUpComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./portals/public/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: 'super-admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SUPER_ADMIN'] },
    loadComponent: () => import('./portals/super-admin/super-admin-portal.component').then(m => m.SuperAdminPortalComponent)
  },
  {
    path: 'tenant',
    canActivate: [authGuard, tenantGuard],
    loadComponent: () => import('./portals/tenant/tenant-portal.component').then(m => m.TenantPortalComponent)
  },
  {
    path: 'customer',
    canActivate: [authGuard],
    loadComponent: () => import('./portals/customer/customer-portal.component').then(m => m.CustomerPortalComponent)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

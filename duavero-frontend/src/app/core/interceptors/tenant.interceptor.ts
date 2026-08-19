import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from '../services/tenant-context.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantContextService);
  const tenantSlug = tenantService.tenantSlug();

  // If a tenant slug is active and header is not yet set, pass informational X-Tenant-Slug
  if (tenantSlug && !req.headers.has('X-Tenant-Slug')) {
    const cloned = req.clone({
      setHeaders: {
        'X-Tenant-Slug': tenantSlug
      }
    });
    return next(cloned);
  }

  return next(req);
};

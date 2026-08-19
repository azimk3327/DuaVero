import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { ApiResponse } from './api.service';

export interface UserSession {
  userId: number;
  tenantId: number | null;
  tenantSlug?: string | null;
  tenantBusinessName?: string | null;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_STAFF' | 'CUSTOMER';
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: {
    id: number;
    tenantId: number | null;
    tenantSlug: string | null;
    tenantBusinessName: string | null;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    userType: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_STAFF' | 'CUSTOMER';
    status: string;
    roles: string[];
    permissions: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/v1/auth';

  private readonly sessionSignal = signal<UserSession | null>(this.loadStoredSession());

  readonly currentSession = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.sessionSignal());
  readonly isSuperAdmin = computed(() => this.sessionSignal()?.userType === 'SUPER_ADMIN');
  readonly isTenantAdmin = computed(() => this.sessionSignal()?.userType === 'TENANT_ADMIN');
  readonly currentTenantId = computed(() => this.sessionSignal()?.tenantId ?? null);
  readonly currentTenantName = computed(() => this.sessionSignal()?.tenantBusinessName ?? null);

  login(identifier: string, password: string, tenantId?: number): Observable<ApiResponse<AuthResponseData>> {
    return this.http.post<ApiResponse<AuthResponseData>>(`${this.baseUrl}/login`, {
      identifier: identifier.trim(),
      password,
      tenantId: tenantId ?? null
    }).pipe(
      tap(res => {
        if (res.success && res.data) {
          const authData = res.data;
          const session: UserSession = {
            userId: authData.user.id,
            tenantId: authData.user.tenantId,
            tenantSlug: authData.user.tenantSlug,
            tenantBusinessName: authData.user.tenantBusinessName,
            email: authData.user.email,
            firstName: authData.user.firstName,
            lastName: authData.user.lastName,
            phoneNumber: authData.user.phoneNumber,
            userType: authData.user.userType,
            roles: authData.user.roles,
            permissions: authData.user.permissions,
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken
          };
          this.setSession(session);
        }
      })
    );
  }

  forgotPassword(identifier: string): Observable<ApiResponse<{ message: string; resetToken?: string }>> {
    return this.http.post<ApiResponse<{ message: string; resetToken?: string }>>(`${this.baseUrl}/forgot-password`, {
      identifier: identifier.trim()
    });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/reset-password`, {
      token: token.trim(),
      newPassword
    });
  }

  signup(data: {
    businessName: string;
    slug: string;
    contactEmail: string;
    contactPhone: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
    ownerPhone?: string;
    password: string;
    packageCode?: string;
  }): Observable<ApiResponse<AuthResponseData>> {
    return this.http.post<ApiResponse<AuthResponseData>>(`${this.baseUrl}/signup`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          const authData = res.data;
          const session: UserSession = {
            userId: authData.user.id,
            tenantId: authData.user.tenantId,
            tenantSlug: authData.user.tenantSlug,
            tenantBusinessName: authData.user.tenantBusinessName,
            email: authData.user.email,
            firstName: authData.user.firstName,
            lastName: authData.user.lastName,
            phoneNumber: authData.user.phoneNumber,
            userType: authData.user.userType,
            roles: authData.user.roles,
            permissions: authData.user.permissions,
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken
          };
          this.setSession(session);
        }
      })
    );
  }

  setSession(session: UserSession): void {
    this.sessionSignal.set(session);
    try {
      localStorage.setItem('duavero_session', JSON.stringify(session));
      localStorage.setItem('duavero_token', session.accessToken);
      if (session.refreshToken) {
        localStorage.setItem('duavero_refresh_token', session.refreshToken);
      }
    } catch (e) {
      console.error('LocalStorage unavailable:', e);
    }
  }

  getToken(): string | null {
    return this.sessionSignal()?.accessToken ?? localStorage.getItem('duavero_token');
  }

  getRefreshToken(): string | null {
    return this.sessionSignal()?.refreshToken ?? localStorage.getItem('duavero_refresh_token');
  }

  hasPermission(permissionCode: string): boolean {
    const session = this.sessionSignal();
    return !!session && (session.userType === 'SUPER_ADMIN' || session.permissions.includes(permissionCode));
  }

  hasRole(roleCode: string): boolean {
    const session = this.sessionSignal();
    return !!session && (session.userType === 'SUPER_ADMIN' || session.roles.includes(roleCode));
  }

  logout(): void {
    const token = this.getRefreshToken();
    if (token) {
      this.http.post(`${this.baseUrl}/logout`, { refreshToken: token }).pipe(
        catchError(() => of(null))
      ).subscribe();
    }
    this.sessionSignal.set(null);
    try {
      localStorage.removeItem('duavero_session');
      localStorage.removeItem('duavero_token');
      localStorage.removeItem('duavero_refresh_token');
    } catch (e) {}
  }

  private loadStoredSession(): UserSession | null {
    try {
      const stored = localStorage.getItem('duavero_session');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }
}

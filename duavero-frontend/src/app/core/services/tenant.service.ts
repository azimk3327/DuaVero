import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './api.service';

export interface TenantUser {
  id: number;
  tenantId: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userType: string;
  status: string;
  roles: string[];
  permissions: string[];
}

export interface TenantProduct {
  id: number;
  tenantId: number;
  categoryId: number;
  brandId?: number;
  name: string;
  slug: string;
  sku?: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  discountPercentage: number;
  taxRatePercentage: number;
  warrantyMonths: number;
  available: boolean;
  featured: boolean;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/v1/tenant';

  getTenantUsers(): Observable<ApiResponse<TenantUser[]>> {
    return this.http.get<ApiResponse<TenantUser[]>>(`${this.baseUrl}/users`);
  }

  createTenantUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    password?: string;
    roleCode: string;
  }): Observable<ApiResponse<TenantUser>> {
    return this.http.post<ApiResponse<TenantUser>>(`${this.baseUrl}/users`, data);
  }

  updateUserStatus(userId: number, status: string): Observable<ApiResponse<TenantUser>> {
    return this.http.put<ApiResponse<TenantUser>>(`${this.baseUrl}/users/${userId}/status`, { status });
  }

  getProducts(): Observable<ApiResponse<TenantProduct[]>> {
    return this.http.get<ApiResponse<TenantProduct[]>>(`${this.baseUrl}/products`);
  }

  createProduct(data: {
    categoryId: number;
    name: string;
    sku?: string;
    shortDescription?: string;
    basePrice: number;
  }): Observable<ApiResponse<TenantProduct>> {
    return this.http.post<ApiResponse<TenantProduct>>(`${this.baseUrl}/products`, data);
  }

  deleteProduct(productId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/products/${productId}`);
  }
}

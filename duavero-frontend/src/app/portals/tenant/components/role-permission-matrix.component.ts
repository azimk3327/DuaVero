import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '@core/services/i18n.service';
import { ApiResponse } from '@core/services/api.service';

export interface RoleMatrixItem {
  id: number;
  code: string;
  name: string;
  description: string;
  systemRole: boolean;
  permissionCodes: string[];
}

export interface PermissionItem {
  id: number;
  module: string;
  action: string;
  code: string;
  description: string;
}

export interface RoleMatrixResponse {
  roles: RoleMatrixItem[];
  permissions: PermissionItem[];
}

@Component({
  selector: 'app-role-permission-matrix',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="matrix-container">
      <div class="matrix-header">
        <div>
          <h3 class="matrix-title">🛡️ {{ i18n.t('RBAC.TITLE') }}</h3>
          <p class="matrix-subtitle">{{ i18n.t('RBAC.SUBTITLE') }}</p>
        </div>
        <button (click)="loadMatrix()" class="btn-refresh-matrix">
          🔄 {{ i18n.t('COMMON.REFRESH') }}
        </button>
      </div>

      <div *ngIf="notification" class="notification-pill" [class.success]="isSuccess">
        {{ notification }}
      </div>

      <div class="matrix-table-wrap">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="col-perm">Permission / Capability</th>
              <th class="col-module">Module</th>
              <th *ngFor="let role of roles" class="col-role">
                <div class="role-th-card">
                  <span class="role-name">{{ role.name }}</span>
                  <code class="role-code">{{ role.code }}</code>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let group of groupedPermissions | keyvalue">
              <tr class="module-group-row">
                <td [attr.colspan]="2 + roles.length">
                  📁 {{ group.key }} Module Permissions
                </td>
              </tr>
              <tr *ngFor="let perm of group.value" class="perm-row">
                <td class="perm-info-cell">
                  <div class="perm-meta">
                    <span class="perm-title">{{ perm.description || perm.code }}</span>
                    <code class="perm-code">{{ perm.code }}</code>
                  </div>
                </td>
                <td>
                  <span class="module-badge">{{ perm.module }}</span>
                </td>
                <td *ngFor="let role of roles" class="checkbox-cell">
                  <label class="custom-chk">
                    <input
                      type="checkbox"
                      [checked]="hasPermission(role, perm.code)"
                      [disabled]="role.code === 'TENANT_ADMIN' && (perm.code === 'ROLE_PERMISSIONS_MANAGE' || perm.code === 'USER_VIEW')"
                      (change)="onToggle(role, perm.code, $event)"
                    />
                    <span class="chk-box"></span>
                  </label>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .matrix-container {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
    }

    .matrix-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
    }

    .matrix-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0 0 4px;
    }

    .matrix-subtitle {
      font-size: 0.84rem;
      color: #94a3b8;
      margin: 0;
    }

    .btn-refresh-matrix {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-refresh-matrix:hover {
      background: rgba(59, 130, 246, 0.2);
      color: #38bdf8;
    }

    .notification-pill {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #93c5fd;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .notification-pill.success {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.4);
      color: #86efac;
    }

    .matrix-table-wrap {
      overflow-x: auto;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;
    }

    .matrix-table th {
      background: #111827;
      padding: 14px 16px;
      color: #94a3b8;
      font-weight: 700;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .col-perm {
      min-width: 260px;
    }

    .col-module {
      min-width: 120px;
    }

    .col-role {
      min-width: 150px;
      text-align: center;
    }

    .role-th-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .role-name {
      color: #f1f5f9;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .role-code {
      font-size: 0.68rem;
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.15);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .module-group-row td {
      background: rgba(15, 23, 42, 0.9);
      color: #38bdf8;
      font-weight: 800;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 10px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .perm-row td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #f1f5f9;
    }

    .perm-info-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .perm-title {
      font-size: 0.84rem;
      font-weight: 600;
      color: #f8fafc;
    }

    .perm-code {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .module-badge {
      background: rgba(255, 255, 255, 0.06);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      color: #cbd5e1;
    }

    .checkbox-cell {
      text-align: center;
    }

    .custom-chk {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
    }

    .custom-chk input {
      opacity: 0;
      position: absolute;
      cursor: pointer;
    }

    .chk-box {
      width: 20px;
      height: 20px;
      background: #1e293b;
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .custom-chk input:checked ~ .chk-box {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .custom-chk input:checked ~ .chk-box::after {
      content: "✓";
      color: #fff;
      font-size: 0.8rem;
      font-weight: 800;
    }

    .custom-chk input:disabled ~ .chk-box {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `]
})
export class RolePermissionMatrixComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly i18n = inject(I18nService);

  private readonly baseUrl = 'http://localhost:8080/api/v1/tenant/users';

  roles: RoleMatrixItem[] = [];
  permissions: PermissionItem[] = [];
  groupedPermissions: Record<string, PermissionItem[]> = {};

  notification: string | null = null;
  isSuccess = true;

  ngOnInit(): void {
    this.loadMatrix();
  }

  loadMatrix(): void {
    this.http.get<ApiResponse<RoleMatrixResponse>>(`${this.baseUrl}/roles/matrix`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.roles = res.data.roles;
          this.permissions = res.data.permissions;
          this.groupPermissions();
        }
      },
      error: (err) => {
        console.error('Failed to load role matrix:', err);
      }
    });
  }

  groupPermissions(): void {
    this.groupedPermissions = {};
    for (const perm of this.permissions) {
      const module = perm.module || 'GENERAL';
      if (!this.groupedPermissions[module]) {
        this.groupedPermissions[module] = [];
      }
      this.groupedPermissions[module].push(perm);
    }
  }

  hasPermission(role: RoleMatrixItem, permCode: string): boolean {
    return role.permissionCodes.includes(permCode);
  }

  onToggle(role: RoleMatrixItem, permCode: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    this.http.post<ApiResponse<RoleMatrixResponse>>(`${this.baseUrl}/roles/${role.id}/permissions/toggle`, {
      permissionCode: permCode,
      enabled: isChecked
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.roles = res.data.roles;
          this.permissions = res.data.permissions;
          this.groupPermissions();
          this.showNotification(`Permission '${permCode}' ${isChecked ? 'granted to' : 'revoked from'} ${role.name}`, true);
        }
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Failed to update permission.', false);
        // revert checkbox visually
        (event.target as HTMLInputElement).checked = !isChecked;
      }
    });
  }

  private showNotification(msg: string, success: boolean): void {
    this.notification = msg;
    this.isSuccess = success;
    setTimeout(() => {
      if (this.notification === msg) {
        this.notification = null;
      }
    }, 4000);
  }
}

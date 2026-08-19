import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="unauth-container">
      <div class="unauth-card">
        <div class="icon-bubble">🛡️</div>
        <h1>Access Restricted</h1>
        <p class="desc">
          You do not have the required role or permission to access this furnishing workspace resource.
        </p>

        <div *ngIf="authService.isAuthenticated()" class="user-context-box">
          <div class="ctx-row"><span>Signed In As:</span> <strong>{{ authService.currentSession()?.email }}</strong></div>
          <div class="ctx-row"><span>Role:</span> <span class="badge">{{ authService.currentSession()?.userType }}</span></div>
          <div *ngIf="authService.currentSession()?.tenantSlug" class="ctx-row"><span>Studio:</span> <code>{{ authService.currentSession()?.tenantSlug }}</code></div>
        </div>

        <div class="action-buttons">
          <button (click)="navigateToPortal()" class="btn-luxury-submit">Return to Your Portal →</button>
          <button (click)="authService.logout()" class="btn-outline">Sign Out</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauth-container {
      min-height: calc(100vh - 128px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 24px 64px;
    }
    .unauth-card {
      max-width: 500px;
      width: 100%;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(220, 38, 38, 0.25);
      border-radius: 24px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 45px rgba(44, 30, 15, 0.08);
    }
    .icon-bubble {
      font-size: 3rem;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 1.6rem;
      font-weight: 800;
      color: #1c1917;
      margin-bottom: 8px;
    }
    .desc {
      font-size: 0.92rem;
      color: #78716c;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .user-context-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      text-align: left;
      margin-bottom: 28px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ctx-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.84rem;
      color: #334155;
    }
    .badge {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.76rem;
    }
    code {
      color: #0284c7;
      font-size: 0.82rem;
    }
    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn-luxury-submit {
      padding: 12px 20px;
      background: linear-gradient(135deg, #1c1917, #292524);
      color: #fef08a;
      border: 1px solid rgba(202, 138, 4, 0.4);
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.92rem;
      transition: all 0.2s ease;
    }
    .btn-luxury-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(28, 25, 23, 0.2);
    }
    .btn-outline {
      padding: 12px 20px;
      background: #ffffff;
      color: #57534e;
      border: 1px solid #d6d3d1;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.92rem;
      transition: all 0.2s ease;
    }
    .btn-outline:hover {
      border-color: #ef4444;
      color: #b91c1c;
    }
  `]
})
export class UnauthorizedComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  navigateToPortal(): void {
    const session = this.authService.currentSession();
    if (!session) {
      this.router.navigate(['/login']);
      return;
    }

    if (session.userType === 'SUPER_ADMIN') {
      this.router.navigate(['/super-admin']);
    } else if (session.userType === 'TENANT_ADMIN' || session.userType === 'TENANT_STAFF') {
      this.router.navigate(['/tenant']);
    } else {
      this.router.navigate(['/customer']);
    }
  }
}

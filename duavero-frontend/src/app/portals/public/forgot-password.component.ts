import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="brand-badge">
            <img src="assets/logo/duavero-interior-icon.svg" alt="DuaVero Icon" class="badge-icon" />
            <span>Account Security</span>
          </div>
          <h2>Reset Your Password</h2>
          <p>Enter your registered email address or mobile phone number to receive a secure password recovery token.</p>
        </div>

        <div *ngIf="errorMessage" class="alert alert-error">
          ⚠️ {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="alert alert-success">
          ✅ {{ successMessage }}
          <div *ngIf="devToken" class="dev-token-box">
            <span><strong>Development Token:</strong> <code>{{ devToken }}</code></span>
            <button type="button" (click)="proceedToReset()" class="btn-use-token">Use Token to Reset →</button>
          </div>
        </div>

        <form (ngSubmit)="handleSubmit()" class="auth-form">
          <div class="form-group">
            <label for="identifier-input">Email Address or Mobile Phone</label>
            <input
              id="identifier-input"
              type="text"
              name="identifier"
              [(ngModel)]="identifier"
              placeholder="e.g. azimk3327@gmail.com or 8650321411"
              required
              class="form-control"
            />
          </div>

          <button
            id="btn-send-reset"
            type="submit"
            [disabled]="loading || !identifier"
            class="btn-luxury-submit"
          >
            <span *ngIf="!loading">Send Reset Instructions →</span>
            <span *ngIf="loading">Processing...</span>
          </button>
        </form>

        <div class="auth-footer">
          <a routerLink="/login" class="back-link">← Return to Sign In</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100vh - 128px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 24px 64px;
    }
    .auth-card {
      max-width: 480px;
      width: 100%;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 24px;
      padding: 38px 40px;
      box-shadow: 0 20px 45px rgba(44, 30, 15, 0.08);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      background: rgba(254, 243, 199, 0.7);
      border: 1px solid rgba(217, 119, 6, 0.25);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 16px;
    }
    .badge-icon {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }
    .auth-header h2 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 8px;
    }
    .auth-header p {
      font-size: 0.88rem;
      color: #78716c;
      line-height: 1.5;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.85rem;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    .dev-token-box {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed rgba(22, 163, 74, 0.3);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dev-token-box code {
      background: #f4f4f5;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.82rem;
      word-break: break-all;
      color: #b45309;
      font-weight: 600;
    }
    .btn-use-token {
      background: #16a34a;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 6px 14px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      align-self: flex-start;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #292524;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .form-control {
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 13px 16px;
      color: #1c1917;
      font-size: 0.94rem;
      outline: none;
      transition: all 0.2s ease;
    }
    .form-control:focus {
      border-color: #ca8a04;
      box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.18);
    }
    .btn-luxury-submit {
      margin-top: 6px;
      padding: 14px;
      background: linear-gradient(135deg, #1c1917, #292524);
      color: #fef08a;
      border: 1px solid rgba(202, 138, 4, 0.4);
      border-radius: 12px;
      font-size: 0.98rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(28, 25, 23, 0.2);
      transition: all 0.2s ease;
    }
    .btn-luxury-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(28, 25, 23, 0.3);
      background: linear-gradient(135deg, #292524, #1c1917);
    }
    .btn-luxury-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .auth-footer {
      margin-top: 24px;
      text-align: center;
      border-top: 1px solid rgba(140, 130, 122, 0.15);
      padding-top: 18px;
    }
    .back-link {
      color: #78716c;
      font-size: 0.86rem;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .back-link:hover {
      color: #b45309;
    }
  `]
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  identifier = '';
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  devToken: string | null = null;

  handleSubmit(): void {
    if (!this.identifier) return;

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.forgotPassword(this.identifier).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'If an account exists, reset instructions have been dispatched.';
        if (res.data?.resetToken) {
          this.devToken = res.data.resetToken;
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to process password reset request.';
      }
    });
  }

  proceedToReset(): void {
    if (this.devToken) {
      this.router.navigate(['/reset-password'], { queryParams: { token: this.devToken } });
    }
  }
}

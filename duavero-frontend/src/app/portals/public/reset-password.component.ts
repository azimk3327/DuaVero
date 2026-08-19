import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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
          <h2>Set New Password</h2>
          <p>Create a strong password of at least 8 characters to secure your DuaVero account.</p>
        </div>

        <div *ngIf="errorMessage" class="alert alert-error">
          ⚠️ {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="alert alert-success">
          ✅ {{ successMessage }}
        </div>

        <form (ngSubmit)="handleSubmit()" class="auth-form">
          <div class="form-group">
            <label for="token-input">Reset Token</label>
            <input
              id="token-input"
              type="text"
              name="token"
              [(ngModel)]="token"
              placeholder="Paste reset token from email"
              required
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="new-pass-input">New Password</label>
            <div class="password-input-wrapper">
              <input
                id="new-pass-input"
                [type]="showPassword ? 'text' : 'password'"
                name="newPassword"
                [(ngModel)]="newPassword"
                placeholder="••••••••••••"
                required
                minlength="8"
                class="form-control"
              />
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="btn-toggle-pwd"
                tabindex="-1"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="confirm-pass-input">Confirm New Password</label>
            <input
              id="confirm-pass-input"
              [type]="showPassword ? 'text' : 'password'"
              name="confirmPassword"
              [(ngModel)]="confirmPassword"
              placeholder="••••••••••••"
              required
              minlength="8"
              class="form-control"
            />
          </div>

          <button
            id="btn-reset-submit"
            type="submit"
            [disabled]="loading || !token || !newPassword || newPassword !== confirmPassword"
            class="btn-luxury-submit"
          >
            <span *ngIf="!loading">Update Password & Sign In →</span>
            <span *ngIf="loading">Updating Password...</span>
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
    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .password-input-wrapper input {
      width: 100%;
      padding-right: 42px;
    }
    .btn-toggle-pwd {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.6;
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
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    const qToken = this.route.snapshot.queryParamMap.get('token');
    if (qToken) {
      this.token = qToken;
    }
  }

  handleSubmit(): void {
    if (!this.token || !this.newPassword) return;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'Password updated successfully! Redirecting to sign in...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Password reset failed. Token may be invalid or expired.';
      }
    });
  }
}

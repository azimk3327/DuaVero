import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-public-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="landing-wrapper">
      <div class="landing-content">
        <!-- Hero Branding Section -->
        <div class="hero-brand">
          <div class="brand-badge">
            <img src="assets/logo/duavero-interior-icon.svg" alt="DuaVero Interior Design Icon" class="badge-icon" />
            <span>Bespoke Furnishing & Interior Studio</span>
          </div>

          <h1 class="main-title">
            DuaVero - <span class="gold-gradient">Custom Furnishing & Interior Solutions</span>
          </h1>

          <p class="hero-description">
            Crafting bespoke luxury furniture, handcrafted upholstery, custom drapery, and architectural interior transformations with precision engineering and timeless elegance.
          </p>
        </div>

        <!-- Luxury Sign In Card -->
        <div class="login-card">
          <div class="card-header">
            <div class="card-icon-wrap">
              <img src="assets/logo/duavero-interior-icon.svg" alt="DuaVero Icon" class="card-icon" />
            </div>
            <h2>Sign In to Your Workspace</h2>
            <p>Access your custom furnishing catalog, client quotations, and interior projects.</p>
          </div>

          <!-- Alert Notifications -->
          <div *ngIf="errorMessage" class="alert alert-error">
            <span>⚠️ {{ errorMessage }}</span>
          </div>

          <div *ngIf="successMessage" class="alert alert-success">
            <span>✅ {{ successMessage }}</span>
          </div>

          <form (ngSubmit)="handleLogin()" class="login-form">
            <div class="form-group">
              <label for="login-identifier">Email Address or Mobile Number</label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  id="login-identifier"
                  type="text"
                  name="identifier"
                  [(ngModel)]="identifier"
                  placeholder="e.g. azimk3327@gmail.com or 8650321411"
                  required
                  class="form-control"
                />
              </div>
            </div>

            <div class="form-group">
              <div class="label-split">
                <label for="login-password">Password</label>
                <a routerLink="/forgot-password" class="link-forgot">Forgot Password?</a>
              </div>
              <div class="input-wrapper">
                <span class="input-icon">🔒</span>
                <input
                  id="login-password"
                  [type]="showPassword ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="password"
                  placeholder="••••••••••••"
                  required
                  class="form-control"
                />
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="btn-toggle-pwd"
                  tabindex="-1"
                  title="Toggle Password Visibility"
                >
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-label">
                <input type="checkbox" name="rememberMe" [(ngModel)]="rememberMe" />
                <span>Remember me on this device</span>
              </label>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              [disabled]="loading || !identifier || !password"
              class="btn-luxury-submit"
            >
              <span *ngIf="!loading">Enter Studio Workspace →</span>
              <span *ngIf="loading">Authenticating...</span>
            </button>
          </form>

          <div class="card-footer">
            <span>Register a new interior or fabrication business? </span>
            <a routerLink="/signup" class="link-register">Start Free Trial →</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-wrapper {
      min-height: calc(100vh - 128px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 24px 64px;
      position: relative;
    }

    .landing-content {
      max-width: 640px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      z-index: 1;
    }

    /* Hero Branding */
    .hero-brand {
      text-align: center;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 18px;
      background: rgba(254, 243, 199, 0.7);
      border: 1px solid rgba(217, 119, 6, 0.25);
      border-radius: 30px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.08);
    }

    .badge-icon {
      width: 22px;
      height: 22px;
      border-radius: 6px;
    }

    .main-title {
      font-size: 2.35rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.2;
      color: #1c1917;
      margin-bottom: 14px;
    }

    .gold-gradient {
      background: linear-gradient(135deg, #b45309, #d97706, #ca8a04);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-description {
      font-size: 1rem;
      color: #57534e;
      line-height: 1.6;
      max-width: 580px;
      margin: 0 auto;
    }

    /* Luxury Login Card */
    .login-card {
      width: 100%;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 24px;
      padding: 38px 40px;
      box-shadow: 
        0 20px 45px rgba(44, 30, 15, 0.08),
        0 4px 12px rgba(44, 30, 15, 0.03);
      position: relative;
    }

    .card-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .card-icon-wrap {
      width: 52px;
      height: 52px;
      margin: 0 auto 14px;
      border-radius: 14px;
      padding: 2px;
      background: linear-gradient(135deg, #eab308, #ca8a04, #854d0e);
      box-shadow: 0 4px 12px rgba(202, 138, 4, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon {
      width: 100%;
      height: 100%;
      border-radius: 12px;
    }

    .card-header h2 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 6px;
    }

    .card-header p {
      font-size: 0.88rem;
      color: #78716c;
      line-height: 1.5;
    }

    /* Alerts */
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

    /* Form Styles */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .label-split {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-group label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #292524;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .link-forgot {
      font-size: 0.8rem;
      color: #b45309;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .link-forgot:hover {
      color: #ca8a04;
      text-decoration: underline;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      font-size: 0.95rem;
      color: #a8a29e;
      pointer-events: none;
    }

    .form-control {
      width: 100%;
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 13px 44px 13px 42px;
      color: #1c1917;
      font-size: 0.94rem;
      outline: none;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(44, 30, 15, 0.03);
    }

    .form-control:focus {
      border-color: #ca8a04;
      box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.18);
    }

    .form-control::placeholder {
      color: #a8a29e;
    }

    .btn-toggle-pwd {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.6;
      transition: opacity 0.15s ease;
    }

    .btn-toggle-pwd:hover {
      opacity: 1;
    }

    .form-options {
      display: flex;
      align-items: center;
      margin-top: -2px;
    }

    .remember-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #57534e;
      cursor: pointer;
    }

    .remember-label input[type="checkbox"] {
      accent-color: #b45309;
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }

    /* Luxury Submit Button */
    .btn-luxury-submit {
      margin-top: 6px;
      padding: 14px;
      background: linear-gradient(135deg, #1c1917, #292524);
      color: #fef08a;
      border: 1px solid rgba(202, 138, 4, 0.4);
      border-radius: 12px;
      font-size: 0.98rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(28, 25, 23, 0.2);
      transition: all 0.2s ease;
    }

    .btn-luxury-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(28, 25, 23, 0.3);
      background: linear-gradient(135deg, #292524, #1c1917);
      border-color: #eab308;
    }

    .btn-luxury-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .card-footer {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid rgba(140, 130, 122, 0.15);
      text-align: center;
      font-size: 0.86rem;
      color: #78716c;
    }

    .link-register {
      color: #b45309;
      font-weight: 700;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .link-register:hover {
      color: #ca8a04;
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .main-title {
        font-size: 1.85rem;
      }
      .login-card {
        padding: 28px 20px;
      }
    }
  `]
})
export class PublicPortalComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  identifier = '';
  password = '';
  showPassword = false;
  rememberMe = true;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const session = this.authService.currentSession();
      if (session?.userType === 'SUPER_ADMIN' || session?.email.toLowerCase() === 'azimk3327@gmail.com') {
        this.router.navigate(['/super-admin']);
      } else if (session?.userType === 'TENANT_ADMIN' || session?.userType === 'TENANT_STAFF') {
        this.router.navigate(['/tenant']);
      }
    }
  }

  handleLogin(): void {
    if (!this.identifier || !this.password) return;

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const trimmedIdent = this.identifier.trim();

    this.authService.login(trimmedIdent, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          const user = res.data.user;
          this.successMessage = `Welcome, ${user.firstName || user.email}! Entering workspace...`;

          setTimeout(() => {
            // Strict Condition: If authenticated email is azimk3327@gmail.com or userType is SUPER_ADMIN
            if (user.email.toLowerCase() === 'azimk3327@gmail.com' || user.userType === 'SUPER_ADMIN') {
              this.router.navigate(['/super-admin']);
            } else if (user.userType === 'TENANT_ADMIN' || user.userType === 'TENANT_STAFF') {
              this.router.navigate(['/tenant']);
            } else {
              this.router.navigate(['/customer']);
            }
          }, 400);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Authentication failure:', err);
        this.errorMessage = err.error?.message || 'Invalid email/mobile number or password. Please try again.';
      }
    });
  }
}

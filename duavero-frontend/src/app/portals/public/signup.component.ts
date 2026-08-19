import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="signup-card">
        <div class="auth-header">
          <div class="brand-badge">
            <img src="assets/logo/duavero-interior-icon.svg" alt="DuaVero Icon" class="badge-icon" />
            <span>Business Onboarding</span>
          </div>
          <h2>Launch Your Furnishing Studio Workspace</h2>
          <p>Register your bespoke furnishing, fabrication, or architectural interior studio to access instant estimates and project management.</p>
        </div>

        <div *ngIf="errorMessage" class="alert alert-error">
          ⚠️ {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="alert alert-success">
          ✅ {{ successMessage }}
        </div>

        <form (ngSubmit)="handleSignup()" class="signup-form">
          <div class="section-title">🏢 Studio & Business Information</div>
          <div class="form-grid">
            <div class="form-group">
              <label for="biz-name">Business Name *</label>
              <input
                id="biz-name"
                type="text"
                name="businessName"
                [(ngModel)]="businessName"
                (ngModelChange)="generateSlug()"
                placeholder="e.g. Royal Sofa & Furnishings"
                required
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="biz-slug">Subdomain Workspace Slug *</label>
              <div class="slug-input-wrapper">
                <input
                  id="biz-slug"
                  type="text"
                  name="slug"
                  [(ngModel)]="slug"
                  placeholder="royal-sofa"
                  required
                  class="form-control slug-input"
                />
                <span class="slug-suffix">.duavero.com</span>
              </div>
            </div>

            <div class="form-group">
              <label for="biz-email">Studio Email *</label>
              <input
                id="biz-email"
                type="email"
                name="contactEmail"
                [(ngModel)]="contactEmail"
                placeholder="studio@royalsofa.com"
                required
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="biz-phone">Studio Phone *</label>
              <input
                id="biz-phone"
                type="text"
                name="contactPhone"
                [(ngModel)]="contactPhone"
                placeholder="+91 98888 88888"
                required
                class="form-control"
              />
            </div>
          </div>

          <div class="section-title" style="margin-top: 16px;">👤 Business Owner / Principal Account</div>
          <div class="form-grid">
            <div class="form-group">
              <label for="first-name">First Name *</label>
              <input
                id="first-name"
                type="text"
                name="ownerFirstName"
                [(ngModel)]="ownerFirstName"
                placeholder="Rajesh"
                required
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="last-name">Last Name *</label>
              <input
                id="last-name"
                type="text"
                name="ownerLastName"
                [(ngModel)]="ownerLastName"
                placeholder="Sharma"
                required
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="owner-email">Owner Login Email *</label>
              <input
                id="owner-email"
                type="email"
                name="ownerEmail"
                [(ngModel)]="ownerEmail"
                placeholder="owner@royalsofa.com"
                required
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="owner-phone">Owner Mobile</label>
              <input
                id="owner-phone"
                type="text"
                name="ownerPhone"
                [(ngModel)]="ownerPhone"
                placeholder="9888888888"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-grid" style="margin-top: 4px;">
            <div class="form-group">
              <label for="pwd-input">Create Password *</label>
              <input
                id="pwd-input"
                type="password"
                name="password"
                [(ngModel)]="password"
                placeholder="••••••••••••"
                required
                minlength="8"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="package-select">Initial Plan</label>
              <select id="package-select" name="packageCode" [(ngModel)]="packageCode" class="form-control">
                <option value="STARTER">Starter Studio (₹1,499/mo)</option>
                <option value="PROFESSIONAL">Professional Furnishing (₹2,999/mo)</option>
                <option value="BUSINESS">Enterprise Interior (₹5,999/mo)</option>
              </select>
            </div>
          </div>

          <button
            id="btn-signup-submit"
            type="submit"
            [disabled]="loading || !businessName || !slug || !contactEmail || !ownerEmail || !password"
            class="btn-luxury-submit"
          >
            <span *ngIf="!loading">Create Studio Workspace →</span>
            <span *ngIf="loading">Creating Workspace...</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>Already have a DuaVero workspace? </span>
          <a routerLink="/login" class="login-link">Sign In</a>
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
    .signup-card {
      max-width: 720px;
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
      font-size: 1.55rem;
      font-weight: 800;
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
    .section-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: #854d0e;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(140, 130, 122, 0.15);
      padding-bottom: 6px;
    }
    .signup-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #292524;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .slug-input-wrapper {
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      overflow: hidden;
    }
    .slug-input {
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
      flex: 1;
    }
    .slug-suffix {
      padding: 0 12px;
      font-size: 0.82rem;
      color: #a8a29e;
      font-weight: 500;
    }
    .form-control {
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 11px 14px;
      color: #1c1917;
      font-size: 0.92rem;
      outline: none;
      transition: all 0.2s ease;
    }
    .form-control:focus {
      border-color: #ca8a04;
      box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.18);
    }
    .btn-luxury-submit {
      margin-top: 14px;
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
      font-size: 0.88rem;
      color: #78716c;
    }
    .login-link {
      color: #b45309;
      text-decoration: none;
      font-weight: 700;
    }
    .login-link:hover {
      text-decoration: underline;
    }
  `]
})
export class SignUpComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  businessName = '';
  slug = '';
  contactEmail = '';
  contactPhone = '';
  ownerFirstName = '';
  ownerLastName = '';
  ownerEmail = '';
  ownerPhone = '';
  password = '';
  packageCode = 'STARTER';

  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  generateSlug(): void {
    if (this.businessName && !this.slug) {
      this.slug = this.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }

  handleSignup(): void {
    if (!this.businessName || !this.slug || !this.contactEmail || !this.ownerEmail || !this.password) return;

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.signup({
      businessName: this.businessName,
      slug: this.slug,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      ownerFirstName: this.ownerFirstName,
      ownerLastName: this.ownerLastName,
      ownerEmail: this.ownerEmail,
      ownerPhone: this.ownerPhone,
      password: this.password,
      packageCode: this.packageCode
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.successMessage = 'Studio workspace created successfully! Launching tenant portal...';
          setTimeout(() => {
            this.router.navigate(['/tenant']);
          }, 800);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Studio registration failed. Please review the form.';
      }
    });
  }
}

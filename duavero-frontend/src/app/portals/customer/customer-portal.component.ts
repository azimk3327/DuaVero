import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-customer-portal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-boxed" style="padding-top: 32px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 700;">Customer Self-Service Portal</h1>
          <p style="color: var(--color-text-secondary); font-size: 0.9rem;">
            Review customized quotes, track orders, and pay tax invoices securely
          </p>
        </div>
        <button (click)="logout()" class="btn btn-secondary" style="font-size: 0.85rem;">
          Sign Out
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1.1rem; font-weight: 600;">My Quotations</h3>
            <span class="badge badge-warning">1 Pending</span>
          </div>
          <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 16px;">
            Quote #QT-2026-0089: Royal 3-Seater Sofa Customization (₹45,000.00)
          </p>
          <button class="btn btn-primary" style="width: 100%; font-size: 0.875rem;">
            Review & Approve Quote
          </button>
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1.1rem; font-weight: 600;">My Invoices</h3>
            <span class="badge badge-success">Paid</span>
          </div>
          <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 16px;">
            Invoice #INV-2026-0042: Advance Payment Received
          </p>
          <button class="btn btn-secondary" style="width: 100%; font-size: 0.875rem;">
            Download Receipt PDF
          </button>
        </div>
      </div>
    </div>
  `
})
export class CustomerPortalComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/public']);
  }
}

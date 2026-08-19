import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="visible"
      class="toast"
      [ngClass]="'toast-' + type"
    >
      <span>{{ message }}</span>
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      z-index: 1100;
      animation: slideUp 200ms ease-out;
    }
    .toast-success { background: var(--status-success); color: #ffffff; }
    .toast-error { background: var(--status-error); color: #ffffff; }
    .toast-warning { background: var(--status-warning); color: #ffffff; }
    .toast-info { background: var(--status-info); color: #ffffff; }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  @Input() message = '';
  @Input() type: ToastType = 'info';
  @Input() visible = false;
}

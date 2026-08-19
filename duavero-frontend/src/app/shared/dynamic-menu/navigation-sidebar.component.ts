import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
  label: string;
  route: string;
  icon?: string;
  badge?: string;
  requiredPermission?: string;
}

@Component({
  selector: 'app-navigation-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="sidebar">
      <div style="padding: 12px 8px; margin-bottom: 8px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.02em;">
          {{ title }}
        </h2>
        <p *ngIf="subtitle" style="font-size: 0.8rem; color: var(--color-text-muted);">{{ subtitle }}</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <a
          *ngFor="let item of items"
          [routerLink]="item.route"
          routerLinkActive="active-link"
          [routerLinkActiveOptions]="{ exact: false }"
          class="nav-item"
        >
          <span *ngIf="item.icon" style="font-size: 1rem;">{{ item.icon }}</span>
          <span style="flex: 1;">{{ item.label }}</span>
          <span *ngIf="item.badge" class="badge badge-info">{{ item.badge }}</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      color: var(--color-text-secondary);
      text-decoration: none;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 500;
      transition: all var(--transition-fast);
    }
    .nav-item:hover {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
    }
    .active-link {
      background: var(--brand-primary-glow);
      color: var(--brand-primary);
      font-weight: 600;
      border-left: 3px solid var(--brand-primary);
    }
  `]
})
export class NavigationSidebarComponent {
  @Input() title: string = 'Navigation';
  @Input() subtitle?: string;
  @Input() items: MenuItem[] = [];
}

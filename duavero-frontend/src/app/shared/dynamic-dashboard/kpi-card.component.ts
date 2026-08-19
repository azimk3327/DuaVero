import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.825rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">
          {{ title }}
        </span>
        <span *ngIf="icon" style="font-size: 1.25rem;">{{ icon }}</span>
      </div>

      <div style="font-size: 1.75rem; font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.03em;">
        {{ value }}
      </div>

      <div *ngIf="trendText" style="font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
        <span [ngClass]="trendPositive ? 'badge badge-success' : 'badge badge-error'">
          {{ trendText }}
        </span>
        <span style="color: var(--color-text-muted);">vs last month</span>
      </div>
    </div>
  `
})
export class KpiCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input() icon?: string;
  @Input() trendText?: string;
  @Input() trendPositive: boolean = true;
}

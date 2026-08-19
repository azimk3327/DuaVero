import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="close()">
      <div class="modal-dialog card" (click)="$event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.2rem; font-weight: 700;">{{ title }}</h3>
          <button (click)="close()" style="background: none; border: none; color: var(--color-text-secondary); font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        <div style="margin-bottom: 20px;">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 150ms ease-out;
    }
    .modal-dialog {
      width: 90%;
      max-width: 550px;
      max-height: 90vh;
      overflow-y: auto;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Dialog';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }
}

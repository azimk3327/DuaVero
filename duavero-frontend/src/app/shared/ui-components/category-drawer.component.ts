import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '@core/services/i18n.service';

export interface CategoryFormData {
  id?: number;
  parentId?: number | null;
  code: string;
  name: string;
  hsnCode?: string;
  defaultTaxRate?: number;
  industryType?: string;
  sortOrder?: number;
  description?: string;
  active: boolean;
  selectedAttributeIds?: number[];
}

export interface AttributeOption {
  id: number;
  code: string;
  name: string;
  dataType: string;
}

@Component({
  selector: 'app-category-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="drawer-backdrop" (click)="onBackdropClick($event)">
      <aside class="drawer-panel">
        <header class="drawer-header">
          <div class="header-titles">
            <span class="drawer-badge">{{ formData.id ? 'UPDATE' : 'CREATE' }}</span>
            <h2 class="drawer-title">
              {{ formData.id ? i18n.t('CATEGORIES.DRAWER_EDIT_TITLE') : i18n.t('CATEGORIES.DRAWER_CREATE_TITLE') }}
            </h2>
            <p class="drawer-subtitle">{{ i18n.t('CATEGORIES.SUBTITLE') }}</p>
          </div>
          <button type="button" (click)="close.emit()" class="btn-close-drawer" aria-label="Close">✕</button>
        </header>

        <form (ngSubmit)="onSubmit()" class="drawer-form">
          <div class="drawer-body">
            <!-- Row 1: Name & Code -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">{{ i18n.t('CATEGORIES.NAME') }} <span class="req">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  name="name"
                  required
                  placeholder="e.g. Acoustic Wall Paneling"
                  class="form-input"
                />
              </div>

              <div class="form-group flex-1">
                <label class="form-label">{{ i18n.t('CATEGORIES.CODE') }} <span class="req">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="formData.code"
                  name="code"
                  required
                  placeholder="e.g. WALL_PANEL_ACOUSTIC"
                  class="form-input mono"
                  [disabled]="!!formData.id"
                />
              </div>
            </div>

            <!-- Row 2: Parent Category & Industry -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">{{ i18n.t('CATEGORIES.PARENT') }}</label>
                <select [(ngModel)]="formData.parentId" name="parentId" class="form-select">
                  <option [ngValue]="null">— None (Top-Level Category) —</option>
                  <option *ngFor="let parent of parentCategories" [ngValue]="parent.id">
                    {{ parent.name }} ({{ parent.code }})
                  </option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">Industry Sector</label>
                <select [(ngModel)]="formData.industryType" name="industryType" class="form-select">
                  <option value="FURNISHING">Furnishing & Upholstery</option>
                  <option value="INTERIOR">Interior Architecture & Decor</option>
                  <option value="HARDWARE">Hardware & Fittings</option>
                  <option value="COMMERCIAL">Commercial Office Furnishing</option>
                </select>
              </div>
            </div>

            <!-- Row 3: HSN Code & Tax Slab -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">{{ i18n.t('CATEGORIES.HSN') }}</label>
                <input
                  type="text"
                  [(ngModel)]="formData.hsnCode"
                  name="hsnCode"
                  placeholder="e.g. 9401 / 9403"
                  class="form-input mono"
                />
              </div>

              <div class="form-group flex-1">
                <label class="form-label">{{ i18n.t('CATEGORIES.TAX_SLAB') }}</label>
                <select [(ngModel)]="formData.defaultTaxRate" name="defaultTaxRate" class="form-select">
                  <option [ngValue]="18">18% GST (Standard Industrial)</option>
                  <option [ngValue]="12">12% GST (Processed Materials)</option>
                  <option [ngValue]="5">5% GST (Essential)</option>
                  <option [ngValue]="28">28% GST (Luxury)</option>
                  <option [ngValue]="0">0% GST (Exempt)</option>
                </select>
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">{{ i18n.t('CATEGORIES.DESCRIPTION') }}</label>
              <textarea
                [(ngModel)]="formData.description"
                name="description"
                rows="3"
                placeholder="Industrial specifications, scope of application, fabrication rules..."
                class="form-textarea"
              ></textarea>
            </div>

            <!-- Dynamic Custom Attributes multi-select chips -->
            <div class="form-group" *ngIf="availableAttributes?.length">
              <label class="form-label">{{ i18n.t('CATEGORIES.CUSTOM_ATTRIBUTES') }}</label>
              <div class="attribute-chips-container">
                <button
                  type="button"
                  *ngFor="let attr of availableAttributes"
                  (click)="toggleAttribute(attr.id)"
                  class="attr-chip"
                  [class.selected]="isAttributeSelected(attr.id)"
                >
                  <span class="attr-chip-icon">{{ isAttributeSelected(attr.id) ? '✓' : '+' }}</span>
                  <span class="attr-chip-text">{{ attr.name }}</span>
                  <code class="attr-chip-code">({{ attr.dataType }})</code>
                </button>
              </div>
            </div>

            <!-- Status Toggle -->
            <div class="form-row status-row">
              <div class="status-info">
                <span class="form-label" style="margin: 0;">{{ i18n.t('CATEGORIES.ACTIVE_STATUS') }}</span>
                <span class="status-desc">Active categories are accessible in quotations and catalog selectors.</span>
              </div>
              <label class="switch">
                <input type="checkbox" [(ngModel)]="formData.active" name="active" />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <footer class="drawer-footer">
            <button type="button" (click)="close.emit()" class="btn-cancel">
              {{ i18n.t('COMMON.CANCEL') }}
            </button>
            <button type="submit" [disabled]="!formData.name || !formData.code" class="btn-save">
              💾 {{ i18n.t('COMMON.SAVE') }}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(12px);
      display: flex;
      justify-content: flex-end;
      z-index: 1050;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .drawer-panel {
      width: 100%;
      max-width: 580px;
      height: 100vh;
      background: #0f172a;
      border-left: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      flex-direction: column;
      box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6);
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .drawer-header {
      padding: 24px 28px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: rgba(30, 41, 59, 0.4);
    }

    .drawer-badge {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 6px;
    }

    .drawer-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0 0 4px;
    }

    .drawer-subtitle {
      font-size: 0.82rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.4;
    }

    .btn-close-drawer {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .btn-close-drawer:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .drawer-form {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .flex-1 {
      flex: 1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .req {
      color: #f87171;
    }

    .form-input, .form-select, .form-textarea {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 10px 14px;
      color: #f8fafc;
      font-size: 0.88rem;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }

    .form-input.mono {
      font-family: monospace;
      font-weight: 600;
      color: #38bdf8;
    }

    .attribute-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      background: rgba(15, 23, 42, 0.6);
      padding: 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      max-height: 140px;
      overflow-y: auto;
    }

    .attr-chip {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .attr-chip:hover {
      background: rgba(56, 189, 248, 0.1);
      border-color: #38bdf8;
    }

    .attr-chip.selected {
      background: rgba(59, 130, 246, 0.2);
      border-color: #60a5fa;
      color: #93c5fd;
      font-weight: 700;
    }

    .attr-chip-icon {
      font-weight: 800;
    }

    .attr-chip-code {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(30, 41, 59, 0.4);
      padding: 14px 18px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .status-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-desc {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: #334155;
      transition: 0.2s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.2s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #22c55e;
    }

    input:checked + .slider:before {
      transform: translateX(20px);
    }

    .drawer-footer {
      padding: 18px 28px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(30, 41, 59, 0.4);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-cancel:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .btn-save {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border: none;
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
      transition: all 0.15s ease;
    }

    .btn-save:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(59, 130, 246, 0.5);
    }

    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class CategoryDrawerComponent {
  readonly i18n = inject(I18nService);

  @Input() formData: CategoryFormData = {
    code: '',
    name: '',
    industryType: 'FURNISHING',
    defaultTaxRate: 18,
    sortOrder: 10,
    active: true,
    selectedAttributeIds: []
  };

  @Input() parentCategories: any[] = [];
  @Input() availableAttributes: AttributeOption[] = [];

  @Output() save = new EventEmitter<CategoryFormData>();
  @Output() close = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('drawer-backdrop')) {
      this.close.emit();
    }
  }

  isAttributeSelected(attrId: number): boolean {
    return !!this.formData.selectedAttributeIds?.includes(attrId);
  }

  toggleAttribute(attrId: number): void {
    if (!this.formData.selectedAttributeIds) {
      this.formData.selectedAttributeIds = [];
    }
    const idx = this.formData.selectedAttributeIds.indexOf(attrId);
    if (idx >= 0) {
      this.formData.selectedAttributeIds.splice(idx, 1);
    } else {
      this.formData.selectedAttributeIds.push(attrId);
    }
  }

  onSubmit(): void {
    if (this.formData.name && this.formData.code) {
      this.save.emit(this.formData);
    }
  }
}

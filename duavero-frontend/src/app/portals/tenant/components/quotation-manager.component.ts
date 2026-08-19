import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '@core/services/i18n.service';
import { AuthService } from '@core/services/auth.service';
import { ApiResponse } from '@core/services/api.service';

export interface QuotationItemDto {
  id?: number;
  itemType: string;
  productId?: number;
  itemName: string;
  hsnCode?: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  discountPercentage: number;
  taxRatePercentage: number;
  totalPrice?: number;
}

export interface QuotationDto {
  id: number;
  organizationId: number;
  customerId: number;
  customerName: string;
  quotationNumber: string;
  revisionNumber: number;
  status: string;
  issueDate: string;
  validUntilDate: string;
  subtotalAmount: number;
  discountAmount: number;
  discountPercentage: number;
  discountApprovalReason?: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  taxAmount: number;
  totalAmount: number;
  advanceRequiredPercentage: number;
  advanceAmountDue: number;
  remainingBalanceAmount: number;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  items: QuotationItemDto[];
}

@Component({
  selector: 'app-quotation-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quotation-wrapper">
      <!-- Section Header -->
      <div class="section-toolbar">
        <div>
          <h3 class="section-title">📝 {{ i18n.t('QUOTATIONS.TITLE') }}</h3>
          <p class="section-subtitle">{{ i18n.t('QUOTATIONS.SUBTITLE') }}</p>
        </div>
        <button
          *ngIf="canCreateQuotes()"
          (click)="openCreateModal()"
          class="btn-action primary"
        >
          {{ i18n.t('QUOTATIONS.CREATE_BTN') }}
        </button>
      </div>

      <!-- Navigation Tabs (All Quotations vs Approval Queue) -->
      <div class="sub-nav">
        <button
          (click)="activeTab = 'all'"
          [class.active]="activeTab === 'all'"
          class="sub-tab"
        >
          📁 {{ i18n.t('QUOTATIONS.TAB_ALL') }} ({{ quotations.length }})
        </button>

        <button
          *ngIf="canApproveQuotes()"
          (click)="activeTab = 'approvals'; loadPendingApprovals()"
          [class.active]="activeTab === 'approvals'"
          class="sub-tab warning"
        >
          ⏳ {{ i18n.t('QUOTATIONS.TAB_APPROVALS') }}
          <span *ngIf="pendingApprovals.length" class="counter-badge">{{ pendingApprovals.length }}</span>
        </button>
      </div>

      <!-- Notifications -->
      <div *ngIf="alertMessage" class="alert-box" [ngClass]="alertType === 'error' ? 'alert-error' : 'alert-success'">
        <span>{{ alertType === 'error' ? '⚠️' : '✅' }} {{ alertMessage }}</span>
        <button (click)="alertMessage = null" class="btn-close-alert">×</button>
      </div>

      <!-- TAB 1: ALL QUOTATIONS TABLE -->
      <div *ngIf="activeTab === 'all'" class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ i18n.t('QUOTATIONS.QUOTE_NUM') }}</th>
              <th>{{ i18n.t('QUOTATIONS.CUSTOMER') }}</th>
              <th>{{ i18n.t('COMMON.SUBTOTAL') }}</th>
              <th>{{ i18n.t('COMMON.DISCOUNT') }}</th>
              <th>{{ i18n.t('COMMON.GRAND_TOTAL') }}</th>
              <th>{{ i18n.t('COMMON.STATUS') }}</th>
              <th>{{ i18n.t('COMMON.ACTIONS') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let q of quotations">
              <td>
                <strong class="quote-number">{{ q.quotationNumber }}</strong>
                <div class="quote-date">{{ q.issueDate }} (Rev. {{ q.revisionNumber }})</div>
              </td>
              <td>
                <span class="customer-name">{{ q.customerName || 'Client #' + q.customerId }}</span>
              </td>
              <td>₹{{ q.subtotalAmount | number:'1.2-2' }}</td>
              <td>
                <span *ngIf="q.discountPercentage > 0" class="discount-pill" [class.high]="q.discountPercentage > 20">
                  {{ q.discountPercentage }}% (₹{{ q.discountAmount | number:'1.2-2' }})
                </span>
                <span *ngIf="!q.discountPercentage || q.discountPercentage === 0" style="color: #64748b;">—</span>
              </td>
              <td>
                <strong class="total-amount">₹{{ q.totalAmount | number:'1.2-2' }}</strong>
                <div class="advance-tag">Adv: ₹{{ q.advanceAmountDue | number:'1.2-2' }}</div>
              </td>
              <td>
                <span class="status-badge" [ngClass]="getStatusClass(q.status)">
                  {{ q.status }}
                </span>
              </td>
              <td>
                <button (click)="viewQuoteDetails(q)" class="btn-table-action">
                  👁️ View
                </button>
              </td>
            </tr>
            <tr *ngIf="!quotations.length">
              <td colspan="7" class="empty-cell">
                No quotations found. Click "+ Create Quotation" to draft your first estimate.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB 2: MANAGER APPROVAL QUEUE -->
      <div *ngIf="activeTab === 'approvals'" class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Quote #</th>
              <th>Customer</th>
              <th>Requested Discount</th>
              <th>Mandatory Justification Reason</th>
              <th>Grand Total</th>
              <th>Manager Decision</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pendingApprovals" class="pending-row">
              <td>
                <strong class="quote-number">{{ p.quotationNumber }}</strong>
                <div class="quote-date">{{ p.issueDate }}</div>
              </td>
              <td><strong>{{ p.customerName || 'Client #' + p.customerId }}</strong></td>
              <td>
                <span class="discount-pill high">
                  ⚠️ {{ p.discountPercentage }}% (₹{{ p.discountAmount | number:'1.2-2' }})
                </span>
              </td>
              <td style="max-width: 280px;">
                <div class="reason-quote">
                  "{{ p.discountApprovalReason || 'No justification provided' }}"
                </div>
              </td>
              <td>
                <strong class="total-amount">₹{{ p.totalAmount | number:'1.2-2' }}</strong>
              </td>
              <td>
                <div class="action-buttons-group">
                  <button (click)="approveDiscount(p)" class="btn-approve">
                    {{ i18n.t('QUOTATIONS.APPROVE_ACTION') }}
                  </button>
                  <button (click)="rejectDiscount(p)" class="btn-reject">
                    {{ i18n.t('QUOTATIONS.REJECT_ACTION') }}
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!pendingApprovals.length">
              <td colspan="6" class="empty-cell">
                🎉 {{ i18n.t('QUOTATIONS.APPROVAL_QUEUE_EMPTY') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- CREATE QUOTATION MODAL -->
      <div *ngIf="showCreateModal" class="modal-overlay">
        <div class="modal-card wide">
          <div class="modal-header">
            <h3>{{ i18n.t('QUOTATIONS.CREATE_BTN') }}</h3>
            <button (click)="showCreateModal = false" class="btn-close">✕</button>
          </div>

          <form (ngSubmit)="handleCreateQuotation()" class="quote-form">
            <div class="form-grid-3">
              <div class="form-group">
                <label>Customer / Client *</label>
                <select [(ngModel)]="selectedCustomerId" name="customerId" required class="form-control">
                  <option [ngValue]="1">Deepak Sharma (Villa 4B)</option>
                  <option [ngValue]="2">Meera Rajput (Penthouse Decor)</option>
                  <option [ngValue]="3">Grand Horizon Banquet Suites</option>
                  <option [ngValue]="4">Apex Tech Park Commercial Lounge</option>
                </select>
              </div>

              <div class="form-group">
                <label>Advance Required (%)</label>
                <input type="number" [(ngModel)]="advancePercentage" name="advancePercentage" (input)="recalculatePreview()" class="form-control" />
              </div>

              <div class="form-group">
                <label>{{ i18n.t('QUOTATIONS.DISCOUNT_PCT') }}</label>
                <input
                  type="number"
                  [(ngModel)]="headerDiscountPercentage"
                  name="headerDiscountPercentage"
                  (input)="recalculatePreview()"
                  placeholder="0.00"
                  class="form-control"
                  [class.input-warning]="headerDiscountPercentage > 20"
                />
              </div>
            </div>

            <!-- DYNAMIC LINE ITEMS TABLE -->
            <div class="items-section">
              <div class="items-header">
                <h4>Line Items & Materials</h4>
                <button type="button" (click)="addItemRow()" class="btn-add-row">+ Add Item</button>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item Description *</th>
                    <th>HSN</th>
                    <th>Unit Price (₹) *</th>
                    <th>Qty *</th>
                    <th>Tax %</th>
                    <th>Line Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of draftItems; let idx = index">
                    <td>
                      <input type="text" [(ngModel)]="item.itemName" [name]="'name_' + idx" required placeholder="e.g. 3-Seater Chesterfield Sofa (Italian Leather)" class="item-input" />
                    </td>
                    <td>
                      <input type="text" [(ngModel)]="item.hsnCode" [name]="'hsn_' + idx" placeholder="9401" style="width: 70px;" class="item-input mono" />
                    </td>
                    <td>
                      <input type="number" [(ngModel)]="item.unitPrice" [name]="'price_' + idx" required (input)="recalculatePreview()" style="width: 100px;" class="item-input" />
                    </td>
                    <td>
                      <input type="number" [(ngModel)]="item.quantity" [name]="'qty_' + idx" required (input)="recalculatePreview()" style="width: 60px;" class="item-input" />
                    </td>
                    <td>
                      <select [(ngModel)]="item.taxRatePercentage" [name]="'tax_' + idx" (change)="recalculatePreview()" class="item-select">
                        <option [ngValue]="18">18%</option>
                        <option [ngValue]="12">12%</option>
                        <option [ngValue]="5">5%</option>
                        <option [ngValue]="0">0%</option>
                      </select>
                    </td>
                    <td class="line-total-cell">
                      ₹{{ (item.unitPrice * item.quantity * (1 + item.taxRatePercentage / 100)) | number:'1.2-2' }}
                    </td>
                    <td>
                      <button type="button" (click)="removeItemRow(idx)" class="btn-remove-row" [disabled]="draftItems.length === 1">✕</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- MANDATORY DISCOUNT REASON PROMPT IF > 20% -->
            <div *ngIf="headerDiscountPercentage > 20" class="discount-alert-card">
              <div class="alert-badge">⚠️ {{ i18n.t('QUOTATIONS.DISCOUNT_WARNING_TITLE') }}</div>
              <p class="alert-desc">
                {{ i18n.t('QUOTATIONS.DISCOUNT_WARNING_MSG').replace('{pct}', '' + headerDiscountPercentage) }}
              </p>
              <div class="form-group" style="margin-top: 10px;">
                <label style="color: #fbbf24; font-weight: 700;">
                  {{ i18n.t('QUOTATIONS.DISCOUNT_REASON_LABEL') }} <span class="req">*</span>
                </label>
                <textarea
                  [(ngModel)]="discountApprovalReason"
                  name="discountApprovalReason"
                  required
                  rows="2"
                  [placeholder]="i18n.t('QUOTATIONS.DISCOUNT_REASON_PLACEHOLDER')"
                  class="form-control"
                  style="border-color: #f59e0b;"
                ></textarea>
              </div>
            </div>

            <!-- FINANCIAL SUMMARY CARD -->
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-line">
                  <span>{{ i18n.t('COMMON.SUBTOTAL') }}:</span>
                  <span>₹{{ previewSubtotal | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line" *ngIf="headerDiscountPercentage > 0">
                  <span style="color: #f87171;">Discount ({{ headerDiscountPercentage }}%):</span>
                  <span style="color: #f87171;">-₹{{ previewDiscountAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line">
                  <span>GST Tax (Est.):</span>
                  <span>+₹{{ previewTaxAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line total">
                  <span>{{ i18n.t('COMMON.GRAND_TOTAL') }}:</span>
                  <span class="total-val">₹{{ previewTotalAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line advance">
                  <span>Advance Due ({{ advancePercentage }}%):</span>
                  <span>₹{{ previewAdvanceDue | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="showCreateModal = false" class="btn-secondary">
                {{ i18n.t('COMMON.CANCEL') }}
              </button>
              <button
                type="submit"
                [disabled]="!draftItems.length || (headerDiscountPercentage > 20 && !discountApprovalReason)"
                class="btn-primary"
              >
                🚀 Generate Quotation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quotation-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0 0 4px;
    }

    .section-subtitle {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0;
    }

    .btn-action.primary {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 10px 18px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    }

    .sub-nav {
      display: flex;
      gap: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
    }

    .sub-tab {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.88rem;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sub-tab:hover {
      color: #f1f5f9;
      background: rgba(255, 255, 255, 0.04);
    }

    .sub-tab.active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      font-weight: 700;
    }

    .sub-tab.warning.active {
      color: #fbbf24;
      background: rgba(245, 158, 11, 0.15);
    }

    .counter-badge {
      background: #ef4444;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 10px;
    }

    .table-container {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.86rem;
    }

    .data-table th {
      background: rgba(15, 23, 42, 0.6);
      padding: 12px 16px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      text-align: left;
    }

    .data-table td {
      padding: 14px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      color: #f1f5f9;
    }

    .quote-number {
      font-family: monospace;
      color: #38bdf8;
      font-weight: 700;
    }

    .quote-date {
      font-size: 0.74rem;
      color: #94a3b8;
    }

    .customer-name {
      font-weight: 600;
    }

    .discount-pill {
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .discount-pill.high {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .total-amount {
      color: #38bdf8;
      font-size: 0.95rem;
    }

    .advance-tag {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .status-badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .badge-approved { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-draft { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
    .badge-rejected { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    .btn-table-action {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }

    .reason-quote {
      font-style: italic;
      color: #cbd5e1;
      background: rgba(15, 23, 42, 0.4);
      padding: 6px 10px;
      border-radius: 6px;
      border-left: 2px solid #f59e0b;
      font-size: 0.8rem;
    }

    .action-buttons-group {
      display: flex;
      gap: 8px;
    }

    .btn-approve {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #4ade80;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-approve:hover {
      background: #22c55e;
      color: #000;
    }

    .btn-reject {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #f87171;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }

    .empty-cell {
      text-align: center;
      color: #94a3b8;
      padding: 30px;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: 20px;
    }

    .modal-card.wide {
      max-width: 860px;
      width: 100%;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 26px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-header h3 {
      font-size: 1.3rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #cbd5e1;
    }

    .form-control {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 9px 12px;
      color: #f8fafc;
      font-size: 0.86rem;
      outline: none;
    }

    .input-warning {
      border-color: #f59e0b !important;
      color: #fbbf24 !important;
    }

    .items-section {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 18px;
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .items-header h4 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }

    .btn-add-row {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #60a5fa;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }

    .items-table th {
      color: #94a3b8;
      text-align: left;
      padding: 6px 8px;
    }

    .item-input, .item-select {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 6px 8px;
      color: #f8fafc;
      font-size: 0.82rem;
      width: 100%;
      outline: none;
    }

    .item-input.mono {
      font-family: monospace;
    }

    .line-total-cell {
      font-weight: 700;
      color: #38bdf8;
      padding: 6px 8px;
    }

    .btn-remove-row {
      background: transparent;
      border: none;
      color: #f87171;
      font-size: 1rem;
      cursor: pointer;
    }

    .discount-alert-card {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 18px;
    }

    .alert-badge {
      font-size: 0.78rem;
      font-weight: 800;
      color: #fbbf24;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    .alert-desc {
      font-size: 0.82rem;
      color: #fde68a;
      margin: 0;
      line-height: 1.4;
    }

    .summary-grid {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .summary-card {
      width: 320px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.84rem;
      color: #cbd5e1;
    }

    .summary-line.total {
      font-size: 1.05rem;
      font-weight: 800;
      color: #f8fafc;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 8px;
    }

    .total-val {
      color: #38bdf8;
    }

    .summary-line.advance {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-secondary {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #fff;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }

    .alert-box {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.88rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; }
    .alert-success { background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #86efac; }
    .btn-close-alert { background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; }
  `]
})
export class QuotationManagerComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly i18n = inject(I18nService);
  readonly authService = inject(AuthService);

  private readonly baseUrl = 'http://localhost:8080/api/v1/quotations';

  activeTab: 'all' | 'approvals' = 'all';
  quotations: QuotationDto[] = [];
  pendingApprovals: QuotationDto[] = [];

  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';

  showCreateModal = false;
  selectedCustomerId = 1;
  headerDiscountPercentage = 0;
  discountApprovalReason = '';
  advancePercentage = 30;

  draftItems: Array<{
    itemName: string;
    hsnCode: string;
    unitPrice: number;
    quantity: number;
    taxRatePercentage: number;
  }> = [];

  previewSubtotal = 0;
  previewDiscountAmount = 0;
  previewTaxAmount = 0;
  previewTotalAmount = 0;
  previewAdvanceDue = 0;

  ngOnInit(): void {
    this.loadQuotations();
    if (this.canApproveQuotes()) {
      this.loadPendingApprovals();
    }
  }

  loadQuotations(): void {
    this.http.get<ApiResponse<QuotationDto[]>>(this.baseUrl).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.quotations = res.data;
        }
      },
      error: () => {}
    });
  }

  loadPendingApprovals(): void {
    this.http.get<ApiResponse<QuotationDto[]>>(`${this.baseUrl}/approvals/pending`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingApprovals = res.data;
        }
      },
      error: () => {}
    });
  }

  openCreateModal(): void {
    this.selectedCustomerId = 1;
    this.headerDiscountPercentage = 0;
    this.discountApprovalReason = '';
    this.advancePercentage = 30;
    this.draftItems = [
      { itemName: '3-Seater Chesterfield Sofa (Italian Suede)', hsnCode: '9401', unitPrice: 45000, quantity: 1, taxRatePercentage: 18 },
      { itemName: 'High-Density Foam Cushioning (3-Year Warranty)', hsnCode: '9401', unitPrice: 12000, quantity: 1, taxRatePercentage: 18 }
    ];
    this.recalculatePreview();
    this.showCreateModal = true;
  }

  addItemRow(): void {
    this.draftItems.push({
      itemName: '',
      hsnCode: '9401',
      unitPrice: 5000,
      quantity: 1,
      taxRatePercentage: 18
    });
    this.recalculatePreview();
  }

  removeItemRow(index: number): void {
    if (this.draftItems.length > 1) {
      this.draftItems.splice(index, 1);
      this.recalculatePreview();
    }
  }

  recalculatePreview(): void {
    let subtotal = 0;
    let tax = 0;

    for (const item of this.draftItems) {
      const lineGross = (item.unitPrice || 0) * (item.quantity || 1);
      const lineTax = lineGross * ((item.taxRatePercentage || 18) / 100);
      subtotal += lineGross;
      tax += lineTax;
    }

    const discPct = this.headerDiscountPercentage || 0;
    const discAmount = subtotal * (discPct / 100);
    const netSubtotal = subtotal - discAmount;
    const total = netSubtotal + tax;
    const advPct = this.advancePercentage || 30;
    const advance = total * (advPct / 100);

    this.previewSubtotal = subtotal;
    this.previewDiscountAmount = discAmount;
    this.previewTaxAmount = tax;
    this.previewTotalAmount = total;
    this.previewAdvanceDue = advance;
  }

  handleCreateQuotation(): void {
    if (this.headerDiscountPercentage > 20 && !this.discountApprovalReason.trim()) {
      this.alertMessage = 'Discount exceeds 20%. Mandatory reason for extra discount must be provided.';
      this.alertType = 'error';
      return;
    }

    const payload = {
      customerId: this.selectedCustomerId,
      discountPercentage: this.headerDiscountPercentage,
      discountApprovalReason: this.headerDiscountPercentage > 20 ? this.discountApprovalReason : null,
      advanceRequiredPercentage: this.advancePercentage,
      items: this.draftItems.map((item, idx) => ({
        itemType: 'PRODUCT',
        itemName: item.itemName,
        hsnCode: item.hsnCode,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discountPercentage: 0,
        taxRatePercentage: item.taxRatePercentage,
        sortOrder: idx + 1
      }))
    };

    this.http.post<ApiResponse<QuotationDto>>(this.baseUrl, payload).subscribe({
      next: (res) => {
        this.showCreateModal = false;
        if (res.data?.status === 'PENDING_APPROVAL') {
          this.alertMessage = `Quotation ${res.data.quotationNumber} saved and routed to Manager Approval Queue (Discount > 20%).`;
          this.alertType = 'success';
        } else {
          this.alertMessage = `Quotation ${res.data?.quotationNumber} created and finalized!`;
          this.alertType = 'success';
        }
        this.loadQuotations();
        if (this.canApproveQuotes()) {
          this.loadPendingApprovals();
        }
      },
      error: (err) => {
        this.alertMessage = err.error?.message || 'Failed to create quotation.';
        this.alertType = 'error';
      }
    });
  }

  approveDiscount(q: QuotationDto): void {
    this.http.post<ApiResponse<QuotationDto>>(`${this.baseUrl}/${q.id}/approve`, {
      remarks: 'Authorized by operations management'
    }).subscribe({
      next: (res) => {
        this.alertMessage = `Quotation ${q.quotationNumber} discount approved!`;
        this.alertType = 'success';
        this.loadQuotations();
        this.loadPendingApprovals();
      },
      error: (err) => {
        this.alertMessage = err.error?.message || 'Failed to approve quotation.';
        this.alertType = 'error';
      }
    });
  }

  rejectDiscount(q: QuotationDto): void {
    const reason = prompt('Enter rejection reason for sales staff:', 'Discount margin too high for single unit order');
    if (reason === null) return;

    this.http.post<ApiResponse<QuotationDto>>(`${this.baseUrl}/${q.id}/reject?reason=${encodeURIComponent(reason)}`, {}).subscribe({
      next: (res) => {
        this.alertMessage = `Quotation ${q.quotationNumber} rejected.`;
        this.alertType = 'error';
        this.loadQuotations();
        this.loadPendingApprovals();
      },
      error: (err) => {
        this.alertMessage = err.error?.message || 'Failed to reject quotation.';
        this.alertType = 'error';
      }
    });
  }

  viewQuoteDetails(q: QuotationDto): void {
    alert(`Quotation ${q.quotationNumber}\nCustomer: ${q.customerName || 'Client #' + q.customerId}\nTotal: ₹${q.totalAmount.toLocaleString()}\nStatus: ${q.status}\nDiscount: ${q.discountPercentage}%\nNotes: ${q.notes || 'None'}`);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'badge-approved';
      case 'PENDING_APPROVAL': return 'badge-pending';
      case 'REJECTED': return 'badge-rejected';
      default: return 'badge-draft';
    }
  }

  canCreateQuotes(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasPermission('QUOTATION_CREATE');
  }

  canApproveQuotes(): boolean {
    return this.authService.hasRole('TENANT_ADMIN') || this.authService.hasRole('TENANT_MANAGER') || this.authService.hasRole('MANAGER') || this.authService.hasPermission('QUOTATION_APPROVE');
  }
}

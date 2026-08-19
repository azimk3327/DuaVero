import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

export interface DynamicAttributeField {
  code: string;
  name: string;
  dataType: 'TEXT' | 'NUMBER' | 'DECIMAL' | 'DROPDOWN' | 'MULTI_SELECT' | 'BOOLEAN' | 'MEASUREMENT';
  unitOfMeasure?: string;
  options?: string[];
  isRequired: boolean;
  validationRegex?: string;
}

@Component({
  selector: 'app-dynamic-field-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="formGroup" class="form-group">
      <label class="form-label">
        {{ field.name }}
        <span *ngIf="field.isRequired" style="color: var(--status-error);">*</span>
      </label>

      <!-- TEXT Input -->
      <input
        *ngIf="field.dataType === 'TEXT'"
        type="text"
        [formControlName]="field.code"
        class="input-control"
        [placeholder]="'Enter ' + field.name"
      />

      <!-- NUMBER / DECIMAL Input -->
      <input
        *ngIf="field.dataType === 'NUMBER' || field.dataType === 'DECIMAL'"
        type="number"
        [formControlName]="field.code"
        class="input-control"
        [placeholder]="'Enter ' + field.name"
      />

      <!-- MEASUREMENT Input with Unit Badge -->
      <div *ngIf="field.dataType === 'MEASUREMENT'" style="display: flex; gap: 8px; align-items: center;">
        <input
          type="number"
          [formControlName]="field.code"
          class="input-control"
          [placeholder]="'Enter ' + field.name"
        />
        <span *ngIf="field.unitOfMeasure" class="badge badge-info">{{ field.unitOfMeasure }}</span>
      </div>

      <!-- DROPDOWN Select -->
      <select
        *ngIf="field.dataType === 'DROPDOWN'"
        [formControlName]="field.code"
        class="select-control"
      >
        <option value="" disabled selected>Select {{ field.name }}</option>
        <option *ngFor="let opt of field.options" [value]="opt">{{ opt }}</option>
      </select>

      <!-- BOOLEAN Toggle -->
      <label *ngIf="field.dataType === 'BOOLEAN'" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" [formControlName]="field.code" />
        <span>{{ field.name }}</span>
      </label>
    </div>
  `
})
export class DynamicFieldRendererComponent {
  @Input({ required: true }) field!: DynamicAttributeField;
  @Input({ required: true }) formGroup!: FormGroup;
}

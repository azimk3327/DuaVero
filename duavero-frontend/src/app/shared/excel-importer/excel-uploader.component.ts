import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-excel-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="card"
      style="border: 2px dashed var(--color-border); text-align: center; padding: 40px 20px; cursor: pointer;"
      (click)="fileInput.click()"
    >
      <input
        #fileInput
        type="file"
        accept=".xlsx, .xls"
        style="display: none;"
        (change)="onFileSelected($event)"
      />
      <div style="font-size: 2.5rem; margin-bottom: 12px;">📊</div>
      <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 6px;">
        Upload Excel Spreadsheet (.xlsx)
      </h3>
      <p style="font-size: 0.85rem; color: var(--color-text-secondary); max-width: 400px; margin: 0 auto;">
        Drag and drop your populated product catalogue spreadsheet here or click to browse.
      </p>
    </div>
  `
})
export class ExcelUploaderComponent {
  @Output() fileSelected = new EventEmitter<File>();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileSelected.emit(input.files[0]);
    }
  }
}

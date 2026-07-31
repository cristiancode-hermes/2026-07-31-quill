import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="modal-overlay" (click)="cancel.emit()">
      <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3>{{ title() }}</h3>
          <button class="icon-btn" (click)="cancel.emit()" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--color-text-muted);">{{ message() }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="cancel.emit()">Cancel</button>
          <button class="btn" [class.btn-danger]="danger()" [class.btn-primary]="!danger()" (click)="confirm.emit()">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialog {
  title = input('Are you sure?');
  message = input('');
  confirmLabel = input('Confirm');
  danger = input(false);
  confirm = output();
  cancel = output();
}

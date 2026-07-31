import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        @if (title()) {
          <div class="modal-header">
            <h3>{{ title() }}</h3>
            <button class="icon-btn" (click)="close.emit()" aria-label="Close">✕</button>
          </div>
        }
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class Modal {
  title = input('');
  close = output();
}

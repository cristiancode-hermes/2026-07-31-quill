import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <span class="empty-state-icon">{{ icon() }}</span>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      @if (actionLabel()) {
        <button class="btn btn-primary" (click)="action.emit()">{{ actionLabel() }}</button>
      }
    </div>
  `
})
export class EmptyState {
  icon = input('✒️');
  title = input('');
  description = input('');
  actionLabel = input('');
  action = output();
}

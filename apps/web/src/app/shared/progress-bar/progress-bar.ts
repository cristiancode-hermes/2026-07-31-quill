import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div class="progress-track">
      <div class="progress-fill" [style.width.%]="percent()"></div>
    </div>
  `
})
export class ProgressBar {
  value = input(0);
  max = input(100);

  percent() {
    if (!this.max()) return 0;
    return Math.min(100, Math.max(0, Math.round((this.value() / this.max()) * 100)));
  }
}

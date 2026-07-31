import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-word-counter',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <span class="word-counter">
      <span>{{ current() | number }}</span>
      @if (goal()) {
        <span>/ {{ goal() | number }}</span>
      }
      <span>words</span>
      <div class="progress-track" style="width: 90px;">
        <div class="progress-fill" [style.width.%]="percent()"></div>
      </div>
    </span>
  `
})
export class WordCounter {
  current = input(0);
  goal = input(0);

  percent() {
    if (!this.goal()) return 0;
    return Math.min(100, Math.round((this.current() / this.goal()) * 100));
  }
}

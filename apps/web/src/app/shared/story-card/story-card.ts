import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import type { Story } from '../../models/models';

@Component({
  selector: 'app-story-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="card story-card card-hover" [routerLink]="['/stories', story().id]" [attr.data-story-id]="story().id">
      <div class="story-card-accent" [style.background]="story().coverColor || 'var(--color-primary)'"></div>
      <div class="flex-between" style="margin-bottom: 8px;">
        @if (story().genre) {
          <span class="badge">{{ story().genre }}</span>
        } @else {
          <span class="badge badge-accent">Uncategorized</span>
        }
        <span class="mono muted">{{ story().updatedAt | date:'MMM d' }}</span>
      </div>
      <h3 class="story-card-title">{{ story().title }}</h3>
      @if (story().synopsis) {
        <p class="muted" style="font-size: 0.813rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          {{ story().synopsis }}
        </p>
      }
    </div>
  `,
  styles: [`
    .story-card { min-height: 130px; }
    p { margin-top: 4px; }
  `]
})
export class StoryCard {
  story = input.required<Story>();
}

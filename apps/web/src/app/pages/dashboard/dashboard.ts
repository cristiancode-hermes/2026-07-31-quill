import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass, DecimalPipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { StoryService } from '../../services/story.service';
import { StatsService } from '../../services/stats.service';
import { StoryCard } from '../../shared/story-card/story-card';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Modal } from '../../shared/modal/modal';
import { FormsModule } from '@angular/forms';
import { ProgressBar } from '../../shared/progress-bar/progress-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass, DecimalPipe, StoryCard, EmptyState, Modal, FormsModule, ProgressBar],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Welcome back{{ auth.currentUser() ? ', ' + auth.currentUser()!.username : '' }}</h1>
          <p class="subtitle">
            @if (stats.dashboard(); as d) {
              You've written <strong>{{ d.todayWords | number }}</strong> of your {{ d.dailyGoal | number }}-word daily goal
              @if (d.streak > 0) { — {{ d.streak }}-day streak 🔥 }
            }
          </p>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary" (click)="openSessionModal()">⏱ Log writing session</button>
          <button class="btn btn-primary" (click)="openStoryModal()">+ New story</button>
        </div>
      </div>

      @if (stats.isLoading() && !stats.dashboard()) {
        <div class="grid" style="margin-bottom: var(--space-2xl);">
          @for (i of [].constructor(4); track $index) {
            <div class="skeleton skeleton-card"></div>
          }
        </div>
      } @else if (stats.dashboard(); as d) {
        <!-- Stat row -->
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: var(--space-2xl);">
          <div class="stat-card">
            <div class="stat-value">{{ d.totalWords | number }}</div>
            <div class="stat-label">Total words</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--color-primary);">{{ d.todayWords | number }}</div>
            <div class="stat-label">Today</div>
            <app-progress-bar [value]="d.todayWords" [max]="d.dailyGoal" style="display:block; margin-top: 10px;" />
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ d.streak }}</div>
            <div class="stat-label">Day streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ d.storyCount }}</div>
            <div class="stat-label">Stories</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ d.characterCount }}</div>
            <div class="stat-label">Characters</div>
          </div>
        </div>

        <!-- Weekly chart -->
        <h2 style="margin-bottom: var(--space-lg);">This week</h2>
        <div class="card" style="margin-bottom: var(--space-2xl);">
          <div style="display: flex; align-items: flex-end; gap: 10px; height: 120px; padding-top: 8px;">
            @for (day of stats.weekly(); track day.date) {
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end;">
                <div class="mono muted" style="font-size: 0.688rem;">{{ day.words }}</div>
                <div class="bar" [style.height.%]="barHeight(day.words)" [class.has-words]="day.words > 0"
                     [attr.aria-label]="day.date + ': ' + day.words + ' words'"></div>
                <div class="mono muted" style="font-size: 0.625rem;">{{ day.date.slice(5) }}</div>
              </div>
            }
          </div>
        </div>

        <!-- Story grid -->
        <div class="flex-between" style="margin-bottom: var(--space-lg);">
          <h2>Your stories</h2>
          <a routerLink="/stories" class="btn btn-ghost btn-sm">View all →</a>
        </div>

        @if (d.recentStories.length === 0) {
          <app-empty-state
            icon="📖"
            title="Ready to start your first story?"
            description="Create a story to organize chapters, characters, locations, and timeline events — all in one place."
            actionLabel="Create your first story"
            (action)="openStoryModal()"
          />
        } @else {
          <div class="grid">
            @for (story of d.recentStories; track story.id) {
              <app-story-card [story]="story" />
            }
          </div>
        }
      }
    </div>

    <!-- New story modal -->
    @if (showStoryModal()) {
      <app-modal title="New story" (close)="showStoryModal.set(false)">
        <div class="form-group">
          <label for="storyTitle">Title *</label>
          <input id="storyTitle" [(ngModel)]="newStoryTitle" placeholder="The Amber Throne" />
        </div>
        <div class="form-group">
          <label for="storyGenre">Genre</label>
          <select id="storyGenre" [(ngModel)]="newStoryGenre">
            <option value="">— Select a genre —</option>
            <option>Fantasy</option><option>Science Fiction</option><option>Romance</option>
            <option>Mystery</option><option>Thriller</option><option>Historical</option>
            <option>Horror</option><option>Literary</option><option>Young Adult</option><option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="storySynopsis">Synopsis</label>
          <textarea id="storySynopsis" rows="3" [(ngModel)]="newStorySynopsis" placeholder="A brief summary of your story…"></textarea>
        </div>
        <div class="form-group">
          <label>Cover color</label>
          <div class="flex gap-sm">
            @for (c of coverColors; track c) {
              <button type="button" class="color-swatch" [style.background]="c"
                      [class.selected]="newStoryColor === c" (click)="newStoryColor = c"
                      [attr.aria-label]="'Select color ' + c"></button>
            }
          </div>
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0;">
          <button class="btn btn-secondary" (click)="showStoryModal.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="createStory()" [disabled]="!newStoryTitle.trim() || creating()">Create story</button>
        </div>
      </app-modal>
    }

    <!-- Log session modal -->
    @if (showSessionModal()) {
      <app-modal title="Log writing session" (close)="showSessionModal.set(false)">
        <div class="form-group">
          <label for="sessionWords">Words written</label>
          <input id="sessionWords" type="number" min="0" [(ngModel)]="sessionWords" />
        </div>
        <div class="form-group">
          <label for="sessionMinutes">Minutes</label>
          <input id="sessionMinutes" type="number" min="1" [(ngModel)]="sessionMinutes" />
        </div>
        <div class="form-group">
          <label for="sessionNotes">Note (optional)</label>
          <input id="sessionNotes" [(ngModel)]="sessionNotes" placeholder="Morning pages…" />
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0;">
          <button class="btn btn-secondary" (click)="showSessionModal.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="logSession()" [disabled]="creating()">Log session</button>
        </div>
      </app-modal>
    }
  `,
  styles: [`
    .bar {
      width: 100%;
      max-width: 34px;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      background: var(--color-border);
      min-height: 3px;
      transition: background-color var(--duration-normal) var(--ease-out);
    }
    .bar.has-words { background: var(--color-primary); }
    .color-swatch {
      width: 30px; height: 30px; border-radius: var(--radius-full);
      border: 2px solid transparent; cursor: pointer;
      transition: transform var(--duration-fast) var(--ease-out);
    }
    .color-swatch:hover { transform: scale(1.1); }
    .color-swatch.selected { border-color: var(--color-text); }
  `]
})
export class DashboardPage {
  public auth = inject(AuthService);
  public stats = inject(StatsService);
  private storyService = inject(StoryService);

  readonly showStoryModal = signal(false);
  readonly showSessionModal = signal(false);
  readonly creating = signal(false);
  newStoryTitle = '';
  newStoryGenre = '';
  newStorySynopsis = '';
  newStoryColor = '#5C2D1A';
  sessionWords = 500;
  sessionMinutes = 30;
  sessionNotes = '';
  coverColors = ['#5C2D1A', '#8B5E3C', '#C4953C', '#4A8C5C', '#3E5C76', '#7A4A8C', '#C44A3F', '#2A1F1A'];

  constructor() {
    this.refresh();
  }

  async refresh() {
    await Promise.all([
      this.stats.loadDashboard(),
      this.stats.loadWeeklyWords(),
      this.storyService.loadStories(),
    ]);
  }

  barHeight(words: number): number {
    const max = Math.max(...this.stats.weekly().map(d => d.words), 1);
    return Math.max(3, Math.round((words / max) * 100));
  }

  openStoryModal() { this.showStoryModal.set(true); }
  openSessionModal() { this.showSessionModal.set(true); }

  async createStory() {
    if (!this.newStoryTitle.trim()) return;
    this.creating.set(true);
    try {
      const story = await this.storyService.createStory({
        title: this.newStoryTitle.trim(),
        genre: this.newStoryGenre || undefined,
        synopsis: this.newStorySynopsis.trim() || undefined,
        coverColor: this.newStoryColor,
      });
      this.showStoryModal.set(false);
      this.newStoryTitle = '';
      this.newStoryGenre = '';
      this.newStorySynopsis = '';
      await this.refresh();
      window.location.href = `/stories/${story.id}`;
    } finally {
      this.creating.set(false);
    }
  }

  async logSession() {
    this.creating.set(true);
    try {
      await this.stats.logWritingSession({
        wordsWritten: Number(this.sessionWords) || 0,
        durationMinutes: Number(this.sessionMinutes) || 1,
        notes: this.sessionNotes.trim() || undefined,
      });
      this.showSessionModal.set(false);
      this.sessionNotes = '';
    } finally {
      this.creating.set(false);
    }
  }
}

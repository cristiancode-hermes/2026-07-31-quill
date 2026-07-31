import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoryService } from '../../services/story.service';
import { StoryCard } from '../../shared/story-card/story-card';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Modal } from '../../shared/modal/modal';
import type { Story } from '../../models/models';

@Component({
  selector: 'app-story-list',
  standalone: true,
  imports: [FormsModule, StoryCard, EmptyState, Modal],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Your stories</h1>
          <p class="subtitle">Every narrative begins as a handful of words. Organize yours into chapters, characters, and worlds.</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">+ New story</button>
      </div>

      <div class="flex gap-sm wrap" style="margin-bottom: var(--space-lg);">
        <input type="search" placeholder="Search stories…" [(ngModel)]="query" class="search-input" style="max-width: 280px;" />
        <select [(ngModel)]="genreFilter" style="max-width: 180px;">
          <option value="">All genres</option>
          @for (g of genres(); track g) {
            <option>{{ g }}</option>
          }
        </select>
      </div>

      @if (storyService.isLoading()) {
        <div class="grid">
          @for (i of [].constructor(6); track $index) {
            <div class="skeleton skeleton-card"></div>
          }
        </div>
      } @else if (filtered().length === 0 && storyService.stories().length > 0) {
        <app-empty-state icon="🔍" title="No matches" description="No stories match your search. Try a different query or genre." />
      } @else if (filtered().length === 0) {
        <app-empty-state
          icon="📖"
          title="No stories yet"
          description="Create your first story and start building your world — chapters, characters, locations, and timeline all live here."
          actionLabel="Create your first story"
          (action)="openNew()"
        />
      } @else {
        <div class="grid">
          @for (story of filtered(); track story.id) {
            <app-story-card [story]="story" />
          }
        </div>
      }
    </div>

    <!-- New story modal -->
    @if (showNew()) {
      <app-modal title="New story" (close)="showNew.set(false)">
        <div class="form-group">
          <label for="newTitle">Title *</label>
          <input id="newTitle" [(ngModel)]="newTitle" placeholder="The Amber Throne" />
        </div>
        <div class="form-group">
          <label for="newGenre">Genre</label>
          <select id="newGenre" [(ngModel)]="newGenre">
            <option value="">— Select a genre —</option>
            <option>Fantasy</option><option>Science Fiction</option><option>Romance</option>
            <option>Mystery</option><option>Thriller</option><option>Historical</option>
            <option>Horror</option><option>Literary</option><option>Young Adult</option><option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="newSynopsis">Synopsis</label>
          <textarea id="newSynopsis" rows="3" [(ngModel)]="newSynopsis" placeholder="A brief summary…"></textarea>
        </div>
        <div class="form-group">
          <label>Cover color</label>
          <div class="flex gap-sm">
            @for (c of coverColors; track c) {
              <button type="button" class="color-swatch" [style.background]="c" [class.selected]="newColor === c" (click)="newColor = c"></button>
            }
          </div>
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0;">
          <button class="btn btn-secondary" (click)="showNew.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="create()" [disabled]="!newTitle.trim()">Create story</button>
        </div>
      </app-modal>
    }
  `,
  styles: [`
    .search-input { flex: 1; }
    .color-swatch {
      width: 30px; height: 30px; border-radius: var(--radius-full);
      border: 2px solid transparent; cursor: pointer;
    }
    .color-swatch.selected { border-color: var(--color-text); }
  `]
})
export class StoryListPage {
  public storyService = inject(StoryService);
  private router = inject(Router);

  readonly showNew = signal(false);
  query = '';
  genreFilter = '';
  newTitle = '';
  newGenre = '';
  newSynopsis = '';
  newColor = '#5C2D1A';
  coverColors = ['#5C2D1A', '#8B5E3C', '#C4953C', '#4A8C5C', '#3E5C76', '#7A4A8C', '#C44A3F', '#2A1F1A'];

  constructor() {
    this.storyService.loadStories();
  }

  filtered(): Story[] {
    const q = this.query.trim().toLowerCase();
    return this.storyService.stories().filter(s => {
      const matchesQuery = !q || s.title.toLowerCase().includes(q) || (s.synopsis ?? '').toLowerCase().includes(q);
      const matchesGenre = !this.genreFilter || s.genre === this.genreFilter;
      return matchesQuery && matchesGenre;
    });
  }

  genres(): string[] {
    return [...new Set(this.storyService.stories().map(s => s.genre).filter((g): g is string => !!g))].sort();
  }

  openNew() { this.showNew.set(true); }

  async create() {
    if (!this.newTitle.trim()) return;
    const story = await this.storyService.createStory({
      title: this.newTitle.trim(),
      genre: this.newGenre || undefined,
      synopsis: this.newSynopsis.trim() || undefined,
      coverColor: this.newColor,
    });
    this.showNew.set(false);
    this.router.navigate(['/stories', story.id]);
  }
}

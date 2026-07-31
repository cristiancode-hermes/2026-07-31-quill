import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoryService } from '../../services/story.service';
import { ChapterService } from '../../services/chapter.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Modal } from '../../shared/modal/modal';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import type { Chapter } from '../../models/models';

@Component({
  selector: 'app-story-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule, EmptyState, Modal, ConfirmDialog],
  template: `
    <div class="container page">
      @if (storyService.isLoading() && !story()) {
        <div class="skeleton" style="height: 200px; margin-bottom: var(--space-lg);"></div>
      } @else if (story(); as story) {
        <div class="page-header">
          <div style="display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap;">
            <div class="story-accent" [style.background]="story.coverColor || 'var(--color-primary)'"></div>
            <div>
              <h1>{{ story.title }}</h1>
              <p class="subtitle">
                @if (story.genre) { <span class="badge">{{ story.genre }}</span> }
                <span class="mono muted">updated {{ story.updatedAt | date:'MMM d, y' }}</span>
              </p>
            </div>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-secondary" (click)="openEdit()">✏ Edit</button>
            <button class="btn btn-danger" (click)="confirmDelete.set(true)">🗑 Delete</button>
          </div>
        </div>

        @if (story.synopsis) {
          <p class="synopsis serif">{{ story.synopsis }}</p>
        }

        <!-- Stats -->
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin: var(--space-xl) 0;">
          <div class="stat-card"><div class="stat-value">{{ story.stats.totalWords | number }}</div><div class="stat-label">Words</div></div>
          <div class="stat-card"><div class="stat-value">{{ story.stats.chapterCount }}</div><div class="stat-label">Chapters</div></div>
          <div class="stat-card"><div class="stat-value">{{ story.stats.sceneCount }}</div><div class="stat-label">Scenes</div></div>
          <div class="stat-card"><div class="stat-value">{{ story.stats.characterCount }}</div><div class="stat-label">Characters</div></div>
          <div class="stat-card"><div class="stat-value">{{ story.stats.locationCount }}</div><div class="stat-label">Locations</div></div>
          <div class="stat-card"><div class="stat-value">{{ story.stats.eventCount }}</div><div class="stat-label">Events</div></div>
        </div>

        <div class="flex gap-sm wrap" style="margin-bottom: var(--space-xl);">
          <a class="btn btn-primary" [routerLink]="['/stories', story.id, 'chapters']">📑 Chapters</a>
          <a class="btn btn-secondary" [routerLink]="['/stories', story.id, 'characters']">🧙 Characters</a>
          <a class="btn btn-secondary" [routerLink]="['/stories', story.id, 'locations']">🗺️ Locations</a>
          <a class="btn btn-secondary" [routerLink]="['/stories', story.id, 'timeline']">⏳ Timeline</a>
        </div>

        <!-- Chapters -->
        <div class="flex-between" style="margin-bottom: var(--space-lg);">
          <h2>Chapters</h2>
          <button class="btn btn-ghost btn-sm" (click)="openChapterModal()">+ Add chapter</button>
        </div>

        @if (chapters().length === 0) {
          <app-empty-state
            icon="📑"
            title="No chapters yet"
            description="Chapters structure your narrative. Add your first chapter to start writing scenes."
            actionLabel="Add a chapter"
            (action)="openChapterModal()"
          />
        } @else {
          <div>
            @for (chapter of chapters(); track chapter.id) {
              <div class="chapter-item" [routerLink]="['/stories', story.id, 'chapters', chapter.id]">
                <div class="chapter-position">{{ chapter.position + 1 }}</div>
                <div class="chapter-body">
                  <div class="chapter-title">{{ chapter.title }}</div>
                  <div class="chapter-sub">{{ chapter.sceneCount ?? 0 }} scenes · {{ chapter.totalWords ?? 0 }} words</div>
                </div>
                <span class="badge" [class.badge-success]="chapter.status === 'done'"
                      [class.badge-warning]="chapter.status === 'drafting' || chapter.status === 'revising'">
                  {{ chapter.status }}
                </span>
              </div>
            }
          </div>
        }
      } @else {
        <app-empty-state icon="🔍" title="Story not found" description="This story may have been archived or deleted." actionLabel="Back to stories" (action)="router.navigate(['/stories'])" />
      }
    </div>

    <!-- Edit story modal -->
    @if (showEdit()) {
      <app-modal title="Edit story" (close)="showEdit.set(false)">
        <div class="form-group">
          <label for="editTitle">Title</label>
          <input id="editTitle" [(ngModel)]="editTitle" />
        </div>
        <div class="form-group">
          <label for="editGenre">Genre</label>
          <input id="editGenre" [(ngModel)]="editGenre" />
        </div>
        <div class="form-group">
          <label for="editSynopsis">Synopsis</label>
          <textarea id="editSynopsis" rows="3" [(ngModel)]="editSynopsis"></textarea>
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0;">
          <button class="btn btn-secondary" (click)="showEdit.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="saveEdit()">Save</button>
        </div>
      </app-modal>
    }

    <!-- Add chapter modal -->
    @if (showChapter()) {
      <app-modal title="Add chapter" (close)="showChapter.set(false)">
        <div class="form-group">
          <label for="chapterTitle">Title *</label>
          <input id="chapterTitle" [(ngModel)]="chapterTitle" placeholder="The Cartographer's Map" />
        </div>
        <div class="form-group">
          <label for="chapterGoal">Word goal (optional)</label>
          <input id="chapterGoal" type="number" min="0" [(ngModel)]="chapterGoal" />
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0;">
          <button class="btn btn-secondary" (click)="showChapter.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="addChapter()" [disabled]="!chapterTitle.trim()">Add chapter</button>
        </div>
      </app-modal>
    }

    @if (confirmDelete()) {
      <app-confirm-dialog
        title="Delete story?"
        message="This will permanently remove the story with all its chapters, scenes, characters, locations, and timeline events. This cannot be undone."
        confirmLabel="Delete story"
        [danger]="true"
        (confirm)="deleteStory()"
        (cancel)="confirmDelete.set(false)"
      />
    }
  `,
  styles: [`
    .synopsis {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
      max-width: 72ch;
      margin-top: var(--space-md);
    }
    .story-accent {
      width: 8px; height: 64px; border-radius: var(--radius-sm); flex-shrink: 0;
    }
  `]
})
export class StoryDetailPage {
  public storyService = inject(StoryService);
  public chapterService = inject(ChapterService);
  public router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly showEdit = signal(false);
  readonly showChapter = signal(false);
  readonly confirmDelete = signal(false);
  storyId = '';
  chapters = signal<Chapter[]>([]);
  editTitle = '';
  editGenre = '';
  editSynopsis = '';
  chapterTitle = '';
  chapterGoal = 2000;

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('storyId')!;
      this.storyId = id;
      await this.storyService.getStory(id);
      await this.loadChapters();
    });
  }

  story() {
    return this.storyService.currentStory();
  }

  async loadChapters() {
    this.chapters.set(await this.chapterService.loadChapters(this.storyId));
  }

  openEdit() {
    const s = this.story();
    if (!s) return;
    this.editTitle = s.title;
    this.editGenre = s.genre ?? '';
    this.editSynopsis = s.synopsis ?? '';
    this.showEdit.set(true);
  }

  async saveEdit() {
    await this.storyService.updateStory(this.storyId, {
      title: this.editTitle.trim() || this.story()!.title,
      genre: this.editGenre.trim() || null,
      synopsis: this.editSynopsis.trim() || null,
    });
    this.showEdit.set(false);
    await this.storyService.getStory(this.storyId);
  }

  openChapterModal() { this.showChapter.set(true); }

  async addChapter() {
    if (!this.chapterTitle.trim()) return;
    await this.chapterService.createChapter(this.storyId, {
      title: this.chapterTitle.trim(),
      wordGoal: Number(this.chapterGoal) || undefined,
    });
    this.showChapter.set(false);
    this.chapterTitle = '';
    await this.loadChapters();
    await this.storyService.getStory(this.storyId);
  }

  async deleteStory() {
    await this.storyService.deleteStory(this.storyId);
    this.router.navigate(['/stories']);
  }
}

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChapterService } from '../../services/chapter.service';
import { StoryService } from '../../services/story.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Modal } from '../../shared/modal/modal';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import type { Chapter } from '../../models/models';

@Component({
  selector: 'app-chapter-list',
  standalone: true,
  imports: [RouterLink, FormsModule, EmptyState, Modal, ConfirmDialog],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <a [routerLink]="['/stories', storyId]" class="muted" style="font-size: 0.813rem;">← {{ story()?.title ?? 'Story' }}</a>
          <h1 style="margin-top: 4px;">Chapters</h1>
          <p class="subtitle">Drag chapters to reorder your narrative. Each chapter holds its scenes.</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">+ Add chapter</button>
      </div>

      @if (chapterService.isLoading()) {
        @for (i of [].constructor(4); track $index) {
          <div class="skeleton" style="height: 64px; margin-bottom: var(--space-sm);"></div>
        }
      } @else if (chapters().length === 0) {
        <app-empty-state
          icon="📑"
          title="No chapters yet"
          description="Chapters give your story structure. Add one and start filling it with scenes."
          actionLabel="Add your first chapter"
          (action)="openNew()"
        />
      } @else {
        <div class="chapter-list">
          @for (chapter of chapters(); track chapter.id; let i = $index) {
            <div class="chapter-row"
                 [class.dragging]="dragId() === chapter.id"
                 [class.drop-target]="dropTarget() === chapter.id"
                 draggable="true"
                 (dragstart)="onDragStart(chapter.id, $event)"
                 (dragover)="onDragOver(chapter.id, $event)"
                 (dragleave)="dropTarget.set(null)"
                 (drop)="onDrop(chapter.id, $event)"
                 (dragend)="onDragEnd()">
              <span class="drag-handle" title="Drag to reorder">⠿</span>
              <div class="chapter-index mono muted">{{ i + 1 }}</div>
              <div class="chapter-body" style="cursor: pointer;" [routerLink]="['/stories', storyId, 'chapters', chapter.id]">
                <div class="chapter-title">{{ chapter.title }}</div>
                <div class="chapter-sub">{{ chapter.sceneCount ?? 0 }} scenes · {{ chapter.totalWords ?? 0 }} words
                  @if (chapter.wordGoal) { · goal {{ chapter.wordGoal }} }
                </div>
              </div>
              <span class="badge" [class.badge-success]="chapter.status === 'done'"
                    [class.badge-warning]="chapter.status === 'drafting' || chapter.status === 'revising'">
                {{ chapter.status }}
              </span>
              <button class="icon-btn" title="Delete chapter" (click)="confirmDelete.set(chapter)">🗑</button>
            </div>
          }
        </div>
      }
    </div>

    @if (showNew()) {
      <app-modal title="Add chapter" (close)="showNew.set(false)">
        <div class="form-group">
          <label for="newTitle">Title *</label>
          <input id="newTitle" [(ngModel)]="newTitle" placeholder="The Cartographer's Map" />
        </div>
        <div class="form-group">
          <label for="newGoal">Word goal (optional)</label>
          <input id="newGoal" type="number" min="0" [(ngModel)]="newGoal" />
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0;">
          <button class="btn btn-secondary" (click)="showNew.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="createChapter()" [disabled]="!newTitle.trim()">Add chapter</button>
        </div>
      </app-modal>
    }

    @if (confirmDelete(); as target) {
      <app-confirm-dialog
        title="Delete chapter?"
        message="This will delete the chapter and all of its scenes. This cannot be undone."
        confirmLabel="Delete"
        [danger]="true"
        (confirm)="removeChapter(target)"
        (cancel)="confirmDelete.set(null)"
      />
    }
  `,
  styles: [`
    .chapter-row {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      margin-bottom: var(--space-sm);
      transition: border-color var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out);
    }
    .chapter-row:hover { border-color: var(--color-primary); }
    .chapter-index { width: 24px; text-align: center; flex-shrink: 0; }
    .chapter-title { font-weight: 600; }
    .chapter-sub { font-size: 0.75rem; color: var(--color-text-muted); font-family: var(--font-mono); }
  `]
})
export class ChapterListPage {
  public chapterService = inject(ChapterService);
  public storyService = inject(StoryService);
  private route = inject(ActivatedRoute);

  storyId = '';
  showNew = signal(false);
  newTitle = '';
  newGoal = 2000;
  confirmDelete = signal<Chapter | null>(null);
  dragId = signal<string | null>(null);
  dropTarget = signal<string | null>(null);
  chapters = signal<Chapter[]>([]);

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      this.storyId = params.get('storyId')!;
      await this.storyService.getStory(this.storyId);
      this.chapters.set(await this.chapterService.loadChapters(this.storyId));
    });
  }

  story() {
    return this.storyService.currentStory();
  }

  openNew() { this.showNew.set(true); }

  async createChapter() {
    if (!this.newTitle.trim()) return;
    await this.chapterService.createChapter(this.storyId, {
      title: this.newTitle.trim(),
      wordGoal: Number(this.newGoal) || undefined,
    });
    this.showNew.set(false);
    this.newTitle = '';
    this.chapters.set(await this.chapterService.loadChapters(this.storyId));
  }

  async removeChapter(chapter: Chapter) {
    await this.chapterService.deleteChapter(chapter.id);
    this.confirmDelete.set(null);
    this.chapters.set(await this.chapterService.loadChapters(this.storyId));
  }

  onDragStart(id: string, event: DragEvent) {
    this.dragId.set(id);
    event.dataTransfer?.setData('text/plain', id);
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(id: string, event: DragEvent) {
    event.preventDefault();
    if (id !== this.dragId()) this.dropTarget.set(id);
  }

  async onDrop(targetId: string, event: DragEvent) {
    event.preventDefault();
    const sourceId = this.dragId();
    this.dropTarget.set(null);
    if (!sourceId || sourceId === targetId) return;
    const list = [...this.chapters()];
    const from = list.findIndex(c => c.id === sourceId);
    const to = list.findIndex(c => c.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    this.chapters.set(list);
    await this.chapterService.reorderChapters(this.storyId, list.map(c => c.id));
    this.chapters.set(await this.chapterService.loadChapters(this.storyId));
  }

  onDragEnd() {
    this.dragId.set(null);
    this.dropTarget.set(null);
  }
}

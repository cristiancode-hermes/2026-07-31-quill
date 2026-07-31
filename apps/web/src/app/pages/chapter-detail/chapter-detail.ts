import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChapterService } from '../../services/chapter.service';
import { StoryService } from '../../services/story.service';
import { SceneService } from '../../services/scene.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Modal } from '../../shared/modal/modal';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { WordCounter } from '../../shared/word-counter/word-counter';
import type { Scene } from '../../models/models';

@Component({
  selector: 'app-chapter-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, EmptyState, Modal, ConfirmDialog, WordCounter],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <a [routerLink]="['/stories', storyId, 'chapters']" class="muted" style="font-size: 0.813rem;">← Chapters</a>
          <h1 style="margin-top: 4px;">{{ chapter()?.title ?? 'Chapter' }}</h1>
          <p class="subtitle">
            <span class="badge" [class.badge-success]="chapter()?.status === 'done'">{{ chapter()?.status ?? 'draft' }}</span>
            <span class="mono muted" style="margin-left: var(--space-sm);">{{ chapter()?.sceneCount ?? 0 }} scenes · {{ chapter()?.totalWords ?? 0 }} words</span>
          </p>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary" (click)="cycleStatus()">Status → {{ nextStatus() }}</button>
          <button class="btn btn-primary" (click)="openNew()">+ Add scene</button>
        </div>
      </div>

      @if (chapter()?.notes) {
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="muted serif" style="font-size: 0.938rem;">{{ chapter()?.notes }}</div>
        </div>
      }

      @if (scenes().length === 0) {
        <app-empty-state
          icon="✍️"
          title="No scenes yet"
          description="Scenes are the building blocks of your chapter. Write the first one — the blank page is waiting."
          actionLabel="Write your first scene"
          (action)="openNew()"
        />
      } @else {
        <div>
          @for (scene of scenes(); track scene.id) {
            <div class="scene-row" [routerLink]="['/stories', storyId, 'chapters', chapterId, 'scenes', scene.id]">
              <div class="scene-body">
                <div class="scene-title">{{ scene.title || 'Untitled scene' }}</div>
                <div class="scene-excerpt serif muted">{{ excerpt(scene.content) }}</div>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-sm);">
                <span class="mono muted">{{ scene.wordCount }} words</span>
                <button class="icon-btn" (click)="$event.stopPropagation(); confirmDelete.set(scene)">🗑</button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (showNew()) {
      <app-modal title="Add scene" (close)="showNew.set(false)">
        <div class="form-group">
          <label for="newTitle">Scene title (optional)</label>
          <input id="newTitle" [(ngModel)]="newTitle" placeholder="The map room" />
        </div>
        <div class="form-group">
          <label for="newContent">Opening lines</label>
          <textarea id="newContent" rows="5" [(ngModel)]="newContent" placeholder="Kael unrolled the parchment across the tavern table…"></textarea>
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0;">
          <button class="btn btn-secondary" (click)="showNew.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="createScene()">Create scene</button>
        </div>
      </app-modal>
    }

    @if (confirmDelete(); as target) {
      <app-confirm-dialog
        title="Delete scene?"
        message="This will permanently delete this scene's content."
        confirmLabel="Delete"
        [danger]="true"
        (confirm)="removeScene(target)"
        (cancel)="confirmDelete.set(null)"
      />
    }
  `,
  styles: [`
    .scene-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-lg);
      padding: var(--space-md) var(--space-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      margin-bottom: var(--space-sm);
      cursor: pointer;
      transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
    }
    .scene-row:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }
    .scene-title { font-weight: 600; }
    .scene-excerpt {
      font-size: 0.813rem;
      display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
    }
  `]
})
export class ChapterDetailPage {
  public chapterService = inject(ChapterService);
  public storyService = inject(StoryService);
  private sceneService = inject(SceneService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  storyId = '';
  chapterId = '';
  showNew = signal(false);
  newTitle = '';
  newContent = '';
  confirmDelete = signal<Scene | null>(null);
  scenes = signal<Scene[]>([]);

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      this.storyId = params.get('storyId')!;
      this.chapterId = params.get('chapterId')!;
      await this.storyService.getStory(this.storyId);
      await this.chapterService.getChapter(this.chapterId);
      this.scenes.set(await this.sceneService.loadScenes(this.chapterId));
    });
  }

  chapter() {
    return this.chapterService.currentChapter();
  }

  nextStatus(): string {
    const order = ['draft', 'drafting', 'revising', 'done'];
    const current = this.chapter()?.status ?? 'draft';
    const idx = order.indexOf(current);
    return order[(idx + 1) % order.length];
  }

  async cycleStatus() {
    await this.chapterService.updateChapter(this.chapterId, { status: this.nextStatus() });
    await this.chapterService.getChapter(this.chapterId);
  }

  openNew() { this.showNew.set(true); }

  async createScene() {
    const scene = await this.sceneService.createScene(this.chapterId, {
      title: this.newTitle.trim() || undefined,
      content: this.newContent,
    });
    this.showNew.set(false);
    this.newTitle = '';
    this.newContent = '';
    this.router.navigate(['/stories', this.storyId, 'chapters', this.chapterId, 'scenes', scene.id]);
  }

  async removeScene(scene: Scene) {
    await this.sceneService.deleteScene(scene.id);
    this.confirmDelete.set(null);
    this.scenes.set(await this.sceneService.loadScenes(this.chapterId));
  }

  excerpt(content: string): string {
    const plain = content.replace(/[#*_`>\[\]()!-]/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.slice(0, 120) || 'Empty scene — click to start writing';
  }
}

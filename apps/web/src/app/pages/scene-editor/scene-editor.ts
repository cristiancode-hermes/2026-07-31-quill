import { Component, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SceneService } from '../../services/scene.service';
import { ChapterService } from '../../services/chapter.service';
import { WordCounter } from '../../shared/word-counter/word-counter';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import type { Scene } from '../../models/models';

function countWords(content: string): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

@Component({
  selector: 'app-scene-editor',
  standalone: true,
  imports: [RouterLink, FormsModule, WordCounter, ConfirmDialog],
  template: `
    <div class="editor-shell">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <input class="scene-title-input serif" [ngModel]="scene()?.title ?? 'Untitled scene'"
               (ngModelChange)="onTitleChange($event)" placeholder="Untitled scene" />
        <div style="flex: 1;"></div>
        <button class="chip" [class.active]="mode() === 'write'" (click)="mode.set('write')">Write</button>
        <button class="chip" [class.active]="mode() === 'preview'" (click)="mode.set('preview')">Preview</button>
        <button class="chip" [class.active]="mode() === 'split'" (click)="mode.set('split')">Split</button>
        <span style="width: 12px;"></span>
        <span class="save-indicator" [class.saved]="sceneService.saveState() === 'saved'">
          @switch (sceneService.saveState()) {
            @case ('saving') { Saving… }
            @case ('saved') { ✓ Saved }
            @case ('error') { ⚠ Save failed — retry }
            @default { Auto-save on }
          }
        </span>
      </div>

      <!-- Editor body -->
      <div class="editor-body" [class.split]="mode() === 'split'">
        @if (mode() === 'write' || mode() === 'split') {
          <textarea class="editor-textarea serif" [class.split-mode]="mode() === 'split'"
                    [ngModel]="scene()?.content ?? ''"
                    (ngModelChange)="onContentChange($event)"
                    placeholder="It was a dark and stormy night…"
                    spellcheck="false"></textarea>
        }
        @if (mode() === 'preview' || mode() === 'split') {
          <div class="editor-preview serif" [class.split-mode]="mode() === 'split'">
            @if (previewHtml()) {
              <div [innerHTML]="previewHtml()"></div>
            } @else {
              <p class="muted">Nothing to preview yet — start writing.</p>
            }
          </div>
        }
      </div>

      <!-- Bottom bar -->
      <div class="editor-footer">
        <a [routerLink]="['/stories', storyId, 'chapters', chapterId]" class="btn btn-ghost btn-sm">← Back to chapter</a>
        <div style="flex: 1;"></div>
        @if (siblings().length > 1) {
          <div class="flex gap-sm">
            @if (prevScene(); as prev) {
              <a class="btn btn-secondary btn-sm" [routerLink]="['/stories', storyId, 'chapters', chapterId, 'scenes', prev.id]">← Prev scene</a>
            }
            @if (nextScene(); as next) {
              <a class="btn btn-secondary btn-sm" [routerLink]="['/stories', storyId, 'chapters', chapterId, 'scenes', next.id]">Next scene →</a>
            }
          </div>
        }
        <app-word-counter [current]="wordCount()" [goal]="chapter()?.wordGoal ?? 0" />
        <button class="icon-btn" style="margin-left: 4px;" (click)="confirmDelete.set(true)" title="Delete scene">🗑</button>
      </div>
    </div>

    @if (confirmDelete()) {
      <app-confirm-dialog
        title="Delete scene?"
        message="This will permanently delete this scene and all of its text."
        confirmLabel="Delete scene"
        [danger]="true"
        (confirm)="deleteScene()"
        (cancel)="confirmDelete.set(false)"
      />
    }
  `,
  styles: [`
    .editor-shell {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 60px);
    }
    .scene-title-input {
      border: none;
      background: transparent;
      font-size: 1.125rem;
      font-weight: 600;
      padding: 4px 8px;
      max-width: 380px;
      box-shadow: none;
    }
    .scene-title-input:focus { box-shadow: none; border-color: transparent; background: color-mix(in srgb, var(--color-background) 60%, transparent); }
    .editor-body { flex: 1; display: flex; flex-direction: column; padding: var(--space-lg) var(--space-xl); gap: var(--space-lg); }
    .editor-body.split { flex-direction: row; }
    .editor-body.split > * { flex: 1; }
    .editor-textarea { flex: 1; min-height: 50vh; }
    .editor-textarea.split-mode { min-height: calc(100vh - 180px); }
    .editor-preview { flex: 1; overflow-y: auto; }
    .editor-preview.split-mode { min-height: calc(100vh - 180px); }
    .editor-footer {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md) var(--space-xl);
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
    }
  `]
})
export class SceneEditorPage implements OnDestroy {
  public sceneService = inject(SceneService);
  public chapterService = inject(ChapterService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  storyId = '';
  chapterId = '';
  sceneId = '';
  mode = signal<'write' | 'preview' | 'split'>('write');
  confirmDelete = signal(false);
  siblings = signal<Scene[]>([]);
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      this.storyId = params.get('storyId')!;
      this.chapterId = params.get('chapterId')!;
      this.sceneId = params.get('sceneId')!;
      await this.chapterService.getChapter(this.chapterId);
      await this.sceneService.getScene(this.sceneId);
      this.siblings.set(await this.sceneService.loadScenes(this.chapterId));
    });
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    // Flush pending changes
    const scene = this.sceneService.currentScene();
    if (scene && this.pendingContent !== null) {
      this.sceneService.saveNow(scene.id, this.pendingContent, this.pendingTitle).catch(() => {});
    }
  }

  scene() {
    return this.sceneService.currentScene();
  }

  chapter() {
    return this.chapterService.currentChapter();
  }

  wordCount() {
    return countWords(this.scene()?.content ?? '');
  }

  previewHtml(): string {
    const content = this.scene()?.content ?? '';
    if (!content.trim()) return '';
    let html = content
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    return `<p>${html}</p>`;
  }

  private pendingContent: string | null = null;
  private pendingTitle: string | null = null;

  onContentChange(value: string) {
    const scene = this.scene();
    if (!scene) return;
    this.pendingContent = value;
    scene.content = value;
    scene.wordCount = countWords(value);
    this.sceneService.scheduleAutoSave(scene.id, value, this.pendingTitle ?? scene.title);
  }

  onTitleChange(value: string) {
    const scene = this.scene();
    if (!scene) return;
    this.pendingTitle = value;
    scene.title = value;
    this.sceneService.scheduleAutoSave(scene.id, scene.content, value);
  }

  prevScene(): Scene | null {
    const list = this.siblings();
    const idx = list.findIndex(s => s.id === this.sceneId);
    return idx > 0 ? list[idx - 1] : null;
  }

  nextScene(): Scene | null {
    const list = this.siblings();
    const idx = list.findIndex(s => s.id === this.sceneId);
    return idx !== -1 && idx < list.length - 1 ? list[idx + 1] : null;
  }

  async deleteScene() {
    await this.sceneService.deleteScene(this.sceneId);
    this.router.navigate(['/stories', this.storyId, 'chapters', this.chapterId]);
  }
}

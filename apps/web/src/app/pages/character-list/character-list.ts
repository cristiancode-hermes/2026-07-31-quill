import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { StoryService } from '../../services/story.service';
import { CharacterCard } from '../../shared/character-card/character-card';
import { EmptyState } from '../../shared/empty-state/empty-state';

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CharacterCard, EmptyState],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <a [routerLink]="['/stories', storyId]" class="muted" style="font-size: 0.813rem;">← {{ story()?.title ?? 'Story' }}</a>
          <h1 style="margin-top: 4px;">Characters</h1>
          <p class="subtitle">The people who drive your story — their traits, histories, and the threads that bind them.</p>
        </div>
        <a class="btn btn-primary" [routerLink]="['/stories', storyId, 'characters', 'new']">+ New character</a>
      </div>

      <div class="flex gap-sm wrap" style="margin-bottom: var(--space-lg);">
        <input type="search" placeholder="Search characters…" [(ngModel)]="query" style="max-width: 260px;" />
        <select [(ngModel)]="roleFilter" style="max-width: 170px;">
          <option value="">All roles</option>
          @for (r of roles(); track r) {
            <option>{{ r }}</option>
          }
        </select>
      </div>

      @if (characterService.isLoading()) {
        <div class="grid">
          @for (i of [].constructor(6); track $index) {
            <div class="skeleton skeleton-card"></div>
          }
        </div>
      } @else if (filtered().length === 0 && characterService.characters().length > 0) {
        <app-empty-state icon="🔍" title="No matches" description="No characters match your filters." />
      } @else if (filtered().length === 0) {
        <app-empty-state
          icon="🧙"
          title="No characters yet"
          description="Give your story its cast — protagonists, mentors, rivals, and everyone in between."
          actionLabel="Create your first character"
          (action)="goNew()"
        />
      } @else {
        <div class="grid">
          @for (character of filtered(); track character.id) {
            <app-character-card [character]="character" />
          }
        </div>
      }
    </div>
  `
})
export class CharacterListPage {
  public characterService = inject(CharacterService);
  public storyService = inject(StoryService);
  private route = inject(ActivatedRoute);

  storyId = '';
  query = '';
  roleFilter = '';

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      this.storyId = params.get('storyId')!;
      await this.storyService.getStory(this.storyId);
      await this.characterService.loadCharacters(this.storyId);
    });
  }

  story() {
    return this.storyService.currentStory();
  }

  filtered() {
    const q = this.query.trim().toLowerCase();
    return this.characterService.characters().filter(c => {
      const matchesQuery = !q || c.name.toLowerCase().includes(q);
      const matchesRole = !this.roleFilter || c.role === this.roleFilter;
      return matchesQuery && matchesRole;
    });
  }

  roles(): string[] {
    return [...new Set(this.characterService.characters().map(c => c.role).filter((r): r is string => !!r))].sort();
  }

  goNew() {
    window.location.href = `/stories/${this.storyId}/characters/new`;
  }
}

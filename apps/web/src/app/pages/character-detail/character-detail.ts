import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { StoryService } from '../../services/story.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { Modal } from '../../shared/modal/modal';
import { EmptyState } from '../../shared/empty-state/empty-state';
import type { Character, CharacterRelationship } from '../../models/models';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, ConfirmDialog, Modal, EmptyState],
  template: `
    <div class="container page" style="max-width: 860px;">
      @if (character(); as c) {
        <div class="page-header">
          <div style="display: flex; align-items: center; gap: var(--space-lg);">
            <div class="avatar" [style.background]="c.avatarColor || 'var(--color-primary)'" style="width: 56px; height: 56px; font-size: 1.5rem;">
              {{ c.name.charAt(0) }}
            </div>
            <div>
              <h1>{{ c.name }}</h1>
              <div class="flex gap-sm" style="margin-top: 4px;">
                @if (c.role) { <span class="badge">{{ c.role }}</span> }
                @if (c.age) { <span class="mono muted">{{ c.age }} years old</span> }
              </div>
            </div>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-secondary" (click)="editing.set(!editing())">{{ editing() ? 'Done editing' : '✏ Edit' }}</button>
            <button class="btn btn-danger" (click)="confirmDelete.set(true)">🗑</button>
          </div>
        </div>

        <div class="tabs">
          <button class="tab" [class.active]="tab() === 'profile'" (click)="tab.set('profile')">Profile</button>
          <button class="tab" [class.active]="tab() === 'relationships'" (click)="tab.set('relationships')">Relationships ({{ relationships().length }})</button>
        </div>

        @if (tab() === 'profile') {
          <div class="card">
            @if (!editing()) {
              <div class="profile-grid">
                <div>
                  <h3 style="margin-bottom: var(--space-sm);">Traits</h3>
                  <div class="flex gap-sm wrap">
                    @for (trait of traits(c); track trait) {
                      <span class="badge badge-accent">{{ trait }}</span>
                    }
                  </div>
                </div>
                @if (c.appearance) {
                  <div>
                    <h3 style="margin-bottom: var(--space-sm);">Appearance</h3>
                    <p class="serif muted">{{ c.appearance }}</p>
                  </div>
                }
                @if (c.backstory) {
                  <div>
                    <h3 style="margin-bottom: var(--space-sm);">Backstory</h3>
                    <p class="serif">{{ c.backstory }}</p>
                  </div>
                }
                @if (c.goals) {
                  <div>
                    <h3 style="margin-bottom: var(--space-sm);">Goals</h3>
                    <p class="serif muted">{{ c.goals }}</p>
                  </div>
                }
              </div>
            } @else {
              <div class="form-group"><label>Name</label><input [(ngModel)]="editForm.name" /></div>
              <div class="grid" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group"><label>Role</label><input [(ngModel)]="editForm.role" /></div>
                <div class="form-group"><label>Age</label><input type="number" [(ngModel)]="editForm.age" /></div>
              </div>
              <div class="form-group"><label>Traits</label><input [(ngModel)]="editForm.traits" /></div>
              <div class="form-group"><label>Appearance</label><textarea rows="2" [(ngModel)]="editForm.appearance"></textarea></div>
              <div class="form-group"><label>Backstory</label><textarea rows="4" [(ngModel)]="editForm.backstory"></textarea></div>
              <div class="form-group"><label>Goals</label><textarea rows="2" [(ngModel)]="editForm.goals"></textarea></div>
              <div class="flex gap-sm" style="justify-content: flex-end;">
                <button class="btn btn-primary" (click)="saveEdit()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save changes' }}</button>
              </div>
            }
          </div>
        }

        @if (tab() === 'relationships') {
          <div class="flex-between" style="margin-bottom: var(--space-lg);">
            <h2>Connections</h2>
            <button class="btn btn-secondary btn-sm" (click)="openRelModal()">+ Add relationship</button>
          </div>

          @if (relationships().length === 0) {
            <app-empty-state icon="🕸️" title="No relationships yet" description="Link this character to others — friends, rivals, family, mentors, enemies." actionLabel="Add relationship" (action)="openRelModal()" />
          } @else {
            <div>
              @for (rel of relationships(); track rel.id) {
                <div class="rel-item">
                  <span class="badge" [class.badge-danger]="rel.type === 'enemy' || rel.type === 'rival'"
                        [class.badge-success]="rel.type === 'friend' || rel.type === 'ally' || rel.type === 'family' || rel.type === 'lover'">{{ rel.type }}</span>
                  <div style="flex: 1;">
                    <a [routerLink]="['/stories', storyId, 'characters', rel.otherCharacter.id]" style="font-weight: 600;">{{ rel.otherCharacter.name }}</a>
                    <span class="muted" style="font-size: 0.75rem; display: block;">{{ rel.direction === 'outgoing' ? '→' : '←' }} {{ rel.description || 'No description' }}</span>
                  </div>
                  <button class="icon-btn" (click)="removeRel(rel)">🗑</button>
                </div>
              }
            </div>
          }
        }
      } @else {
        <app-empty-state icon="🔍" title="Character not found" description="This character may have been deleted." actionLabel="Back to characters" (action)="router.navigate(['/stories', storyId, 'characters'])" />
      }
    </div>

    <!-- Add relationship modal -->
    @if (showRel()) {
      <app-modal title="Add relationship" (close)="showRel.set(false)">
        <div class="form-group">
          <label for="relTarget">With whom?</label>
          <select id="relTarget" [(ngModel)]="relForm.targetCharacterId">
            <option value="">— Select a character —</option>
            @for (other of others(); track other.id) {
              <option [value]="other.id">{{ other.name }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label for="relType">Relationship</label>
          <select id="relType" [(ngModel)]="relForm.type">
            <option value="friend">Friend</option>
            <option value="ally">Ally</option>
            <option value="rival">Rival</option>
            <option value="enemy">Enemy</option>
            <option value="family">Family</option>
            <option value="lover">Lover</option>
            <option value="mentor">Mentor</option>
          </select>
        </div>
        <div class="form-group">
          <label for="relDesc">Description (optional)</label>
          <input id="relDesc" [(ngModel)]="relForm.description" placeholder="Childhood friends from the harbor…" />
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0;">
          <button class="btn btn-secondary" (click)="showRel.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="addRel()" [disabled]="!relForm.targetCharacterId">Add relationship</button>
        </div>
      </app-modal>
    }

    @if (confirmDelete()) {
      <app-confirm-dialog title="Delete character?" message="This will delete the character and all their relationships. This cannot be undone." confirmLabel="Delete" [danger]="true" (confirm)="deleteChar()" (cancel)="confirmDelete.set(false)" />
    }
  `,
  styles: [`
    .profile-grid { display: grid; gap: var(--space-xl); }
  `]
})
export class CharacterDetailPage {
  public characterService = inject(CharacterService);
  public storyService = inject(StoryService);
  public router = inject(Router);
  private route = inject(ActivatedRoute);

  storyId = '';
  characterId = '';
  tab = signal<'profile' | 'relationships'>('profile');
  editing = signal(false);
  saving = signal(false);
  confirmDelete = signal(false);
  showRel = signal(false);
  relationships = signal<CharacterRelationship[]>([]);
  editForm = { name: '', role: '', age: null as number | null, traits: '', appearance: '', backstory: '', goals: '' };
  relForm = { targetCharacterId: '', type: 'friend', description: '' };

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      this.storyId = params.get('storyId')!;
      this.characterId = params.get('characterId')!;
      await this.storyService.getStory(this.storyId);
      await this.characterService.loadCharacters(this.storyId);
      await this.refresh();
    });
  }

  character(): Character | null {
    return this.characterService.currentCharacter() ?? null;
  }

  async refresh() {
    await this.characterService.getCharacter(this.characterId);
    this.relationships.set(await this.characterService.getRelationships(this.characterId));
  }

  traits(c: Character): string[] {
    return (c.traits ?? '').split(',').map(t => t.trim()).filter(Boolean);
  }

  others(): Character[] {
    return this.characterService.characters().filter(c => c.id !== this.characterId);
  }

  openEdit() {
    const c = this.character();
    if (!c) return;
    this.editForm = {
      name: c.name, role: c.role ?? '', age: c.age,
      traits: c.traits ?? '', appearance: c.appearance ?? '',
      backstory: c.backstory ?? '', goals: c.goals ?? '',
    };
    this.editing.set(true);
  }

  async saveEdit() {
    this.saving.set(true);
    try {
      await this.characterService.updateCharacter(this.characterId, {
        name: this.editForm.name.trim() || this.character()!.name,
        role: this.editForm.role.trim() || null,
        age: this.editForm.age,
        traits: this.editForm.traits.trim() || null,
        appearance: this.editForm.appearance.trim() || null,
        backstory: this.editForm.backstory.trim() || null,
        goals: this.editForm.goals.trim() || null,
      });
      this.editing.set(false);
      await this.refresh();
    } finally {
      this.saving.set(false);
    }
  }

  openRelModal() {
    this.relForm = { targetCharacterId: '', type: 'friend', description: '' };
    this.showRel.set(true);
  }

  async addRel() {
    if (!this.relForm.targetCharacterId) return;
    await this.characterService.addRelationship(this.characterId, {
      targetCharacterId: this.relForm.targetCharacterId,
      type: this.relForm.type,
      description: this.relForm.description.trim() || undefined,
    });
    this.showRel.set(false);
    await this.refresh();
  }

  async removeRel(rel: CharacterRelationship) {
    await this.characterService.removeRelationship(rel.id);
    await this.refresh();
  }

  async deleteChar() {
    await this.characterService.deleteCharacter(this.characterId);
    this.router.navigate(['/stories', this.storyId, 'characters']);
  }
}

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { StoryService } from '../../services/story.service';

@Component({
  selector: 'app-character-form',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="container page" style="max-width: 720px;">
      <div class="page-header">
        <div>
          <a [routerLink]="['/stories', storyId, 'characters']" class="muted" style="font-size: 0.813rem;">← Characters</a>
          <h1 style="margin-top: 4px;">New character</h1>
        </div>
      </div>

      <div class="card">
        <div class="form-group">
          <label for="name">Name *</label>
          <input id="name" [(ngModel)]="form.name" placeholder="Kael Ashford" />
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr;">
          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" [(ngModel)]="form.role">
              <option value="">— Select a role —</option>
              <option value="protagonist">Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="side">Side character</option>
              <option value="mentor">Mentor</option>
              <option value="supporting">Supporting</option>
            </select>
          </div>
          <div class="form-group">
            <label for="age">Age (optional)</label>
            <input id="age" type="number" min="0" [(ngModel)]="form.age" />
          </div>
        </div>

        <div class="form-group">
          <label for="traits">Traits (comma-separated)</label>
          <input id="traits" [(ngModel)]="form.traits" placeholder="stubborn, curious, loyal" />
        </div>

        <div class="form-group">
          <label for="appearance">Appearance</label>
          <textarea id="appearance" rows="2" [(ngModel)]="form.appearance" placeholder="Physical description…"></textarea>
        </div>

        <div class="form-group">
          <label for="backstory">Backstory</label>
          <textarea id="backstory" rows="4" [(ngModel)]="form.backstory" placeholder="Where did they come from? What shaped them?"></textarea>
        </div>

        <div class="form-group">
          <label for="goals">Goals</label>
          <textarea id="goals" rows="2" [(ngModel)]="form.goals" placeholder="What do they want most?"></textarea>
        </div>

        <div class="form-group">
          <label>Avatar color</label>
          <div class="flex gap-sm">
            @for (c of colors; track c) {
              <button type="button" class="swatch" [style.background]="c" [class.selected]="form.avatarColor === c" (click)="form.avatarColor = c"></button>
            }
          </div>
        </div>

        @if (error()) {
          <div class="form-alert form-alert-error">{{ error() }}</div>
        }

        <div class="flex gap-sm" style="justify-content: flex-end; margin-top: var(--space-lg);">
          <a class="btn btn-secondary" [routerLink]="['/stories', storyId, 'characters']">Cancel</a>
          <button class="btn btn-primary" (click)="save()" [disabled]="!form.name.trim() || saving()">
            {{ saving() ? 'Creating…' : 'Create character' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .swatch { width: 30px; height: 30px; border-radius: var(--radius-full); border: 2px solid transparent; cursor: pointer; }
    .swatch.selected { border-color: var(--color-text); }
  `]
})
export class CharacterFormPage {
  private characterService = inject(CharacterService);
  private storyService = inject(StoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  storyId = '';
  saving = signal(false);
  error = signal('');
  colors = ['#5C2D1A', '#8B5E3C', '#C4953C', '#4A8C5C', '#3E5C76', '#7A4A8C', '#C44A3F', '#2A1F1A'];

  form = {
    name: '',
    role: '',
    age: null as number | null,
    traits: '',
    appearance: '',
    backstory: '',
    goals: '',
    avatarColor: '#5C2D1A',
  };

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.storyId = params.get('storyId')!;
      this.storyService.getStory(this.storyId);
    });
  }

  async save() {
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const character = await this.characterService.createCharacter(this.storyId, {
        name: this.form.name.trim(),
        role: this.form.role || null,
        age: this.form.age,
        traits: this.form.traits.trim() || null,
        appearance: this.form.appearance.trim() || null,
        backstory: this.form.backstory.trim() || null,
        goals: this.form.goals.trim() || null,
        avatarColor: this.form.avatarColor,
      });
      this.router.navigate(['/stories', this.storyId, 'characters', character.id]);
    } catch (e: unknown) {
      this.error.set((e as { error?: { message?: string } })?.error?.message ?? 'Could not create character');
    } finally {
      this.saving.set(false);
    }
  }
}

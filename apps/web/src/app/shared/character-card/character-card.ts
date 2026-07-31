import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Character } from '../../models/models';

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="card character-card card-hover" [routerLink]="['/stories', character().storyId, 'characters', character().id]">
      <div class="avatar" [style.background]="character().avatarColor || 'var(--color-primary)'">
        {{ character().name.charAt(0) }}
      </div>
      <div style="min-width: 0;">
        <div style="font-weight: 600;">{{ character().name }}</div>
        @if (character().role) {
          <span class="badge" style="margin-top: 4px;">{{ character().role }}</span>
        }
        @if (traitList().length) {
          <div class="flex gap-sm wrap" style="margin-top: 6px;">
            @for (trait of traitList().slice(0, 3); track trait) {
              <span class="badge badge-accent">{{ trait }}</span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [` .character-card { min-height: 84px; } `]
})
export class CharacterCard {
  character = input.required<Character>();

  traitList() {
    return (this.character().traits ?? '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }
}

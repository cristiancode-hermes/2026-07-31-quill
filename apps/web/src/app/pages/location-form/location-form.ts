import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../../services/location.service';
import { StoryService } from '../../services/story.service';
import type { Location } from '../../models/models';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="container page" style="max-width: 720px;">
      <div class="page-header">
        <div>
          <a [routerLink]="['/stories', storyId, 'locations']" class="muted" style="font-size: 0.813rem;">← Locations</a>
          <h1 style="margin-top: 4px;">New location</h1>
        </div>
      </div>

      <div class="card">
        <div class="form-group">
          <label for="name">Name *</label>
          <input id="name" [(ngModel)]="form.name" placeholder="The Verdant Reach" />
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr;">
          <div class="form-group">
            <label for="type">Type *</label>
            <select id="type" [(ngModel)]="form.type">
              <option value="world">World</option>
              <option value="continent">Continent</option>
              <option value="realm">Realm</option>
              <option value="region">Region</option>
              <option value="city">City</option>
              <option value="town">Town</option>
              <option value="building">Building</option>
              <option value="room">Room</option>
              <option value="landmark">Landmark</option>
            </select>
          </div>
          <div class="form-group">
            <label for="parent">Located within</label>
            <select id="parent" [(ngModel)]="form.parentId">
              <option [value]="null">— None (top level) —</option>
              @for (loc of locations(); track loc.id) {
                <option [value]="loc.id">{{ loc.name }}</option>
              }
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" rows="4" [(ngModel)]="form.description" placeholder="What does this place look, sound, and smell like?"></textarea>
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr;">
          <div class="form-group">
            <label for="climate">Climate</label>
            <input id="climate" [(ngModel)]="form.climate" placeholder="Temperate, foggy mornings" />
          </div>
          <div class="form-group">
            <label for="population">Population (optional)</label>
            <input id="population" type="number" min="0" [(ngModel)]="form.population" />
          </div>
        </div>

        @if (error()) {
          <div class="form-alert form-alert-error">{{ error() }}</div>
        }

        <div class="flex gap-sm" style="justify-content: flex-end; margin-top: var(--space-lg);">
          <a class="btn btn-secondary" [routerLink]="['/stories', storyId, 'locations']">Cancel</a>
          <button class="btn btn-primary" (click)="save()" [disabled]="!form.name.trim() || saving()">
            {{ saving() ? 'Creating…' : 'Create location' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class LocationFormPage {
  private locationService = inject(LocationService);
  private storyService = inject(StoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  storyId = '';
  locations = signal<Location[]>([]);
  saving = signal(false);
  error = signal('');

  form = {
    name: '',
    type: 'region',
    parentId: null as string | null,
    description: '',
    climate: '',
    population: null as number | null,
  };

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      this.storyId = params.get('storyId')!;
      await this.storyService.getStory(this.storyId);
      this.locations.set(await this.locationService.loadLocations(this.storyId));
    });
  }

  async save() {
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const location = await this.locationService.createLocation(this.storyId, {
        name: this.form.name.trim(),
        type: this.form.type,
        parentId: this.form.parentId || null,
        description: this.form.description.trim() || null,
        climate: this.form.climate.trim() || null,
        population: this.form.population,
      });
      this.router.navigate(['/stories', this.storyId, 'locations', location.id]);
    } catch (e: unknown) {
      this.error.set((e as { error?: { message?: string } })?.error?.message ?? 'Could not create location');
    } finally {
      this.saving.set(false);
    }
  }
}

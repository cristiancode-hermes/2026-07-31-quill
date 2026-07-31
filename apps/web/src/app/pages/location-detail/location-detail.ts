import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { LocationService } from '../../services/location.service';
import { StoryService } from '../../services/story.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/empty-state/empty-state';
import type { Location } from '../../models/models';

@Component({
  selector: 'app-location-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, ConfirmDialog, EmptyState, DecimalPipe],
  template: `
    <div class="container page" style="max-width: 760px;">
      @if (location(); as loc) {
        <div class="page-header">
          <div>
            <a [routerLink]="['/stories', storyId, 'locations']" class="muted" style="font-size: 0.813rem;">← Locations</a>
            <h1 style="margin-top: 4px;">{{ loc.name }}</h1>
            <div class="flex gap-sm" style="margin-top: 4px;">
              <span class="badge badge-accent">{{ loc.type }}</span>
              @if (parentName(); as p) { <span class="muted" style="font-size: 0.813rem;">within {{ p }}</span> }
              @if (loc.population) { <span class="mono muted">{{ loc.population | number }} residents</span> }
            </div>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-secondary" (click)="editing.set(!editing())">{{ editing() ? 'Done editing' : '✏ Edit' }}</button>
            <button class="btn btn-danger" (click)="confirmDelete.set(true)">🗑</button>
          </div>
        </div>

        @if (!editing()) {
          @if (loc.description) {
            <div class="card serif" style="font-size: 1rem; line-height: 1.75; margin-bottom: var(--space-lg);">
              {{ loc.description }}
            </div>
          }
          @if (loc.climate) {
            <div class="stat-card" style="display: inline-block; margin-bottom: var(--space-lg);">
              <div class="stat-label">Climate</div>
              <div style="margin-top: 4px;">{{ loc.climate }}</div>
            </div>
          }
        } @else {
          <div class="card">
            <div class="form-group"><label>Name</label><input [(ngModel)]="editForm.name" /></div>
            <div class="grid" style="grid-template-columns: 1fr 1fr;">
              <div class="form-group">
                <label>Type</label>
                <select [(ngModel)]="editForm.type">
                  <option value="world">World</option><option value="continent">Continent</option>
                  <option value="realm">Realm</option><option value="region">Region</option>
                  <option value="city">City</option><option value="town">Town</option>
                  <option value="building">Building</option><option value="room">Room</option>
                  <option value="landmark">Landmark</option>
                </select>
              </div>
              <div class="form-group">
                <label>Population</label>
                <input type="number" min="0" [(ngModel)]="editForm.population" />
              </div>
            </div>
            <div class="form-group"><label>Climate</label><input [(ngModel)]="editForm.climate" /></div>
            <div class="form-group"><label>Description</label><textarea rows="4" [(ngModel)]="editForm.description"></textarea></div>
            <div class="flex gap-sm" style="justify-content: flex-end;">
              <button class="btn btn-primary" (click)="saveEdit()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save changes' }}</button>
            </div>
          </div>
        }

        @if (children().length > 0) {
          <h2 style="margin: var(--space-2xl) 0 var(--space-lg);">Places within</h2>
          <div class="card">
            @for (child of children(); track child.id) {
              <div class="tree-item" (click)="go(child.id)">
                <span>📍</span>
                <span style="flex: 1; font-weight: 500;">{{ child.name }}</span>
                <span class="badge badge-accent">{{ child.type }}</span>
              </div>
            }
          </div>
        }
      } @else {
        <app-empty-state icon="🔍" title="Location not found" description="This location may have been deleted." actionLabel="Back to locations" (action)="router.navigate(['/stories', storyId, 'locations'])" />
      }
    </div>

    @if (confirmDelete()) {
      <app-confirm-dialog title="Delete location?" message="Children of this location will move to the top level. This cannot be undone." confirmLabel="Delete" [danger]="true" (confirm)="deleteLoc()" (cancel)="confirmDelete.set(false)" />
    }
  `
})
export class LocationDetailPage {
  public locationService = inject(LocationService);
  public storyService = inject(StoryService);
  public router = inject(Router);
  private route = inject(ActivatedRoute);

  storyId = '';
  locationId = '';
  editing = signal(false);
  saving = signal(false);
  confirmDelete = signal(false);
  location = signal<Location | null>(null);
  children = signal<Location[]>([]);
  editForm = { name: '', type: 'region', description: '', climate: '', population: null as number | null };

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      this.storyId = params.get('storyId')!;
      this.locationId = params.get('locationId')!;
      await this.storyService.getStory(this.storyId);
      await this.refresh();
    });
  }

  async refresh() {
    const loc = await this.locationService.getLocation(this.locationId);
    this.location.set(loc);
    this.children.set(loc.children ?? []);
  }

  parentName(): string | null {
    const loc = this.location();
    if (!loc?.parentId) return null;
    return this.locationService.locations().find(l => l.id === loc.parentId)?.name ?? null;
  }

  go(id: string) {
    window.location.href = `/stories/${this.storyId}/locations/${id}`;
  }

  async saveEdit() {
    this.saving.set(true);
    try {
      await this.locationService.updateLocation(this.locationId, {
        name: this.editForm.name.trim() || this.location()!.name,
        type: this.editForm.type,
        description: this.editForm.description.trim() || null,
        climate: this.editForm.climate.trim() || null,
        population: this.editForm.population,
      });
      this.editing.set(false);
      await this.refresh();
    } finally {
      this.saving.set(false);
    }
  }

  async deleteLoc() {
    await this.locationService.deleteLocation(this.locationId);
    this.router.navigate(['/stories', this.storyId, 'locations']);
  }
}

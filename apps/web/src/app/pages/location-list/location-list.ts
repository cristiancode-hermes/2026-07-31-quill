import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { StoryService } from '../../services/story.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { LocationNode } from '../../shared/location-node/location-node';
import type { Location } from '../../models/models';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [RouterLink, EmptyState, LocationNode],
  template: `
    <div class="container page" style="max-width: 860px;">
      <div class="page-header">
        <div>
          <a [routerLink]="['/stories', storyId]" class="muted" style="font-size: 0.813rem;">← {{ story()?.title ?? 'Story' }}</a>
          <h1 style="margin-top: 4px;">Locations</h1>
          <p class="subtitle">The world your story lives in — realms, cities, rooms, and the spaces between.</p>
        </div>
        <a class="btn btn-primary" [routerLink]="['/stories', storyId, 'locations', 'new']">+ New location</a>
      </div>

      @if (locationService.isLoading() && tree().length === 0) {
        <div class="skeleton" style="height: 200px;"></div>
      } @else if (tree().length === 0) {
        <app-empty-state
          icon="🗺️"
          title="No locations yet"
          description="Build your world from the ground up — continents, cities, buildings, and landmarks. Locations nest inside each other."
          actionLabel="Create your first location"
          (action)="goNew()"
        />
      } @else {
        <div class="card">
          @for (node of tree(); track node.id) {
            <app-location-node [location]="node" [depth]="0" [storyId]="storyId" (navigate)="goLocation($event)" />
          }
        </div>
      }
    </div>
  `
})
export class LocationListPage {
  public locationService = inject(LocationService);
  public storyService = inject(StoryService);
  private route = inject(ActivatedRoute);

  storyId = '';
  tree = signal<Location[]>([]);

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      this.storyId = params.get('storyId')!;
      await this.storyService.getStory(this.storyId);
      await this.refresh();
    });
  }

  story() {
    return this.storyService.currentStory();
  }

  async refresh() {
    this.tree.set(await this.locationService.loadTree(this.storyId));
  }

  goNew() {
    window.location.href = `/stories/${this.storyId}/locations/new`;
  }

  goLocation(id: string) {
    window.location.href = `/stories/${this.storyId}/locations/${id}`;
  }
}

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TimelineService } from '../../services/timeline.service';
import { StoryService } from '../../services/story.service';
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Modal } from '../../shared/modal/modal';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import type { TimelineEvent } from '../../models/models';

const TYPE_COLORS: Record<string, string> = {
  plot: '#C4953C',
  character: '#8B5E3C',
  location: '#4A8C5C',
  battle: '#C44A3F',
  revelation: '#3E5C76',
};

@Component({
  selector: 'app-timeline-view',
  standalone: true,
  imports: [RouterLink, FormsModule, EmptyState, Modal, ConfirmDialog],
  template: `
    <div class="container page" style="max-width: 820px;">
      <div class="page-header">
        <div>
          <a [routerLink]="['/stories', storyId]" class="muted" style="font-size: 0.813rem;">← {{ story()?.title ?? 'Story' }}</a>
          <h1 style="margin-top: 4px;">Timeline</h1>
          <p class="subtitle">The spine of your plot — every event in order, with the characters and places it touches.</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">+ Add event</button>
      </div>

      <div class="chips">
        <button class="chip" [class.active]="typeFilter() === ''" (click)="typeFilter.set('')">All</button>
        @for (t of ['plot', 'character', 'location', 'battle', 'revelation']; track t) {
          <button class="chip" [class.active]="typeFilter() === t" (click)="typeFilter.set(t)">{{ t }}</button>
        }
      </div>

      @if (timelineService.isLoading() && events().length === 0) {
        <div class="skeleton" style="height: 260px;"></div>
      } @else if (filtered().length === 0 && events().length > 0) {
        <app-empty-state icon="🔍" title="No events of this type" description="Try a different filter." />
      } @else if (events().length === 0) {
        <app-empty-state
          icon="⏳"
          title="No events yet"
          description="Start building your timeline — key plot beats, character turns, battles, and revelations."
          actionLabel="Add your first event"
          (action)="openNew()"
        />
      } @else {
        <div class="timeline">
          @for (event of filtered(); track event.id) {
            <div class="timeline-item">
              <div class="timeline-dot" [style.background]="typeColor(event.eventType)"></div>
              <div class="card">
                <div class="flex-between" style="margin-bottom: var(--space-sm);">
                  <div class="flex gap-sm" style="align-items: center;">
                    <span class="timeline-date">Day {{ event.eventDate }}</span>
                    <span class="badge">{{ event.eventType }}</span>
                    @if (event.importance >= 4) {
                      <span class="badge badge-warning">★ important</span>
                    }
                  </div>
                  <button class="icon-btn" (click)="confirmDelete.set(event)">🗑</button>
                </div>
                <h3 style="margin-bottom: var(--space-xs);">{{ event.title }}</h3>
                <p class="serif muted" style="font-size: 0.9rem;">{{ event.description }}</p>
                @if (event.characters?.length || event.locations?.length) {
                  <div class="flex gap-sm wrap" style="margin-top: var(--space-md);">
                    @for (c of event.characters ?? []; track c.id) {
                      <span class="badge badge-accent">🧙 {{ c.name }}</span>
                    }
                    @for (l of event.locations ?? []; track l.id) {
                      <span class="badge">📍 {{ l.name }}</span>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- New event modal -->
    @if (showNew()) {
      <app-modal title="Add timeline event" (close)="showNew.set(false)">
        <div class="form-group">
          <label for="evTitle">Title *</label>
          <input id="evTitle" [(ngModel)]="evForm.title" placeholder="The Fall of the Amber Throne" />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr;">
          <div class="form-group">
            <label for="evDate">Story day</label>
            <input id="evDate" type="number" [(ngModel)]="evForm.eventDate" />
          </div>
          <div class="form-group">
            <label for="evType">Type</label>
            <select id="evType" [(ngModel)]="evForm.eventType">
              <option value="plot">Plot</option>
              <option value="character">Character</option>
              <option value="location">Location</option>
              <option value="battle">Battle</option>
              <option value="revelation">Revelation</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="evImportance">Importance (1–5)</label>
          <div class="flex gap-sm">
            @for (n of [1, 2, 3, 4, 5]; track n) {
              <button type="button" class="chip" [class.active]="evForm.importance === n" (click)="evForm.importance = n">{{ n }}</button>
            }
          </div>
        </div>
        <div class="form-group">
          <label for="evDesc">Description *</label>
          <textarea id="evDesc" rows="3" [(ngModel)]="evForm.description" placeholder="What happens?"></textarea>
        </div>
        <div class="form-group">
          <label>Characters involved</label>
          <div class="chips">
            @for (c of characters(); track c.id) {
              <button type="button" class="chip" [class.active]="evForm.characterIds.includes(c.id)" (click)="toggleChar(c.id)">{{ c.name }}</button>
            }
          </div>
        </div>
        <div class="form-group">
          <label>Locations</label>
          <div class="chips">
            @for (l of locations(); track l.id) {
              <button type="button" class="chip" [class.active]="evForm.locationIds.includes(l.id)" (click)="toggleLoc(l.id)">{{ l.name }}</button>
            }
          </div>
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0;">
          <button class="btn btn-secondary" (click)="showNew.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="createEvent()" [disabled]="!evForm.title.trim() || !evForm.description.trim()">Add event</button>
        </div>
      </app-modal>
    }

    @if (confirmDelete(); as target) {
      <app-confirm-dialog title="Delete event?" message="This will remove the event from the timeline." confirmLabel="Delete" [danger]="true" (confirm)="removeEvent(target)" (cancel)="confirmDelete.set(null)" />
    }
  `
})
export class TimelineViewPage {
  public timelineService = inject(TimelineService);
  public storyService = inject(StoryService);
  public characterService = inject(CharacterService);
  public locationService = inject(LocationService);
  private route = inject(ActivatedRoute);

  storyId = '';
  typeFilter = signal('');
  showNew = signal(false);
  confirmDelete = signal<TimelineEvent | null>(null);
  events = signal<TimelineEvent[]>([]);
  characters = signal<{ id: string; name: string }[]>([]);
  locations = signal<{ id: string; name: string }[]>([]);

  evForm = {
    title: '',
    description: '',
    eventDate: 1,
    eventType: 'plot',
    importance: 1,
    characterIds: [] as string[],
    locationIds: [] as string[],
  };

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
    this.events.set(await this.timelineService.loadEvents(this.storyId));
    const chars = await this.characterService.loadCharacters(this.storyId);
    this.characters.set(chars.map(c => ({ id: c.id, name: c.name })));
    const locs = await this.locationService.loadLocations(this.storyId);
    this.locations.set(locs.map(l => ({ id: l.id, name: l.name })));
  }

  filtered(): TimelineEvent[] {
    const f = this.typeFilter();
    if (!f) return this.events();
    return this.events().filter(e => e.eventType === f);
  }

  typeColor(type: string): string {
    return TYPE_COLORS[type] ?? '#C4953C';
  }

  openNew() {
    this.evForm = { title: '', description: '', eventDate: (this.events().at(-1)?.eventDate ?? 0) + 1, eventType: 'plot', importance: 1, characterIds: [], locationIds: [] };
    this.showNew.set(true);
  }

  toggleChar(id: string) {
    const list = this.evForm.characterIds;
    this.evForm.characterIds = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
  }

  toggleLoc(id: string) {
    const list = this.evForm.locationIds;
    this.evForm.locationIds = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
  }

  async createEvent() {
    await this.timelineService.createEvent(this.storyId, {
      title: this.evForm.title.trim(),
      description: this.evForm.description.trim(),
      eventDate: Number(this.evForm.eventDate) || 1,
      eventType: this.evForm.eventType,
      importance: this.evForm.importance,
      characterIds: this.evForm.characterIds,
      locationIds: this.evForm.locationIds,
    });
    this.showNew.set(false);
    await this.refresh();
  }

  async removeEvent(event: TimelineEvent) {
    await this.timelineService.deleteEvent(event.id);
    this.confirmDelete.set(null);
    await this.refresh();
  }
}

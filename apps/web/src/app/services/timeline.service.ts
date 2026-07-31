import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { TimelineEvent } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private readonly api = '/api';

  readonly events = signal<TimelineEvent[]>([]);
  readonly isLoading = signal(false);

  constructor(private http: HttpClient) {}

  async loadEvents(storyId: string): Promise<TimelineEvent[]> {
    this.isLoading.set(true);
    try {
      const events = await firstValueFrom(this.http.get<TimelineEvent[]>(`${this.api}/stories/${storyId}/timeline`));
      this.events.set(events);
      return events;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createEvent(storyId: string, data: Partial<TimelineEvent> & { characterIds?: string[]; locationIds?: string[] }): Promise<TimelineEvent> {
    const event = await firstValueFrom(this.http.post<TimelineEvent>(`${this.api}/stories/${storyId}/timeline`, data));
    this.events.update(list => [...list, event].sort((a, b) => a.eventDate - b.eventDate));
    return event;
  }

  async updateEvent(id: string, data: Partial<TimelineEvent> & { characterIds?: string[]; locationIds?: string[] }): Promise<TimelineEvent> {
    const event = await firstValueFrom(this.http.patch<TimelineEvent>(`${this.api}/timeline/${id}`, data));
    this.events.update(list => list.map(e => e.id === id ? { ...e, ...event } : e));
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/timeline/${id}`));
    this.events.update(list => list.filter(e => e.id !== id));
  }
}

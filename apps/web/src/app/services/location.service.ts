import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Location } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly api = '/api';

  readonly locations = signal<Location[]>([]);
  readonly tree = signal<Location[]>([]);
  readonly isLoading = signal(false);

  constructor(private http: HttpClient) {}

  async loadLocations(storyId: string): Promise<Location[]> {
    this.isLoading.set(true);
    try {
      const locations = await firstValueFrom(this.http.get<Location[]>(`${this.api}/stories/${storyId}/locations`));
      this.locations.set(locations);
      return locations;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadTree(storyId: string): Promise<Location[]> {
    const tree = await firstValueFrom(this.http.get<Location[]>(`${this.api}/stories/${storyId}/locations/tree`));
    this.tree.set(tree);
    return tree;
  }

  async getLocation(id: string): Promise<Location> {
    return firstValueFrom(this.http.get<Location>(`${this.api}/locations/${id}`));
  }

  async createLocation(storyId: string, data: Partial<Location>): Promise<Location> {
    const location = await firstValueFrom(this.http.post<Location>(`${this.api}/stories/${storyId}/locations`, data));
    this.locations.update(list => [...list, location]);
    return location;
  }

  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    const location = await firstValueFrom(this.http.patch<Location>(`${this.api}/locations/${id}`, data));
    this.locations.update(list => list.map(l => l.id === id ? { ...l, ...location } : l));
    return location;
  }

  async deleteLocation(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/locations/${id}`));
    this.locations.update(list => list.filter(l => l.id !== id));
  }
}

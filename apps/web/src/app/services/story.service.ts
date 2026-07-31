import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Story, StoryDetail, StoryStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StoryService {
  private readonly api = '/api';

  readonly stories = signal<Story[]>([]);
  readonly currentStory = signal<StoryDetail | null>(null);
  readonly isLoading = signal(false);

  constructor(private http: HttpClient) {}

  async loadStories(): Promise<Story[]> {
    this.isLoading.set(true);
    try {
      const stories = await firstValueFrom(this.http.get<Story[]>(`${this.api}/stories`));
      this.stories.set(stories);
      return stories;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getStory(id: string): Promise<StoryDetail> {
    const story = await firstValueFrom(this.http.get<StoryDetail>(`${this.api}/stories/${id}`));
    this.currentStory.set(story);
    return story;
  }

  async createStory(data: { title: string; genre?: string; synopsis?: string; coverColor?: string }): Promise<Story> {
    const story = await firstValueFrom(this.http.post<Story>(`${this.api}/stories`, data));
    this.stories.update(list => [story, ...list]);
    return story;
  }

  async updateStory(id: string, data: Partial<Story>): Promise<Story> {
    const story = await firstValueFrom(this.http.patch<Story>(`${this.api}/stories/${id}`, data));
    this.stories.update(list => list.map(s => s.id === id ? story : s));
    return story;
  }

  async deleteStory(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/stories/${id}`));
    this.stories.update(list => list.filter(s => s.id !== id));
  }

  async getStoryStats(id: string): Promise<StoryStats> {
    return firstValueFrom(this.http.get<StoryStats>(`${this.api}/stats/story/${id}`));
  }
}

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Chapter } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ChapterService {
  private readonly api = '/api';

  readonly chapters = signal<Chapter[]>([]);
  readonly currentChapter = signal<Chapter | null>(null);
  readonly isLoading = signal(false);

  constructor(private http: HttpClient) {}

  async loadChapters(storyId: string): Promise<Chapter[]> {
    this.isLoading.set(true);
    try {
      const chapters = await firstValueFrom(this.http.get<Chapter[]>(`${this.api}/stories/${storyId}/chapters`));
      this.chapters.set(chapters);
      return chapters;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getChapter(id: string): Promise<Chapter> {
    const chapter = await firstValueFrom(this.http.get<Chapter>(`${this.api}/chapters/${id}`));
    this.currentChapter.set(chapter);
    return chapter;
  }

  async createChapter(storyId: string, data: { title: string; wordGoal?: number; notes?: string }): Promise<Chapter> {
    const chapter = await firstValueFrom(this.http.post<Chapter>(`${this.api}/stories/${storyId}/chapters`, data));
    this.chapters.update(list => [...list, chapter]);
    return chapter;
  }

  async updateChapter(id: string, data: Partial<Chapter>): Promise<Chapter> {
    const chapter = await firstValueFrom(this.http.patch<Chapter>(`${this.api}/chapters/${id}`, data));
    this.chapters.update(list => list.map(c => c.id === id ? { ...c, ...chapter } : c));
    return chapter;
  }

  async deleteChapter(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/chapters/${id}`));
    this.chapters.update(list => list.filter(c => c.id !== id));
  }

  async reorderChapters(storyId: string, orderedIds: string[]): Promise<Chapter[]> {
    const chapters = await firstValueFrom(this.http.put<Chapter[]>(`${this.api}/stories/${storyId}/chapters/reorder`, { orderedIds }));
    this.chapters.set(chapters);
    return chapters;
  }
}

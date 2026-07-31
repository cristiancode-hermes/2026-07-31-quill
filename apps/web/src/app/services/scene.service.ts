import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Scene } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SceneService {
  private readonly api = '/api';

  readonly scenes = signal<Scene[]>([]);
  readonly currentScene = signal<Scene | null>(null);
  readonly isSaving = signal(false);
  readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient) {}

  async loadScenes(chapterId: string): Promise<Scene[]> {
    const scenes = await firstValueFrom(this.http.get<Scene[]>(`${this.api}/chapters/${chapterId}/scenes`));
    this.scenes.set(scenes);
    return scenes;
  }

  async getScene(id: string): Promise<Scene> {
    const scene = await firstValueFrom(this.http.get<Scene>(`${this.api}/scenes/${id}`));
    this.currentScene.set(scene);
    return scene;
  }

  async createScene(chapterId: string, data: { title?: string; content?: string }): Promise<Scene> {
    const scene = await firstValueFrom(this.http.post<Scene>(`${this.api}/chapters/${chapterId}/scenes`, data));
    this.scenes.update(list => [...list, scene]);
    return scene;
  }

  async updateScene(id: string, data: Partial<Scene>): Promise<Scene> {
    const scene = await firstValueFrom(this.http.patch<Scene>(`${this.api}/scenes/${id}`, data));
    this.scenes.update(list => list.map(s => s.id === id ? { ...s, ...scene } : s));
    return scene;
  }

  async deleteScene(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/scenes/${id}`));
    this.scenes.update(list => list.filter(s => s.id !== id));
  }

  /** Debounced auto-save */
  scheduleAutoSave(id: string, content: string, title?: string | null): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveNow(id, content, title);
    }, 1500);
  }

  async saveNow(id: string, content: string, title?: string | null): Promise<void> {
    this.saveState.set('saving');
    try {
      const payload: Record<string, string> = { content };
      if (title !== undefined && title !== null) payload['title'] = title;
      await this.updateScene(id, payload);
      this.saveState.set('saved');
      setTimeout(() => this.saveState.set('idle'), 2000);
    } catch {
      this.saveState.set('error');
    }
  }
}

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { DashboardStats, WeeklyWords, WritingSession } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly api = '/api';

  readonly dashboard = signal<DashboardStats | null>(null);
  readonly weekly = signal<WeeklyWords[]>([]);
  readonly isLoading = signal(false);

  constructor(private http: HttpClient) {}

  async loadDashboard(): Promise<DashboardStats> {
    this.isLoading.set(true);
    try {
      const stats = await firstValueFrom(this.http.get<DashboardStats>(`${this.api}/stats/dashboard`));
      this.dashboard.set(stats);
      return stats;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadWeeklyWords(): Promise<WeeklyWords[]> {
    const weekly = await firstValueFrom(this.http.get<WeeklyWords[]>(`${this.api}/stats/weekly-words`));
    this.weekly.set(weekly);
    return weekly;
  }

  async logWritingSession(data: { wordsWritten: number; durationMinutes: number; storyId?: string; notes?: string; sessionDate?: string }): Promise<WritingSession> {
    const session = await firstValueFrom(this.http.post<WritingSession>(`${this.api}/writing-sessions`, data));
    // Refresh dashboard after logging
    await this.loadDashboard();
    await this.loadWeeklyWords();
    return session;
  }

  async getSessions(): Promise<WritingSession[]> {
    return firstValueFrom(this.http.get<WritingSession[]>(`${this.api}/writing-sessions`));
  }
}

import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { StoryService } from '../../services/story.service';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div style="display: flex; align-items: center; gap: var(--space-md);">
        <button class="icon-btn" (click)="sidebarOpen.set(!sidebarOpen())" aria-label="Toggle story menu" style="display: none;">
          ☰
        </button>
        <a routerLink="/dashboard" class="nav-logo">
          <span class="nav-logo-icon">✒</span>
          Quill
        </a>
      </div>

      <div class="nav-links">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-link" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
        <a routerLink="/stories" routerLinkActive="active" class="nav-link">Stories</a>
        @if (currentStory(); as story) {
          <a [routerLink]="['/stories', story.id, 'chapters']" class="nav-link" style="color: var(--color-secondary); font-weight: 600;">{{ story.title }}</a>
        }
      </div>

      <div class="nav-actions">
        <button class="icon-btn" (click)="theme.toggle()" [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
          {{ theme.isDark() ? '☀' : '☾' }}
        </button>
        @if (auth.currentUser(); as user) {
          <a routerLink="/settings" class="avatar" [style.background]="'var(--color-primary)'" style="width: 34px; height: 34px; font-size: 0.875rem; cursor: pointer;" [title]="user.username">
            {{ user.username.charAt(0).toUpperCase() }}
          </a>
          <button class="btn btn-ghost btn-sm" (click)="auth.logout()">Log out</button>
        }
      </div>
    </nav>

    <div class="layout-body">
      @if (currentStory(); as story) {
        <aside class="sidebar" [class.open]="sidebarOpen()">
          <div class="sidebar-title">Story</div>
          <a [routerLink]="['/stories', story.id]" class="sidebar-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">📖 Overview</a>
          <a [routerLink]="['/stories', story.id, 'chapters']" class="sidebar-link" routerLinkActive="active">📑 Chapters</a>
          <a [routerLink]="['/stories', story.id, 'characters']" class="sidebar-link" routerLinkActive="active">🧙 Characters</a>
          <a [routerLink]="['/stories', story.id, 'locations']" class="sidebar-link" routerLinkActive="active">🗺️ Locations</a>
          <a [routerLink]="['/stories', story.id, 'timeline']" class="sidebar-link" routerLinkActive="active">⏳ Timeline</a>
        </aside>
      }
      <main class="layout-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .nav-logo-icon { font-family: var(--font-sans); }
    .avatar { text-decoration: none; }
  `]
})
export class LayoutShell {
  public auth = inject(AuthService);
  public theme = inject(ThemeService);
  private storyService = inject(StoryService);
  private router = inject(Router);
  readonly sidebarOpen = signal(false);

  currentStory() {
    return this.storyService.currentStory();
  }

  constructor() {
    // Track current story from URL for sidebar context
    this.router.events.subscribe(() => {
      const segments = this.router.url.split('/');
      const storyIdx = segments.indexOf('stories');
      if (storyIdx !== -1 && segments[storyIdx + 1]) {
        const storyId = segments[storyIdx + 1];
        const current = this.storyService.currentStory();
        if (!current || current.id !== storyId) {
          this.storyService.getStory(storyId).catch(() => { /* not found */ });
        }
      }
    });
  }
}

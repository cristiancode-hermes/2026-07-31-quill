import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LayoutShell } from './layout/layout-shell/layout-shell';

export const routes: Routes = [
  {
    path: '',
    component: LayoutShell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
        title: 'Dashboard — Quill'
      },
      {
        path: 'stories',
        loadComponent: () => import('./pages/story-list/story-list').then(m => m.StoryListPage),
        title: 'Stories — Quill'
      },
      {
        path: 'stories/:storyId',
        loadComponent: () => import('./pages/story-detail/story-detail').then(m => m.StoryDetailPage),
        title: 'Story — Quill'
      },
      {
        path: 'stories/:storyId/chapters',
        loadComponent: () => import('./pages/chapter-list/chapter-list').then(m => m.ChapterListPage),
        title: 'Chapters — Quill'
      },
      {
        path: 'stories/:storyId/chapters/:chapterId',
        loadComponent: () => import('./pages/chapter-detail/chapter-detail').then(m => m.ChapterDetailPage),
        title: 'Chapter — Quill'
      },
      {
        path: 'stories/:storyId/chapters/:chapterId/scenes/:sceneId',
        loadComponent: () => import('./pages/scene-editor/scene-editor').then(m => m.SceneEditorPage),
        title: 'Scene Editor — Quill'
      },
      {
        path: 'stories/:storyId/characters',
        loadComponent: () => import('./pages/character-list/character-list').then(m => m.CharacterListPage),
        title: 'Characters — Quill'
      },
      {
        path: 'stories/:storyId/characters/new',
        loadComponent: () => import('./pages/character-form/character-form').then(m => m.CharacterFormPage),
        title: 'New Character — Quill'
      },
      {
        path: 'stories/:storyId/characters/:characterId',
        loadComponent: () => import('./pages/character-detail/character-detail').then(m => m.CharacterDetailPage),
        title: 'Character — Quill'
      },
      {
        path: 'stories/:storyId/locations',
        loadComponent: () => import('./pages/location-list/location-list').then(m => m.LocationListPage),
        title: 'Locations — Quill'
      },
      {
        path: 'stories/:storyId/locations/new',
        loadComponent: () => import('./pages/location-form/location-form').then(m => m.LocationFormPage),
        title: 'New Location — Quill'
      },
      {
        path: 'stories/:storyId/locations/:locationId',
        loadComponent: () => import('./pages/location-detail/location-detail').then(m => m.LocationDetailPage),
        title: 'Location — Quill'
      },
      {
        path: 'stories/:storyId/timeline',
        loadComponent: () => import('./pages/timeline-view/timeline-view').then(m => m.TimelineViewPage),
        title: 'Timeline — Quill'
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then(m => m.SettingsPage),
        title: 'Settings — Quill'
      },
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginPage),
    title: 'Login — Quill'
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterPage),
    title: 'Register — Quill'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

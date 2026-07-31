import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { StatsService } from '../../services/stats.service';
import { Modal } from '../../shared/modal/modal';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import type { WritingSession } from '../../models/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, Modal, ConfirmDialog],
  template: `
    <div class="container page" style="max-width: 760px;">
      <div class="page-header">
        <div>
          <h1>Settings</h1>
          <p class="subtitle">Your profile, writing goals, and preferences.</p>
        </div>
      </div>

      @if (auth.currentUser(); as user) {
        <div class="grid" style="grid-template-columns: 1fr 1fr; align-items: start;">
          <!-- Profile -->
          <div class="card">
            <h2 style="margin-bottom: var(--space-lg);">Profile</h2>
            @if (profileMsg()) {
              <div class="form-alert form-alert-success">{{ profileMsg() }}</div>
            }
            <div class="form-group">
              <label for="username">Username</label>
              <input id="username" [(ngModel)]="profileForm.username" />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input id="email" [value]="user.email" disabled style="opacity: 0.6;" />
            </div>
            <div class="form-group">
              <label for="goal">Daily word goal</label>
              <input id="goal" type="number" min="0" [(ngModel)]="profileForm.dailyWordGoal" />
              <p class="form-hint">Your target for words written per day.</p>
            </div>
            <div class="form-group">
              <label for="avatar">Avatar URL (optional)</label>
              <input id="avatar" [(ngModel)]="profileForm.avatarUrl" placeholder="https://…" />
            </div>
            <button class="btn btn-primary" (click)="saveProfile()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save profile' }}</button>
          </div>

          <div>
            <!-- Appearance -->
            <div class="card" style="margin-bottom: var(--space-lg);">
              <h2 style="margin-bottom: var(--space-lg);">Appearance</h2>
              <div class="flex-between">
                <div>
                  <div style="font-weight: 600;">Dark mode</div>
                  <div class="muted" style="font-size: 0.813rem;">Warm dark tones, like lamplight on old paper.</div>
                </div>
                <button class="btn btn-secondary" (click)="theme.toggle()">{{ theme.isDark() ? '☀ Light mode' : '☾ Dark mode' }}</button>
              </div>
            </div>

            <!-- Security -->
            <div class="card">
              <h2 style="margin-bottom: var(--space-lg);">Change password</h2>
              @if (passMsg()) {
                <div class="form-alert" [class.form-alert-success]="!passError()" [class.form-alert-error]="passError()">{{ passMsg() }}</div>
              }
              <div class="form-group">
                <label for="current">Current password</label>
                <input id="current" type="password" [(ngModel)]="passForm.currentPassword" />
              </div>
              <div class="form-group">
                <label for="newPass">New password</label>
                <input id="newPass" type="password" [(ngModel)]="passForm.newPassword" />
                <p class="form-hint">At least 8 characters.</p>
              </div>
              <button class="btn btn-secondary" (click)="changePassword()" [disabled]="saving() || passForm.newPassword.length < 8">Update password</button>
            </div>

            <!-- Sessions -->
            <div class="card" style="margin-top: var(--space-lg);">
              <h2 style="margin-bottom: var(--space-lg);">Recent sessions</h2>
              @if (sessions().length === 0) {
                <p class="muted" style="font-size: 0.875rem;">No writing sessions logged yet.</p>
              } @else {
                @for (s of sessions().slice(0, 8); track s.id) {
                  <div class="flex-between" style="padding: 8px 0; border-bottom: 1px solid var(--color-border);">
                    <div>
                      <div style="font-weight: 500;">{{ s.wordsWritten }} words</div>
                      <div class="mono muted" style="font-size: 0.688rem;">{{ s.sessionDate }} · {{ s.durationMinutes }} min</div>
                    </div>
                    @if (s.notes) { <span class="muted" style="font-size: 0.75rem;">{{ s.notes }}</span> }
                  </div>
                }
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="skeleton" style="height: 300px;"></div>
      }
    </div>
  `
})
export class SettingsPage {
  public auth = inject(AuthService);
  public theme = inject(ThemeService);
  private statsService = inject(StatsService);

  saving = signal(false);
  profileMsg = signal('');
  passMsg = signal('');
  passError = signal(false);
  sessions = signal<WritingSession[]>([]);
  profileForm = { username: '', dailyWordGoal: 500, avatarUrl: '' };
  passForm = { currentPassword: '', newPassword: '' };

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm = { username: user.username, dailyWordGoal: user.dailyWordGoal, avatarUrl: user.avatarUrl ?? '' };
    }
    this.statsService.getSessions().then(s => this.sessions.set(s)).catch(() => {});
  }

  async saveProfile() {
    this.saving.set(true);
    this.profileMsg.set('');
    try {
      await this.auth.updateProfile({
        username: this.profileForm.username.trim() || undefined,
        dailyWordGoal: Number(this.profileForm.dailyWordGoal) || undefined,
        avatarUrl: this.profileForm.avatarUrl.trim() || undefined,
      });
      this.profileMsg.set('Profile updated ✓');
      setTimeout(() => this.profileMsg.set(''), 3000);
    } catch {
      this.profileMsg.set('Could not save profile');
    } finally {
      this.saving.set(false);
    }
  }

  async changePassword() {
    this.saving.set(true);
    this.passMsg.set('');
    this.passError.set(false);
    try {
      await this.auth.changePassword(this.passForm.currentPassword, this.passForm.newPassword);
      this.passForm = { currentPassword: '', newPassword: '' };
      this.passMsg.set('Password updated ✓');
    } catch (e: unknown) {
      this.passError.set(true);
      this.passMsg.set((e as { error?: { message?: string } })?.error?.message ?? 'Could not change password');
    } finally {
      this.saving.set(false);
    }
  }
}

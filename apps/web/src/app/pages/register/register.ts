import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="nav-logo-icon">✒</span>
          Quill
        </div>
        <h1 style="text-align: center; margin-bottom: var(--space-xs);">Start your story</h1>
        <p class="muted" style="text-align: center; margin-bottom: var(--space-xl);">Every novel begins with a single word.</p>

        @if (error()) {
          <div class="form-alert form-alert-error">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" name="email" [(ngModel)]="email" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" type="text" name="username" [(ngModel)]="username" required minlength="3" autocomplete="username" />
            <p class="form-hint">Letters, numbers and underscores — at least 3 characters.</p>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" name="password" [(ngModel)]="password" required minlength="8" autocomplete="new-password" />
            <p class="form-hint">At least 8 characters.</p>
          </div>
          <div class="form-group">
            <label for="confirm">Confirm password</label>
            <input id="confirm" type="password" name="confirm" [(ngModel)]="confirm" required autocomplete="new-password" />
            @if (confirm && confirm !== password) {
              <p class="form-error">Passwords do not match.</p>
            }
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="auth.loading() || (confirm !== password)">
            {{ auth.loading() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="muted" style="text-align: center; margin-top: var(--space-lg); font-size: 0.813rem;">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .nav-logo-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border-radius: var(--radius-md);
      background: var(--color-primary); color: #fff;
    }
  `]
})
export class RegisterPage {
  public auth = inject(AuthService);
  private router = inject(Router);
  email = '';
  username = '';
  password = '';
  confirm = '';
  error = signal('');

  async onSubmit() {
    this.error.set('');
    try {
      await this.auth.register(this.email, this.username, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string | string[] } };
      const msg = anyE.error?.message;
      this.error.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Registration failed. Please try again.'));
    }
  }
}

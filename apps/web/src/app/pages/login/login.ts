import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="nav-logo-icon">✒</span>
          Quill
        </div>
        <h1 style="text-align: center; margin-bottom: var(--space-xs);">Welcome back</h1>
        <p class="muted" style="text-align: center; margin-bottom: var(--space-xl);">Pick up where your story left off.</p>

        @if (error()) {
          <div class="form-alert form-alert-error">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" name="email" [(ngModel)]="email" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" />
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="muted" style="text-align: center; margin-top: var(--space-lg); font-size: 0.813rem;">
          New to Quill? <a routerLink="/register">Create an account</a>
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
export class LoginPage {
  public auth = inject(AuthService);
  private router = inject(Router);
  email = '';
  password = '';
  error = signal('');

  async onSubmit() {
    this.error.set('');
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string | string[] } };
      const msg = anyE.error?.message;
      this.error.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Invalid credentials. Please try again.'));
    }
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, map, type Observable, shareReplay, throwError } from 'rxjs';
import { LoginService } from '@core/api/login/login.service';
import { RefreshTokenService } from '@core/api/refresh-token/refresh-token.service';
import type { LoginRequest, LoginResponse } from '@core/api/login/login.types';
import type { Token } from '@shared/models/auth.types';
import { AppPath } from '@shared/enums/app-path.enum';

export type Session = LoginResponse;

/**
 * NOTE: the session lives in localStorage so it survives reloads. Any XSS can
 * read it — if the backend supports it, prefer httpOnly cookies.
 */
export const SESSION_STORAGE_KEY = 'app.session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Injections
  private router = inject(Router);
  private loginService = inject(LoginService);
  private refreshTokenService = inject(RefreshTokenService);

  // Data
  private readonly sessionState = signal<Session | null>(readStoredSession());
  private refreshRequest: Observable<Token> | null = null;
  public readonly session = this.sessionState.asReadonly();

  // Computeds
  public readonly isAuthenticated = computed(
    () => this.sessionState() !== null,
  );

  // Methods
  public async login(credentials: LoginRequest): Promise<void> {
    const session = await this.loginService.login(credentials);
    this.saveSession(session);
    void this.router.navigate(['/', AppPath.MAIN]);
  }

  /**
   * Refreshes the access token. Concurrent callers share the same in-flight
   * request (single-flight), so N parallel 401s trigger a single refresh.
   */
  public refreshToken(): Observable<Token> {
    const session = this.sessionState();
    if (!session) {
      return throwError(() => new Error('No active session'));
    }

    this.refreshRequest ??= this.refreshTokenService
      .refreshToken(session.refreshToken)
      .pipe(
        map((tokens) => {
          this.saveSession({ ...session, ...tokens });
          return tokens.token;
        }),
        finalize(() => {
          this.refreshRequest = null;
        }),
        shareReplay(1),
      );

    return this.refreshRequest;
  }

  public logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.sessionState.set(null);
    void this.router.navigate(['/', AppPath.LOGIN]);
  }

  private saveSession(session: Session): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.sessionState.set(session);
  }
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { username, token, refreshToken } = value as Record<string, unknown>;
  return (
    typeof username === 'string' &&
    typeof token === 'string' &&
    typeof refreshToken === 'string'
  );
}

function readStoredSession(): Session | null {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (isSession(parsed)) {
      return parsed;
    }
  } catch {
    // Corrupted value: discarded below
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
  return null;
}

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { LoginService } from '@core/api/login/login.service';
import { RefreshTokenService } from '@core/api/refresh-token/refresh-token.service';
import { AppPath } from '@shared/enums/app-path.enum';
import { AuthService, type Session, SESSION_STORAGE_KEY } from './auth.service';

const SESSION: Session = {
  username: 'demo',
  token: 'access',
  refreshToken: 'refresh',
};

describe('AuthService', () => {
  const loginService = { login: vi.fn() };
  const refreshTokenService = { refreshToken: vi.fn() };
  let router: Router;

  function setup(): AuthService {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoginService, useValue: loginService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  describe('session restore', () => {
    it('starts anonymous when nothing is stored', () => {
      const service = setup();

      expect(service.session()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('restores a valid stored session', () => {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(SESSION));

      const service = setup();

      expect(service.session()).toEqual(SESSION);
      expect(service.isAuthenticated()).toBe(true);
    });

    it.each([
      ['corrupted JSON', '{not json'],
      ['an invalid shape', JSON.stringify({ username: 'demo' })],
      ['a primitive', JSON.stringify('token')],
    ])('discards %s', (_, stored) => {
      localStorage.setItem(SESSION_STORAGE_KEY, stored);

      const service = setup();

      expect(service.session()).toBeNull();
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });

  it('logs in, stores the session and navigates home', async () => {
    const service = setup();
    loginService.login.mockResolvedValue(SESSION);

    await service.login({ username: 'demo', password: 'secret' });

    expect(service.session()).toEqual(SESSION);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBe(
      JSON.stringify(SESSION),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/', AppPath.MAIN]);
  });

  it('logs out, clears the session and navigates to login', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(SESSION));
    const service = setup();

    service.logout();

    expect(service.session()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/', AppPath.LOGIN]);
  });

  describe('refreshToken', () => {
    it('fails when there is no session', async () => {
      const service = setup();

      await expect(firstValueFrom(service.refreshToken())).rejects.toThrow(
        'No active session',
      );
    });

    it('stores the new tokens and emits the access token', async () => {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(SESSION));
      const service = setup();
      refreshTokenService.refreshToken.mockReturnValue(
        of({ token: 'new-access', refreshToken: 'new-refresh' }),
      );

      const token = await firstValueFrom(service.refreshToken());

      expect(token).toBe('new-access');
      expect(refreshTokenService.refreshToken).toHaveBeenCalledWith('refresh');
      expect(service.session()).toEqual({
        username: 'demo',
        token: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('shares a single in-flight request between concurrent callers', () => {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(SESSION));
      const service = setup();
      refreshTokenService.refreshToken.mockReturnValue(
        throwError(() => new Error('pending')),
      );

      const first = service.refreshToken();
      const second = service.refreshToken();

      expect(first).toBe(second);
      expect(refreshTokenService.refreshToken).toHaveBeenCalledTimes(1);
    });
  });
});

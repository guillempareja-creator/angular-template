import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { LOGIN_URL } from '@core/api/login/login.service';
import { AuthService, type Session } from '@core/services/auth.service';
import { HttpResponseHandlerService } from '@core/services/http-response-handler.service';
import { authInterceptor } from './auth.interceptor';

const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor', () => {
  const session = signal<Session | null>(null);
  const authService = { session, refreshToken: vi.fn(), logout: vi.fn() };
  const responseHandler = { handleSessionExpired: vi.fn() };
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    vi.resetAllMocks();
    session.set({ username: 'demo', token: 'access', refreshToken: 'refresh' });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: HttpResponseHandlerService, useValue: responseHandler },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('adds the bearer token to API requests', async () => {
    const request = firstValueFrom(http.get('/example'));

    const call = httpTesting.expectOne('/example');
    expect(call.request.headers.get('Authorization')).toBe('Bearer access');
    call.flush({});
    await request;
  });

  it('sends no token when there is no session', async () => {
    session.set(null);
    const request = firstValueFrom(http.get('/example'));

    const call = httpTesting.expectOne('/example');
    expect(call.request.headers.has('Authorization')).toBe(false);
    call.flush({});
    await request;
  });

  it('does not touch non-API requests', async () => {
    const request = firstValueFrom(http.get('./assets/i18n/es.json'));

    const call = httpTesting.expectOne('./assets/i18n/es.json');
    expect(call.request.headers.has('Authorization')).toBe(false);
    call.flush({});
    await request;
  });

  it('refreshes the token on 401 and retries the request', async () => {
    authService.refreshToken.mockReturnValue(of('new-access'));
    const request = firstValueFrom(http.get('/example'));

    httpTesting.expectOne('/example').flush(null, UNAUTHORIZED);
    const retry = httpTesting.expectOne('/example');
    expect(retry.request.headers.get('Authorization')).toBe(
      'Bearer new-access',
    );
    retry.flush({ ok: true });

    await expect(request).resolves.toEqual({ ok: true });
  });

  it('closes the session when the refresh fails', async () => {
    authService.refreshToken.mockReturnValue(
      throwError(() => new Error('refresh failed')),
    );
    const request = firstValueFrom(http.get('/example'));

    httpTesting.expectOne('/example').flush(null, UNAUTHORIZED);

    await expect(request).rejects.toThrow('Session expired');
    expect(responseHandler.handleSessionExpired).toHaveBeenCalledTimes(1);
    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('does not try to refresh a 401 from the auth endpoints', async () => {
    const request = firstValueFrom(http.post(LOGIN_URL, {}));

    httpTesting.expectOne(LOGIN_URL).flush(null, UNAUTHORIZED);

    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(authService.refreshToken).not.toHaveBeenCalled();
  });

  it('rethrows other errors untouched', async () => {
    const request = firstValueFrom(http.get('/example'));

    httpTesting
      .expectOne('/example')
      .flush(null, { status: 500, statusText: 'Server Error' });

    await expect(request).rejects.toMatchObject({ status: 500 });
    expect(authService.refreshToken).not.toHaveBeenCalled();
  });
});

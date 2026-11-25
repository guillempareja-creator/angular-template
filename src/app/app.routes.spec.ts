import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { ExampleService } from '@core/api/example/example.service';
import { AuthService } from '@core/services/auth.service';
import { routes } from './app.routes';

describe('app routes', () => {
  const isAuthenticated = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslateService(),
        {
          provide: AuthService,
          useValue: { isAuthenticated, login: vi.fn() },
        },
        {
          provide: ExampleService,
          useValue: { getExample: vi.fn().mockResolvedValue(null) },
        },
      ],
    });
  });

  async function navigate(url: string): Promise<string> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return TestBed.inject(Router).url;
  }

  it.each([
    { url: '/main', authenticated: false, expected: '/login' },
    { url: '/main', authenticated: true, expected: '/main' },
    { url: '/login', authenticated: true, expected: '/main' },
    { url: '/does-not-exist', authenticated: true, expected: '/main' },
  ])(
    'navigating to $url (authenticated: $authenticated) ends on $expected',
    async ({ url, authenticated, expected }) => {
      isAuthenticated.set(authenticated);

      await expect(navigate(url)).resolves.toBe(expected);
    },
  );
});

import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ExampleService } from '@core/api/example-api/example/example.service';
import { routes } from './app.routes';

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslateService(),
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
    { url: '/main', expected: '/main' },
    { url: '/', expected: '/main' },
    { url: '/does-not-exist', expected: '/main' },
  ])('navigating to $url ends on $expected', async ({ url, expected }) => {
    await expect(navigate(url)).resolves.toBe(expected);
  });
});

import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { LoaderService } from '@core/services/loader.service';
import { requestContext } from './http-context.tokens';
import { loaderInterceptor } from './loader.interceptor';

describe('loaderInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let loader: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loaderInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    loader = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('shows the loader while an API request is in flight', async () => {
    const request = firstValueFrom(http.get('/example'));

    expect(loader.isLoading()).toBe(true);
    httpTesting.expectOne('/example').flush({});
    await request;

    expect(loader.isLoading()).toBe(false);
  });

  it('hides the loader when the request fails', async () => {
    const request = firstValueFrom(http.get('/example'));

    httpTesting
      .expectOne('/example')
      .flush(null, { status: 500, statusText: 'Server Error' });

    await expect(request).rejects.toBeDefined();
    expect(loader.isLoading()).toBe(false);
  });

  it('skips the loader when the request opts out', async () => {
    const request = firstValueFrom(
      http.get('/example', { context: requestContext({ showLoader: false }) }),
    );

    expect(loader.isLoading()).toBe(false);
    httpTesting.expectOne('/example').flush({});
    await request;
  });

  it('skips the loader for non-API requests', async () => {
    const request = firstValueFrom(http.get('./assets/i18n/es.json'));

    expect(loader.isLoading()).toBe(false);
    httpTesting.expectOne('./assets/i18n/es.json').flush({});
    await request;
  });
});

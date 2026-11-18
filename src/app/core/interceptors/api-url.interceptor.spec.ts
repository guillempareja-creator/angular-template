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
import { environment } from '../../../environments/environment';
import { apiUrlInterceptor } from './api-url.interceptor';

describe('apiUrlInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('prefixes API requests with the environment base URL', async () => {
    const request = firstValueFrom(http.get('/example'));

    httpTesting.expectOne(`${environment.api}/example`).flush({});

    await expect(request).resolves.toEqual({});
  });

  it('leaves non-API requests untouched', async () => {
    const request = firstValueFrom(http.get('./assets/i18n/es.json'));

    httpTesting.expectOne('./assets/i18n/es.json').flush({});

    await expect(request).resolves.toEqual({});
  });
});

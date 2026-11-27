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
import { httpInterceptor } from './http.interceptor';

describe('httpInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('lets requests and responses through untouched', async () => {
    const response = firstValueFrom(
      http.post('/api/items', { name: 'item' }, { headers: { 'X-Id': '7' } }),
    );

    const call = httpTesting.expectOne({ method: 'POST', url: '/api/items' });
    expect(call.request.body).toEqual({ name: 'item' });
    expect(call.request.headers.get('X-Id')).toBe('7');
    call.flush({ id: 1 });

    await expect(response).resolves.toEqual({ id: 1 });
  });
});

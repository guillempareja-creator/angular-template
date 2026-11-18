import {
  HttpClient,
  HttpHeaders,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { HttpResponseHandlerService } from '@core/services/http-response-handler.service';
import { HttpCustomHeader } from '@shared/enums/http-custom-headers.enum';
import { requestContext } from './http-context.tokens';
import { notificationInterceptor } from './notification.interceptor';

describe('notificationInterceptor', () => {
  const handler = {
    handleHttpError: vi.fn(),
    handleHttpWarning: vi.fn(),
    handleSuccessResponse: vi.fn(),
  };
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([notificationInterceptor])),
        provideHttpClientTesting(),
        { provide: HttpResponseHandlerService, useValue: handler },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('shows nothing for a plain successful request', async () => {
    const request = firstValueFrom(http.get('/example'));

    httpTesting.expectOne('/example').flush({});
    await request;

    expect(handler.handleSuccessResponse).not.toHaveBeenCalled();
    expect(handler.handleHttpWarning).not.toHaveBeenCalled();
  });

  it('shows the success message requested through the context', async () => {
    const request = firstValueFrom(
      http.post(
        '/example',
        {},
        {
          context: requestContext({ successMessage: 'saved' }),
        },
      ),
    );

    httpTesting.expectOne('/example').flush({});
    await request;

    expect(handler.handleSuccessResponse).toHaveBeenCalledWith('saved');
  });

  it('gives precedence to the backend warning header', async () => {
    const request = firstValueFrom(
      http.post(
        '/example',
        {},
        {
          context: requestContext({ successMessage: 'saved' }),
        },
      ),
    );

    httpTesting.expectOne('/example').flush(
      {},
      {
        headers: new HttpHeaders({
          [HttpCustomHeader.CUSTOM_WARNING_MESSAGE]: 'customWarning',
        }),
      },
    );
    await request;

    expect(handler.handleHttpWarning).toHaveBeenCalledWith('customWarning');
    expect(handler.handleSuccessResponse).not.toHaveBeenCalled();
  });

  it('notifies HTTP errors and rethrows them', async () => {
    const request = firstValueFrom(http.get('/example'));

    httpTesting
      .expectOne('/example')
      .flush({ tag: 'customError' }, { status: 400, statusText: 'Bad' });

    await expect(request).rejects.toMatchObject({ status: 400 });
    expect(handler.handleHttpError).toHaveBeenCalledTimes(1);
  });

  it('ignores non-API requests', async () => {
    const request = firstValueFrom(http.get('./assets/i18n/es.json'));

    httpTesting
      .expectOne('./assets/i18n/es.json')
      .flush(null, { status: 404, statusText: 'Not Found' });

    await expect(request).rejects.toBeDefined();
    expect(handler.handleHttpError).not.toHaveBeenCalled();
  });
});

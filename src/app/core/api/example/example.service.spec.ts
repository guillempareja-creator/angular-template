import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  SHOW_LOADER,
  SUCCESS_MESSAGE,
} from '@core/interceptors/http-context.tokens';
import { ExampleService } from './example.service';

describe('ExampleService', () => {
  let service: ExampleService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExampleService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('getExample → GET /example', async () => {
    const response = service.getExample();

    const call = httpTesting.expectOne({ method: 'GET', url: '/example' });
    call.flush({ example: 'data' });

    await expect(response).resolves.toEqual({ example: 'data' });
  });

  it('createExample → POST /example with the default success toast', async () => {
    const response = service.createExample({ example: 'new' });

    const call = httpTesting.expectOne({ method: 'POST', url: '/example' });
    expect(call.request.body).toEqual({ example: 'new' });
    expect(call.request.context.get(SUCCESS_MESSAGE)).toBe('default');
    call.flush({ message: 'created', id: 1 });

    await expect(response).resolves.toEqual({ message: 'created', id: 1 });
  });

  it('updateExample → PUT /example/:id with a custom success toast', async () => {
    const response = service.updateExample(7, { example: 'edited' });

    const call = httpTesting.expectOne({ method: 'PUT', url: '/example/7' });
    expect(call.request.body).toEqual({ example: 'edited' });
    expect(call.request.context.get(SUCCESS_MESSAGE)).toBe('exampleUpdated');
    call.flush({ message: 'updated', id: 7 });

    await expect(response).resolves.toEqual({ message: 'updated', id: 7 });
  });

  it('getExampleDocument → GET /example/document as a blob, without loader', async () => {
    const blob = new Blob(['pdf']);
    const response = service.getExampleDocument();

    const call = httpTesting.expectOne('/example/document');
    expect(call.request.responseType).toBe('blob');
    expect(call.request.context.get(SHOW_LOADER)).toBe(false);
    call.flush(blob);

    await expect(response).resolves.toBe(blob);
  });
});

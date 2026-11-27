import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EXAMPLE_API_URL } from '../example-api.constants';
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

  it('getExample → GET {exampleApi}/example', async () => {
    const response = service.getExample();

    const call = httpTesting.expectOne({
      method: 'GET',
      url: `${EXAMPLE_API_URL}/example`,
    });
    call.flush({ example: 'data' });

    await expect(response).resolves.toEqual({ example: 'data' });
  });
});

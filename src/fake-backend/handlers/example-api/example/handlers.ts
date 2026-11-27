import { delay, http, HttpResponse } from 'msw';
import { EXAMPLE_API_URL } from '@core/api/example-api/example-api.constants';
import { exampleGetMock } from './mocks';

export const exampleHandlers = [
  // GET /example
  http.get(`${EXAMPLE_API_URL}/example`, async () => {
    await delay();
    return HttpResponse.json(exampleGetMock);
  }),
];

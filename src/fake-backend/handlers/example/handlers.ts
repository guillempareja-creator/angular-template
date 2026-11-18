import { http, HttpResponse } from 'msw';
import { sleep } from '@shared/utils/delay.utils';
import {
  apiUrl,
  generatePDF,
  getDocumentHeaders,
  getWarningHeaders,
  requireAuth,
} from '../../utils';
import { exampleGetMock, examplePostMock, examplePutMock } from './mocks';

export const exampleHandlers = [
  // GET /example
  http.get(apiUrl('/example'), async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) {
      return unauthorized;
    }

    await sleep();
    return HttpResponse.json(exampleGetMock);
  }),

  // POST /example
  http.post(apiUrl('/example'), async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) {
      return unauthorized;
    }

    await sleep();
    return HttpResponse.json(examplePostMock);
  }),

  // PUT /example/:id — also demonstrates a backend warning header
  http.put(apiUrl('/example/:id'), async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) {
      return unauthorized;
    }

    await sleep();
    return HttpResponse.json(examplePutMock, {
      headers: getWarningHeaders('customWarning'),
    });
  }),

  // GET /example/document
  http.get(apiUrl('/example/document'), async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) {
      return unauthorized;
    }

    await sleep();
    return new HttpResponse(generatePDF(), {
      status: 200,
      headers: getDocumentHeaders('example-document.pdf', 'application/pdf'),
    });
  }),
];

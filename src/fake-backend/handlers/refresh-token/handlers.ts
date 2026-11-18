import { http, HttpResponse } from 'msw';
import { sleep } from '@shared/utils/delay.utils';
import { REFRESH_TOKEN_URL } from '@core/api/refresh-token/refresh-token.service';
import { apiUrl } from '../../utils';
import { refreshTokenMock } from './mocks';

export const refreshTokenHandlers = [
  // POST /refreshToken
  http.post(apiUrl(REFRESH_TOKEN_URL), async () => {
    await sleep();
    return HttpResponse.json(refreshTokenMock);
  }),
];

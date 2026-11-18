import { http, HttpResponse } from 'msw';
import { sleep } from '@shared/utils/delay.utils';
import { LOGIN_URL } from '@core/api/login/login.service';
import { apiUrl } from '../../utils';
import { loginMock } from './mocks';

export const loginHandlers = [
  // POST /login — any credentials are accepted
  http.post(apiUrl(LOGIN_URL), async () => {
    await sleep();
    return HttpResponse.json(loginMock);
  }),
];

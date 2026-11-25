import type { LoginResponse } from '@core/api/login/login.types';

export const loginMock: LoginResponse = {
  username: 'demo',
  token: 'demo-access-token',
  refreshToken: 'demo-refresh-token',
};

import type { RefreshTokenResponse } from '@core/api/refresh-token/refresh-token.types';

export const refreshTokenMock: RefreshTokenResponse = {
  token: 'demo-refreshed-access-token',
  refreshToken: 'demo-refreshed-refresh-token',
};

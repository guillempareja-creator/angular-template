import { HttpResponse } from 'msw';
import { loginMock } from '../handlers/login/mocks';
import { refreshTokenMock } from '../handlers/refresh-token/mocks';

const VALID_TOKENS = [loginMock.token, refreshTokenMock.token];

/**
 * Returns a 401 response when the request has no valid bearer token, or
 * `null` when it is authorized. Use it in every protected handler:
 * `const unauthorized = requireAuth(request); if (unauthorized) { return unauthorized; }`
 */
export function requireAuth(request: Request): HttpResponse<null> | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (token && VALID_TOKENS.includes(token)) {
    return null;
  }

  return new HttpResponse(null, { status: 401 });
}

import {
  HttpErrorResponse,
  type HttpInterceptorFn,
  type HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { HttpResponseHandlerService } from '@core/services/http-response-handler.service';
import { LOGIN_URL } from '@core/api/login/login.service';
import { REFRESH_TOKEN_URL } from '@core/api/refresh-token/refresh-token.service';
import type { Token } from '@shared/models/auth.types';
import { isApiRequest } from './interceptor.utils';

const AUTH_ENDPOINTS: readonly string[] = [LOGIN_URL, REFRESH_TOKEN_URL];

class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
  }
}

const UNAUTHORIZED: number = HttpStatusCode.Unauthorized;

function withToken(
  req: HttpRequest<unknown>,
  token: Token | undefined,
): HttpRequest<unknown> {
  return token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
}

function isRefreshable(req: HttpRequest<unknown>, error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === UNAUTHORIZED &&
    !AUTH_ENDPOINTS.includes(req.url)
  );
}

/**
 * Adds the bearer token and, on 401, refreshes it once (single-flight) and
 * retries. If the refresh fails, the session is closed.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const responseHandler = inject(HttpResponseHandlerService);

  return next(withToken(req, authService.session()?.token)).pipe(
    catchError((error: unknown) => {
      if (!isRefreshable(req, error)) {
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        catchError(() => {
          responseHandler.handleSessionExpired();
          authService.logout();
          return throwError(() => new SessionExpiredError());
        }),
        switchMap((token) => next(withToken(req, token))),
      );
    }),
  );
};

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { Token } from '@shared/models/auth.types';
import { requestContext } from '@core/interceptors/http-context.tokens';
import type {
  RefreshTokenRequest,
  RefreshTokenResponse,
} from './refresh-token.types';

export const REFRESH_TOKEN_URL = '/refreshToken';

@Injectable({
  providedIn: 'root',
})
export class RefreshTokenService {
  // Injections
  private http = inject(HttpClient);

  // Methods
  // Returns an Observable (not a Promise) because it is consumed inside the
  // auth interceptor's retry pipeline (switchMap on 401).
  public refreshToken(refreshToken: Token): Observable<RefreshTokenResponse> {
    const body: RefreshTokenRequest = { refreshToken };
    return this.http.post<RefreshTokenResponse>(REFRESH_TOKEN_URL, body, {
      context: requestContext({ showLoader: false }),
    });
  }
}

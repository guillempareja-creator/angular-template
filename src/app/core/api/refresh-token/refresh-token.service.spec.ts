import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SHOW_LOADER } from '@core/interceptors/http-context.tokens';
import {
  REFRESH_TOKEN_URL,
  RefreshTokenService,
} from './refresh-token.service';

describe('RefreshTokenService', () => {
  it('refreshToken → POST /refreshToken silently (no loader)', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const httpTesting = TestBed.inject(HttpTestingController);
    const tokens = { token: 'new-access', refreshToken: 'new-refresh' };

    const response = firstValueFrom(
      TestBed.inject(RefreshTokenService).refreshToken('refresh'),
    );

    const call = httpTesting.expectOne({
      method: 'POST',
      url: REFRESH_TOKEN_URL,
    });
    expect(call.request.body).toEqual({ refreshToken: 'refresh' });
    expect(call.request.context.get(SHOW_LOADER)).toBe(false);
    call.flush(tokens);

    await expect(response).resolves.toEqual(tokens);
    httpTesting.verify();
  });
});

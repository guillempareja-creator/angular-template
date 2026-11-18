import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LOGIN_URL, LoginService } from './login.service';

describe('LoginService', () => {
  it('login → POST /login with the credentials', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const httpTesting = TestBed.inject(HttpTestingController);
    const session = { username: 'demo', token: 't', refreshToken: 'r' };

    const response = TestBed.inject(LoginService).login({
      username: 'demo',
      password: 'secret',
    });

    const call = httpTesting.expectOne({ method: 'POST', url: LOGIN_URL });
    expect(call.request.body).toEqual({ username: 'demo', password: 'secret' });
    call.flush(session);

    await expect(response).resolves.toEqual(session);
    httpTesting.verify();
  });
});

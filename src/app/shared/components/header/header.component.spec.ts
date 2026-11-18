import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthService, type Session } from '@core/services/auth.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  const session = signal<Session | null>(null);
  const authService = { session, logout: vi.fn() };
  let fixture: ComponentFixture<HeaderComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    vi.resetAllMocks();
    session.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: AuthService, useValue: authService },
      ],
    });
    fixture = TestBed.createComponent(HeaderComponent);
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('shows the app name and no user area when anonymous', () => {
    expect(host.querySelector('.app-name')?.textContent).toContain('app.name');
    expect(host.querySelector('.user')).toBeNull();
  });

  it('shows the capitalised username and logs out on click', async () => {
    session.set({ username: 'demo', token: 't', refreshToken: 'r' });
    await fixture.whenStable();

    expect(host.querySelector('.user')?.textContent).toContain('Demo');

    host.querySelector<HTMLButtonElement>('#header-btn-logout')?.click();

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
});

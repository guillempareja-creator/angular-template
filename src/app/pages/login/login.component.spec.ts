import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthService } from '@core/services/auth.service';
import { FormService } from '@shared/services/form.service';
import LoginComponent from './login.component';

describe('LoginComponent', () => {
  const authService = { login: vi.fn() };
  let fixture: ComponentFixture<LoginComponent>;
  let host: HTMLElement;
  let formService: FormService;

  beforeEach(async () => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: AuthService, useValue: authService },
      ],
    });
    formService = TestBed.inject(FormService);
    vi.spyOn(formService, 'focusFirstInvalidControl');
    fixture = TestBed.createComponent(LoginComponent);
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  function fill(id: string, value: string): void {
    const input = host.querySelector<HTMLInputElement>(`#${id}`);
    if (!input) {
      throw new Error(`Missing input #${id}`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function submit(): Promise<void> {
    host.querySelector<HTMLButtonElement>('#login-btn-submit')?.click();
    await fixture.whenStable();
  }

  it('shows the validation errors and focuses the form when empty', async () => {
    await submit();

    expect(authService.login).not.toHaveBeenCalled();
    expect(formService.focusFirstInvalidControl).toHaveBeenCalledWith(host);
    expect(host.querySelector('#login-error-username')?.textContent).toContain(
      'form.requiredError',
    );
    expect(
      host.querySelector('#login-input-password')?.getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('logs in with the entered credentials', async () => {
    fill('login-input-username', 'demo');
    fill('login-input-password', 'secret');

    await submit();

    expect(authService.login).toHaveBeenCalledWith({
      username: 'demo',
      password: 'secret',
    });
    expect(formService.focusFirstInvalidControl).not.toHaveBeenCalled();
  });
});

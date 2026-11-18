import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { IsInvalidControlPipe } from '@shared/pipes/is-invalid-control.pipe';
import { ErrorMessagePipe } from '@shared/pipes/error-message.pipe';
import { markAllControlsAsTouched } from '@shared/utils/form.utils';
import { AuthService } from '@core/services/auth.service';
import { FormService } from '@shared/services/form.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    IsInvalidControlPipe,
    TranslatePipe,
    ErrorMessagePipe,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {
  // Injections
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private formService = inject(FormService);

  // Data
  public form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  // Methods
  public handleLogin(): void {
    markAllControlsAsTouched(this.form);

    if (this.form.invalid) {
      this.formService.focusFirstInvalidControl(this.host.nativeElement);
      return;
    }

    void this.authService.login(this.form.getRawValue());
  }
}

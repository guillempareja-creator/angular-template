import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { AppPath } from '@shared/enums/app-path.enum';

/** Only authenticated users; everyone else is redirected to the login page. */
export const authGuard: CanActivateFn = () =>
  inject(AuthService).isAuthenticated() ||
  inject(Router).createUrlTree(['/', AppPath.LOGIN]);

/** Only anonymous users (e.g. login page); authenticated users go home. */
export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).isAuthenticated() ||
  inject(Router).createUrlTree(['/', AppPath.MAIN]);

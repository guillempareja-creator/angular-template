import type { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';
import { AppPath } from '@shared/enums/app-path.enum';

export const routes: Routes = [
  {
    path: AppPath.LOGIN,
    loadComponent: () => import('./pages/login/login.component'),
    canActivate: [guestGuard],
  },
  {
    path: AppPath.MAIN,
    loadComponent: () => import('./pages/main/main.component'),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: AppPath.MAIN,
  },
];

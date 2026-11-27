import type { Routes } from '@angular/router';
import { AppPath } from '@shared/enums/app-path.enum';

export const routes: Routes = [
  {
    path: AppPath.MAIN,
    loadComponent: () => import('./pages/main/main.component'),
  },
  {
    path: '**',
    redirectTo: AppPath.MAIN,
  },
];

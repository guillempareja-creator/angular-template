import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '@core/services/loader.service';
import { SHOW_LOADER } from './http-context.tokens';
import { isApiRequest } from './interceptor.utils';

/** Shows the global loader while API requests are in flight (opt-out via `SHOW_LOADER`). */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req) || !req.context.get(SHOW_LOADER)) {
    return next(req);
  }

  const loaderService = inject(LoaderService);
  loaderService.show();

  return next(req).pipe(
    finalize(() => {
      loaderService.hide();
    }),
  );
};

import type { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { isApiRequest } from './interceptor.utils';

/** Prefixes relative API URLs with `environment.api`. Must be the last interceptor. */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req)) {
    return next(req);
  }

  return next(req.clone({ url: `${environment.api}${req.url}` }));
};

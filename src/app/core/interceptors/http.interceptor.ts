import type { HttpInterceptorFn } from '@angular/common/http';

/**
 * Single entry point of every HTTP request of the app (registered in
 * `app.config.ts`). It intentionally does nothing yet: each project adds here
 * its cross-cutting HTTP concerns (auth headers, error handling, global
 * loader…) once they are defined. See docs/architecture/api.md.
 */
export const httpInterceptor: HttpInterceptorFn = (req, next) => next(req);

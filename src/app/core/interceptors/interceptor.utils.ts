import type { HttpRequest } from '@angular/common/http';

const ASSETS_PREFIX = '/assets/';

/**
 * API calls use relative URLs (`/example`). Absolute URLs, protocol-relative
 * URLs and static assets (e.g. translation files) are not API requests and
 * are left untouched by the interceptors.
 */
export function isApiRequest(req: HttpRequest<unknown>): boolean {
  return (
    req.url.startsWith('/') &&
    !req.url.startsWith('//') &&
    !req.url.startsWith(ASSETS_PREFIX)
  );
}

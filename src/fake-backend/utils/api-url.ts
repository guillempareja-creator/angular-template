import { environment } from '../../environments/environment';

/** Absolute mock URL for a relative API path: `apiUrl('/example')` → `/api/example`. */
export function apiUrl(path: string): string {
  return `${environment.api}${path}`;
}

import { HttpContext, HttpContextToken } from '@angular/common/http';
import { DEFAULT_MESSAGE_TAG } from '@core/services/http-response-handler.service';

/** Tag of the generic success toast (`httpRequest.success.default`). */
export const DEFAULT_SUCCESS_MESSAGE = DEFAULT_MESSAGE_TAG;

/** Show the global loader while the request is in flight (default: true). */
export const SHOW_LOADER = new HttpContextToken<boolean>(() => true);

/**
 * i18n tag (`httpRequest.success.{tag}`) of the toast to show when the request
 * succeeds. `null` (default) shows nothing; `'default'` shows the generic one.
 */
export const SUCCESS_MESSAGE = new HttpContextToken<string | null>(() => null);

export type RequestOptions = {
  showLoader?: boolean;
  successMessage?: string;
};

/**
 * Builds the `HttpContext` for an API call:
 * `this.http.post(url, body, { context: requestContext({ successMessage: 'default' }) })`
 */
export function requestContext({
  showLoader = true,
  successMessage,
}: RequestOptions): HttpContext {
  return new HttpContext()
    .set(SHOW_LOADER, showLoader)
    .set(SUCCESS_MESSAGE, successMessage ?? null);
}

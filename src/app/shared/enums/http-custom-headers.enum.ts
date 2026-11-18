/**
 * Response headers the backend may send. Request-side options (loader,
 * success messages) travel as `HttpContext` tokens and never reach the
 * backend — see `core/interceptors/http-context.tokens.ts`.
 */
export enum HttpCustomHeader {
  CUSTOM_WARNING_MESSAGE = 'Back-Custom-Warning-Message',
}

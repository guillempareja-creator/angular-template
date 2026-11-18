import type {
  InterpolationParameters,
  TranslateService,
} from '@ngx-translate/core';

/**
 * Type-safe wrapper around `TranslateService.instant()`, whose return type is
 * `any`. Use it whenever a translation is needed in TypeScript code.
 * Falls back to the key when the entry is missing or is not a plain string.
 */
export function translateText(
  translate: TranslateService,
  key: string,
  params?: InterpolationParameters,
): string {
  const translation: unknown = translate.instant(key, params);

  return typeof translation === 'string' ? translation : key;
}

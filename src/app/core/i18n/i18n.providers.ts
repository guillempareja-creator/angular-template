import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {
  type EnvironmentProviders,
  inject,
  LOCALE_ID,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

export const DEFAULT_LANGUAGE = 'es';
export const DEFAULT_LOCALE = 'es-ES';
export const TRANSLATIONS_PATH = './assets/i18n/';

/**
 * Registers ngx-translate and the Angular locale (date, number and currency
 * pipes), and blocks the first render until the default translations are
 * loaded so `translate.instant()` is always safe to use.
 */
export function provideI18n(): EnvironmentProviders {
  registerLocaleData(localeEs, DEFAULT_LOCALE);

  return makeEnvironmentProviders([
    { provide: LOCALE_ID, useValue: DEFAULT_LOCALE },
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: TRANSLATIONS_PATH,
        suffix: '.json',
      }),
      fallbackLang: DEFAULT_LANGUAGE,
    }),
    provideAppInitializer(() =>
      firstValueFrom(inject(TranslateService).use(DEFAULT_LANGUAGE)),
    ),
  ]);
}

import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApplicationInitStatus, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_LOCALE,
  provideI18n,
  TRANSLATIONS_PATH,
} from './i18n.providers';

describe('provideI18n', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideI18n(),
      ],
    });
  });

  it('sets the application locale', () => {
    expect(TestBed.inject(LOCALE_ID)).toBe(DEFAULT_LOCALE);
  });

  it('loads the default language before the app starts', async () => {
    const httpTesting = TestBed.inject(HttpTestingController);
    const translate = TestBed.inject(TranslateService);

    httpTesting
      .expectOne(`${TRANSLATIONS_PATH}${DEFAULT_LANGUAGE}.json`)
      .flush({ greeting: 'Hola' });
    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(translate.instant('greeting')).toBe('Hola');
    httpTesting.verify();
  });
});

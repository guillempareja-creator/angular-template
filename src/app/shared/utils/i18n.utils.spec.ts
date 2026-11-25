import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { translateText } from './i18n.utils';

describe('translateText', () => {
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ lang: 'es' })],
    });
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      greeting: 'Hola {{name}}',
      nested: { child: 'Hijo' },
    });
  });

  it('returns the interpolated translation', () => {
    expect(translateText(translate, 'greeting', { name: 'Ana' })).toBe(
      'Hola Ana',
    );
  });

  it('returns the key when the translation is missing', () => {
    expect(translateText(translate, 'missing.key')).toBe('missing.key');
  });

  it('returns the key when the entry is not a plain string', () => {
    expect(translateText(translate, 'nested')).toBe('nested');
  });
});

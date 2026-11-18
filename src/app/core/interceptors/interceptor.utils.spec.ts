import { HttpRequest } from '@angular/common/http';
import { isApiRequest } from './interceptor.utils';

describe('isApiRequest', () => {
  it.each([
    ['/example', true],
    ['/example/1', true],
    ['./assets/i18n/es.json', false],
    ['/assets/i18n/es.json', false],
    ['//cdn.example.com/file.js', false],
    ['https://external.example.com/api', false],
  ])('%s → %s', (url, expected) => {
    expect(isApiRequest(new HttpRequest('GET', url))).toBe(expected);
  });
});

import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { HttpResponseHandlerService } from './http-response-handler.service';
import { NotificationService } from './notification.service';

describe('HttpResponseHandlerService', () => {
  let service: HttpResponseHandlerService;
  let notifications: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      httpRequest: {
        error: { default: 'Generic error', customError: 'Custom error' },
        warning: {
          default: 'Generic warning',
          customWarning: 'Custom warning',
        },
        success: { default: 'Generic success', saved: 'Saved' },
      },
    });
    translate.use('es');
    service = TestBed.inject(HttpResponseHandlerService);
    notifications = TestBed.inject(NotificationService);
  });

  function lastMessage(): string | undefined {
    return notifications.notifications().at(-1)?.message;
  }

  describe('handleHttpError', () => {
    it('translates the error tag sent by the backend', () => {
      service.handleHttpError(
        new HttpErrorResponse({ error: { tag: 'customError' } }),
      );

      expect(lastMessage()).toBe('Custom error');
    });

    it.each([
      ['an unknown tag', { tag: 'unknown' }],
      ['a non-string tag', { tag: 42 }],
      ['a body without tag', { message: 'boom' }],
      ['an empty body', null],
    ])('falls back to the default error with %s', (_, body) => {
      service.handleHttpError(new HttpErrorResponse({ error: body }));

      expect(lastMessage()).toBe('Generic error');
    });
  });

  it('shows a translated warning', () => {
    service.handleHttpWarning('customWarning');

    expect(notifications.notifications().at(-1)).toMatchObject({
      type: 'warning',
      message: 'Custom warning',
    });
  });

  it('shows a translated success message', () => {
    service.handleSuccessResponse('saved');

    expect(notifications.notifications().at(-1)).toMatchObject({
      type: 'success',
      message: 'Saved',
    });
  });

  it('shows the default success message when no tag is given', () => {
    service.handleSuccessResponse();

    expect(lastMessage()).toBe('Generic success');
  });

  it('shows the session expired error', () => {
    service.handleSessionExpired();

    expect(notifications.notifications().at(-1)).toMatchObject({
      type: 'error',
      message: 'httpRequest.error.sessionExpired',
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { NotificationService } from '@core/services/notification.service';
import { FormService } from './form.service';

describe('FormService', () => {
  let service: FormService;
  let notifications: NotificationService;
  let container: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
    });
    service = TestBed.inject(FormService);
    notifications = TestBed.inject(NotificationService);
    container = document.createElement('form');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('focuses the first invalid control and shows the form error', () => {
    container.innerHTML = `
      <input id="valid" class="ng-valid" />
      <input id="first" class="ng-invalid" />
      <textarea id="second" class="ng-invalid"></textarea>
    `;

    service.focusFirstInvalidControl(container);

    expect(document.activeElement?.id).toBe('first');
    expect(notifications.notifications().at(-1)).toMatchObject({
      type: 'error',
      message: 'form.globalError',
    });
  });

  it('does nothing when every control is valid', () => {
    container.innerHTML = '<input class="ng-valid" />';

    service.focusFirstInvalidControl(container);

    expect(notifications.notifications()).toHaveLength(0);
  });
});

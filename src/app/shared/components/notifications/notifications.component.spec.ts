import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { NotificationService } from '@core/services/notification.service';
import { NotificationsComponent } from './notifications.component';

describe('NotificationsComponent', () => {
  let service: NotificationService;
  let fixture: ComponentFixture<NotificationsComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
    });
    service = TestBed.inject(NotificationService);
    fixture = TestBed.createComponent(NotificationsComponent);
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  function renderedNotifications(): HTMLElement[] {
    return Array.from(host.querySelectorAll<HTMLElement>('.notification'));
  }

  it('renders nothing when there are no notifications', () => {
    expect(renderedNotifications()).toHaveLength(0);
  });

  it('renders each notification with an accessible role', async () => {
    service.success('Saved');
    service.error('Failed');
    await fixture.whenStable();

    const [success, error] = renderedNotifications();
    expect(success?.textContent).toContain('Saved');
    expect(success?.getAttribute('role')).toBe('status');
    expect(error?.classList).toContain('notification--error');
    expect(error?.getAttribute('role')).toBe('alert');
  });

  it('dismisses a notification with its close button', async () => {
    service.warning('Careful');
    await fixture.whenStable();

    host.querySelector<HTMLButtonElement>('.notification-close')?.click();
    await fixture.whenStable();

    expect(service.notifications()).toHaveLength(0);
    expect(renderedNotifications()).toHaveLength(0);
  });
});

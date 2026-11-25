import { TestBed } from '@angular/core/testing';
import {
  NOTIFICATION_DURATION_MS,
  NotificationService,
} from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('queues notifications of every type', () => {
    service.success('ok');
    service.warning('careful');
    service.error('ko');

    expect(service.notifications().map(({ type }) => type)).toEqual([
      'success',
      'warning',
      'error',
    ]);
  });

  it('ignores a duplicate of a visible notification', () => {
    service.error('ko');
    service.error('ko');

    expect(service.notifications()).toHaveLength(1);
  });

  it('dismisses a notification by id', () => {
    service.success('first');
    service.success('second');
    const [first] = service.notifications();

    service.dismiss(first!.id);

    expect(service.notifications().map(({ message }) => message)).toEqual([
      'second',
    ]);
  });

  it('auto-dismisses notifications after the configured duration', () => {
    service.success('ok');

    vi.advanceTimersByTime(NOTIFICATION_DURATION_MS);

    expect(service.notifications()).toEqual([]);
  });
});

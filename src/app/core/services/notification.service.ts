import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'warning' | 'error';

export type AppNotification = {
  id: number;
  type: NotificationType;
  message: string;
};

export const NOTIFICATION_DURATION_MS = 5000;

/**
 * In-house replacement for toast libraries. Notifications are rendered by
 * `NotificationsComponent` (mounted once in `AppComponent`).
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  // Data
  private nextId = 0;
  private readonly notificationList = signal<readonly AppNotification[]>([]);
  public readonly notifications = this.notificationList.asReadonly();

  // Methods
  public success(message: string): void {
    this.show('success', message);
  }

  public warning(message: string): void {
    this.show('warning', message);
  }

  public error(message: string): void {
    this.show('error', message);
  }

  public dismiss(id: number): void {
    this.notificationList.update((list) =>
      list.filter((notification) => notification.id !== id),
    );
  }

  private show(type: NotificationType, message: string): void {
    const isDuplicate = this.notificationList().some(
      (notification) =>
        notification.type === type && notification.message === message,
    );
    if (isDuplicate) {
      return;
    }

    const id = this.nextId++;
    this.notificationList.update((list) => [...list, { id, type, message }]);
    setTimeout(() => {
      this.dismiss(id);
    }, NOTIFICATION_DURATION_MS);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationService } from '@core/services/notification.service';

/** Renders the toasts queued in `NotificationService`. Mounted once in `AppComponent`. */
@Component({
  selector: 'app-notifications',
  imports: [TranslatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  // Injections
  private notificationService = inject(NotificationService);

  // Data
  public notifications = this.notificationService.notifications;

  // Methods
  public handleDismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}

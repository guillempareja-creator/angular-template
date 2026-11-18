import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@core/services/notification.service';
import { translateText } from '@shared/utils/i18n.utils';

const INVALID_CONTROL_SELECTOR =
  'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, [formcontrolname].ng-invalid';

@Injectable({ providedIn: 'root' })
export class FormService {
  // Injections
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  // Methods
  /**
   * Focuses (and scrolls to) the first invalid control inside `container`
   * and shows the generic form error toast.
   */
  public focusFirstInvalidControl(container: HTMLElement): void {
    const invalidControl = container.querySelector<HTMLElement>(
      INVALID_CONTROL_SELECTOR,
    );
    if (!invalidControl) {
      return;
    }

    invalidControl.focus();
    this.notificationService.error(
      translateText(this.translate, 'form.globalError'),
    );
  }
}

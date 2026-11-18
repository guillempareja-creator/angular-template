import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { HttpErrorResponse } from '@angular/common/http';
import { translateText } from '@shared/utils/i18n.utils';
import {
  NotificationService,
  type NotificationType,
} from '@core/services/notification.service';

export const DEFAULT_MESSAGE_TAG = 'default';

/**
 * Translates backend tags (`httpRequest.{type}.{tag}` in i18n) into
 * user-facing notifications. Used by the HTTP interceptors.
 */
@Injectable({
  providedIn: 'root',
})
export class HttpResponseHandlerService {
  // Injections
  private translate = inject(TranslateService);
  private notificationService = inject(NotificationService);

  // Methods
  public handleHttpError(error: HttpErrorResponse): void {
    const errorTag = readErrorTag(error.error) ?? DEFAULT_MESSAGE_TAG;
    this.notificationService.error(
      this.translateServerMessage(errorTag, 'error'),
    );
  }

  public handleHttpWarning(warningTag: string): void {
    this.notificationService.warning(
      this.translateServerMessage(warningTag, 'warning'),
    );
  }

  public handleSuccessResponse(successTag: string = DEFAULT_MESSAGE_TAG): void {
    this.notificationService.success(
      this.translateServerMessage(successTag, 'success'),
    );
  }

  public handleSessionExpired(): void {
    this.notificationService.error(
      translateText(this.translate, 'httpRequest.error.sessionExpired'),
    );
  }

  /**
   * Returns the translation for `httpRequest.{type}.{tag}`, falling back to
   * `httpRequest.{type}.default` when the tag is unknown.
   */
  private translateServerMessage(tag: string, type: NotificationType): string {
    const translationKey = `httpRequest.${type}.${tag}`;
    const translatedMessage = translateText(this.translate, translationKey);

    if (translatedMessage === translationKey) {
      return translateText(
        this.translate,
        `httpRequest.${type}.${DEFAULT_MESSAGE_TAG}`,
      );
    }

    return translatedMessage;
  }
}

function readErrorTag(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('tag' in body)) {
    return null;
  }

  return typeof body.tag === 'string' ? body.tag : null;
}

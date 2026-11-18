import { Pipe, type PipeTransform, inject } from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { translateText } from '@shared/utils/i18n.utils';

type MaybeControl = AbstractControl | null | undefined;

type FirstError = { key: string; value: unknown };

type TranslatableError = {
  translationTag: string;
  interpolationParams?: Record<string, unknown>;
};

/**
 * Angular native validators that need translation.
 * Add more Angular native validations here (email, min, max, pattern, etc.)
 */
const ANGULAR_NATIVE_VALIDATORS: Readonly<Record<string, string>> = {
  required: 'form.requiredError',
};

function isTranslatableError(value: unknown): value is TranslatableError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'translationTag' in value &&
    typeof value.translationTag === 'string'
  );
}

function findFirstError(controls: MaybeControl[]): FirstError | null {
  for (const control of controls) {
    const errors = control?.errors;
    const key = errors ? Object.keys(errors)[0] : undefined;
    if (errors && key) {
      return { key, value: errors[key] };
    }
  }

  return null;
}

@Pipe({ name: 'errorMessage', pure: false })
export class ErrorMessagePipe implements PipeTransform {
  // Injections
  private translate = inject(TranslateService);

  // Methods
  private resolveErrorValue(errorValue: unknown): string {
    if (typeof errorValue === 'string') {
      return errorValue;
    }

    if (isTranslatableError(errorValue)) {
      return translateText(
        this.translate,
        errorValue.translationTag,
        errorValue.interpolationParams,
      );
    }

    return translateText(this.translate, 'form.invalidFieldError');
  }

  /**
   * Returns an error message based on the first error found among one or more controls.
   * - Accepts a single control or an array of them (nullish entries are ignored,
   *   so `form.get('field')` can be passed directly).
   * - Custom messages passed as `errorMessages` override any default.
   * - Angular native validators (like 'required') are translated from i18n.
   * - Custom validators returning `{ translationTag, interpolationParams }` are translated.
   * - Plain string error values are returned as-is.
   *
   * @param controls      One control or an array of controls to inspect.
   * @param errorMessages Optional overrides e.g. { required: 'Custom message' }.
   */
  public transform(
    controls: MaybeControl | MaybeControl[],
    errorMessages: Record<string, string> = {},
  ): string {
    const list = Array.isArray(controls) ? controls : [controls];
    const firstError = findFirstError(list);
    if (!firstError) {
      return '';
    }

    const customMessage = errorMessages[firstError.key];
    if (customMessage) {
      return customMessage;
    }

    const nativeTag = ANGULAR_NATIVE_VALIDATORS[firstError.key];
    if (nativeTag) {
      return translateText(this.translate, nativeTag);
    }

    return this.resolveErrorValue(firstError.value);
  }
}

import type {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

/**
 * Returns the control value as text, or `null` when it is empty (nullish or
 * whitespace only) or not a primitive text/number. Empty values are left to
 * `Validators.required`.
 */
function readText(control: AbstractControl): string | null {
  const value: unknown = control.value;
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const text = String(value);
  return text.trim() === '' ? null : text;
}

/**
 * Validates that the value is a valid number
 * Returns error if value is not numeric (e.g., "abc", "12abc", NaN)
 *
 * Example usage in i18n:
 * "form.numericError": "Debe ser un valor numérico"
 */
export function numericValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const text = readText(control)?.trim();
    if (!text) {
      return null;
    }

    if (isNaN(Number(text)) || isNaN(parseFloat(text))) {
      return {
        numeric: { translationTag: 'form.numericError' },
      };
    }

    return null;
  };
}

/**
 * Validates exact length
 * Returns error with the exact value for i18n interpolation
 *
 * Example usage in i18n:
 * "form.exactLengthError": "Debe tener exactamente {{length}} caracteres"
 */
export function exactLengthValidator(length: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const text = readText(control);
    if (text === null || text.length === length) {
      return null;
    }

    return {
      exactLength: {
        translationTag: 'form.exactLengthError',
        interpolationParams: { length },
      },
    };
  };
}

/**
 * Validates maximum length with dynamic limit
 * Returns error with the max value for i18n interpolation
 *
 * Example usage in i18n:
 * "form.maxLengthError": "Máximo {{max}} caracteres permitidos"
 */
export function maxLengthValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const text = readText(control);
    if (text === null || text.length <= max) {
      return null;
    }

    return {
      maxLength: {
        translationTag: 'form.maxLengthError',
        interpolationParams: { max },
      },
    };
  };
}

/**
 * Validates minimum length with dynamic limit
 * Returns error with the min value for i18n interpolation
 *
 * Example usage in i18n:
 * "form.minLengthError": "Mínimo {{min}} caracteres requeridos"
 */
export function minLengthValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const text = readText(control);
    if (text === null || text.length >= min) {
      return null;
    }

    return {
      minLength: {
        translationTag: 'form.minLengthError',
        interpolationParams: { min },
      },
    };
  };
}

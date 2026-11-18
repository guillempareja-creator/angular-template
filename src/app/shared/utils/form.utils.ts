import { FormArray, FormGroup, type AbstractControl } from '@angular/forms';

/**
 * Marks a control and all its descendants (FormGroup / FormArray) as touched.
 *
 * @param control - Root control to mark.
 */
export function markAllControlsAsTouched(control: AbstractControl): void {
  if (control instanceof FormGroup || control instanceof FormArray) {
    Object.values(control.controls).forEach((ctrl) => {
      markAllControlsAsTouched(ctrl);
    });
  }
  control.markAsTouched();
}

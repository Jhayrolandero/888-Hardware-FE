import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function sellPriceValidator(stockPrice: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const sellPrice = control.value;

    // Ensure sellPrice and stockPrice are valid numbers before checking
    if (sellPrice != null && stockPrice != null) {
      return sellPrice >= stockPrice ? null : { sellPriceInvalid: true };
    }
    return null;
  };
}

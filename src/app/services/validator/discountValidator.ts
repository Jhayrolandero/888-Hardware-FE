import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Custom validator function
export function overInitPrice(price: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      // Check if the value is greater than the max limit
      if (value > price) {
        return { 'overInitPrice': { value: value } }; // Return error if invalid
      }
  
      return null; // Return null if valid
    };
  }
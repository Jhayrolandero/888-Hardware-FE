import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription } from 'rxjs';
import { greaterThanZeroValidator } from '../../../../services/validator/greaterThanZero';

@Component({
  selector: 'app-bundle-types',
  templateUrl: './bundle-types.component.html',
  styleUrl: './bundle-types.component.css'
})
export class BundleTypesComponent {

  // @Input('bundleType') bundleType: number | null = 1
  // @Input('resetTier') resetTier: boolean = false
  private eventsSubscription!: Subscription;
  @Input() resetTier!: Observable<boolean>

  @Output() tiersChanged = new EventEmitter<FormArray>();

  tierCount: number = 1
  @Input() textDisplay: string = "% Off"

  bundleForm = this.fb.group({
    incoming_tiers: this.fb.array([
      new FormGroup({
        requiredQty: new FormControl(0, [Validators.required, greaterThanZeroValidator()]),
        promoValue: new FormControl(0, [Validators.required, greaterThanZeroValidator()])  
      })
    ])
  })

  ngOnInit() {
    // Watch for reset form event 
    this.eventsSubscription = this.resetTier.subscribe(res => {
      if(res) {
        this.bundleForm.reset()

        while (this.incoming_tiers.length) {
          this.incoming_tiers.removeAt(0);
        }
    
        this.tierCount = 1

        this.bundleForm = this.fb.group({
          incoming_tiers: this.fb.array([
            new FormGroup({
              requiredQty: new FormControl(0, [Validators.required, greaterThanZeroValidator()]),
              promoValue: new FormControl(0, [Validators.required, greaterThanZeroValidator()])  
            })
          ])
        })
        
      }
    })
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe()
  }

  get incoming_tiers() {
    return this.bundleForm.get('incoming_tiers') as FormArray
  }

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.incoming_tiers.valueChanges.subscribe(
      res => {
          this.tiersChanged.emit(res)
      }
    )
  }

  public addTier() {
    if(this.incoming_tiers.invalid) {
      this.snackBar.open('Value must be greater than zero', 'Close', {
        duration: 2000,
      });
      return
    }

    if(this.incoming_tiers.length > 1) {
      const prevTier = this.incoming_tiers.at(this.incoming_tiers.length-2)
      const currTier = this.incoming_tiers.at(this.incoming_tiers.length-1)

      if((currTier.dirty) && prevTier.value.requiredQty > currTier.value.requiredQty) {
        this.snackBar.open('Buy quantity must greater than previous tier', 'Close', {
          duration: 2000,
        });
        return
      } else if((currTier.dirty) && prevTier.value.promoValue >= currTier.value.promoValue) {
        this.snackBar.open('Promo value must greater than previous tier', 'Close', {
          duration: 2000,
        });
        return
      }
    }
    this.tierCount = this.tierCount+1

    let tierForm = new FormGroup({
      requiredQty: new FormControl(0, [Validators.required, greaterThanZeroValidator()]),
      promoValue: new FormControl(0, [Validators.required, greaterThanZeroValidator()])
    })

    this.incoming_tiers.push(tierForm)
  }

  public deleteTier(idx: number) { 
    this.tierCount = this.tierCount-1

    this.incoming_tiers.removeAt(idx)
  }

  test() {
    console.log(this.bundleForm.value)
  }

}

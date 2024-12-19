import { ChangeDetectorRef, Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { CurrBundleProduct, Product } from '../../../interface/product';
import { ProductService } from '../../../services/store/product.service';
import { mainPort } from '../../../app.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../services/data.service';
import { greaterThanZeroValidator } from '../../../services/validator/greaterThanZero';
import { BundleService } from '../../../services/store/bundle.service';
import { PromoService } from '../../../services/promo.service';

@Component({
  selector: 'app-bundle-deals',
  templateUrl: './bundle-deals.component.html',
  styleUrl: './bundle-deals.component.css'
})
export class BundleDealsComponent {

  bundleTypeForm = new FormGroup({
    bundleName: new FormControl('', [Validators.required]),
    bundleStart: new FormControl(this.formatDateToYYYYMMDD(new Date()), [Validators.required]),
    bundleEnd: new FormControl(this.formatDateToYYYYMMDD(new Date()), [Validators.required]),
    bundleType: new FormControl(1, [Validators.required]),
    purchaseLimit: new FormControl(0,[Validators.required, greaterThanZeroValidator(), Validators.pattern(/^[0-9]*$/)]),
    productsArr: this.fb.array([]),
    bundleTiers: new FormControl()
  })

  addProductArr: Product[] = []
  // addProductArr: Product[] = []
  port = mainPort
  resetTier: boolean = false
  filteredProducts!: Product[];
  resetSubject: Subject<boolean> = new Subject<boolean>();
  products!: Product[]
  cre!: any
  bundleProducts!: CurrBundleProduct[]
  productSearch = '';
  selectedProduct: Product | null = null;

  constructor(    
    private router: Router,
    private productService: ProductService,
    private promoService: PromoService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dataService: DataService,
    private bundleService: BundleService
  ) {
    this.productService.product$.subscribe((data) => {
      this.products = data;
      this.filteredProducts = this._filter('')
      console.log(this.filteredProducts)
    });

    this.bundleService.currBundleProduct$.subscribe(data => {
      console.log("Bundle products updated: ", data)
      this.bundleProducts = data
      this.filteredProducts = this._filter('')
      console.log("Filtered on search bar: ", this.filteredProducts)
    })

    
  }


  private periodValidator() {
    return new Date(this.getControlValue('bundleEnd')).getTime() < new Date(this.getControlValue('bundleStart')).getTime()
  }

  public formatDateToYYYYMMDD(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Adding 1 because months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }


  public getControlValue(controlName: string) {
    return this.bundleTypeForm.get(controlName)?.value
  }

  public dateWrapper(dateTime: string) {
    return new Date(dateTime)
  }
  
  public goTo(){
    this.router.navigate(['/promotions']);
  }

  get incoming_Products() {
    return this.bundleTypeForm.get('productsArr') as FormArray;
  }

  get incoming_Tiers() {
    return this.bundleTypeForm.get('bundleTiers') as FormArray
  }


  public onchangeTier(e: FormArray) {
    console.log(e)
    this.bundleTypeForm.patchValue({
      bundleTiers: e
    })

    console.log(this.incoming_Tiers.value)
  }

  public _productFilter(e: any) {
    this.filteredProducts = this._filter(e)
  }

  private _filter(value: string): Product[] {
    let activeBundleProd = this.bundleProducts.filter(x => x.bundle_status === 'ongoing')
    console.log("Actove bundle products: ", activeBundleProd)
    //Create product but remove all products that are in the active bundle
    let products = this.products.filter(x => !activeBundleProd.some(y => y.product_ID === x.product_ID))
    const filterValue = this._normalizeValue(value);
    return products
      .filter(products => this._normalizeValue(products.product_name).includes(filterValue))
// =======
//   private _filter(value: string): CurrBundleProduct[] {
//     const filterValue = this._normalizeValue(value);
//     console.log("Filter bundle products: ", this.bundleProducts)
//     return this.bundleProducts
//       .filter(bundleProducts => this._normalizeValue(bundleProducts.product_name).includes(filterValue) && (bundleProducts.bundle_status === 'no' || bundleProducts.bundle_status === 'expired'))
  }

  private _normalizeValue(value: string): string {
    try {
      return value.toLowerCase().replace(/\s/g, '');
    } catch(err) {
      return ""
    }
  }

  private searchProduct(searchWord: string) {
    let productRes : CurrBundleProduct | undefined
    productRes = this.bundleProducts.find(x => this._normalizeValue(x.product_name).startsWith(this._normalizeValue(searchWord)))
    return productRes
  }


  public addProduct() {
    
    if(this.cre === undefined || this.cre === null) {
      this.snackBar.open("Product name cannot be empty!", 'Close', {
        duration: 1000,
      });
      return
    } 

    // If typed manually 
    if(this.cre.product_ID === undefined) {
      const searchWord = this.cre as any
      const productRes = this.searchProduct(searchWord)
      if(productRes === undefined) {
        this.snackBar.open("Product doesn't exist!", 'Close', {
          duration: 1000,
        });
        return
      }
      
      this.cre = productRes
    }

    if(this.addProductArr.includes(this.cre)) {
      this.snackBar.open("Product is already added!", 'Close', {
        duration: 1000,
      });

      this.cre = null
      return
    } 

    let productForm = new FormControl(this.cre.product_ID)

    this.incoming_Products.push(productForm)
    this.addProductArr.push(this.cre)
    this.cre = null
    this.productSearch = ''
  }


  public deleteProduct(idx: number) {
    this.addProductArr.splice(idx, 1);
    this.incoming_Products.removeAt(idx) // Correct way to remove the item in place
  }

  private cleanseForm() {
    this.bundleTypeForm.reset()
    this.addProductArr = []
    this.resetSubject.next(true);

    while (this.incoming_Products.length) {
      this.incoming_Products.removeAt(0);
    }

    this.bundleTypeForm.patchValue({
      bundleStart: this.formatDateToYYYYMMDD(new Date()),
      bundleEnd: this.formatDateToYYYYMMDD(new Date()),
      bundleType: 1
    })
  }

  private validateForm() {
    const snackMessage = (msg: string) => {
      this.snackBar.open(msg, 'Close', {
        duration: 2000,
      });  

      return false
    }

    let isValid = true
    Object.keys(this.bundleTypeForm.controls).forEach(key => {
      const controlErrors = this.bundleTypeForm.get(key)!.errors;
      if (controlErrors != null) {
        
        Object.keys(controlErrors).forEach(keyError => {
          switch(key) {
            case "bundleName":
              isValid = snackMessage("Bundle name cannot be empty!")
              break
            case "purchaseLimit":
              switch(keyError){
                case "required":
                  isValid = snackMessage("Purchase limit cannot be empty!")
                  break
                case "greaterThanZero":
                  isValid = snackMessage("Purchase limit must be greater than zero")
                  break
              }
              break
          }
        //  console.log('Key control: ' + key + ', keyError: ' + keyError + ', err value: ', controlErrors[keyError]);
        });
      }
    });

    if(!isValid) return false

    if(this.incoming_Tiers.value === null || this.incoming_Tiers.length <= 0) return snackMessage('Bundle tiers cannot be empty!')

    const values = this.incoming_Tiers.value as []
    let tierInvalid = false

    for(let i = 0; i < values.length; i++) {
      if(this.incoming_Tiers.value[i].requiredQty <= 0 || this.incoming_Tiers.value[i].promoValue <= 0) {
        tierInvalid = true
        console.log("wtf")
        break
      }
    }

    if(tierInvalid) return snackMessage('A bundle tier input cannot be zero')

    let requiredInvalid = false
    let promoInvalid = false
    for (let i = 1; i < values.length; i++) {
      const previousGroup = this.incoming_Tiers.value[i - 1]
      const currentGroup = this.incoming_Tiers.value[i]


      const previousRequiredQty = previousGroup.requiredQty
      const currentRequiredQty = currentGroup.requiredQty
  
      const previousPromoValue = previousGroup.promoValue
      const currentPromoValue = currentGroup.promoValue
  
      if (currentRequiredQty < previousRequiredQty) {
        requiredInvalid = true
      } else if (currentPromoValue <= previousPromoValue) {
        promoInvalid = true
      }
    }

    if(requiredInvalid) return snackMessage('Buy quantity must greater than or equal previous tier');  
    if(promoInvalid) return snackMessage('Promo value must greater than previous tier');  
      
    if(this.periodValidator()) return snackMessage('End date cannot start soon than start date')

    return true
  }

  public test() {

    console.log(this.bundleTypeForm.value)
    if(!this.validateForm()) return

    this.dataService.postData(this.bundleTypeForm, 'addDeal').subscribe({
      next: (res:any) => {
        console.log(res)
        // res.data.map((x:any) => this.bundleService.patchCurrDiscountState(x));
        this.promoService.updatePromo(res)
        this.bundleService.updateTier(res.bundle_tiers)
        this.bundleService .updateBundleProduct(res.products)

        console.log(this.bundleService.getBundleTierState())
        console.log(this.bundleService.getCurrDiscountState())  
        this.cleanseForm()
      },
      error: (err) => {
        console.log(err)
      }
    })
  }
}

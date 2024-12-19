import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Variant, VariantGroup } from '../../interface/variant';
import { DataService } from '../data.service';
import { BackgroundSyncService } from './background-sync.service';
import { HttpClient } from '@angular/common/http';
import { mainPort } from '../../app.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../loading.service';

@Injectable({
  providedIn: 'root'
})
export class VariantService {

  private _variant = new BehaviorSubject<Variant[]>([]);
  variant$ = this._variant.asObservable();
  loaderState: string = "variant"

  constructor(
    private dataService: DataService,
    private http: HttpClient,
    private backgroundSync: BackgroundSyncService,
    private _snackBar: MatSnackBar,
    private loaderService: LoadingService
  ) {
    this.loaderService.initLoading(this.loaderState)
    this.initVariant();
   }

  initVariant(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getVariant').subscribe({
      next: (value: any) => {
        console.log("Loading Variant...", value);
        this.setVariantState(value.data);
        this.loaderService.stopLoading(this.loaderState)
      },
      error: (error) => {
        console.log(error);
        this.loaderService.stopLoading(this.loaderState)
      }
    })
  }

  getVariantState() {
    return this._variant.getValue();
  }

  setVariantState(data: Variant[]){
    this._variant.next(data);
  }

  addVariant(variant: Variant[]){ 
    variant.forEach((v) => {   
      console.log(v)
      let oldState = this._variant.getValue();
      console.log(oldState);
      let newState = [...oldState, v];
  
      this.setVariantState(newState);
    });
  }

  quickEditVariant(variantForm: any, id: number) {
    console.log("from quick edit, heres the id passed ", id)
    let formValues = variantForm.value;
    let oldState = this._variant.getValue();
    console.log("from quick edit, heres the old state ", oldState)
    let newState = oldState.map((variant) => {
      if (variant.variant_ID === id) {
        console.log("i found the variant you want to quickly edit")
        return {
          ...variant,
          variant_name: formValues.variant_name,
          variant_stock_price: formValues.variant_stock_price,
          variant_unit_price: formValues.variant_unit_price
        };
      }
      return variant;
    });

    this.setVariantState(newState);
  }

  editVariant(variants: Variant[]){
    let tempVariants = variants;
    let oldState = this._variant.getValue();
    let newState = [...oldState];
    let formVariants: number[] = [];

    tempVariants.forEach((variant) => {
      formVariants.push(variant.variant_ID);
    })

    oldState.forEach((variant) => {
      if(variant.product_ID === tempVariants[0].product_ID){
        if(!formVariants.includes(variant.variant_ID)){
          console.log("Deleting ", variant);
          newState = oldState.filter((tempVar) => tempVar.variant_ID !== variant.variant_ID);
          oldState = newState;
        }
      }
    })

    oldState.map((variant) => {
      let formVariant = tempVariants.find(v => v.variant_ID === variant.variant_ID);

      if (formVariant) {
        variant.variant_code = formVariant.variant_code;
        variant.variant_stock_price = formVariant.variant_stock_price;
        variant.variant_stock_discount = formVariant.variant_stock_discount;
        variant.variant_unit_price = formVariant.variant_unit_price;
        variant.variant_unit_discount = formVariant.variant_unit_discount;
        variant.variant_stock = formVariant.variant_stock;
        variant.variant_description = formVariant.variant_description;
        variant.variant_image = formVariant.variant_image;
        variant.low_stock_level = formVariant.low_stock_level;
        variant.critical_stock_level = formVariant.critical_stock_level;
        console.log("Variant map: ", variant);
        tempVariants = tempVariants.filter(v => v.variant_ID !== variant.variant_ID);
      }

      return variant;
    });
    tempVariants.forEach((variant) => {
      newState = [...newState, variant];
    });

    // Update the state with the new variants
    this.setVariantState(newState);
  }

  deleteVariant(variant: Variant, ){
    let oldState = this._variant.getValue();
    let id = variant.variant_ID;
    // let temp = oldState.filter((v) => v.product_ID === variant.product_ID);

    // if(temp.length < 2){
    //   this._snackBar.open("You cannot delete the last variant. Please use the product edit to make such changes.", 'Undo', {duration: 3500});
    //   return;
    // }

    let newState = oldState.filter((variant) => variant.variant_ID !== id);

    this.setVariantState(newState);
  }

  findVariants(id: number) {
    let currentState = this._variant.getValue();
    let variants = currentState.filter((variant) => variant.product_ID === id);

    return variants;
  }

  addQuantity(inventory: any){
    let oldState = this._variant.getValue();
    let newState = oldState.map((product) => {
      if(product.variant_ID === inventory.variant_ID){
        product.variant_stock = product.variant_stock + inventory.quantity;
      }
      return product;
    });
    this.setVariantState(newState);
  }

  addVariantByID(product_ID: number, variant: Variant[]) {
    console.log("Adding variant...: ", variant);

    // Get the current state
    let oldState = this._variant.getValue();

    // Ensure the product_ID comparison is correct and filter the old state
    let newState = oldState.filter(item => item.product_ID !== product_ID);

    // Add the new product
    let updatedState = [...newState, ...variant];

    // Update the BehaviorSubject state
    this._variant.next(updatedState); // Use `.next()` to push the new state

    // Log the new state
    console.log("Updated State: ", this._variant.getValue());
}



  getVariant(product_ID: number, variant_ID: number){
    let currentState = this._variant.getValue();
    let variant = currentState.find((variant) => variant.product_ID === product_ID && variant.variant_ID === variant_ID);

    return variant;
  }

  updateVariantStock(product_ID: number, variant_ID: number, quantity: number){
    let currentState = this._variant.getValue();
    let newState = currentState.map((variant) => {
      if (variant.product_ID === product_ID && variant.variant_ID === variant_ID) {
        return {...variant, variant_stock: variant.variant_stock - quantity};
      }
      return variant;
    });

    this.setVariantState(newState);
  }

  updateSupplierStock(product: any){
    let oldState = this._variant.getValue();
    let newState = oldState.map((prod) => {
      if(prod.variant_ID === product.variant_ID){
        prod.variant_stock = prod.variant_stock + product.incoming_quantity;
        prod.variant_unit_price = product.variant_unit_price;
        prod.variant_stock_price = product.variant_stock_price;
        prod.variant_stock_discount = product.discount.join(", ");
      }
      return prod;
    });
    this.setVariantState(newState);
  }
  
}


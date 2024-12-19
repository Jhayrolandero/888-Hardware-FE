import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../../interface/product';
import { Variant } from '../../../interface/variant';
import { mainPort } from '../../../app.component';
import { VariantService } from '../../../services/store/variant.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ProductService } from '../../../services/store/product.service';
import { FormGroup, FormControl, FormArray, FormBuilder, Validators } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { overInitPrice } from '../../../services/validator/discountValidator';
import { DiscountService } from '../../../services/store/discount.service';
import { PromoService } from '../../../services/promo.service';

type addVariants = {
  [id: number] : Variant[]
}

@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.component.html',
  styleUrl: './discounts.component.css'
})

export class DiscountsComponent implements OnInit {
  test = ''
  showLimit = false
  products: Product[] = []
  selectedProduct: Product | null = null;
  addedProducts: Product[] = []
  filteredProducts: Product[] = []
  variants: Variant[] = []
  addedVariants: addVariants | undefined = undefined
  productSearch: string = ''
  port = mainPort
  isSubmitting = false;
  discountAll = null;

  promotionDiscountForm = new FormGroup({
    discount_name: new FormControl<string>('', Validators.required),
    discount_from: new FormControl<Date | null>(null, Validators.required),
    discount_to: new FormControl<Date | null>(null, Validators.required),
    discount_products: this.fb.array<any>([]), 
  })

  constructor(    
    private router: Router,
    private productService: ProductService,
    private variantService: VariantService,
    private discountService: DiscountService,
    private promoService: PromoService,
    private dataService: DataService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private titleService: Title,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(){
    this.titleService.setTitle("Discounts - 888 Hardware Trading");


  }

  ngAfterViewInit(){
    this.productService.product$.subscribe({
      next: (value) => {
        this.products = value
        this.filteredProducts = this.discountService.getDiscountAvailable(this.products);
        console.log("Filtered Products Initial: ", this.filteredProducts);
        this.productSearchFilter();
      }
    })
    this.discountService.discountProduct$.subscribe({
      next: (value) => {
        this.filteredProducts = this.discountService.getDiscountAvailable(this.products);
        this.productSearchFilter();
      }
    })
  }

  get discount_products() {
    return this.promotionDiscountForm.get('discount_products') as FormArray;
  }

  get discount_from() {
    return this.promotionDiscountForm.get('discount_from')!.value;
  }

  get discount_to() {
    return this.promotionDiscountForm.get('discount_to')!.value;
  }

  public testChange(e: any) {
    if(e.target.value.toLowerCase() === 'set limit'){
      this.showLimit = true
    } else {
      this.showLimit = false
    }
  }

  checkDate(){

  }

  goTo(){
    this.router.navigate(['/promotions']);
  }

  productSearchFilter(){
    this.filteredProducts = this.products.filter((product) => {
      return product.product_name.toLowerCase().includes(this.productSearch.toLowerCase())
    })
    console.log("Initial search result: ", this.filteredProducts);
    this.filteredProducts = this.discountService.getDiscountAvailable(this.filteredProducts);
  }

  getDiscountedPrice(idx: any, idxV: any){
    if(idxV == -1){
      let productForm = this.discount_products.at(idx) as FormGroup;
      return productForm.get('discounted_price')?.value;
    }
    else{
      let variantArray = (this.discount_products.at(idx) as FormGroup).get('variantForms') as FormArray;
      let variantForm = variantArray.at(idxV) as FormGroup;
      return variantForm.get('discounted_price')?.value;
    }
  }

  getDiscount(idx: any, idxV: any){
    if(idxV == -1){
      let productForm = this.discount_products.at(idx) as FormGroup;
      return productForm.get('discount')?.value;
    }
    else{
      let variantArray = (this.discount_products.at(idx) as FormGroup).get('variantForms') as FormArray;
      let variantForm = variantArray.at(idxV) as FormGroup;
      return variantForm.get('discount')?.value;
    }
  }

  priceChange(e: any, idx: any, idxV: any){
    const inputElement = e.target as HTMLInputElement;
    let deezCount = +inputElement.value;

    console.log(deezCount)

    if(idxV == -1){
      let productForm = this.discount_products.at(idx) as FormGroup;
      let product_sell_price = productForm.get('unit_price')?.value;
      if(deezCount >= product_sell_price || deezCount < 0){ return; }
      let discount = ((product_sell_price - deezCount) / product_sell_price) * 100;
      productForm.patchValue({
        discount: Math.trunc(discount),
        discounted_price: Math.trunc(deezCount)
      })
    }
    else{
      //Fetches value of the current formgroup
      let variantArray = (this.discount_products.at(idx) as FormGroup).get('variantForms') as FormArray;
      let variantForm = variantArray.at(idxV) as FormGroup;
      //Fetches the variant sell price
      let variant_unit_price = variantForm.get('variant_unit_price')?.value;
      if(deezCount >= variant_unit_price || deezCount < 0){ return; }
      let discount = ((variant_unit_price - deezCount) / variant_unit_price) * 100;
      variantForm.patchValue({
        discount: Math.trunc(discount),
        discounted_price: Math.trunc(deezCount)
      });
    }
  }

  discountChange(e: any, idx: any, idxV: any){
    const inputElement = e.target as HTMLInputElement; 
    let deezCount = +inputElement.value;
    if(deezCount >= 100 || deezCount < 0){ return; }
    this.discountApply(deezCount, idx, idxV);
  }

  discountApply(deezCount: any, idx: any, idxV: any){
    if(deezCount < 100){
      if(idxV == -1){
        let productForm = this.discount_products.at(idx) as FormGroup;
        let product_sell_price = productForm.get('unit_price')?.value;
        let discount = deezCount;
        let discounted_price = product_sell_price - (product_sell_price * (discount / 100));
        productForm.patchValue({
          discount: Math.trunc(discount),
          discounted_price: Math.trunc(discounted_price)
        });
      }
      else{
        //Fetches value of the current formgroup
        let variantArray = (this.discount_products.at(idx) as FormGroup).get('variantForms') as FormArray;
        let variantForm = variantArray.at(idxV) as FormGroup;
        //Fetches the variant sell price
        let variant_unit_price = variantForm.get('variant_unit_price')?.value;
        let discount = deezCount;
        let discounted_price = variant_unit_price - (variant_unit_price * (discount / 100));
        variantForm.patchValue({
          discount: Math.trunc(discount),
          discounted_price: Math.trunc(discounted_price)
        });
      }
    }
  }

  addVariantForm(variant: any){
  }

  fetchVariants(product: any){
    return this.variantService.findVariants(product.product_ID);
  }

  addProducts(){
    let selectedID = this.selectedProduct!.product_ID;

    //No selected product
    if(this.selectedProduct === null){
      this.snackBar.open("Please select a product", "Close", {
        duration: 2000
      });
      return;
    }

    //Exist checker
    if(this.addedProducts.find((product) => product.product_ID === selectedID)){
      this.snackBar.open("Product already added", "Close", {
        duration: 2000
      });
      return;
    }

    if(this.selectedProduct.has_variant){
      this.addedProducts.push(this.selectedProduct);
      let productForm = new FormGroup({
        product_ID: new FormControl<number>(this.selectedProduct.product_ID),
        product_name: new FormControl<string>(this.selectedProduct.product_name),
        has_variant: new FormControl<boolean>(this.selectedProduct.has_variant),
        variantForms: this.fb.array<any>([]),
      })
      this.discount_products.push(productForm);


      //Fetch all variants within this product
      let variants = this.variantService.findVariants(selectedID);
      variants.forEach((variant) => {
        if (!this.addedVariants) {
          this.addedVariants = { [selectedID]: [variant] };
        } else {
          if (this.addedVariants!.hasOwnProperty(selectedID)) {
            if (!this.addedVariants![selectedID].includes(variant)) {
              // Push if key exists but not the value
              this.addedVariants![selectedID] = [...this.addedVariants![selectedID], variant];
            }
          } else {
            // Add if key doesn't exist
            this.addedVariants![selectedID] = [variant];
          }
        }
        let variantForm = new FormGroup({
          product_ID: new FormControl<number>(selectedID),
          variant_ID: new FormControl<number>(variant.variant_ID),
          variant_name: new FormControl<string>(variant.variant_name),
          variant_unit_price: new FormControl<number>(variant.variant_unit_price),
          variant_stock: new FormControl<number>(variant.variant_stock),
          discounted_price: new FormControl<number>(variant.variant_unit_price, [overInitPrice(variant.variant_unit_price)]),
          discount: new FormControl<number>(0, [Validators.max(100)]),
        });
        (productForm.get('variantForms') as FormArray).push(variantForm);
      })

      console.log("variants hehe", this.addedVariants)
    }
    else{
      this.addedProducts.push(this.selectedProduct);
      let productForm = new FormGroup({
        product_ID: new FormControl<number>(this.selectedProduct.product_ID),
        product_name: new FormControl<string>(this.selectedProduct.product_name),
        unit_price: new FormControl<number>(this.selectedProduct.unit_price),
        product_stock: new FormControl<number>(this.selectedProduct.product_stock),
        has_variant: new FormControl<boolean>(this.selectedProduct.has_variant),
        discounted_price: new FormControl<number>(this.selectedProduct.unit_price, [overInitPrice(this.selectedProduct.unit_price)]),
        discount: new FormControl<number>(0, [Validators.max(100)]),
      }); 
      this.discount_products.push(productForm);
      console.log(this.addedProducts);
    }
    this.selectedProduct = null;
    this.productSearch = '';
    console.log("Added variants: ", this.addedVariants);
  }

  addVariant(inventory: any, variant: any, idx: any){
    //Exist checher
    if(this.addedVariants![inventory.product_ID].find((v) => v.variant_ID === variant.variant_ID)){
      this.snackBar.open("Variant already added", "Close", {
        duration: 2000
      });
      return;
    }

    let productForm = this.discount_products.at(idx) as FormGroup;
    let variantArray = productForm.get('variantForms') as FormArray;
    let variantForm = new FormGroup({
      product_ID: new FormControl<number>(variant.product_ID),
      variant_ID: new FormControl<number>(variant.variant_ID),
      variant_name: new FormControl<string>(variant.variant_name),
      variant_unit_price: new FormControl<number>(variant.variant_unit_price),
      variant_stock: new FormControl<number>(variant.variant_stock),
      discounted_price: new FormControl<number>(variant.variant_unit_price),
      discount: new FormControl<number>(0)
    });
    variantArray.push(variantForm);
    if (!this.addedVariants) {
      this.addedVariants = { [inventory.product_ID]: [variant] };
    } else {
      if (this.addedVariants!.hasOwnProperty(inventory.product_ID)) {
        if (!this.addedVariants![inventory.product_ID].includes(variant)) {
          // Push if key exists but not the value
          this.addedVariants![inventory.product_ID] = [...this.addedVariants![inventory.product_ID], variant];
        }
      } else {
        // Add if key doesn't exist
        this.addedVariants![inventory.product_ID] = [variant];
      }
    }
  }
  
  deleteProduct(prod: any, idx: any){
    this.discount_products.removeAt(idx);
    this.addedProducts = this.addedProducts.filter((product) => product.product_ID !== prod.product_ID);

    //Deletes the variants the product has if it has one
    if(prod.has_variant){
      this.addedVariants![prod.product_ID] = this.addedVariants![prod.product_ID].filter((variant) => variant.product_ID !== prod.product_ID);
    }
  }
  
  deleteVariant(inv: any, vari: any, idx: any, idxV: any){
    let productForm = this.discount_products.at(idx) as FormGroup;
    let variantArray = productForm.get('variantForms') as FormArray;
    variantArray.removeAt(idxV);
    this.addedVariants![inv.product_ID] = this.addedVariants![inv.product_ID].filter((variant) => variant.variant_ID !== vari.variant_ID);
  }

  applyAllDiscount(){
    //Get value of input form with discountAll id
    let inputElement = document.getElementById('discountAll') as HTMLInputElement;
    if(+inputElement.value >= 100){
      this.snackBar.open("Discount cannot be 100% or more", "Close", {
        duration: 2000
      });
      return;
    }

    this.discount_products.controls.forEach((productForm, i) => {
      if(!productForm.get('has_variant')?.value){
        productForm.patchValue({
          discount: +inputElement.value,
        });
        this.discountApply(+inputElement.value, i, -1);
      }
      else{
        (productForm.get('variantForms') as FormArray).controls.forEach((variantForm: any, idx) => {
          variantForm.patchValue({
            discount: +inputElement.value
          });
          this.discountApply(+inputElement.value, i, idx);
          console.log(variantForm)
        });
      }
    });
  }

  submitDiscount(){
    console.log(this.promotionDiscountForm.value)
    if(this.addedProducts.length === 0){
      this.snackBar.open("Please add products to the discount.", "Close", {
        duration: 2000
      });
      return;
    }

    if(this.discount_from! > this.discount_to!){
      this.snackBar.open("Invalid date range.", "Close", {
        duration: 2000
      });
      return;
    }

    if(this.promotionDiscountForm.get('discount_products')!.invalid){
      this.snackBar.open("Invalid form values.", "Close", {
        duration: 2000
      });
      return;
    }
    
    if(this.promotionDiscountForm.invalid){
      this.snackBar.open("Please fill in all the fields.", "Close", {
        duration: 2000
      });
      return;
    }

    this.isSubmitting = true;
    this.dataService.postData(this.promotionDiscountForm, 'addPromotionDiscount').subscribe({
      next: (res: any) => {
        console.log(res)
        this.isSubmitting = false;
        this.promoService.updatePromo(res)
        this.discountService.updateDiscount(res.discountProductList)
        this.snackBar.open('Promotion has been added!', 'Close', {
          duration: 2000,
        });

        //Reset data
        this.promotionDiscountForm.patchValue({
          discount_name: '',
          discount_from: null,
          discount_to: null,
          discount_products: []
        });

        this.discount_products.clear();

        this.selectedProduct = null;
        this.addedProducts = []
        this.addedVariants = undefined
        this.productSearch = ''
        this.discountAll = null;

        this.discountService.initDiscount();
      },
      error: (err) => {
        console.error(err)
        this.isSubmitting = false;
      }
    })
  }

}

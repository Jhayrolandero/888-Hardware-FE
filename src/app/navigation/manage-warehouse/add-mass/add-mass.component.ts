import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, of, startWith } from 'rxjs';
import { mainPort } from '../../../app.component';
import { Product } from '../../../interface/product';
import { Supplier, SupplierPromo } from '../../../interface/supplier';
import { Variant } from '../../../interface/variant';
import { DataService } from '../../../services/data.service';
import { ProductService } from '../../../services/store/product.service';
import { SupplierService } from '../../../services/store/supplier.service';
import { VariantService } from '../../../services/store/variant.service';
import { sellPriceValidator } from '../../../services/validator/sellPriceValidator';
import { AddSupplierDialogComponent } from '../../supplier/add-supplier-dialog/add-supplier-dialog.component';
import { CanComponentDeactivate } from '../../../services/guard/can-deactivate.guard';
import { Router } from '@angular/router';

type addVariants = {
  [id: number] : Variant[]
}
@Component({
  selector: 'app-add-mass',
  templateUrl: './add-mass.component.html',
  styleUrl: './add-mass.component.css'
})
export class AddMassComponent implements CanComponentDeactivate{

  canDeactivate(): boolean {
    if (this.incoming_Products.length > 0 && this.addMassForm.dirty) {
      return confirm('You have unsaved changes! Do you really want to leave?');
    }
    return true;
  }

  @Output() massSwitchTrigger = new EventEmitter();
  goBack() {
    this.massSwitchTrigger.emit()
  }

  port = mainPort
  control = new FormControl('');
  filteredProducts!: Observable<Product[]>;
  filteredSuppliers!: Observable<Supplier[]>;
  products!: Product[]
  variants!: Variant[]
  suppliers!: Supplier[]
  supplierPromo: SupplierPromo[] = []
  addProductArr: Product[] = []
  variantsStock: addVariants | undefined = undefined
  Object = Object
  cre!: any
  supplierInput!: Supplier | null
  selectedSupplier: string = ''
  isSubmitting = false;

  readonly panelOpenState = signal(false);


  addMassForm = this.fb.group({
    supplier_Id: [0],
    DR_Number: [''],
    incoming_Products: this.fb.array<any>([]),
    total_Cost: 0,
    method_of_payment: "-",
    is_Paid: false
  })

  incomingProductForm = new FormGroup({
    has_variants: new FormControl<boolean>(false),
    product_Id: new FormControl<number>(0)
  })

  get incoming_Products() {
    return this.addMassForm.get('incoming_Products') as FormArray;
  }

  get total_Cost() {
    return this.addMassForm.get('total_Cost')?.value
  } 

  get variant_Incoming() {
    console.log(this.incoming_Products.get('variant_Incoming')?.value)
    return this.incoming_Products.get('variant_Incoming') as FormArray
  }

  public variant_Incoming_Idx(prodIdx: number) {
    return this.incoming_Products.at(prodIdx).get('variant_Incoming') as FormArray 
  }

  public addIncoming() {  
    this.incoming_Products.push(this.incomingProductForm);
  }

  public openSupplierDialog() {
    this.dialog.open(AddSupplierDialogComponent)
  }

  goHome(){
    this.router.navigate(['/manage-warehouse/']);
  }

  constructor(
    private router: Router,
    private productService: ProductService,
    private variantService: VariantService,
    private supplierService: SupplierService,
    private fb: FormBuilder,
    private dataService: DataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.variantService.variant$.subscribe((data) => {
      this.variants = data;
    });

    this.productService.product$.subscribe((data) => {
      this.products = data;
    });

    this.supplierService.supplier$.subscribe({
      next: (value: Supplier[]) => {
        this.suppliers = value.map(
          supplier => ({
            ...supplier,
            addingPromo: false, 
            isDropdown: false ,
            isEditing: false,
            isLoading: false
          })
        )
      }
    })
    this.watchChanges()
  }

  getPrice(idx: any){
    return this.incoming_Products.at(idx).get('sell_Price')?.value;
  }

  private watchChanges() {  
    this.incoming_Products.valueChanges.subscribe(() => {
      this.subProductPriceChanges()
      this.subVariantPriceChanges()
      this.calculateDiscount()
      this.subTotalPriceChanges()
    });
  }

  // For total Price
  private subTotalPriceChanges() {
    const prodArray = this.incoming_Products
    let totalCost = 0;

    prodArray.controls.forEach((prodControls) => {
      const variantControl = prodControls.get('has_variants')

      if(variantControl!.value === 1) {
        const variantArray = prodControls.get('variant_Incoming') as FormArray

        variantArray.controls.forEach((variantControl) => {
          const varFinalControl = variantControl.get('final_Cost')

          let finalCost = varFinalControl?.value ? varFinalControl.value : 0
          totalCost += finalCost
        })

      } else if(variantControl!.value === 0) {
        const finalCostControl = prodControls.get('final_Cost')

        let finalCost = finalCostControl?.value ? finalCostControl.value : 0
        totalCost += finalCost
      }
    })
    this.addMassForm.patchValue(
      {
        total_Cost: totalCost
      },
      { emitEvent: false }
    );
  }

  private subProductPriceChanges() {
    const prodArray = this.incoming_Products

    prodArray.controls.forEach((prodControls, productIdx) => {
        const quantityControl = prodControls.get('quantity')
        const stockPriceControl = prodControls.get('stock_price')

        // Get initial
        let qty = quantityControl?.value  ? quantityControl.value : 0
        
        // Get initial
        let stock = stockPriceControl?.value ? stockPriceControl.value : 0

        const finalCost = stock * qty;

        this.incoming_Products.at(productIdx).patchValue(
          {
            final_Cost: finalCost
          },
          { emitEvent: false }
        );

    })
  }

  private subVariantPriceChanges() {
    const calculateVariantFinalCost = (prodIdx: number, varIdx: number, qty: number, stock_price: number) => {
      const varArray = this.incoming_Products.at(prodIdx).get('variant_Incoming') as FormArray
      const varItem = varArray.at(varIdx)

      varItem.patchValue({
        final_Cost: qty*stock_price
      },{ emitEvent: false })
    }

    const prodArray = this.incoming_Products;
      // Loop through each product to detect changes in its variants
      prodArray.controls.forEach((productControl, productIndex) => {
        const variantArray = productControl.get('variant_Incoming') as FormArray;
    
        // Ensure variantArray exists before proceeding
        if (variantArray) {
          variantArray.controls.forEach((variantControl, variantIndex) => {
            const quantityControl = variantControl.get('quantity');

            const stockPriceControl = variantControl.get('stock_price')
    
            // Subscribe to quantity control changes within each variant
            let qty  = quantityControl?.value ? quantityControl.value : 0 
            
            let stock = stockPriceControl?.value ? parseFloat(stockPriceControl.value) : 0
            
            calculateVariantFinalCost(productIndex, variantIndex, qty, stock)
          });
        }
      });
  }
  
  private calculateDiscount() {
    const prodArray = this.incoming_Products

    let discountArr: number[] = []
    let stockPrice = 0
    let qty = 0
    let varIdx = -1

    prodArray.controls.forEach((prodControls, prodIdx) => {
      const hasVariantControl = prodControls.get('has_variants')
      // Variant
      if(hasVariantControl!.value === 1) {
        const varArray = prodControls.get('variant_Incoming') as FormArray

        varArray.controls.forEach((varControls,variantIdx) => { 
          const varDiscountControl = varControls.get('discount')
          const varStockControl = varControls.get('stock_price')
          const varQtyControl = varControls.get('quantity')

          discountArr = varDiscountControl?.value ? varDiscountControl.value as number[] : []
          stockPrice = varStockControl?.value ? parseFloat(varStockControl.value) : 0  
          qty = varQtyControl?.value ? varQtyControl.value : 0
          varIdx = variantIdx
        })
      } 
      // No variant
      else if(hasVariantControl!.value === 0) {
        const discountControl = prodControls.get('discount')
        const stockControl = prodControls.get('stock_price')
        const quantityControl = prodControls.get('quantity')

        discountArr = discountControl?.value ? discountControl.value as any[] : []
        stockPrice = stockControl?.value ? parseFloat(stockControl.value) : 0  
        qty = quantityControl?.value ? quantityControl.value : 0

      }
      
      const newCost = this.calculateCompoundDiscount(discountArr, stockPrice, qty)

      // No variant
      if(hasVariantControl!.value === 0) {

        this.incoming_Products.at(prodIdx).patchValue(
          {
            final_Cost: newCost
          },
          { emitEvent: false }
        );

      } 
      // Variant
      else if(hasVariantControl!.value === 1) {
        const varArray = prodArray.at(prodIdx).get('variant_Incoming') as FormArray
        const varItem = varArray.at(varIdx)
  
        if(varItem === undefined) return
        
        varItem.patchValue({
          final_Cost: newCost
        },{ emitEvent: false })
  
      }
    })
  }
  calculateCompoundDiscount(discount: any, price: number, quantity: number){
    let mainValue = price;
    let discountArr = discount
    if(discountArr.length < 1) return price * quantity

    discountArr.forEach((element: any) => {
      mainValue = (mainValue + ((parseFloat(element) / 100) * +mainValue));
    });
    return mainValue * quantity;
  }

  
  ngOnInit() {
    this.filteredProducts = this.control.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  private _filter(value: string): Product[] {
    const filterValue = this._normalizeValue(value);
    return this.products
      .filter(product => this._normalizeValue(product.product_name).includes(filterValue))
  }
  
  private _filterSupplier(value: string): Supplier[] {
    const filterValue = this._normalizeValue(value)
    return this.suppliers
    .filter(supplier => this._normalizeValue(supplier.supplier_name).includes(filterValue))
  }

  private _normalizeValue(value: string): string {
    try {
      return value.toLowerCase().replace(/\s/g, '');
    } catch(err) {
      return ""
    }
  }

  private searchProduct(searchWord: string) {

    let productRes : Product | undefined
    productRes = this.products.find(x => this._normalizeValue(x.product_name).startsWith(this._normalizeValue(searchWord)))
    return productRes
  }

  public addPromo(idx: number, varIdx: number, promoID: number, promoName: string) {
    if(varIdx === -1) {
      if(promoID === -1){
        (this.incoming_Products.at(idx)).patchValue({
          supplier_promo_ID: null
        })
      }
      else{
        (this.incoming_Products.at(idx)).patchValue({
          supplier_promo_ID: promoID
        })
      }
    }
    else{
      if(promoID === -1){
        (this.incoming_Products.at(idx).get('variant_Incoming') as FormArray)?.at(varIdx).patchValue({
          supplier_promo_ID: null
        })
      }
      else{
        (this.incoming_Products.at(idx).get('variant_Incoming') as FormArray)?.at(varIdx).patchValue({
          supplier_promo_ID: promoID
        })
      }
    }
  }

  public getCurrentPromo(idx: number, varIdx: number) {
    if(varIdx === -1) {
      return this.supplierService.getSupplierPromoName(this.incoming_Products.at(idx).get('supplier_promo_ID')?.value)
    }
    else{
      return this.supplierService.getSupplierPromoName((this.incoming_Products.at(idx).get('variant_Incoming') as FormArray)?.at(varIdx).get('supplier_promo_ID')?.value)
    }
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
    // debugger

    if(this.cre.has_variant) {
      let variantForm = new FormGroup({
        has_variants: new FormControl(this.cre.has_variant),
        product_Id: new FormControl(this.cre.product_ID),
        quantity: new FormControl(null),
        final_Cost: new FormControl(0),
        variant_Incoming: this.fb.array<any>([])
      })
    
      this.incoming_Products.push(variantForm)
    } else {
      let product_discount : any
      let product_unit_discount : any
      
      // Split first
      product_discount = this.cre.product_stock_discount == null || this.cre.product_stock_discount.split(',')[0] === '' ? [] : this.cre.product_stock_discount.split(',')
      product_unit_discount = this.cre.unit_price_discount == null || this.cre.unit_price_discount.split(',')[0] === '' ? [] : this.cre.unit_price_discount.split(',')
      
      // Then parse all to number
      product_discount = product_discount.filter((x:string) => parseFloat(x))

      let productForm = new FormGroup({
        has_variants: new FormControl(this.cre.has_variant),
        product_Id: new FormControl(this.cre.product_ID),
        supplier_promo_ID: new FormControl(null),
        discount: new FormControl(product_discount),
        currDiscount: new FormControl(null),
        currUnitDiscount: new FormControl(null),
        quantity: new FormControl(null, Validators.required),
        sell_Price: new FormControl(this.cre.unit_price, [sellPriceValidator(this.cre.default_stock_price)]),
        stock_price: new FormControl(this.cre.default_stock_price, [sellPriceValidator(this.cre.default_stock_price)]),
        final_Cost: new FormControl(0),
        free: new FormControl(null),
        unit_discount: new FormControl(product_unit_discount)
      })
    
      this.incoming_Products.push(productForm)
    }

    this.addProductArr.push(this.cre)
    this.cre = null
  }

  public setSupplier(id: number) {
    this.supplierPromo = this.supplierService.getSupplierPromoID(id)
    this.selectedSupplier = this.supplierInput!.supplier_name
    this.addMassForm.patchValue({
      supplier_Id: this.supplierInput!.supplier_ID
    })
    this.clearPromos();
    console.log("Selected Supplier: ", this.selectedSupplier)
  }


  public _productFilter(e: any) {
    this.filteredProducts = of(this._filter(e))
  }

  public _supplierFilter(e: any){
    this.filteredSuppliers = of(this._filterSupplier(e))
  }

  public deleteOrder(id: number, idx: number) {
    console.log("Before: ",this.variantsStock, id);
    // For my sanity, ill just enclose this in try because Typescript pussies out when it recognizes undefined values
    try {
      if(this.variantsStock![id].length > 0) {
        delete this.variantsStock![id]
        if(Object.keys(this.variantsStock!).length === 0) delete this.variantsStock
      }
    } catch (error) {
    }
    
    this.incoming_Products.removeAt(idx)

    // Filter the product array
    this.addProductArr = this.addProductArr.filter(prod => prod.product_ID !== id)
    console.log("After: ",this.variantsStock);
  } 
  
  public deleteVariant(var_id: number, prod_id: number, varIdx: number, prodIdx: number) {

    let variantArr = this.incoming_Products.at(prodIdx).get('variant_Incoming') as FormArray
    variantArr.removeAt(varIdx)

    this.variantsStock![prod_id] = this.variantsStock![prod_id].filter(varx => varx.variant_ID !== var_id) 
    
    if(this.variantsStock![prod_id].length <= 0) {
      delete this.variantsStock![prod_id]
      this.incoming_Products.removeAt(prodIdx)
      this.addProductArr = this.addProductArr.filter(prod => prod.product_ID !== prod_id)
    } 
  }

  public _filterVariant(id: number): Variant[] {
    console.log("This is the variant to display on dropdown selection: ", this.variants)
    return this.variants.filter(x => x.product_ID === id)
  }

  public selectVariant(variant: Variant, prod_id: number, idx: number) {
    // Init
    if (!this.variantsStock) {
      this.variantsStock = { [prod_id]: [variant] };
    } else {
      if (this.variantsStock.hasOwnProperty(prod_id)) {
        if (!this.variantsStock[prod_id].includes(variant)) {
          // Push if key exists but not the value
          this.variantsStock[prod_id] = [...this.variantsStock[prod_id], variant];
        }
      } else {
        // Add if key doesn't exist
        this.variantsStock[prod_id] = [variant];
      }
    }
  
    // Get the form array for variants
    let pushVariant = this.incoming_Products.at(idx).get('variant_Incoming') as FormArray;
  
    // Check if the variant is already added in the FormArray (by variant_ID)
    const variantExists = pushVariant.controls.some((control: any) => {
      return control.get('variant_Id')?.value === variant.variant_ID;
    });

    //Variant empty discount condition
    console.log(variant.variant_stock_discount.split(','))
    let variantDiscount : number[] | string[]
    let variantUnitDiscount : number[] | string[]
    
    // Split first
    variantDiscount = variant.variant_stock_discount == null || variant.variant_stock_discount.split(',')[0] === '' ? [] : variant.variant_stock_discount.split(',')
    variantUnitDiscount = variant.variant_unit_discount == null || variant.variant_unit_discount.split(',')[0] === '' ? [] : variant.variant_unit_discount.split(',')

    // Then parse all to number
    variantDiscount = variantDiscount.map(x => parseFloat(x))
    // If the variant doesn't exist, add the new form group
    if (!variantExists) {
      let variants = new FormGroup({
        variant_Id: new FormControl(variant.variant_ID),
        supplier_promo_ID: new FormControl(null),
        quantity: new FormControl(null, Validators.required),
        final_Cost: new FormControl(0),
        sell_Price: new FormControl(variant.variant_unit_price, [sellPriceValidator(variant.variant_stock_price)]),
        stock_price: new FormControl(variant.variant_stock_price, [sellPriceValidator(variant.variant_stock_price)]),
        discount: new FormControl(variantDiscount),
        unit_discount: new FormControl(variantUnitDiscount),
        currDiscount: new FormControl(null),
        currUnitDiscount: new FormControl(null),
        free: new FormControl(null)
      });
  
      pushVariant.push(variants);
    }
  }

  public pushDiscount(prodIdx: number, multiplier: 1|-1) {
    if(this.incoming_Products.at(prodIdx).get('currDiscount')?.value === null || this.incoming_Products.at(prodIdx).get('currDiscount')?.value === 0) {
      this.snackBar.open('Discount cannot be empty or zero!', 'Close', {
        duration: 2000,
      });

      return
    } 
    
    this.incoming_Products.at(prodIdx).patchValue({
      discount: [...this.incoming_Products.at(prodIdx).get('discount')!.value, this.incoming_Products.at(prodIdx).get('currDiscount')!.value * multiplier]
    })      

    // Sanitize the form
    this.incoming_Products.at(prodIdx).patchValue({
      currDiscount: null
    })      
  }

  public pushUnitDiscount(prodIdx: number, multiplier: 1|-1) {
    if(this.incoming_Products.at(prodIdx).get('currUnitDiscount')?.value === null || this.incoming_Products.at(prodIdx).get('currUnitDiscount')?.value === 0) {
      this.snackBar.open('Discount cannot be empty or zero!', 'Close', {
        duration: 2000,
      });

      return
    } 
    
    this.incoming_Products.at(prodIdx).patchValue({
      unit_discount: [...this.incoming_Products.at(prodIdx).get('unit_discount')!.value, this.incoming_Products.at(prodIdx).get('currUnitDiscount')!.value * multiplier]
    })      

    // Sanitize the form
    this.incoming_Products.at(prodIdx).patchValue({
      currUnitDiscount: null
    })      
  }

  public pushVariantDiscount(prodIdx: number, varIdx: number,multiplier: 1|-1) {

    const varArray = this.incoming_Products.at(prodIdx).get('variant_Incoming') as FormArray 
    const varElem = varArray.at(varIdx) 

    if(varElem.get('currDiscount')?.value === null || varElem.get('currDiscount')?.value === 0) {
      this.snackBar.open('Discount cannot be empty or zero!', 'Close', {
        duration: 2000,
      });

      return
    }

    varElem.patchValue({
      discount: [...varElem.get('discount')!.value, varElem.get('currDiscount')!.value*multiplier]
    })      

    varElem.patchValue({
      currDiscount: null
    })
    console.log(varElem.value)
  }

  public pushVariantUnitDiscount(prodIdx: number, varIdx: number,multiplier: 1|-1) {

    const varArray = this.incoming_Products.at(prodIdx).get('variant_Incoming') as FormArray 
    const varElem = varArray.at(varIdx) 

    if(varElem.get('currUnitDiscount')?.value === null || varElem.get('currUnitDiscount')?.value === 0) {
      this.snackBar.open('Discount cannot be empty or zero!', 'Close', {
        duration: 2000,
      });

      return
    }

    varElem.patchValue({
      unit_discount: [...varElem.get('unit_discount')!.value, varElem.get('currUnitDiscount')!.value*multiplier]
    })      

    varElem.patchValue({
      currUnitDiscount: null
    })
    console.log(varElem.value)
  }


  public removeVariantDiscount(prodIdx: number, varIdx: number, discountIdx: number) {
    const varArray = this.incoming_Products.at(prodIdx).get('variant_Incoming') as FormArray
    const varElem =  varArray.at(varIdx)
    const varDiscount = varElem.get('discount')!.value
    
    varDiscount.splice(discountIdx, 1)

    varElem.patchValue({
      discount: varDiscount
    })
  }

  public removeVariantUnitDiscount(prodIdx: number, varIdx: number, discountIdx: number) {
    const varArray = this.incoming_Products.at(prodIdx).get('variant_Incoming') as FormArray
    const varElem =  varArray.at(varIdx)
    const varDiscount = varElem.get('unit_discount')!.value
    
    varDiscount.splice(discountIdx, 1)

    varElem.patchValue({
      unit_discount: varDiscount
    })
  }

  public clearPromos(){
    const incomingProducts = this.addMassForm.get('incoming_Products') as FormArray;
    incomingProducts.controls.forEach((control) => {
      const formGroup = control as FormGroup;
      if(formGroup.get('has_variants')?.value) {
        const variant_Incoming = formGroup.get('variant_Incoming') as FormArray
        variant_Incoming.controls.forEach((variantControl) => {
          const variant = variantControl as FormGroup;
          variant.patchValue({
            supplier_promo_ID: null
          })
        })
      }
      else{
        formGroup.patchValue({
          supplier_promo_ID: null
        })
      }
    })
  }
  
  public clearSupplierSelection() {
    this.supplierInput = null
    this.selectedSupplier = ''
    this.addMassForm.patchValue({
      supplier_Id: 0
    })

    this.clearPromos();
  }

  public removeProductDiscount(prodIdx: number, discountIdx: number) {
    const discounts = this.incoming_Products.at(prodIdx).get('discount')!.value;
    
    discounts.splice(discountIdx, 1);  // Splice removes the item at the index
    
    this.incoming_Products.at(prodIdx).patchValue({
      discount: discounts
    });
  }

  public removeProductUnitDiscount(prodIdx: number, discountIdx: number) {
    const discounts = this.incoming_Products.at(prodIdx).get('unit_discount')!.value;
    
    discounts.splice(discountIdx, 1);  // Splice removes the item at the index
    
    this.incoming_Products.at(prodIdx).patchValue({
      unit_discount: discounts
    });
  }
      
  public test2() {
    console.log(this.addMassForm.getRawValue())
  }

  public getSellProductPrice(prodIdx: number) {
    return this.incoming_Products.at(prodIdx)
  }

  public getSellVariantPrice(prodIdx: number, varIdx: number) {

    return this.variant_Incoming_Idx(prodIdx).at(varIdx)
  }
  
test() {
  console.log(this.addMassForm.value)
}

  public submitStock() {
    let toReturn = false;
    console.log(this.addMassForm)
    console.log(this.incoming_Products)

    if(this.selectedSupplier === '') {
      this.snackBar.open('Please select a supplier!', 'Close', {
        duration: 2000,
      });
      return
    }

    //Iterates through all products/variants and checks if the forms are filled out properly
    this.incoming_Products.value.forEach((x:any) => {
      //Variants
      if(x.has_variants) {
        x.variant_Incoming.forEach((y:any) => {
          if(y.quantity === null || y.quantity <= 0 || y.final_Cost === null || y.final_Cost <= 0 || y.sell_Price === null || y.sell_Price <= 0 || y.stock_price === null || y.stock_price <= 0) {
            this.snackBar.open('Please fill out the forms properly!', 'Close', {
              duration: 2000,
            });
            toReturn = true;
            return
          }
        })
        //Products
      } else {
        if(x.quantity === null || x.quantity <= 0 || x.final_Cost === null || x.final_Cost <= 0 || x.sell_Price === null || x.sell_Price <= 0 || x.stock_price === null || x.stock_price <= 0) {
          this.snackBar.open('Please fill out the forms properly!', 'Close', {
            duration: 2000,
          });
          toReturn = true;
          return
        }
      }
    })



    if (toReturn) {return;}
    this.isSubmitting = true;
    this.dataService.postData(this.addMassForm, 'addMassTransaction').subscribe({
      next: (res: any) => {
        console.log(res)
        this.supplierService.addSupplierTransaction(res.supplier_transaction)
        res.products.forEach((product: any) => {
          //Supplier Transaction update
          this.supplierService.addSupplierProduct(product)

          //Manage Warehouse update
          if(product.variant_ID == null)
            this.productService.updateSupplierStock(product)
          else{
            this.variantService.updateSupplierStock(product)
          }
        })
        this.isSubmitting = false;
        this.addMassForm.reset()
        this.addProductArr = []
        this.snackBar.open('Stock has been updated!', 'Close', {
          duration: 2000,
        });
      },
      error: (err) => {
        console.error(err)
      }
    })
  }
}

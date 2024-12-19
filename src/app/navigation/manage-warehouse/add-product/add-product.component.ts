import { Component, EventEmitter, input, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { mainPort } from '../../../app.component';
import { Product, Volume } from '../../../interface/product';
import { FormVariant, Variant, VariantGroup } from '../../../interface/variant';
import { DeleteDialogComponent } from '../../../reusable-components/delete-dialog/delete-dialog.component';
import { DataService } from '../../../services/data.service';
import { BackgroundSyncService } from '../../../services/store/background-sync.service';
import { ProductService } from '../../../services/store/product.service';
import { VariantService } from '../../../services/store/variant.service';
import { AddCategoryDialogComponent } from '../add-category-dialog/add-category-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CanComponentDeactivate } from '../../../services/guard/can-deactivate.guard';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})

export class AddProductComponent implements OnInit, CanComponentDeactivate {

  canDeactivate(): boolean {
    // Check if form is dirty and not submitted
    if (this.inventoryForm.dirty || this.variantGroups.length > 0 || this.volume.length > 0) {
      return confirm('You have unsaved changes! Do you really want to leave?');
    }
    return true;
  }
  
  @Input() productId: number = 0;
  @Output() addSwitchTrigger = new EventEmitter();
  @Output() addEditID = new EventEmitter();
  categ!: string[];
  isSubmitting = false;
  variantGroups: VariantGroup[] = [];
  productVariants: Variant[] = [];
  isEditingVariant: boolean = false;
  hasUnsavedChanges = false

  volumeEditIdx: number = -1
  

  //Error message state
  variantGroupError: boolean = false;
  isAddingVariant: boolean = false;
  categoryValue = '';
  isEditing: boolean = false;
  port = mainPort
  discountArr: string[] = [];
  unitDiscountArr: string[] = [];
  deletingID: number = 0; 

  newVolumeQuantity: number | null = null;
  newVolumePrice: number | null = null;
  volume: Volume[] = [];
  formProduct!: Product;

  selectedProductCategory: any = '' ;

  showProductForm: boolean = true
  // Enable volume bracket
  enableVolume: boolean = true

  // add new Volume
  currentlyAdding = false;
  editingVolume = false;
  currentlyEditing: number = 0;
  currentlyLoading = false
  currentlyDeleting = false;

  stockLevelError = false
  constructor(
    private router: Router,
    private dataService: DataService,
    private backgroundSync: BackgroundSyncService,
    private productService: ProductService,
    private variantService: VariantService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ){
    // console.log(this.variantGroups.length);

    //Event listener for when service worker finishes syncing
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        if (event.data.success) {
          // console.log("Flush Finished!");
          this.productService.initProduct();
        }
      }
    });

    this.onChangeSellPrice()
    this.onChangeStockLevel()
  }

  goHome(){
    this.router.navigate(['/manage-warehouse/']);
  }


  // Check for variant sell price to enable volume bracket
  private onChangeSellPrice() {
    this.inventoryForm.valueChanges.subscribe(res => {
      const variantsControl = res.variants as VariantGroup[]

      this.enableVolume = this.onChangeSellPriceHelper(variantsControl)
    })
  }

  private onChangeSellPriceHelper(varGroup: VariantGroup[]) {
    const priceSet = new Set()

    varGroup?.forEach(x => {
      x.variants.forEach(y => {
        priceSet.add(y.sell_price)
      })
    })

    // Use set then check if length is greater than 1
    if(priceSet.size > 1) {
      return false
    } else {
      return true
    }

  }

  /**
   * Calculate CSL & LSL value
   * @param {any} criticalStockLevel?:number|null
   * @param {any} lowStockLevel?:number|null
   * @returns {any}
   */
    private onChangeStockLevelHelper(criticalStockLevel?:number | null, lowStockLevel?:number| null): void {
      if((criticalStockLevel == null || lowStockLevel == null) || (criticalStockLevel === 0 || lowStockLevel === 0))  return
        
      if(criticalStockLevel >= lowStockLevel) {
      this.snackBar.open('Critical stock level cannot be greater or equal to low stock level', 'Close', {
        duration: 4000,
      });

      this.stockLevelError = true
    } else {
        this.stockLevelError = false
      }
  }

  /**
   * Subscribe to CSL & LSL level value change
   * @returns {void}
   */
  private onChangeStockLevel(): void {
    this.inventoryForm.get('low_stock_level')?.valueChanges.subscribe(res => {
      this.onChangeStockLevelHelper(this.inventoryForm.get('critical_stock_level')?.value, res)
    })
    
    this.inventoryForm.get('critical_stock_level')?.valueChanges.subscribe(res => {
      this.onChangeStockLevelHelper(res, this.inventoryForm.get('low_stock_level')?.value)
    })
  }

  checkEdit() {
    if(this.productId !== 0){
      this.isEditing = true;
      const product = this.productService.findProduct(this.productId);
      let strDisc = product!.product_stock_discount;
      this.discountArr = strDisc ? strDisc.split(',') : [];
      this.unitDiscountArr = product!.unit_price_discount ? product!.unit_price_discount.split(',') : [];
      this.selectedProductCategory = product!.category_name ? product!.category_name : '';
      console.log(this.selectedProductCategory);

      if (product) {
        this.formProduct = product;
        console.log("this is the product object bruh", this.formProduct);
        this.inventoryForm.patchValue({
          product_ID: this.productId,
          product_name: product.product_name,
          product_code: product.product_code,
          product_stock: product.product_stock,
          product_stock_discount: product.product_stock_discount,
          default_stock_price: product.default_stock_price,
          unit_price_discount: product.unit_price_discount,
          unit_price: product.unit_price,
          description: product.description,
          category: product.category_ID,
          product_image: product.product_image,
          brand: product.brand,
          unit_name: product.unit_name,
          has_variant: product.has_variant,
          has_volume: product.has_volume,
          critical_stock_level: product.critical_stock_level,
          low_stock_level: product.low_stock_level,
          latest_stock_entry_id: product.latest_stock_entry_id
        })
        // TODO: able to edit the current unit discount when the unit discount get edited
        if(product.has_variant){
          this.variantService.findVariants(this.productId).forEach((variant) => {
            let existingGroup = this.variantGroups.find(group => group.groupName === variant.variant_group_name);
            if (existingGroup) {
              existingGroup.variants.push({
                variant_ID: variant.variant_ID,
                variant_code: variant.variant_code,
                variant_type: variant.variant_type,
                name: variant.variant_name,
                stock_price: variant.variant_stock_price,
                variant_stock_discount: variant.variant_stock_discount,
                sell_price: variant.variant_unit_price,
                variant_unit_discount: variant.variant_unit_discount,
                stock: variant.variant_stock,
                description: variant.variant_description,
                image: variant.variant_image,
                low_stock_level: variant.low_stock_level,
                critical_stock_level: variant.critical_stock_level,
                latest_stock_entry_id: variant.latest_stock_entry_id
              })
            } else {
              this.variantGroups.push({
                groupName: variant.variant_group_name,
                variants: [{
                  variant_ID: variant.variant_ID,
                  variant_code: variant.variant_code,
                  variant_type: variant.variant_type,
                  name: variant.variant_name,
                  stock_price: variant.variant_stock_price,
                  variant_stock_discount: variant.variant_stock_discount,
                  sell_price: variant.variant_unit_price,
                  variant_unit_discount: variant.variant_unit_discount,
                  stock: variant.variant_stock,
                  description: variant.variant_description,
                  image: variant.variant_image,
                  low_stock_level: variant.low_stock_level,
                  critical_stock_level: variant.critical_stock_level,
                  latest_stock_entry_id: variant.latest_stock_entry_id

                }]
              })
            }
          });
        }

        if(product.has_volume){
          const VolumeResult = this.productService.findVolume(this.productId);
          this.volume = Array.isArray(VolumeResult) ? VolumeResult : [VolumeResult];
          this.inventoryForm.patchValue({
            volumes: this.volume
          })

          console.log("this is Volume tanginaaa", this.volume);
        }
        console.log(this.inventoryForm.value);
        console.log("this is variant group value", this.variantGroups);
        this.categoryValue = product.category_name;
        console.log("this is category value", this.categoryValue);

      }
    }
  }


  ngOnInit(): void {
    
    this.route.paramMap.subscribe(params => {
      const paramID = params.get('id')
      if(paramID) {
        this.productId = parseInt(paramID)
        this.checkEdit()
      }
    });
  }


  // inventoryForm = new FormGroup({
  //   product_ID: new FormControl<number>(0),
  //   product_name: new FormControl<string>(''),
  //   product_code: new FormControl<string>(''),
  //   product_stock: new FormControl<number>(0),
  //   product_stock_discount: new FormControl<string>(''),
  //   default_stock_price: new FormControl<number>(0),
  //   unit_price_discount: new FormControl<string>(''),
  //   unit_price: new FormControl<number>(0),
  //   description: new FormControl<string>(''),
  //   category: new FormControl<number| null>(null),
  //   category_name: new FormControl<string | null>(''),
  //   product_image: new FormControl<string>(''),
  //   brand: new FormControl<string>(''),
  //   unit_name: new FormControl<string>('pcs'),
  //   has_variant: new FormControl<boolean>(false),
  //   variants: new FormControl<VariantGroup[]>(this.variantGroups),
  //   has_volume: new FormControl<boolean>(false),
  //   volumes: new FormControl<Volume[]>(this.volume),
  //   low_stock_level: new FormControl<number | null>(0),
  //   critical_stock_level: new FormControl<number | null>(0),
  //   latest_stock_entry_id: new FormControl<number | null>(0)
  // });

  inventoryForm = new FormGroup({
    product_ID: new FormControl<number | null>(null),
    product_name: new FormControl<string>(''),
    product_code: new FormControl<string>(''),
    product_stock: new FormControl<number | null>(null),
    product_stock_discount: new FormControl<string>(''),
    default_stock_price: new FormControl<number | null>(null),
    unit_price_discount: new FormControl<string>(''),
    unit_price: new FormControl<number | null>(null),
    description: new FormControl<string>(''),
    category: new FormControl<number | null>(null),
    category_name: new FormControl<string | null>(''),
    product_image: new FormControl<string>(''),
    brand: new FormControl<string>(''),
    unit_name: new FormControl<string>('pcs'),
    has_variant: new FormControl<boolean>(false),
    variants: new FormControl<VariantGroup[]>(this.variantGroups),
    has_volume: new FormControl<boolean>(false),
    volumes: new FormControl<Volume[]>(this.volume),
    low_stock_level: new FormControl<number | null>(null),
    critical_stock_level: new FormControl<number | null>(null),
    latest_stock_entry_id: new FormControl<number | null>(null)
  });
  

  addDiscount(type: string){
    let discountInput = <HTMLInputElement>document.getElementById("discountInput")!;
    let discount = (<HTMLInputElement>document.getElementById("discountInput")!).value;
    if(discount === ''){
      this.snackBar.open('Discount cannot be empty!', 'Close', {
        duration: 2000,
      });
      return;
    }

    if(type === 'add'){
      this.discountArr.push(discount);
    }
    else {
      this.discountArr.push('-' + discount);
    }
    discountInput.value = ''; 
  }

  addUnitDiscount(type: string){
    let discountInput = <HTMLInputElement>document.getElementById("unitDiscountInput")!;
    let discount = (<HTMLInputElement>document.getElementById("unitDiscountInput")!).value;
    if(discount === ''){
      this.snackBar.open('Discount cannot be empty!', 'Close', {
        duration: 2000,
      });
      return;
    }

    if(type === 'add'){
      this.unitDiscountArr.push(discount);
    }
    else {
      this.unitDiscountArr.push('-' + discount);
    }
    discountInput.value = ''; 
  }


  deleteDiscount(index: any){
    this.discountArr.splice(index, 1);
  }

  deleteUnitDiscount(index: any){
    this.unitDiscountArr.splice(index, 1);
  }


  focusProduct(inputElement: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
    inputElement.focus();
  }


  goBack() {
    this.inventoryForm.reset();
    this.variantGroups = []
    this.volume = []
    this.isAddingVariant = false
    console.log("reset: ", this.inventoryForm.value);
    this.productId = 0;
    this.addEditID.emit(this.productId); // Wha does this do???
    this.addSwitchTrigger.emit();
    this.router.navigate(['/manage-warehouse/']);

  }

  //Adds variant group name to temporary object
  addVariant(){
    let inputElement = <HTMLInputElement>document.getElementById("variantGroupName");
    let inputValue = (<HTMLInputElement>document.getElementById("variantGroupName")!).value; 
    this.isAddingVariant = true;

    if(inputValue === ''){
      this.snackBar.open('Input cannot be empty.', 'Close', {
        duration: 2000,
      });
      this.isAddingVariant = false;
      inputElement.value = '';
      return;
    }

    //If given groupname does not exists in the array of variantgroups yet
    if(!this.variantGroups.some(group => group.groupName === inputValue)){
      //Create new instance of variantgroup with empty variants ofc
      this.variantGroups.push({groupName: inputValue, variants: []})
    }
    else{
      //Shows error message for 2.5 seconds.
      this.snackBar.open('Variant/Brand name already exists.', 'Close', {
        duration: 2000,
      });
      this.isAddingVariant = false;
    }
    inputElement.value = '';
  }

//just for laughs
  //Update variant to main form
  updateVariant(variant: FormVariant[], name: string){
    //Find index of variantgroup to find the specific element to change variant to
    this.variantGroups.forEach((x, i) => {
      if(x.groupName === name) this.variantGroups[i].variants = variant;
    })

    console.log("Editing variant")

    this.inventoryForm.patchValue({
      variants: this.variantGroups
    }, {emitEvent: true})
    console.log(this.inventoryForm);
  }

  deleteVariant(name: string){
    this.variantGroups = this.variantGroups.filter(x => x.groupName !== name)

    console.log("Deleting variant")

    this.inventoryForm.patchValue({
      variants: this.variantGroups
    }, {emitEvent: true})

  }

  //Preview image for main image (lord god how do i do this dynamically) (update, we on fire frfr it's dynamic na)
  mainImageURL?: string = '';
  PreviewMainImage(event: Event) {

    const allowedFileType = ["image/png", "image/jpeg"]
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0]; // Using optional chaining to handle null or undefined

    if (file && allowedFileType.includes(file.type)) {
      // File Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.mainImageURL = reader.result as string;

        this.inventoryForm.patchValue({
          product_image: this.mainImageURL
        })
      };
      reader.readAsDataURL(file);
    }
    else {
      // this.messageService.sendMessage("File type should be .png or .jpeg/.jpg", -1)

    }
  }


  selectCategory(){
    this.dialog.open(AddCategoryDialogComponent, {
      width: '50%',
      height: '530px',
      disableClose: true,
      data: {
        category_ID: this.inventoryForm.get('category')?.value,
        category_name: this.selectedProductCategory,
      }
    }).afterClosed()
      .subscribe(category_selected => {
        console.log(category_selected);
        this.selectedProductCategory = category_selected.category_name;
        this.inventoryForm.patchValue({
          category: category_selected.category_ID,
          category_name: category_selected.category_name
        });
        console.log(this.inventoryForm.value);
        console.log(this.selectedProductCategory);
    });
  }

  parseDiscount(){
    let parsed = '';
    if(this.discountArr.length > 0){
      this.discountArr.forEach((discount) => {
        parsed += discount + ',';
      })
      parsed = parsed.slice(0, -1);
      this.inventoryForm.patchValue({
        product_stock_discount: parsed
      })
    }
  }

  parseUnitDiscount(){
    let parsed = '';
    if(this.unitDiscountArr.length > 0){
      this.unitDiscountArr.forEach((discount) => {
        parsed += discount + ',';
      })
      parsed = parsed.slice(0, -1);
      this.inventoryForm.patchValue({
        unit_price_discount: parsed
      })
    }
  }

  test() {
    console.log(this.inventoryForm.value)
  }

  submitForm(){
    console.log("Main form to submit: ", this.inventoryForm.value);
    this.inventoryForm.patchValue({
      product_ID: this.productId
    })

    // Normalize discount
    if(this.discountArr.length > 0){
      this.parseDiscount();
    } else{
      this.inventoryForm.patchValue({
        product_stock_discount: ''
      })
    } 

    if(this.unitDiscountArr.length > 0){
      this.parseUnitDiscount();
    } else{
      this.inventoryForm.patchValue({
        unit_price_discount: ''
      })
    }

    //Checks if there's variant or not
    if(this.variantGroups.length > 0){
      this.inventoryForm.patchValue({
        has_variant: true
      })

    } else{
      this.inventoryForm.patchValue({
        has_variant: false
      })

      const lowStockLevel = this.inventoryForm.get('low_stock_level')?.value
      const criticalStockLevel = this.inventoryForm.get('critical_stock_level')?.value

      if((lowStockLevel == null || criticalStockLevel == null) || (criticalStockLevel < 1 || lowStockLevel < 1)) {
        this.snackBar.open(`LSL & CSL must be filled uasdp!`, 'Close', {
          duration: 2000,
        });

        return
      }
    }

    // Check volume
    if(this.volume.length > 0){
      this.inventoryForm.patchValue({
        has_volume: true
      })  
    }

    let controlForm = ['product_name'];
    if(this.inventoryForm.get('has_variant')?.value === true){
      console.log("Has variant");
    } else {
      console.log("Has no variant");
      controlForm.push('unit_price', 'default_stock_price');
    }

    let isIncompleteForm = controlForm.some(controlName => {
      let control = this.inventoryForm.get(controlName)!;
      console.log(control.value);
      return control.value === '' || control.value === null || control.value === 0;
    });
    
    if (isIncompleteForm) {
      console.log("Incomplete form");
      if(this.inventoryForm.get('has_variant')?.value === true){

        this.snackBar.open(`Product Name  must be filled up.`, 'Close', {
          duration: 2000,
        });
      } else {
        this.snackBar.open(`Product Name, Sell Price and Stock Price must be filled up.`, 'Close', {
          duration: 2000,
        });
      }
      return;
    }

    // There's volume but the volume adding is disable
    if(this.volume.length > 0 && !this.enableVolume){
      this.snackBar.open('All Variant sell prices must be equal to add a volume.', 'Close', {
        duration: 2000,
      });
      return;
    }

    if(this.stockLevelError) {
      this.snackBar.open('Critical stock level cannot be greater or equal to low stock level', 'Close', {
        duration: 4000,
      });

      return
    }


    console.log("this is the main form: ", this.inventoryForm.getRawValue());
    this.isSubmitting = true;
    if(this.isEditing){
      
      this.dataService.patchData(this.inventoryForm, "editProduct").subscribe({
        next: (value: any) => {

          //NOTE: have to wait for the result inorder to store into behaviour subject. can be revised.
          console.log("EditProduct return: ", value);
          this.productService.editProduct(value.product);
          if(this.inventoryForm.get('has_variant')?.value === true){
            this.variantService.editVariant(value.variants);
          }

          this.productService.editVolume(value.volumes);
          this.snackBar.open('Product has been successfully updated!', 'Close', {
            duration: 2000,
          });

          this.isSubmitting = false;
        },
        error: (error) => {
          this.backgroundSync.addNewRequest([this.inventoryForm.getRawValue(), 'editProduct'], "PATCH");
          this.backgroundSync.trafficHandler();

          console.log(error);
          this.goBack();
          this.isSubmitting = false;
        },
        complete: () => {
          
          this.goBack();
          this.isSubmitting = false;
        }
      });
    } else {
         
      this.dataService.postData(this.inventoryForm, "addProduct").subscribe({
        next: (value: any) => {
          console.log(value);
          this.isSubmitting = false;
          this.productService.addProduct(value.product);
          this.variantService.addVariant(value.variants);
          // console.log("this is the volume", value.volumes);
          this.productService.addVolume(value.volumes);
          
          this.snackBar.open('Product has been successfully added!', 'Close', {
            duration: 2000,
          });
          this.isSubmitting = false;
        },
        error: (error) => {
          this.backgroundSync.addNewRequest(this.inventoryForm.getRawValue(), "POST");
          this.backgroundSync.trafficHandler();
          console.log(error);
          this.isSubmitting = false;
          this.goBack();
        },
        complete: () => {
          this.isSubmitting = false;
          this.goBack();
        }
      });

    }
  }

  checkNoEmptyVariantGroup(){
    if(this.currentlyAdding) {
      return false;
    } 
    else if(this.currentlyEditing !== 0) {  
      return false;
    } else if(this.currentlyDeleting) {
      return false;
    }

    for (const group of this.variantGroups) {
      if (group.variants.length < 1) {
      return false;
      }
    }
    return true;
  }

  addNewVolume() {
    this.editingVolume = false;
    this.currentlyAdding = true;
  }

  editVolume(Volume: Volume, editIdx: number){
    this.editingVolume = true;
    this.currentlyEditing = Volume.volume_ID;
    this.newVolumePrice = Volume.volume_price;
    this.newVolumeQuantity = Volume.volume_quantity;
    this.volumeEditIdx = editIdx
  }

  deleteVolume(Volume: Volume){
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        volume: Volume
      },
      width: '300px',
      height: '220px'
    });

    dialogRef.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {

          this.currentlyDeleting = true;
          this.deletingID = Volume.volume_ID;
          this.dataService.deleteData(Volume.volume_ID, 'deleteVolume').subscribe({
            next: (value: any) => {
              this.productService.deleteVolume(Volume.volume_ID);
              this.volume = this.volume.filter(u => u.volume_ID !== Volume.volume_ID);
              console.log("this is the volume", this.volume);
              this.inventoryForm.patchValue({ volumes: this.volume});
              this.currentlyDeleting = false;
            }, error: (error) => {  
              // this.backgroundSync.addNewRequest([Volume.volume_ID, 'deleteVolume'], "DELETE");
              // this.backgroundSync.trafficHandler();
              // console.log(error);
              this.currentlyDeleting = false;
              this.deletingID = 0;
            },
            complete: () => {
              this.currentlyDeleting = false
              this.deletingID = 0;
            }
          });
        }
      },
      error: (error: any) => {
        console.log(error);
      }
    });


  }

  cancel(Volume: Volume | null) { 
    this.editingVolume = false;
    this.currentlyAdding = false;
    this.currentlyEditing = 0;
    this.emptyHolders();

  }

  confirm(Volume: Volume | null) {
    //if adding new volume 
    if(this.currentlyAdding){
      if(this.newVolumePrice === null || this.newVolumeQuantity === null){
        this.snackBar.open('Price and Quantity must be filled up!', 'Close', {
          duration: 2000,
        });
        return;
      }

      //no volume ID unless Save Changes is clicked
      const newVolume: any = {
        volume_ID: -1,
        product_ID: this.productId,
        volume_price: this.newVolumePrice,
        volume_quantity: this.newVolumeQuantity
      }
      this.volume.push(newVolume);
      this.inventoryForm.patchValue({ volumes: this.volume});
      this.currentlyAdding = false;
      this.emptyHolders();
    }
    else {
      //if editing existing volume
      debugger
      const updated = this.volume.map((u, idx) => {
        if (idx === this.volumeEditIdx) {
          return { 
            ...u, 
            volume_price: this.newVolumePrice ?? 0, // Default value for price
            volume_quantity: this.newVolumeQuantity ?? 0 // Default value for quantity
          };
        }
        return u;
      });

      this.volume = updated;
      this.inventoryForm.patchValue({ volumes: updated});
      this.editingVolume = false;
      this.currentlyAdding = false;
      this.currentlyEditing = 0;
      // this.volumeEditIdx = -1
      this.emptyHolders();
    }
  }

  emptyHolders() {
    this.newVolumePrice = null;
    this.newVolumeQuantity = null;
  }

  submitVolume() {   
    this.currentlyAdding = false;
  }

}
 
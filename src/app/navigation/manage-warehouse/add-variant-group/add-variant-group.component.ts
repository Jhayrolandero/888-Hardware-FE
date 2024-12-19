import { Component, EventEmitter, Input, OnInit, output, Output, signal } from '@angular/core';
import { FormVariant, VariantGroup } from '../../../interface/variant';
import { FormControl, FormGroup } from '@angular/forms';
import { mainPort } from '../../../app.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanComponentDeactivate } from '../../../services/guard/can-deactivate.guard';

@Component({
  selector: 'app-add-variant-group',
  templateUrl: './add-variant-group.component.html',
  styleUrl: './add-variant-group.component.css'
})

export class AddVariantGroupComponent implements OnInit, CanComponentDeactivate{

  canDeactivate(): boolean {
    if (this.variantForm.dirty) {
      return confirm('You have unsaved changes! Do you really want to leave?');
    }
    return true;
  }

  @Input() varG!: VariantGroup;
  @Input() productForm!: any;
  @Input() id!: string;
  @Input() unitDiscountInput!: any;
  @Input() stockDiscountInput!: any;
  @Output() updateVariant = new EventEmitter<FormVariant[]>();
  @Output() deleteVariantGroup = new EventEmitter<string>();
  @Output() editingVariant = new EventEmitter<boolean>();

  //State when adding a variant.
  isAddingVariant: boolean = false;
  isEditingVariant: boolean = false;
  currentVariantEditing: string = '';
  subvariantExists = false;
  nameEmpty = false;
  discountArrVar: string[] = [];
  unitDiscountArrVar: string[] = [];
  port = mainPort
  stockLevelError = false
  readonly panelOpenState = signal(false);

  //Custom ID to prevent sharing of image form id

  //Array of variant displayed
  variants: FormVariant[] = [];

  variantForm = new FormGroup({
    variant_ID: new FormControl<number>(0),
    variant_code: new FormControl<string>(''),
    variant_type: new FormControl<string>(''),
    variant_name: new FormControl<string>(''),
    variant_stock_price: new FormControl<number>(0),
    variant_stock_discount: new FormControl<string>(''),
    variant_unit_price: new FormControl<number>(0),
    variant_unit_discount: new FormControl<string>(''),
    variant_stock: new FormControl<number>(0),
    variant_description: new FormControl<string>(''),
    variant_image: new FormControl<string>(''),
    low_stock_level: new FormControl<number>(0),
    critical_stock_level: new FormControl<number>(0),
  });

  constructor(
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    console.log("Variant Group up where they stay all day in the sun", this.varG);
    if(this.varG){
      this.variants = this.varG.variants;
    }
    // console.log(this.variants)
    this.onChangeStockLevel()
  }

  addDiscount(){
    let discount = (<HTMLInputElement>document.getElementById("discountInputVar")!).value;
    console.log(discount);
    if(discount === ''){
      this.snackBar.open('Discount cannot be empty!', 'Close', {
        duration: 2000,
      });
      return;
    }
    this.discountArrVar.push(discount);
  }

  addUnitDiscount(){
    let discount = (<HTMLInputElement>document.getElementById("unitDiscountInputVar")!).value;
    if(discount === ''){
      this.snackBar.open('Discount cannot be empty!', 'Close', {
        duration: 2000,
      });
      return;
    }
    this.unitDiscountArrVar.push(discount);
  }

  deleteDiscount(index: any){
    this.discountArrVar.splice(index, 1);
  }

  deleteUnitDiscount(index: any){
    this.unitDiscountArrVar.splice(index, 1);
  }

  focusProduct(inputElement: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
    inputElement.focus();
  }

  addVariantSub(varG: VariantGroup){
    this.editingVariant.emit(true);
    if(!this.isAddingVariant){
      this.variantForm.reset()

      let localProductForm = this.productForm.value;
      console.log("Local Product Form", localProductForm);
      this.discountArrVar = [...this.stockDiscountInput];
      this.unitDiscountArrVar = [...this.unitDiscountInput];

      this.variantForm.patchValue({
        variant_stock_price: localProductForm.default_stock_price,
        variant_unit_price: localProductForm.unit_price,
        low_stock_level: localProductForm.low_stock_level,
        critical_stock_level: localProductForm.critical_stock_level,
      })
      //Initially create an empty iterable
      this.isAddingVariant = true;
    }
  }

  //Cancel current add variant
  cancel(){
    this.variantImageURL = '';
    this.isAddingVariant = false;
    this.discountArrVar = [];
    this.unitDiscountArrVar = [];
    //Reset value to default
    this.variantForm.patchValue({
      variant_code: '',
      variant_name: '',
      variant_unit_discount: '',
      variant_unit_price: 0,
      variant_stock_discount: '',
      variant_stock: 0,

      variant_stock_price: 0,
      variant_description: '',
      variant_image: '',
    })

    this.editingVariant.emit(false);
  }

  //Send variant data back to parent
  update(){
    this.updateVariant.emit(this.variants);
    this.editingVariant.emit(false);
  }

  parseDiscount(){
    let parsed = '';
    if(this.discountArrVar.length > 0){
      this.discountArrVar.forEach((discount) => {
        parsed += discount + ',';
      })
      parsed = parsed.slice(0, -1);
      this.variantForm.patchValue({
        variant_stock_discount: parsed
      })
    }
  }

  parseUnitDiscount(){
    let parsed = '';
    if(this.unitDiscountArrVar.length > 0){
      this.unitDiscountArrVar.forEach((discount) => {
        parsed += discount + ',';
      })
      parsed = parsed.slice(0, -1);
      this.variantForm.patchValue({
        variant_unit_discount: parsed
      })
    }
  }

  //Confirm add variant
  confirm(){
    if(this.discountArrVar.length > 0){
      this.parseDiscount();
    }
    else{
      this.variantForm.patchValue({
        variant_stock_discount: ''
      })
    }

    if(this.unitDiscountArrVar.length > 0){
      this.parseUnitDiscount();
    }
    else{
      this.variantForm.patchValue({
        variant_unit_discount: ''
      })
    }

    //Edge case checks
    let controlForm = ['variant_name', 'variant_stock_price', 'variant_unit_price'];
    let isIncompleteForm = controlForm.some(controlName => {
      let control = this.variantForm.get(controlName)!;
      console.log(control.value);
      return control.value === '' || control.value === null || control.value === 0;
    });
    
    if (isIncompleteForm) {
      this.snackBar.open('Variant Name, Variant Stock Price, and Variant Sell Price must be filled up!', 'Close', {
        duration: 2000,
      });
      return;
    }

    //Similar name with same variant type checker
    let variantOfSameType = this.variants.filter(x => x.variant_type === this.variantForm.get('variant_type')!.value!);
    if(variantOfSameType.some(x => x.name === this.variantForm.get('variant_name')!.value!)){
      this.snackBar.open('Variant Name already exists in the variant type.', 'Close', {
        duration: 2000,
      });
      return;
    }

    const lowStockLevel = this.variantForm.get('low_stock_level')?.value
    const criticalStockLevel = this.variantForm.get('critical_stock_level')?.value

    if((lowStockLevel == null || criticalStockLevel == null) || (criticalStockLevel < 1 || lowStockLevel < 1)) {
      this.snackBar.open(`LSL & CSL must be filled up!`, 'Close', {
        duration: 2000,
      });
      return
    }

    if(this.stockLevelError) {
      this.snackBar.open('Critical stock level cannot be greater or equal to low stock level', 'Close', {
        duration: 4000,
      });
      return
    }

    this.variants.push({
      variant_ID: -1,
      variant_code: this.variantForm.get('variant_code')!.value!,
      variant_type: this.variantForm.get('variant_type')!.value!,
      name: this.variantForm.get('variant_name')!.value!,
      stock_price: this.variantForm.get('variant_stock_price')!.value!,
      variant_stock_discount: this.variantForm.get('variant_stock_discount')!.value!,
      sell_price: this.variantForm.get('variant_unit_price')!.value!,
      variant_unit_discount: this.variantForm.get('variant_unit_discount')!.value!,
      stock: this.variantForm.get('variant_stock')!.value!,
      description: this.variantForm.get('variant_description')!.value!,
      image: this.variantForm.get('variant_image')!.value!,
      low_stock_level: this.variantForm.get('low_stock_level')!.value!,
      critical_stock_level: this.variantForm.get('critical_stock_level')!.value!,
    })


    console.log(this.variants);
    this.update()
    this.cancel();
    this.editingVariant.emit(false);
    if(!this.editingVariant) {
      console.log("Editing variant is false");
    }
  }

  editIndividualVariant(variant: any){
    console.log("Editing this: ", variant);
    if(!this.isEditingVariant){
      this.isEditingVariant = true
      this.editingVariant.emit(true);
      this.currentVariantEditing = variant.name + variant.variant_type;

      if(variant.variant_stock_discount === null){variant.variant_stock_discount = '';}
      if(variant.variant_stock_discount !== ''){
        this.discountArrVar = variant.variant_stock_discount.split(',');
      }
      else{
        this.discountArrVar = [];
      }

      if(variant.variant_unit_discount === null){variant.variant_unit_discount = '';}
      if(variant.variant_unit_discount !== ''){
        this.unitDiscountArrVar = variant.variant_unit_discount.split(',');
      }
      else{
        this.unitDiscountArrVar = [];
      }

      this.variantForm.patchValue({
        variant_code: variant.variant_code,
        variant_type: variant.variant_type,
        variant_name: variant.name,
        variant_stock_price: variant.stock_price,
        variant_stock_discount: variant.variant_stock_discount,
        variant_unit_price: variant.sell_price,
        variant_unit_discount: variant.variant_unit_discount,
        variant_stock: variant.stock,
        variant_description: variant.description,
        variant_image: variant.image,
        low_stock_level: variant.low_stock_level,
        critical_stock_level: variant.critical_stock_level,
      })
      console.log("after edit variant state", variant.variant_stock_discount, variant.variant_stock_discount.split(','));
    }
  }

  cancelEditVariant(){

    this.isEditingVariant = false;
    this.currentVariantEditing = '';
    this.discountArrVar = [];
    this.unitDiscountArrVar = [];
    this.variantForm.patchValue({
      variant_code: '',
      variant_type: '',
      variant_name: '',
      variant_unit_price: 0,
      variant_stock_discount: '',
      variant_stock: 0,
      variant_description: '',
      variant_image: ''
    })
    this.editingVariant.emit(false);
  }

  confirmEditVariant(variant: any){
    let controlForm = ['variant_name', 'variant_stock_price', 'variant_unit_price', 'low_stock_level', 'critical_stock_level'];
    let isIncompleteForm = controlForm.some(controlName => {
      let control = this.variantForm.get(controlName)!;
      console.log(control.value);
      return control.value === '' || control.value === null || control.value === 0;
    });
    
    
    if (isIncompleteForm) {
      this.snackBar.open('Name, Stock Price, LSL, CSL, and Sell Price must be filled up!', 'Close', {
        duration: 2000,
      });
      this.editingVariant.emit(false);
      return;
      
    }


    //Similar name with same variant type checker

    let variantOfSameType = this.variants.filter(x => x.variant_type === this.variantForm.get('variant_type')!.value!);
    variantOfSameType = variantOfSameType.filter(x => (x.name + x.variant_type) !== this.currentVariantEditing);


    if(variantOfSameType.some(x => x.name === this.variantForm.get('variant_name')!.value!)){
      this.snackBar.open('Variant Name already exists in the variant type.', 'Close', {
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

  
    if(this.discountArrVar.length > 0){
      this.parseDiscount();
    }
    else{
      this.variantForm.patchValue({
        variant_stock_discount: ''
      })
    }

    if(this.unitDiscountArrVar.length > 0){
      this.parseUnitDiscount();
    }
    else{
      this.variantForm.patchValue({
        variant_unit_discount: ''
      })
    }

    this.variants.forEach(x => {
      if((x.name + x.variant_type) === this.currentVariantEditing){
        console.log("Found the variant to edit", x);
        x.variant_code = this.variantForm.get('variant_code')!.value!;
        x.variant_type = this.variantForm.get('variant_type')!.value!;
        x.name = this.variantForm.get('variant_name')!.value!;
        x.stock_price = this.variantForm.get('variant_stock_price')!.value!;
        x.variant_stock_discount = this.variantForm.get('variant_stock_discount')!.value!;
        x.sell_price = this.variantForm.get('variant_unit_price')!.value!;
        x.variant_unit_discount = this.variantForm.get('variant_unit_discount')!.value!;
        x.stock = this.variantForm.get('variant_stock')!.value!;
        x.description = this.variantForm.get('variant_description')!.value!;
        x.image = this.variantForm.get('variant_image')!.value!;
        x.low_stock_level = this.variantForm.get('low_stock_level')!.value!
        x.critical_stock_level = this.variantForm.get('critical_stock_level')!.value!
      }
    })
    this.currentVariantEditing = '';
    this.isEditingVariant = false;
    this.discountArrVar = [];
    this.unitDiscountArrVar = [];
    this.update()
    console.log(this.variants);
  }

  delete(name: string){
    this.variants = this.variants.filter(x => x.name !== name);
    this.update();
    this.editingVariant.emit(false);
  }

  deleteVariant(name: string){
    this.deleteVariantGroup.emit(name)
    this.editingVariant.emit(false);
  }

  //Preview image for main image (lord god how do i do this dynamically)
  variantImageURL?: string = '';
  PreviewVariantImage(event: Event) {

    const allowedFileType = ["image/png", "image/jpeg"]
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0]; // Using optional chaining to handle null or undefined

    if (file && allowedFileType.includes(file.type)) {
      // File Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.variantImageURL = reader.result as string;

        this.variantForm.patchValue({
          variant_image: this.variantImageURL
        })
      };
      reader.readAsDataURL(file);  
    }
    else {
      // this.messageService.sendMessage("File type should be .png or .jpeg/.jpg", -1)

    }
  }

  onImageError(event: Event, vari: any) {
    const target = event.target as HTMLImageElement;
    target.src = this.port + vari.image;
  }

  /**
   * Calculate CSL & LSL value
   * @param {any} criticalStockLevel?:number|null
   * @param {any} lowStockLevel?:number|null
   * @returns {any}
   */
  private onChangeStockLevelHelper(criticalStockLevel?:number | null, lowStockLevel?:number| null): void {
      if(criticalStockLevel == null || lowStockLevel == null)  return
        
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
    this.variantForm.get('low_stock_level')?.valueChanges.subscribe(res => {
      this.onChangeStockLevelHelper(this.variantForm.get('critical_stock_level')?.value, res)
    })
    
    this.variantForm.get('critical_stock_level')?.valueChanges.subscribe(res => {
      this.onChangeStockLevelHelper(res, this.variantForm.get('low_stock_level')?.value)
    })
  }

}

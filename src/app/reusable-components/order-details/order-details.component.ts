import { Component, SimpleChanges } from '@angular/core';
import { Input } from '@angular/core';
import { ProductService } from '../../services/store/product.service';
import { VariantService } from '../../services/store/variant.service';
@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent {
  @Input() product: any;
  //The main display for the html
  inventory: any;
  constructor(
    private productService: ProductService,
    private variantService: VariantService,
  ) {console.log(this.product)}

  ngOnChange(changes: SimpleChanges) {
    console.log("Changing something")
    console.log("Changes: ", changes)
    // this.calculateTotal()
  }

  ngOnInit(){
    console.log("Product: ",this.product)
    // console.log('re-render')
    //Checks if passed order object is a variant or product(its just named product)
    if(this.product.variant_ID === undefined || this.product.variant_ID === null || this.product.variant_ID === -1) {
      this.inventory = this.productService.findProduct(this.product.product_ID);
    }
    else{
      let temp = this.productService.findProduct(this.product.product_ID);
      this.inventory = this.variantService.getVariant(this.product.product_ID, this.product.variant_ID);
      this.inventory.product_name = temp!.product_name;
    }
    console.log("Inventory: ",this.inventory)
  }

  calculateTotal() {
    if(this.inventory.variant_name !== undefined){
      return this.product.quantity * this.inventory.variant_unit_price ;
    }
    else{
      return this.product.quantity * this.inventory.unit_price;
    }
  }

  calculateCompoundDiscount(discount: any, price: any, quantity: any){
    let discountArr: any[] = [];
    let mainValue = price;

    if(discount === null || discount === undefined || discount === '') return price * quantity;
    if(discount.includes(",")){
      discountArr = discount.split(',');
    }
    else{
      discountArr.push(discount);
    }
    console.log("The discount array: ", discountArr);
    discountArr.forEach((element: any) => {
      console.log("The element and value: ", element, mainValue);
      console.log("The discount: ", ((+element / 100) * +mainValue))
      mainValue = (mainValue - ((+element / 100) * +mainValue));
      console.log("Mainvalue of: ", mainValue);
    });
    console.log(discountArr)
    return mainValue * quantity;
  }

}

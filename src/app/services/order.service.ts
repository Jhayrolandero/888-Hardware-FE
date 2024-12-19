import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Order } from '../interface/product';
import { LoadingService } from './loading.service';
import { ProductService } from './store/product.service';
import { VariantService } from './store/variant.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private _orders = new BehaviorSubject<any[]>([]);
  order$ = this._orders.asObservable();

  private editTransactionInstance = new BehaviorSubject<any[]>([]);
  editTransactionInstance$ = this.editTransactionInstance.asObservable();

  private orderLoader = new BehaviorSubject<boolean>(false);
  orderLoader$ = this.orderLoader.asObservable();

  isEditing = new BehaviorSubject<boolean>(false);
  isEditing$ = this.isEditing.asObservable();

  constructor(
    private loaderService: LoadingService,
    private productService: ProductService,
    private variantService: VariantService
  ) {  }

  getOrderState() {
    return this._orders.getValue();
  }

  setOrderState(order: any) {
    this._orders.next(order);
  }

  setCloseEdit(){
    this.isEditing.next(false);
  }

  setIsEdit(){
    this.isEditing.next(true);
  }

  setEditTransactionInstance(transaction: any){
    this.editTransactionInstance.next(transaction);
  }

  setEditState(transaction: any, transactionProduct: any){
    console.log("Adding this set of orders: ", transactionProduct);
    this.isEditing.next(true);
    this.setEditTransactionInstance(transaction);
    transactionProduct.forEach((order: any) => {
      if(order.has_variant){
        this.variantService.updateVariantStock(order.product_ID, order.variant_ID, order.quantity * -1);
      }
      else{
        this.productService.addQuantity(order);
      }
    });
    this.setOrderState(transactionProduct);
  }
}

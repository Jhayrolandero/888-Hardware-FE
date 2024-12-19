import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DataService } from '../data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { mainPort } from '../../app.component';
import { BehaviorSubject } from 'rxjs';
import { DiscountPromo } from '../../interface/product';
import { LoadingService } from '../loading.service';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private discountProduct = new BehaviorSubject<any[]>([]);
  discountProduct$ = this.discountProduct.asObservable();

  loaderState: string = "discount"

  constructor(
    private http: HttpClient,
    private loaderService: LoadingService
  ) {
    this.loaderService.initLoading(this.loaderState)
    this.initDiscount();
  }

  initDiscount(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getDiscountProduct').subscribe({
      next: (value: any) => {
        console.log("Loading Discount Products...", value);
        this.setDiscountState(value.data);
        this.loaderService.stopLoading(this.loaderState)
      },
      error: (error) => {
        console.log(error);
        this.loaderService.stopLoading(this.loaderState)
      }
    })
  }

  getDiscountState() {
    return this.discountProduct.getValue();
  }

  updateDiscount(discountList: any){
    discountList.forEach((discount: any) => {
      this.setDiscountState([...this.discountProduct.getValue(), discount]);
    });
    
  }

  getDiscountAvailable(products: any){
    let activeDisc: any[] = [];
    let ret = products;
    let discountArr = this.getDiscountState();
    //If discount to date is less than current date, add to tempdisc

    discountArr.forEach((discount) => {
      if(new Date(discount.discount_to) >= new Date()){
        activeDisc.push(discount);
      }
    });
    console.log("Active Discount: ", activeDisc);
    //Remove products in ret tahat are in activeDisc
    activeDisc.forEach((disc) => {
      ret = ret.filter((product: any) => {
        return product.product_ID != disc.product_ID;
      });
    });
    return ret
  }

  setDiscountState(data: any[]){
    console.log("Setting transaction state...", data);
    this.discountProduct.next(data);
  }
}

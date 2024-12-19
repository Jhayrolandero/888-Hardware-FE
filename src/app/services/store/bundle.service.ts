import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { mainPort } from '../../app.component';
import { CurrBundleProduct } from '../../interface/product';

@Injectable({
  providedIn: 'root'
})
export class BundleService {

  private currBundleProduct = new BehaviorSubject<any[]>([])
  currBundleProduct$ = this.currBundleProduct.asObservable()

  private bundleTier = new BehaviorSubject<any[]>([])
  bundleTier$ = this.bundleTier.asObservable()

  constructor(
    private http: HttpClient
  ) { 
    this.initCurrBundle()
    this.initBundleTier()
  }

  initCurrBundle() {
    this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getBundleProduct').subscribe({
      next: (value: any) => {
        console.log("Loading Bundle Products...", value);
        this.setCurrDiscountState(value.data);
      },
      error: (error) => {
        console.log(error);
      }
    })  
  }

  initBundleTier(){
    this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getBundleTier').subscribe({
      next: (value: any) => {
        console.log("Loading Bundle Tier...", value);
        this.setBundleTierState(value.data);
      },
      error: (error) => {
        console.log(error);
      }
    })
  }

  getCurrDiscountState() {
    return this.currBundleProduct.getValue();
  }

  getBundleTierState() {
    return this.bundleTier.getValue();  
  }

  getOneBundleTier(id: number) {
    return this.getBundleTierState().filter(x => x.deal_ID === id)
  }

  setCurrDiscountState(data: any[]) {
    this.currBundleProduct.next(data)
  }

  setBundleTierState(data: any[]) {
    this.bundleTier.next(data)
  }

  updateTier(tierList: any){
    //Add to bundleTier
    tierList.forEach((tier: any) => {
      this.setBundleTierState([...this.getBundleTierState(), tier]);
    });

  }

  updateBundleProduct(productList: any){
    productList.forEach((product: any) => {
      this.setCurrDiscountState([...this.getCurrDiscountState(), product]);
    });
  }

  patchCurrDiscountState(newCurrDiscount: CurrBundleProduct) {
    const currDiscountArr = this.getCurrDiscountState()

    // Patch the products array
    const newState = currDiscountArr.map(x => {
      if (x.product_ID === newCurrDiscount.product_ID) {

        return { ...x, ...newCurrDiscount };
      }
      return x; 
    });
    
    this.setCurrDiscountState(newState)
  }
}


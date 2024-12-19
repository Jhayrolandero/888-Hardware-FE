import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { mainPort } from '../app.component';
import { BehaviorSubject, tap, timer } from 'rxjs';
import { Promo } from '../interface/product';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class PromoService {
  
  private promotion = new BehaviorSubject<Promo[]>([]);
  promotion$ = this.promotion.asObservable();
  loaderState: string = "promo"

  constructor(
    private http: HttpClient,
    private loaderService: LoadingService
  ) { 
    this.loaderService.initLoading(this.loaderState)
    this.initPromos();
  }

  initPromos(){
    this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getAllPromotion').subscribe({
      next: (value: any) => {
        this.setPromoState(value.promotion);
        this.loaderService.stopLoading(this.loaderState)
        console.log("Loading Promotion...", value.promotion);
      },
      error: (error) => {
        console.log(error);
        this.loaderService.stopLoading(this.loaderState)
      }
    })
  }

  updatePromo(promo: Promo){
    this.setPromoState([...this.promotion.getValue(), promo]);
  }

  getPromoState() {
    return this.promotion.getValue();
  }

  setPromoState(promotion: any[]) { 
    this.promotion.next(promotion);
  }

}

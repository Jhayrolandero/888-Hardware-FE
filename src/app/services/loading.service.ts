import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private loadingStates : { [key:string]: BehaviorSubject<boolean> } = {}

  constructor() { }

  // Start loading
  initLoading(key: string) {
    if (!this.loadingStates[key]) {
      this.loadingStates[key] = new BehaviorSubject<boolean>(true);
    } else {
      this.loadingStates[key].next(true);
    }
  }

  // Stop loading for specific state
  stopLoading(key: string) {
    if (this.loadingStates[key]) {
      this.loadingStates[key].next(false);
    }
  }

   // Get observable for a specific loading state
   isLoading$(key: string) {
    // if (!this.loadingStates[key]) {
    //   this.loadingStates[key] = new BehaviorSubject<boolean>(false);
    // }
    return this.loadingStates[key].asObservable();
  }




}

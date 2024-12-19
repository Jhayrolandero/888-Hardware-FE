import { Injectable, signal } from '@angular/core';
import { merge, fromEvent, map, Observable, Observer, startWith } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {

  isOnline = signal(null)
  
  constructor() { 
    this.createOnline$().subscribe(data => this.isOnline.set(data))
  }

  createOnline$() {
    return merge<any>(
      fromEvent(window, 'offline').pipe(map(() => false)),
      fromEvent(window, 'online').pipe(map(() => true)),
      new Observable((sub: Observer<boolean>) => {
        sub.next(navigator.onLine);
        sub.complete();
      })
    ).pipe(
      startWith(navigator.onLine)
    );
  }
}

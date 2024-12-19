import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { fromEvent, map, merge, Observable, Observer, startWith } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import { TokenService } from '../services/authentication/token.service';
import { ProductService } from '../services/store/product.service';
import { VariantService } from '../services/store/variant.service';
import { OfflineService } from '../services/offline.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {
  opened: boolean = true;
  destroyed = new Subject<void>();
  screenSize: string = ''
  isOnline: boolean = true;
  sideBarToggle = true;
  private _snackBar = inject(MatSnackBar);


  options = this._formBuilder.group({
    bottom: 0,
    fixed: true,
    top: 0,
  });

  displayNameMap = new Map([
    [Breakpoints.XSmall, 'XSmall'],
    [Breakpoints.Small, 'Small'],
    [Breakpoints.Medium, 'Medium'],
    [Breakpoints.Large, 'Large'],
    [Breakpoints.XLarge, 'XLarge'],
  ]);

  constructor(
    private breakpointObserver: BreakpointObserver,
    private _formBuilder: FormBuilder,
    private productService: ProductService,
    private variantService: VariantService,
    public token: TokenService,
  ) {



    breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        for (const query of Object.keys(result.breakpoints)) {
          if (result.breakpoints[query]) {
            this.screenSize = this.displayNameMap.get(query) ?? 'Unknown';
          }
        }
      });

    //Subscribe to online checker (works on mobile but not on my laptop for some reason)
    this.createOnline$().subscribe(data => {
      this.isOnline = data

      if(!this.isOnline) {
        this._snackBar.open("You're currently offline!", 'close', {
          duration: 3000,
          horizontalPosition: 'start'
        });
      }
    })
  }

  toggle(){
    this.sideBarToggle = !this.sideBarToggle
    console.log(this.sideBarToggle);
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

    //Observable function for ofline checking
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



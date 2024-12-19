import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderComponent } from '../order/order.component';
import { MatTabsModule } from '@angular/material/tabs';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatMenuModule} from '@angular/material/menu';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import { OrderDetailsComponent } from './order-details/order-details.component';
import {MatTableModule} from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatSidenavModule} from '@angular/material/sidenav'; 
import { OverlayModule } from '@angular/cdk/overlay';
import { OrderLandingComponent } from '../navigation/order-landing/order-landing.component';
import {CdkDrag} from '@angular/cdk/drag-drop';
import { OfflineScreenComponent } from './offline-screen/offline-screen.component';

@NgModule({
  declarations: [
    OrderComponent,
    OrderDetailsComponent,
    OrderLandingComponent,
  ],
  imports: [
    MatProgressSpinnerModule,
    CommonModule,
    MatTabsModule,
    MatMenuModule,
    MatSelectModule,
    MatSidenavModule,
    MatExpansionModule,
    MatTableModule,
    LazyLoadImageModule,
    FormsModule,
    ReactiveFormsModule,
    OverlayModule,
    CdkDrag
  ]
})
export class OrdersModule { }


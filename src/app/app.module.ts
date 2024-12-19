import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {CookieService} from 'ngx-cookie-service';

import { TokenInterceptor } from './services/authentication/token.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { ServiceWorkerModule } from '@angular/service-worker';
import { MaterialsModule } from './reusable-components/managewarehouse.module';
import { LoginComponent } from './login/login.component';
import { TableModule } from './reusable-components/table.module';

//for the hash sa route

import { LocationStrategy, HashLocationStrategy } from '@angular/common';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';

import { ClipboardModule } from 'ngx-clipboard';
import { CustomerDetailsComponent } from './navigation/customer-details/customer-details.component';
import { ActivityLogComponent } from './navigation/activity-log/activity-log.component';
import { OrdersModule } from './reusable-components/orders.module';
import { AddStockDialogComponent } from './navigation/manage-warehouse/add-stock-dialog/add-stock-dialog.component';
import { PromoPreviewComponent } from './navigation/manage-warehouse/promo-preview/promo-preview.component';
import { LogoutDialogComponent } from './reusable-components/logout-dialog/logout-dialog.component';
import { DeleteDialogComponent } from './reusable-components/delete-dialog/delete-dialog.component';
import {MatTableModule} from '@angular/material/table';
import { AddCategoryComponent } from './navigation/manage-warehouse/add-category/add-category.component';

import { AddCategoryDialogComponent } from './navigation/manage-warehouse/add-category-dialog/add-category-dialog.component';
import { SupplierTransactionTableComponent } from './navigation/supplier-transactions/supplier-transaction-table/supplier-transaction-table.component';
import { PromotionComponent } from './navigation/promotion/promotion.component';
import { DiscountsComponent } from './navigation/promotion/discounts/discounts.component';
import { BundleDealsComponent } from './navigation/promotion/bundle-deals/bundle-deals.component';
import { AddOnComponent } from './navigation/promotion/add-on/add-on.component';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PromotionsModule } from './reusable-components/promo.module';
import { LandingComponent } from './navigation/promotion/landing/landing.component';
import { BundleTypesComponent } from './navigation/promotion/bundle-deals/bundle-types/bundle-types.component';
import { OrderDetailsDialogComponent } from './order/order-details-dialog/order-details-dialog.component';
import { PaymentConfirmDialogComponent } from './navigation/transaction-history/payment-confirm-dialog/payment-confirm-dialog.component';
import { ManageOrderDraftsComponent } from './navigation/manage-order-drafts/manage-order-drafts.component';
import { DeliverDialogComponent } from './navigation/manage-order-drafts/order-drafts/deliver-dialog/deliver-dialog.component';
import { OrderLandingComponent } from './navigation/order-landing/order-landing.component';
import { OrderPageComponent } from './navigation/order-page/order-page.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { ManageWarehousePageComponent } from './navigation/manage-warehouse/manage-warehouse-page/manage-warehouse-page.component';
import {MatRadioModule} from '@angular/material/radio';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import { WarehouseArchiveComponent } from './navigation/manage-warehouse/warehouse-archive/warehouse-archive.component';
//test
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ActivityLogComponent,
    AddStockDialogComponent,
    LogoutDialogComponent,
    AddCategoryComponent,
    AddCategoryDialogComponent,
    DeleteDialogComponent,
    OrderDetailsDialogComponent,
    PaymentConfirmDialogComponent,
    DeliverDialogComponent,
    ManageOrderDraftsComponent,
    OrderPageComponent,
    ManageWarehousePageComponent
  ],
  imports: [
    //Para sa transaction-history lang to ero di ko alam san a dapat ilagay
    MatIconModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatRadioModule,
    MaterialsModule,
    MatMenuModule,
    TableModule,
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    ClipboardModule,
    PromotionsModule,
    MatExpansionModule,
    ServiceWorkerModule.register('custom-service-worker.js', {
      enabled: !isDevMode(),

      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    provideAnimationsAsync(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass:TokenInterceptor,
      multi:true
    },
    CookieService,
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    provideNativeDateAdapter()
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }


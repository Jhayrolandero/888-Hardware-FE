import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NavigationComponent } from './navigation/navigation.component';
import { ManageWarehouseComponent } from './navigation/manage-warehouse/manage-warehouse.component';
import { DashboardComponent } from './navigation/dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { OrderComponent } from './order/order.component';
import { authGuard } from './services/guard/authguard.service';
import { CustomerDetailsComponent } from './navigation/customer-details/customer-details.component';
import { TransactionHistoryComponent } from './navigation/transaction-history/transaction-history.component';
import { ActivityLogComponent } from './navigation/activity-log/activity-log.component';
import { SupplierComponent } from './navigation/supplier/supplier.component';
import { OrderDraftsComponent } from './navigation/manage-order-drafts/order-drafts/order-drafts.component';
import { SupplierTransactionsComponent } from './navigation/supplier-transactions/supplier-transactions.component';
import { DiscountsComponent } from './navigation/promotion/discounts/discounts.component';
import { PromotionComponent } from './navigation/promotion/promotion.component';
import { LandingComponent } from './navigation/promotion/landing/landing.component';
import { BundleDealsComponent } from './navigation/promotion/bundle-deals/bundle-deals.component';
import { AddOnComponent } from './navigation/promotion/add-on/add-on.component';
import { PromoPreviewComponent } from './navigation/manage-warehouse/promo-preview/promo-preview.component';
import { ManageOrderDraftsComponent } from './navigation/manage-order-drafts/manage-order-drafts.component';
import { OrderLandingComponent } from './navigation/order-landing/order-landing.component';
import { OrderPageComponent } from './navigation/order-page/order-page.component';
import { CanDeactivateGuard } from './services/guard/can-deactivate.guard';
import { AddProductComponent } from './navigation/manage-warehouse/add-product/add-product.component';
import { ManageWarehousePageComponent } from './navigation/manage-warehouse/manage-warehouse-page/manage-warehouse-page.component';
import { AddMassComponent } from './navigation/manage-warehouse/add-mass/add-mass.component';
import { WarehouseArchiveComponent } from './navigation/manage-warehouse/warehouse-archive/warehouse-archive.component';


const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { 
    path: '', 
    component: NavigationComponent, 
    children: [
      {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
      // {path: 'manage-warehouse', 
      //   component: ManageWarehouseComponent, 
      //   canActivate: [authGuard], 
      //   canDeactivate: [canDeactivateGuard]},
      {
        path: 'manage-warehouse', component: ManageWarehousePageComponent, children: [
          {path: '', component: ManageWarehouseComponent, canActivate: [authGuard]},
          {path: 'add-product', component: AddProductComponent, canActivate: [authGuard], canDeactivate: [CanDeactivateGuard]},
          {path: 'edit-product/:id', component: AddProductComponent, canActivate: [authGuard], canDeactivate: [CanDeactivateGuard]},
          {path: 'add-stock', component: AddMassComponent, canActivate: [authGuard], canDeactivate: [CanDeactivateGuard]}
        ]
      },
      {path: 'supplier-transactions', component: SupplierTransactionsComponent, canActivate: [authGuard]},
      {path: 'warehouse-archive', component: WarehouseArchiveComponent, canActivate: [authGuard]},
      // {path: 'create-order', component: OrderComponent, canActivate: [authGuard]},
      {path: 'manage-customers', component: CustomerDetailsComponent, canActivate: [authGuard]},
      {path: 'activity-logs', component: ActivityLogComponent, canActivate: [authGuard]},
      {path: 'manage-suppliers', component: SupplierComponent, canActivate: [authGuard]},
      // {path: 'promotions', component: PromotionComponent, children: [
      //   {path: '', component: LandingComponent, canActivate: [authGuard]},
      //   {path: 'discounts', component: DiscountsComponent, canActivate: [authGuard]},
      //   {path: 'bundle', component: BundleDealsComponent, canActivate: [authGuard]},
      //   {path: 'addon', component: AddOnComponent, canActivate: [authGuard]},
      //   {path: 'promo-preview', component: PromoPreviewComponent, canActivate: [authGuard]},
      // ], canActivateChild: [authGuard]},
      {
        path: 'order-landing', component: OrderPageComponent, children: [
          {path: '', component: OrderLandingComponent, canActivate: [authGuard]},
          {path: 'manage-order-drafts', component: ManageOrderDraftsComponent, children: [
            {path: '', component: OrderDraftsComponent, canActivate: [authGuard]},
            {path: 'edit-order', component: OrderComponent, canActivate: [authGuard]},
          ], canActivate: [authGuard]},
          {path: 'manage-sales', component: TransactionHistoryComponent, canActivate: [authGuard]},
          {path: 'create-order', component: OrderComponent, canActivate: [authGuard], canDeactivate: [CanDeactivateGuard]},
        ], canActivateChild: [authGuard]
      }
    ], 
    canActivateChild: [authGuard],
  },
  { path: 'login', component: LoginComponent }, 
  { path: '**', redirectTo: '/login' }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
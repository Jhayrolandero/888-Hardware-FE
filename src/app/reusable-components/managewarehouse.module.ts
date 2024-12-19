import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import { MatButtonModule} from '@angular/material/button';
import { MatSidenavModule} from '@angular/material/sidenav';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from '../navigation/navigation.component';
import { ManageWarehouseComponent } from '../navigation/manage-warehouse/manage-warehouse.component';
import { DashboardComponent } from '../navigation/dashboard/dashboard.component';
import { AddProductComponent } from '../navigation/manage-warehouse/add-product/add-product.component';
import { AddVariantGroupComponent } from '../navigation/manage-warehouse/add-variant-group/add-variant-group.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { PendingRequestComponent } from '../navigation/manage-warehouse/pending-request/pending-request.component';
import { LazyLoadImageModule } from 'ng-lazyload-image'; 
import {MatExpansionModule} from '@angular/material/expansion';
import { SidePanelComponent } from './side-panel/side-panel.component';
import { AddMassComponent } from '../navigation/manage-warehouse/add-mass/add-mass.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { AddSupplierDialogComponent } from '../navigation/supplier/add-supplier-dialog/add-supplier-dialog.component';
import { DiscountsComponent } from '../navigation/promotion/discounts/discounts.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OfflineScreenComponent } from './offline-screen/offline-screen.component';
import { WarehouseArchiveComponent } from '../navigation/manage-warehouse/warehouse-archive/warehouse-archive.component';
@NgModule({
  declarations: [
    SidebarComponent,
    NavigationComponent,
    ManageWarehouseComponent,
    DashboardComponent,
    AddProductComponent,
    AddVariantGroupComponent,
    PendingRequestComponent,
    SidePanelComponent,
    AddMassComponent,
    AddSupplierDialogComponent,
    WarehouseArchiveComponent
  ],
  imports: [
    MatAutocompleteModule,
    CommonModule,
    MatButtonModule,
    MatMenuModule,
    MatSidenavModule,
    RouterOutlet,
    MatTableModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    LazyLoadImageModule,
    MatExpansionModule,
    MatButtonModule, 
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,

  ]
})
export class MaterialsModule { }

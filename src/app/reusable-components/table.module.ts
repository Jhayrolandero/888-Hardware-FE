import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatMenuModule} from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import { TransactionHistoryComponent } from '../navigation/transaction-history/transaction-history.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TransactionTableComponent } from '../navigation/transaction-history/transaction-table/transaction-table.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ReactiveFormsModule } from '@angular/forms';
import {MatNativeDateModule} from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { SupplierTransactionsComponent } from '../navigation/supplier-transactions/supplier-transactions.component';
import { SupplierComponent } from '../navigation/supplier/supplier.component';
import { SupplierTransactionDialogComponent } from '../navigation/supplier-transactions/supplier-transaction-dialog/supplier-transaction-dialog.component';
import { SupplierTransactionTableComponent } from '../navigation/supplier-transactions/supplier-transaction-table/supplier-transaction-table.component';
import { CustomerDetailsComponent } from '../navigation/customer-details/customer-details.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router, RouterModule } from '@angular/router';
import { OrderDraftsComponent } from '../navigation/manage-order-drafts/order-drafts/order-drafts.component';
import { MatIconModule } from '@angular/material/icon';
import { TableComponentComponent } from './table-component/table-component.component';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';

@NgModule({
  declarations: [
    TransactionHistoryComponent,
    TransactionTableComponent,
    OrderDraftsComponent,
    SupplierComponent,
    SupplierTransactionsComponent,
    SupplierTransactionDialogComponent,
    SupplierTransactionTableComponent,
    CustomerDetailsComponent,
    TableComponentComponent
  ],
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormField,
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatMenuModule,
    MatSelectModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatTableModule,
    LazyLoadImageModule,
    FormsModule,
    MatCheckboxModule,
    RouterModule,
    MatProgressSpinner,
    MatIconModule,
    MatRadioModule
  ]
})
export class TableModule { }


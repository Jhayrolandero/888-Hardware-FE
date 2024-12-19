import { Component, OnInit, ViewChild, AfterViewInit, QueryList, ViewChildren } from '@angular/core';
import { Transaction } from '../../../interface/transaction';
import { TransactionService } from '../../../services/store/transaction.service';
import { Order, Product } from '../../../interface/product';
import { ProductService } from '../../../services/store/product.service';
import { VariantService } from '../../../services/store/variant.service';
import { Variant } from '../../../interface/variant';
import { FormGroup, FormControl } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../../../reusable-components/delete-dialog/delete-dialog.component';
import { OrderService } from '../../../services/order.service';
import { DeliverDialogComponent } from './deliver-dialog/deliver-dialog.component';
import { Router } from '@angular/router';
import { OfflineService } from '../../../services/offline.service';


@Component({
  selector: 'app-order-drafts',
  templateUrl: './order-drafts.component.html',
  styleUrl: './order-drafts.component.css'
})
export class OrderDraftsComponent implements  OnInit {
  mainTransaction: [Transaction, any[]][] = [];
  transaction: Transaction[] = [];
  transactionProduct: Order[] = [];
  searchParam = '';
  filteredMainTransaction: Transaction[] = [];
  parsedTransactionProduct = new Map<number, any[]>();
  date: any;
  ascending = true;
  sortType = 'Name';
  isLoading = false;
  isEditing = false;
  currentUrl = '';

  displayedColumns: string[] = ['quantity', 'product_name','stock_price', 'sell_price', 'total'];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private productService: ProductService,
    private variantService: VariantService,
    private transactionService: TransactionService,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private orderService: OrderService,
    private titleService: Title,
    private routers: Router,
    public offlineService: OfflineService
  ) {
    this.currentUrl = this.router.url.split('/')[2];
  }

  transactionForm = new FormGroup({
    transaction: new FormControl<[Transaction, any] | null>(null)
  });

  ngOnInit(): void {
    this.titleService.setTitle("Order Summary - 888 Hardware Trading");
    

    this.orderService.isEditing$.subscribe((isEditing) => {
      console.log("Is editing: ", isEditing); 
      this.isEditing = isEditing;
    });


    // Initialize transaction values
    this.transactionService.transaction$.subscribe({
      next: (value: Transaction[]) => {
        this.transaction = value;
        this.filteredMainTransaction = value;
      }
    });

    this.transactionService.transactionLoader$.subscribe({
      next: (value: boolean) => {
        this.isLoading = value;
      }
    });

    this.transactionService.transactionProduct$.subscribe({
      next: (value: any[]) => {
        console.log("Transaction Product has updated ", value);
        this.transactionProduct = value;
        // if (this.productService.getProductstate().length > 0 && this.variantService.getVariantState().length > 0) {
        //   this.parseMainTransaction();
        // }
      }
    });

    this.transaction = this.transaction.map((transaction) => {
      transaction.is_dropdown = false;
      return transaction;
    });

  }

  parseTransactionProduct(transaction: any){
    if(this.parsedTransactionProduct.has(transaction.transaction_ID)){
      return;
    }
    else{
      let localTransactionProduct = this.transactionProduct.filter((product: any) => product.transaction_ID === transaction.transaction_ID);
      this.parsedTransactionProduct.set(transaction.transaction_ID, localTransactionProduct);
      console.log(localTransactionProduct);
      console.log(this.parsedTransactionProduct);
    }
  }

  toggleSortDirection() {
    this.ascending = !this.ascending;
    this.sortTransaction(this.sortType);
  }

  sortTransaction(type: string) {
    if (type === 'Date') {
      this.filteredMainTransaction.sort((a, b) => {
          if (this.ascending) {
              return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
          } else {
              return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
          }
      });
    } else if (type === 'Name') {
      this.filteredMainTransaction.sort((a, b) => {
          if (this.ascending) {
              return a.client_name.localeCompare(b.client_name);
          } else {
              return b.client_name.localeCompare(a.client_name);
          }
      });
    }
    this.sortType = type;
  }

  onChangeSearch() {
    if (this.searchParam) {
      console.log("Filtering");
      this.filteredMainTransaction = this.transaction.filter((transaction) => 
        transaction.client_name.toLowerCase().includes(this.searchParam.toLowerCase())
      );
    } else {
      this.filteredMainTransaction = this.transaction;
    }
  }

  searchDateOnEnter(event: any){
    if(event.key === "Enter"){
      this.searchDate();
    }
  }

  goTo(url: string){
    this.router.navigate(['/order-landing/' + url]);
    this.currentUrl = url;
  }

  searchDate(){
    // if(this.date){
    //   let date = new Date(this.date);
    //   let filterDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    //   console.log("Filtering Date", filterDate);
    //   this.filteredMainTransaction = this.mainTransaction.filter(([transaction]) => 
    //     transaction.transaction_date.includes(filterDate)
    //   );
    // }
    // else{
    //   this.filteredMainTransaction = this.mainTransaction;
    // }
  }

  //Associate transaction products with respective transaction for efficient iteration on html
  //NOTE: AS OF NOW, THIS IS EXTREMELY SLOW, AND OPERATES ON O(n^2) TIME COMPLEXITY SIMILAR TO VARIANTS ON MANAGE ORDERS, PLEASE FIX BOTH USING SQL BECAUSE THIS WILL BREAK THE UNIVERSE IF THE RECORDS GO TO MILLIONS (i mean its kinda impossible but still fix this chris)
  parseMainTransaction(){
    this.mainTransaction = [];
    this.transaction.forEach((transaction) => {
      let order = this.transactionProduct.filter((order) => order.transaction_ID === transaction.transaction_ID);
      let mainList = order.map((order) => {
        if(order.variant_ID !== null){
          let prod = this.productService.findProduct(order.product_ID);
          let varia = this.variantService.getVariant(order.product_ID, order.variant_ID);
          varia!.product_name = prod!.product_name;
          return {...varia, ...order};

        }
        else{
          return {...this.productService.findProduct(order.product_ID), ...order};
        }
      })
      this.mainTransaction.push([transaction, mainList]);
    });

    console.log("Main Transaction", this.mainTransaction);
    // this.filteredMainTransaction = this.mainTransaction;
  }

  exportTransaction(exportData: any){
    this.transactionForm.patchValue({
      transaction: exportData
    });
    console.log("Exporting Transaction", exportData);

    this.dataService.downloadData(this.transactionForm, "exportTransaction").subscribe({
      next: (value: any) => {
        const url = window.URL.createObjectURL(value);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'DR' + exportData[0].receipt_number + '.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.log(error);
        // this.snackBar.open("Error Updating Client", "Close", {
        //   duration: 2000,
        // });
      }
    });
  }

  deleteOrder(id: number){
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        order_draft: id
      },
      width: '300px'
    });

    dialogRef.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {
          this.dataService.deleteData(id, "deleteOrder").subscribe({
            next: (value: any) => {
              console.log(value);
      
              this.transactionService.getTransactionProductState().forEach((transTemp) => {
                if(transTemp.transaction_ID === id){
                  //Variant Filter
                  if(transTemp.variant_ID === null){
                    this.productService.addQuantity(transTemp);
                  }
                  else{
                    this.variantService.addQuantity(transTemp);
                  }
                }
              });
              this.snackBar.open("Order draft has been successfully deleted.", "Close", {
                duration: 2000,
              });
              this.transactionService.deleteTransaction(id);
            },
            error: (error) => {
              console.log(error);
            }
          });
        } else {
          console.log("cancelled");
        }
      },
      error: (error: any) => {
        console.log(error);
      }
    });


  }

  fetchTransactionProduct(transaction: Transaction){
    return this.transactionProduct.filter((product) => {
      return product.transaction_ID === transaction.transaction_ID;
    });
  }

  calculateTotal() {
    // return order.reduce((sum: number, item: any) => sum + item.final_total, 0);
    return 12;
  }

  editOrder(transaction: any){
    //Set isDropdown to false to prevent dropdown from showing
    this.filteredMainTransaction.map((transaction) => {
      if(transaction.transaction_ID === transaction.transaction_ID){
        transaction.is_dropdown = false;
      }
      return transaction
    });
    this.routers.navigate(['/order-landing/manage-order-drafts/edit-order']).then(() => {
      this.orderService.setEditState(transaction, this.fetchTransactionProduct(transaction));
    });
  }

  deliverOrder(order: any){
    const dialogRef = this.dialog.open(DeliverDialogComponent);

    dialogRef.afterClosed().subscribe({
      next: (result: any[]) => {
        console.log("result");
        if(result[0]){
          this.dataService.patchObjectData({
            id: order.transaction_ID,
            term: result[1],
            dr: result[2]
          }, "deliverOrder").subscribe({
            next: (value: any) => {
              let orderPass = {...order, ...value};
              this.transactionService.updatePaid(orderPass);
      
              this.snackBar.open("Order has been successfully delivered.", "Close", {
                duration: 2000,
              });
            },
            error: (error) => {
              console.log(error);
              this.snackBar.open("Error Delivering Order", "Close", {
                duration: 2000,
              });
            }
          });
        }
      }
    });
  }
}

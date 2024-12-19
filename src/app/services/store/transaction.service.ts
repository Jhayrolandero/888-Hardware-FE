import { HttpClient } from '@angular/common/http';
import { Injectable, ɵɵsetComponentScope } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../data.service';
import { mainPort } from '../../app.component';
import { Client } from '../../interface/client';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Transaction } from '../../interface/transaction';
import { Order } from '../../interface/product';
import { VariantService } from './variant.service';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transaction = new BehaviorSubject<Transaction[]>([]);
  private transactionProduct = new BehaviorSubject<any[]>([]);

  private sales = new BehaviorSubject<Transaction[]>([]);

  transaction$ = this.transaction.asObservable();
  transactionProduct$ = this.transactionProduct.asObservable();
  sales$ = this.sales.asObservable(); 

  private transactionLoader = new BehaviorSubject<boolean>(true);
  transactionLoader$ = this.transactionLoader.asObservable();

  private salesLoader = new BehaviorSubject<boolean>(true);
  salesLoader$ = this.salesLoader.asObservable();


  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private variantService: VariantService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {
    this.initTransaction();
    this.initTransactionProduct();
    this.initSales();
  }

  initTransaction(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getTransaction').subscribe({
      next: (value: any) => {
        console.log("Loading Transaction...", value);
        this.setTransactionState(value.data);
        this.transactionLoader.next(false);
      },
      error: (error) => {
        console.log(error);
        // this.initClient();
      }
    })
  }

  initTransactionProduct(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getTransactionProduct').subscribe({
        next: (value: any) => {
          console.log("Loading Transaction Product...", value);
          this.setTransactionProductState(value.data);
        },
        error: (error) => {
          console.log(error);
          // this.initClient();
        }
      })
  }

  initSales(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getSales').subscribe({
      next: (value: any) => {
        console.log("Loading Sales...", value);
        this.setSalesState(value.data);
        this.salesLoader.next(false);
      },
      error: (error) => {
        console.log(error);
        // this.initClient();
      }
    })
  }

  addTransaction(transactionData: any){
    let oldState = this.getTransactionState();
    let newState = [...oldState, transactionData];

    this.setTransactionState(newState);
    console.log(transactionData);
    transactionData.order.forEach((order: any) => {
      this.addTransactionProduct(order);
    })

  }

  addTransactionProduct(order: any){
    let oldState = this.getTransactionProductState();
    let newState = [...oldState, order];

    this.setTransactionProductState(newState);
  }

  deleteTransactionProduct(id: number){

    let oldState = this.getTransactionProductState();
    let newState = oldState.filter((order) => order.transaction_ID !== id);

    this.setTransactionProductState(newState);
  }

  deleteTransaction(id: number){
    let oldState = this.getTransactionState();
    let newState = oldState.filter((transaction) => transaction.transaction_ID as number !== id);
    this.setTransactionState(newState);
  }

  updateTransaction(transaction: any){
    //Parse order to get the product details

    console.log(this.productService.getProductstate());
    let mainTransactObject = transaction.order.map((order: any) => {
    console.log("Order", order);
      if(order.variant_ID){
        let addInv = Object.assign({}, order, this.variantService.getVariant(order.product_ID, order.variant_ID), this.productService.findProduct(order.product_ID));
        console.log("Add Inv", addInv, this.variantService.getVariant(order.product_ID, order.variant_ID), this.productService.findProduct(order.product_ID));
        return addInv;
      }
      else{
        let addInv = Object.assign({}, order, this.productService.findProduct(order.product_ID));
        console.log("Add Inv", addInv, this.productService.findProduct(order.product_ID));
        return addInv;
      }
    });
    //Delete records of both transaction and its products
    this.deleteTransactionProduct(transaction.transaction_ID);
    this.deleteTransaction(transaction.transaction_ID);
    let oldState = this.getTransactionState();
    let newState = [...oldState, transaction];
    this.setTransactionState(newState);
    console.log("Transaction product to pass", transaction.order);
    //Add new product details to the transaction product list
    mainTransactObject.forEach((order: any) => {
      this.addTransactionProduct(order);
    });

    console.log(this.getTransactionProductState());
  }

  updatePaid(order: any){
    let oldState = this.getTransactionState();
    let newState = oldState.filter((transaction) => transaction.transaction_ID !== order.transaction_ID);
    this.setTransactionState(newState);

    oldState = this.getSalesState();
    newState = [...oldState, order];
    this.setSalesState(newState);
  }

  updatePaymentStatus(transaction: Transaction[], paymentDetails: string, date: string, isPaid: boolean, paidAmount: string, unix: string, totalPaid: number){
    let oldState = this.getSalesState();
    transaction.forEach((transact) => {
      oldState = oldState.map((sale) => {
        if(sale.transaction_ID === transact.transaction_ID){
          return {
            ...sale,
            is_paid: isPaid,
            paid_date_unix: unix + '',
            transaction_detail: paymentDetails,
            paid_date: date,
            paid_amount: paidAmount+'',
            total_paid: totalPaid,
          }
        }
        return sale;
      });
      this.setSalesState(oldState);
    });
  }


  editTransaction(updatedTransaction: any) {
    let oldState = this.getSalesState();
    let index = oldState.findIndex((transact: any) => transact.transaction_ID === updatedTransaction.transaction_ID);

    oldState[index] = {
      ...oldState[index],
      dr_number: updatedTransaction.dr_number,
      transaction_detail: updatedTransaction.transaction_detail
    };
    

    this.sales.next(oldState);
  }


  // returns array of Sales Object delivered during the month
  getSalesOfTheMonth(month: number, year: number){
    let sales = this.getSalesState();
    let monthSales = sales.filter((sale) => {
      let saleDate = new Date(sale.transaction_date);
      return saleDate.getMonth() + 1 === month && saleDate.getFullYear() === year;
    });

    return monthSales;
  }
    
  // returns total sales of the month, subtotal_price
  getTotalSaleOfMonth(month: number, year: number): number {

    let sales = this.getSalesOfTheMonth(month, year);
    let total = 0;
    if (sales.length === 0) {
      return 0;
    }
  
    sales.forEach((sale) => {
      total += Number(sale.subtotal_price);
    });
  

    return total;
  }

  // returns length of sales of the month
  // getLengthOfSalesOfMonth(month: number, year: number): number {
  //   let sales = this.getSalesOfTheMonth(month, year);
  //   let length = sales.length;
  
  //   return length;
  // }

  getTransactionLength(){
    let transaction = this.getTransactionState();
    let length = transaction.length;

    return length;

  }



  getTransactionState() {
    return this.transaction.getValue();
  }

  getSalesState() {
    return this.sales.getValue();
  }

  getTransactionProductState() {
    return this.transactionProduct.getValue();
  }

  setTransactionState(data: Transaction[]){
    console.log("Setting transaction state...", data);
    this.transaction.next(data);
  }

  setTransactionProductState(data: any[]){
    console.log("Setting transaction product state...", data);
    this.transactionProduct.next(data);
  }

  setSalesState(data: Transaction[]){
    console.log("Setting sales state...", data);
    this.sales.next(data);
  }
}
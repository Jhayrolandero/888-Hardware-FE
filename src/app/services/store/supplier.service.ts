import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { mainPort } from '../../app.component';
import { DataService } from '../data.service';
import { Supplier, SupplierProduct, SupplierTransaction } from '../../interface/supplier';
import { SupplierProductPopup } from '../../interface/supplier-product-popup';
import { SupplierPromo } from '../../interface/supplier';
import { Form, FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private supplier = new BehaviorSubject<Supplier[]>([]);
  supplier$ = this.supplier.asObservable();

  private supplierProductPopup = new BehaviorSubject<any>([]);
  supplierProductPopup$ = this.supplierProductPopup.asObservable();

  private supplierProduct = new BehaviorSubject<SupplierProduct[]>([]);
  supplierProduct$ = this.supplierProduct.asObservable();

  private supplierPromo = new BehaviorSubject<SupplierPromo[]>([]);
  supplierPromo$ = this.supplierPromo.asObservable();
  
  private supplierTransaction = new BehaviorSubject<SupplierTransaction[]>([]);
  supplierTransaction$ = this.supplierTransaction.asObservable();

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.initService();
    this.initPromo();
    this.initSupplierTransaction();
    this.initSupplierProduct();
  }

  initService(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getSupplier').subscribe({
      next: (value: any) => {
        console.log("Loading Supplier...", value);
        this.setSupplierState(value.data);
      },
      error: (error) => {
        console.log(error);
      }
    })
  }

  initPromo() {
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getSupplierPromo').subscribe({
      next: (value: any) => {
        console.log("Loading Supplier Promo...", value);
        this.setSupplierPromoState(value.data);
      }
    });
  }
  
  initSupplierTransaction(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getSupplierTransaction').subscribe({
      next: (value: any) => {
        console.log("Loading Supplier...", value);
        this.setSupplierTransactionState(value.data);
      },
      error: (error) => {
        console.log(error);
      }
    })
  }

  initSupplierProduct() {
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getSupplierProduct').subscribe({
      next: (value: any) => {
        console.log("Loading Supplier Product...", value);
        this.setSupplierProductState(value.data);
      }
    });
  }

  createPromo(form: any){
    let promo: SupplierPromo = {
      supplier_promo_ID: form.supplier_promo_ID,
      supplier_ID: form.supplier_ID,
      promo_name: form.promo_name,
      promo_description: form.promo_description,
      isEditing: false,
      isAdding: false,
      isLoading: false
      
    }

    return promo;
  }

  createSupplier(form: any){  
    let supplier: Supplier = {
      supplier_ID: form.supplier_ID,
      supplier_name: form.supplier_name,
      supplier_contact: form.supplier_contact,
      supplier_note: form.supplier_note,
      isEditing: false,
      addingPromo: false,
      isDropdown: false,
      isLoading: false
    }

    return supplier;
  }

  addSupplier(supplier: Supplier) {
    const oldState = this.getSupplierState()
    const newState = [...oldState, supplier]
    this.setSupplierState(newState)
  }

  addPromo(promo: SupplierPromo){
    let oldState = this.getSupplierPromoState();
    let newState = [...oldState, promo];
    this.setSupplierPromoState(newState);
  }

  addSupplierTransaction(transaction: SupplierTransaction){
    let oldState = this.getSupplierTransactionState();
    let newState = [...oldState, transaction];
    this.setSupplierTransactionState(newState);
  }

  addSupplierProduct(product: SupplierProduct){
    let oldState = this.getSupplierProductState();
    let newState = [...oldState, product];
    this.setSupplierProductState(newState);
  }

  editPromo(updatedPromo: SupplierPromo) {
    let oldState = this.getSupplierPromoState();

    let index = oldState.findIndex((promo: SupplierPromo) => promo.supplier_promo_ID === updatedPromo.supplier_promo_ID);
    
    if (index !== -1) {
      oldState[index] = updatedPromo;
    }

    this.setSupplierPromoState(oldState);
  }

  editSupplier(updatedSupplier: Supplier) {
    let oldState = this.getSupplierState();

    let index = oldState.findIndex((supplier: Supplier) => supplier.supplier_ID === updatedSupplier.supplier_ID);
    
    if (index !== -1) {
      oldState[index] = updatedSupplier;
    }

    this.setSupplierState(oldState);
  }

  setSupplierPromoState(data: any){
    this.supplierPromo.next(data);  
  }

  getSupplierPromoState() {
    return this.supplierPromo.getValue();
  }

  getSupplierPromoID(id: number){
    return this.supplierPromo.getValue().filter((promo: SupplierPromo) => promo.supplier_ID === id);
  }

  getSupplierPromoName(id: number){
    let tempSupplier = this.supplierPromo.getValue().find((promo: SupplierPromo) => promo.supplier_promo_ID === id);
    return tempSupplier?.promo_name;
  }
  
  getSupplierState(){
    return this.supplier.getValue();
  }

  getSupplierProductPopupState() {
    return this.supplierProductPopup.getValue();
  }

  getSupplierProductState() {
    return this.supplierProduct.getValue();
  }

  getSupplierTransactionState(){
    return this.supplierTransaction.getValue();
  }

  setSupplierProductPopupState(data: any){
    this.supplierProductPopup.next(data);
  }

  setSupplierProductState(data: any){
    this.supplierProduct.next(data);
  }

  setSupplierState(data: Supplier[]){
    this.supplier.next(data);
  }

  setSupplierTransactionState(data: SupplierTransaction[]){
    this.supplierTransaction.next(data);
  }

  updateSupplierTransactionPaid(supp: any[], method: string, date: Date,  isPaid: boolean, paidAmount: string, unix: string, totalPaid: number){
    let oldState = this.supplierTransaction.getValue();
    supp.forEach((transaction: any) => {
      oldState = oldState.map((supppl) => {
        if(supppl.supplier_transaction_ID === transaction.supplier_transaction_ID){
          return {
            ...supppl,
            is_paid: isPaid,
            paid_date_unix: unix + '',
            method_of_payment: method,
            paid_date: date,
            paid_amount: paidAmount+'',
            total_paid: totalPaid,
          }
        }
        console.log('Supplier Transaction', supppl);
        return supppl;
      })
    });
    this.setSupplierTransactionState(oldState);

  }

  deletePromo(promo: SupplierPromo){
    let oldState = this.getSupplierPromoState();
    let newState = oldState.filter((oldPromo: SupplierPromo) => oldPromo.supplier_promo_ID !== promo.supplier_promo_ID);
    this.setSupplierPromoState(newState);
  }

  deleteSupplier(supplier: Supplier){ 
    let oldState = this.getSupplierState();
    let newState = oldState.filter((oldSupplier: Supplier) => oldSupplier.supplier_ID !== supplier.supplier_ID);
    this.setSupplierState(newState);
  } 

  
}

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AddStockDialogComponent } from '../../manage-warehouse/add-stock-dialog/add-stock-dialog.component';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-supplier-transaction-dialog',
  templateUrl: './supplier-transaction-dialog.component.html',
  styleUrl: './supplier-transaction-dialog.component.css'
})
export class SupplierTransactionDialogComponent {
  method_of_payment = '';
  paymentMethod = '';
  fullDetail = '';
  errorMsg = '';
  paymentTypeSupp = 'full';
  paymentAmount?: number;

  paymentFormSupp = new FormGroup({
    inputValueSupp: new FormControl(),
  });


  constructor
  (
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddStockDialogComponent>
  ) 
  {
    dialogRef.disableClose = true;
  }

  ngOnInit(){
    console.log(this.data);
    this.paymentFormSupp.disable();
    this.paymentFormSupp.get('inputValueSupp')?.valueChanges.subscribe(value => {
      this.checkMaxPayable();
    });
  }

  onpaymentTypeSuppChange(event: any){
    console.log("Here!");
    console
    this.paymentTypeSupp = event.value;
    console.log(this.paymentTypeSupp);

    if(this.paymentTypeSupp == 'full'){
      this.paymentFormSupp.disable();
    } else {
      this.paymentFormSupp.enable();
    }
    console.log(this.paymentTypeSupp);
  }

  checkMaxPayable(){
    const maxPayable = this.parsePayableAmount();
    const control = this.paymentFormSupp.get('inputValueSupp');
    console.log(maxPayable, +control!.value);
    if(+control!.value! > maxPayable){
      control?.setValue(maxPayable);
    }
  }

  updateFullDetail() {
    this.errorMsg = '';
    this.fullDetail = this.paymentMethod + ' - ' + this.method_of_payment;
    console.log(this.fullDetail);
  }

  parsePayableAmount(){
    let total = this.data.subtotal;
    if(!this.data.selected_list[0].paid_amount) return total;
    return this.data.selected_list[0].paid_amount.split(',').reduce((acc:number, element: any) => {
      return acc -= element;
    }, total);
  }


  close(){
    this.dialogRef.close([false, '', '']);
  }

  submit(){
    this.paymentAmount = this.paymentFormSupp.get('inputValueSupp')!.value;
    if(this.paymentTypeSupp == 'full'){
      this.paymentAmount = this.parsePayableAmount();
    }
    this.dialogRef.close([true, this.method_of_payment, this.paymentAmount]);
  }
}

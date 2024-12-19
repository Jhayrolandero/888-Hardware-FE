import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../../../reusable-components/delete-dialog/delete-dialog.component';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-payment-confirm-dialog',
  templateUrl: './payment-confirm-dialog.component.html',
  styleUrl: './payment-confirm-dialog.component.css'
})
export class PaymentConfirmDialogComponent {
  transaction_detail = '';
  paymentMethod = '';
  fullDetail = '';
  errorMsg = '';
  paymentType='full';
  paymentAmount?: number;
  paymentForm = new FormGroup({
    inputValue: new FormControl(),
  });

  constructor(
    private dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

  ) { 
    dialogRef.disableClose = true;
    console.log(data);
  }

  ngOnInit() {
    this.paymentForm.disable();
    this.paymentForm.get('inputValue')?.valueChanges.subscribe(value => {
      this.checkMaxPayable();
    });
  }

  onPaymentTypeChange(event: any){
    this.paymentType = event.value;

    if(this.paymentType == 'full'){
      this.paymentForm.disable();
    } else {
      this.paymentForm.enable();
    }
    console.log(this.paymentType);
  }

  checkMaxPayable(){
    console.log("calling this!");
    const maxPayable = this.parsePayableAmount();
    const control = this.paymentForm.get('inputValue');
    console.log(maxPayable, +control!.value);
    if(+control!.value! > maxPayable){
      console.log('Payment amount exceeds payable amount.');
      control?.setValue(maxPayable);
    }
  }

  cancel(){
    this.dialogRef.close([false, '', '']);
  }

  confirm() {
    if(this.fullDetail == ''){
      this.errorMsg = 'Please enter transaction detail.';
      return;
    } else if(this.paymentMethod == ''){
      this.errorMsg = 'Please select payment method.';
      return;
    }
    console.log(this.paymentAmount);
    
    if(this.paymentType == 'full'){
      this.paymentAmount = this.parsePayableAmount();
    }

    this.dialogRef.close([true, this.fullDetail, this.paymentAmount]);
  }

  updateFullDetail() {
    this.errorMsg = '';
    this.fullDetail = this.paymentMethod + ' - ' + this.transaction_detail;
    console.log(this.fullDetail);
  }

  parsePayableAmount(){
    let total = this.data.subtotal;
    if(!this.data.selected_list[0].paid_amount) return total;
    return this.data.selected_list[0].paid_amount.split(',').reduce((acc:number, element: any) => {
      return acc -= element;
    }, total);
  }

}

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../../reusable-components/delete-dialog/delete-dialog.component';

@Component({
  selector: 'app-order-details-dialog',
  templateUrl: './order-details-dialog.component.html',
  styleUrl: './order-details-dialog.component.css'
})
export class OrderDetailsDialogComponent {
  supplier_name: string = '';
  promo_name: string = '';
  order_id: number = 0;
  volume_quantity: string = '';
  product_name: string = '';  
  variant_name: string = '';  
  constructor(
    private dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

  ) { 
    dialogRef.disableClose = true;
  }

  cancel(){
    this.dialogRef.close(false);
  }

  confirm() {
    this.dialogRef.close(true);
  }
}

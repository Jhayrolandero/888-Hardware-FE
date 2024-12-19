import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.css'
})
export class DeleteDialogComponent {
  supplier_name: string = '';
  promo_name: string = '';
  order_id: number = 0;
  volume_quantity: string = '';
  product_name: string = '';  
  variant_name: string = '';
  order_draft: string = '';
  constructor(
    private dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

  ) { 


    if(data.supplier){
      this.supplier_name = data.supplier.supplier_name;
    }
    else if(data.promo){
      this.promo_name = data.promo.promo_name;
    } else if(data.order_id){
      this.order_id = data.order_id
    } else if(data.volume){
      this.volume_quantity = data.volume.volume_quantity;
    } else if(data.product){
      this.product_name = data.product.product_name;
    } else if (data.variant){
      this.variant_name = data.variant.variant_name;    
    }
  }

  cancel(){
    this.dialogRef.close(false);
  }

  confirm() {
    this.dialogRef.close(true);
  }
}

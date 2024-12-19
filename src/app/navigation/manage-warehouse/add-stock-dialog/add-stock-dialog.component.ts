import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-stock-dialog',
  templateUrl: './add-stock-dialog.component.html',
  styleUrl: './add-stock-dialog.component.css'
})
export class AddStockDialogComponent {
  constructor
  (
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddStockDialogComponent>
  ) 
  {

  }

  ngOnInit(){
    console.log(this.data);
  }

  close(){
    this.dialogRef.close();
  }
}

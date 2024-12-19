import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../../../../reusable-components/delete-dialog/delete-dialog.component';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-deliver-dialog',
  templateUrl: './deliver-dialog.component.html',
  styleUrl: './deliver-dialog.component.css'
})
export class DeliverDialogComponent {


  //Formgroup
    paymentTerm = new FormGroup({
      term: new FormControl(),
      dr: new FormControl(),
    });
  

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
    let term = this.paymentTerm.get('term')?.value;
    let dr = this.paymentTerm.get('dr')?.value;
    this.dialogRef.close([true, term, dr]);
  }
}

import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { SupplierService } from '../../../services/store/supplier.service';
import { Supplier } from '../../../interface/supplier';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-add-supplier-dialog',
  templateUrl: './add-supplier-dialog.component.html',
  styleUrl: './add-supplier-dialog.component.css'
})
export class AddSupplierDialogComponent {

  constructor(
    private dataService: DataService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AddSupplierDialogComponent>
  ) {}

  supplierForm = new FormGroup({
    supplier_name: new FormControl('', [Validators.required]),
    supplier_contact: new FormControl('', [Validators.required]),
    supplier_note: new FormControl(''),
  })


  public close(){
    this.dialogRef.close()
  }

  public submitForm() {

    if(this.supplierForm.invalid) {
      let errMsg = ''

      if(this.supplierForm.get('supplier_name')?.hasError('required')) {
        errMsg = "Supplier Name"
      } else if(this.supplierForm.get('supplier_contact')?.hasError('required')) {
        errMsg = "Supplier Contact"
      }
      this.snackBar.open(`${errMsg} cannot be empty!`, 'Close', {
        duration: 2000,
      });
      
      return
    }
    
    this.dataService.postData(this.supplierForm, 'addSupplier').subscribe({
      next: (res: any) => {
        const newSupplier = this.supplierService.createSupplier(res.supplier)
        console.log()
        this.supplierService.addSupplier(newSupplier)

        this.snackBar.open('A new supplier is added', 'Close', {
          duration: 2000,
        });
        
        this.supplierForm.reset()
        this.close()
      },
      error: (err) => {
        console.error(err)
      }
    })
  }
}

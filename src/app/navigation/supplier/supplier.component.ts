import { Component } from '@angular/core';
import { Supplier, SupplierPromo } from '../../interface/supplier';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { DataService } from '../../services/data.service';
import { SupplierService } from '../../services/store/supplier.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../../reusable-components/delete-dialog/delete-dialog.component';
import { AddSupplierDialogComponent } from './add-supplier-dialog/add-supplier-dialog.component';
import { OfflineService } from '../../services/offline.service';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.css'
})
export class SupplierComponent {
  suppliers: Supplier[] = [];
  promos: SupplierPromo[] = [];
  addingPromo = false;

  searchParam: string = '';
  searchFilter: string = '';
  isSearching = false;

  disableAdd = false;
  
  PromoForm = new FormGroup({
    supplier_promo_ID: new FormControl<number>(0) || null,
    supplier_ID: new FormControl<number>(0),
    promo_name: new FormControl<string>('', Validators.required),
    promo_description: new FormControl<string>(''),
  });

  SupplierForm = new FormGroup({
    supplier_ID: new FormControl<number>(0),
    supplier_name: new FormControl<string>('', Validators.required),
    supplier_contact: new FormControl<string>('', Validators.required),
    supplier_note: new FormControl<string>(''),
  });

  constructor(
    private dataService: DataService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private titleService: Title,
    private dialog: MatDialog,
    public offlineService: OfflineService

  ) {}

  ngOnInit(): void {
    this.titleService.setTitle("Supplier Details - 888 Hardware Trading");
    this.supplierService.supplier$.subscribe({
      next: (value: Supplier[]) => {
        //need pa ba to lol
        this.suppliers = value.map(supplier => ({
          ...supplier,
          addingPromo: false, 
          isDropdown: false ,
          isEditing: false,
          isLoading: false
        }));
        console.log("Initialized suppliers:", this.suppliers);
      }
    });

    this.supplierService.supplierPromo$.subscribe({ 
      next: (value: SupplierPromo[]) => {
        this.promos = value;
      }
    })
  }

  onKeydown(event: KeyboardEvent, supplier: Supplier, promo: SupplierPromo | null): void {
    if (event.key === 'Enter') {
        this.submitPromo(supplier, promo);
    }
  }

  onChangeSearch(){
    console.log(this.searchParam);
    this.isSearching = true;
    let supplier = this.supplierService.getSupplierState();
    let promo = this.supplierService.getSupplierPromoState();
    switch(this.searchFilter){
      case 'Supplier Name':
        supplier = supplier.filter(supplier => supplier.supplier_name.toLowerCase().includes(this.searchParam!.toLowerCase()));
        this.suppliers = supplier;
        break;
      case 'Supplier Contact':
        supplier = supplier.filter(supplier => supplier.supplier_contact.toLowerCase().includes(this.searchParam!.toLowerCase()));
        this.suppliers = supplier;
        break;
      case 'Promo Title':
        promo = promo.filter(promo => promo.promo_name.toLowerCase().includes(this.searchParam!.toLowerCase()));
        this.promos = promo;
        const supplierIDs = promo.map(p => p.supplier_ID);

        supplier = supplier.filter(supplier => supplierIDs.includes(supplier.supplier_ID));
        this.suppliers = supplier;
        break;
      default:
        supplier = supplier.filter(supplier => supplier.supplier_name.toLowerCase().includes(this.searchParam!.toLowerCase()));
        this.suppliers = supplier;
        break;
    }

  }

  toggleRow(supplier: Supplier): void {
    ////supplier.isDropdown = !supplier.isDropdown;
    supplier.addingPromo = false;
    supplier.isEditing = false;
  }

  //Promos start here
  toggleEditSupplier(supplier: Supplier): void {
    ////supplier.isDropdown = !supplier.isDropdown;
    this.SupplierForm.patchValue({
      supplier_ID: supplier.supplier_ID,
      supplier_name: supplier.supplier_name,
      supplier_contact: supplier.supplier_contact,
      supplier_note: supplier.supplier_note
    });
    supplier.isEditing = !supplier.isEditing
    
  }

  getPromosForSupplier(supplier_ID: number): SupplierPromo[] {
    return this.promos.filter(promo => promo.supplier_ID === supplier_ID);
  }

  toggleAddingPromo(supplier: Supplier): void {
    ////supplier.isDropdown = !supplier.isDropdown;
    

    this.PromoForm.reset();
    supplier.addingPromo = !supplier.addingPromo;
  }

  closeAdd(supplier: Supplier): void {
    //supplier.isDropdown = !supplier.isDropdown;

    if(supplier.addingPromo) {
      this.PromoForm.reset();
      supplier.addingPromo = !supplier.addingPromo;
    } else {
      this.SupplierForm.reset();
      supplier.isEditing = !supplier.isEditing;
    }
    
  }

  checkPromoTitle(title: any): boolean {
    return !title || title.length === 0;
  }

  editPromo(supplier:Supplier, promo: SupplierPromo): void {
    //supplier.isDropdown = !supplier.isDropdown;
    this.PromoForm.patchValue({
      supplier_promo_ID: promo.supplier_promo_ID,
      promo_name: promo.promo_name,
      promo_description: promo.promo_description
    });
    promo.isEditing = true;
  }
  

  closePromo(supplier: Supplier,promo: SupplierPromo): void {
    //supplier.isDropdown = !supplier.isDropdown;
    this.PromoForm.reset();
    promo.isEditing = !promo.isEditing;

  }


  submitPromo(supplier: Supplier, promo: SupplierPromo | null): void {
    //supplier.isDropdown = !supplier.isDropdown;

    const promoTitle = this.PromoForm.get('promo_name')?.value;
    if (this.checkPromoTitle(promoTitle)) {
      this.snackBar.open("Please fill in the promo title", "Close", {
        duration: 2000
      });
      return;
    }
    
    this.PromoForm.patchValue({
      supplier_ID: supplier.supplier_ID
    });

    if(promo === null) {
      supplier.isLoading = true;
      this.dataService.postData(this.PromoForm, "addPromo").subscribe({
        next: (value: any) => {
          this.supplierService.addPromo(value.promo);
          this.snackBar.open("Promo Added", "Close", {
            duration: 2000
          });
          
          this.PromoForm.reset();
          supplier.isLoading = false;
          supplier.addingPromo = !supplier.addingPromo;
        },
        error: (error) => {
          this.PromoForm.reset();
          supplier.isLoading = false;
          supplier.addingPromo = !supplier.addingPromo;
        }
      });

    } else {
      
      promo.isLoading = true;
      this.disableAdd = true;

      this.dataService.patchData(this.PromoForm, "editPromo").subscribe({
        next: (value: any) => {
          //not reliant on response from backend
          let newPromo = this.supplierService.createPromo(this.PromoForm.value);
          console.log("New Promo", newPromo);
          this.supplierService.editPromo(newPromo);
          // console.log("Promo edited ", value);
          this.snackBar.open("Promo Edited", "Close", {
            duration: 2000
          });

          supplier.isLoading = false;

          this.PromoForm.reset();
          promo.isEditing = !promo.isEditing;
          this.disableAdd = false;
        },
        error: (error) => {
          console.log(error);
          promo.isEditing = !promo.isEditing;
          promo.isLoading = false;
          this.disableAdd = false;
        }
      });
    }

  }


  editSupplierInfo(supplier: Supplier): void {
    ////supplier.isDropdown = !supplier.isDropdown;

    console.log("Editing supplier info", this.SupplierForm.value);
    supplier.isLoading = true;
    this.dataService.patchData(this.SupplierForm, "editSupplier").subscribe({
      next: (value: any) => {
        let newSupplier = this.supplierService.createSupplier(this.SupplierForm.value);
        this.supplierService.editSupplier(newSupplier);
        this.snackBar.open("Supplier Edited", "Close", {
          duration: 2000
        });


        this.SupplierForm.reset();
        supplier.isLoading = false;
        supplier.isEditing = !supplier.isEditing;
      },
      error: (error) => {
        console.log(error);
        supplier.isLoading = false;
      }
    });
  }

  deletePromo(promo: SupplierPromo): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        promo: promo
      },
      width: '300px',
      height: '220px'
    });

    dialogRef.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {

          promo.isLoading = true;
          this.disableAdd = true;
          this.dataService.deleteData(promo.supplier_promo_ID, "deletePromo").subscribe({
            next: (value: any) => {
              this.supplierService.deletePromo(promo);
              this.snackBar.open("Supplier Deleted", "Close", {
                duration: 2000
              });
              promo.isLoading = false;
              this.disableAdd = false;
            },
            error: (error) => {
              console.log(error);
              promo.isLoading = false;
              this.disableAdd = false;
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

  deleteSupplier(supplier: Supplier): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        supplier: supplier
      },
      width: '300px',
      height: '230px'
    });

    dialogRef.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {
          supplier.isLoading = true;
          this.dataService.deleteData(supplier.supplier_ID, "deleteSupplier").subscribe({
            next: (value: any) => {
              this.supplierService.deleteSupplier(supplier);
              this.snackBar.open(`Supplier {{supplier.supplier_name}} Deleted `, "Close", {
                duration: 2000
              });
              supplier.isLoading = false;
            },
            error: (error) => {
              console.log(error);
              supplier.isLoading = false;
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

  public openSupplierDialog() {
    this.dialog.open(AddSupplierDialogComponent)
  }
}

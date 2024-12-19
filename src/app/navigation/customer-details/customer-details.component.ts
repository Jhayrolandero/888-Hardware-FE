import { Component, OnInit } from '@angular/core';
import { Client } from '../../interface/client';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CopyService } from '../../services/copy.service';
import { DataService } from '../../services/data.service';
import { ProductService } from '../../services/store/product.service';
import { VariantService } from '../../services/store/variant.service';
import { ClientService } from '../../services/store/client.service';
import { FormGroup, FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { OfflineService } from '../../services/offline.service';
@Component({
  selector: 'app-customer-details',
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.css'
})
export class CustomerDetailsComponent {
  clients: Client[] = [];
  editingClient: boolean = false;
  currentlyEditing: number = -1;
  searchFilter = '';
  searchParam = '';
  isLoading = true;

  clientForm = new FormGroup({
    client_ID: new FormControl<number>(0),
    client_name: new FormControl<string>(''),
    client_contact: new FormControl<string>(''),
    client_address: new FormControl<string>(''),
    client_note: new FormControl<string>(''),
  });

  constructor(
    private dataService: DataService,
    private clientService: ClientService,
    private snackBar: MatSnackBar,
    private titleService: Title,
    public offlineService: OfflineService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle("Customer Details - 888 Hardware Trading");

    this.clientService.client$.subscribe({
      next: (value: Client[]) => {
        console.log("Client has updated");
        this.clients = value;
        if(this.clients.length > 0){
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
      }
    })
  }

  clearState(){
    this.searchParam = '';
    this.clients = this.clientService.getClientState();
  }

  onChangeSearch(){
    console.log(this.searchParam);
    let client = this.clientService.getClientState();
    switch(this.searchFilter){
      case 'Client Name':
        this.clients = client.filter(supplier => supplier.client_name.toLowerCase().includes(this.searchParam!.toLowerCase()));
        break;

      case 'Contact Information':
        this.clients = client.filter(supplier => supplier.client_contact.toLowerCase().includes(this.searchParam!.toLowerCase()));
        break;

      case 'Client Address':
        this.clients = client.filter(supplier => supplier.client_address.toLowerCase().includes(this.searchParam!.toLowerCase()));
        break;

      case 'Note':
        this.clients = client.filter(supplier => supplier.client_note.toLowerCase().includes(this.searchParam!.toLowerCase()));
        break;

      default:
        client = client.filter(supplier => supplier.client_name.toLowerCase().includes(this.searchParam!.toLowerCase()));
        this.clients = client;
        break;
    }
  }

  editClient(id: number) {  
    console.log("trying");
    this.editingClient = true;
    this.currentlyEditing = id;
    
    const client = this.clientService.getClientByID(id);
    if (client) {
        this.clientForm.patchValue({
          client_ID: id,
          client_name: client.client_name,
          client_contact: client.client_contact,
          client_address: client.client_address,
          client_note: client.client_note,
        });

        console.log("new form values", this.clientForm.value);
    } else {
        console.error("Client not found");
    }
  }

  closeEdit() {
    this.editingClient = false;
    this.currentlyEditing = -1;
    this.clientForm.reset();
  }

  deleteClient(id: number){
    this.clientService.deleteClient(id);
  };

  submitClientEdit(){
    this.editingClient = false;
    this.currentlyEditing = -1;

    this.dataService.patchData(this.clientForm, "editClient").subscribe({
      next: (value: any) => {
        this.clientService.editClient(this.clientForm, this.clientForm.controls['client_ID'].value ?? 0);
        this.snackBar.open("Client Updated", "Close", {
          duration: 2000,
        });
      },
      error: (error) => {
        this.snackBar.open("Error Updating Client", "Close", {
          duration: 2000,
        });
      }
    });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../../interface/product';
import { DataService } from '../data.service';
import { BackgroundSyncService } from './background-sync.service';
import { mainPort } from '../../app.component';
import { Client } from '../../interface/client';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../loading.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private client = new BehaviorSubject<Client[]>([]);
  client$ = this.client.asObservable();
  loaderState: string = "client"

  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private loaderService: LoadingService

  ) {
    this.loaderService.initLoading(this.loaderState)
    this.initClient();
  }

  initClient(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getClient').subscribe({
      next: (value: any) => {
        console.log("Loading Client...", value);
        this.setClientState(value.data);
        this.loaderService.stopLoading(this.loaderState)
      },
      error: (error) => {
        console.log(error);
        this.loaderService.stopLoading(this.loaderState)
      }
    })
  }

  editClient(clientForm: any, id: number) {
    let formValues = clientForm;
    let oldState = this.client.getValue();
    let newState = oldState.map((client) => {
      if (client.client_ID === id) {
        console.log("i found the variant you want to quickly edit")
        return {
          client_ID: id,
          client_name: formValues.get('client_name').value,
          client_contact: formValues.get('client_contact').value,
          client_address: formValues.get('client_address').value,
          client_note: formValues.get('client_note').value
        };
      }
      console.log("i did not find the variant you want to quickly edit")
      return client;
    });
    console.log("New state", newState);
    this.setClientState(newState);
  }

  deleteClient(id: number){
    let oldState = this.client.getValue();
    let newState = oldState.filter((client) => client.client_ID !== id);

    this.setClientState(newState);

    //to do: pag nag error, balik m ona lang yung previous state
    this.dataService.deleteData(id, 'deleteClient').subscribe({
      next: (value: any) => {
        this.snackBar.open("Client Deleted", "Close", {
          duration: 2000,
        });
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  addClient(client: any) {
    let oldState = this.getClientState()
    let newState = [...oldState, client]
    this.setClientState(newState)
  }

  getClientState() {
    return this.client.getValue();
  }

  setClientState(data: Client[]){
    console.log("Setting client state...", data);
    this.client.next(data);
  }

  getClientByID(id: number){
    return this.client.getValue().find((c) => c.client_ID === id);
  }
}

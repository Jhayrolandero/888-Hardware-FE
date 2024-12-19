import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { mainPort } from '../../app.component';
import { Log } from '../../interface/log';
import { LoadingService } from '../loading.service';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private logs = new BehaviorSubject<Log[]>([]);
  logs$ = this.logs.asObservable();

  logState = 'activityLog'
  currPage = 1
  stopPagination = false;
  currlog = (page : number) => mainPort + `/888-Hardware-Trading/API-hardware-trading/main/getLogs?page=${page}`

  constructor(
    private http: HttpClient,
    private loaderService: LoadingService

  ) {
    this.initLogs();
  }

  initLogs(){
    this.loaderService.initLoading(this.logState)
    return this.http.get(this.currlog(this.currPage)).subscribe({
      next: (value: any) => {
        console.log("Loading Logs...", value);
        this.setLogsState(value.data);
        this.loaderService.stopLoading(this.logState)
      },
      error: (error) => {
        console.log(error);
        this.loaderService.stopLoading(this.logState)
      }
    })
  }

  // editClient(clientForm: any, id: number) {
  //   let formValues = clientForm;
  //   let oldState = this.client.getValue();
  //   let newState = oldState.map((client) => {
  //     if (client.client_ID === id) {
  //       console.log("i found the variant you want to quickly edit")
  //       return {
  //         client_ID: id,
  //         client_name: formValues.get('client_name').value,
  //         client_contact: formValues.get('client_contact').value,
  //         client_address: formValues.get('client_address').value,
  //         client_note: formValues.get('client_note').value
  //       };
  //     }
  //     console.log("i did not find the variant you want to quickly edit")
  //     return client;
  //   });
  //   console.log("New state", newState);
  //   this.setClientState(newState);
  // }


  // addClient(client: any) {
  //   let oldState = this.getClientState()
  //   let newState = [...oldState, client]
  //   this.setClientState(newState)
  // }

  callPagination() {
    // console.log(this.stopPagination)
    if(this.stopPagination) return

    return this.http.get(this.currlog(++this.currPage)).subscribe({
      next: (value: any) => {
        // console.log(`Loading Logs... ${this.currlog(this.currPage)}`, value.data);

        // console.log(value.last)
        if(!value.last) {
          this.setLogsState(value.data);
        } else {
          this.stopPagination = true
        }
      },
      error: (error) => {
        console.log(error);
      }
    })

  }

  setLogsState(data: Log[]){
    console.log("Setting client state...", data);
    this.logs.next(this.logs.value.concat(data));
  }

}

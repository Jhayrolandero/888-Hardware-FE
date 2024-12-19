import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { mainPort } from '../app.component';
import { Product } from '../interface/product';

//Testing return type
type ProductData = {
  code: number,
  data: Product[]
}

@Injectable({
  providedIn: 'root'
})

export class DataService {
  //Also, i read na 
  constructor(private http: HttpClient) {}

  //Reusable data requests
  login(data: any, endpoint: string) {
    return this.http.post(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/' + endpoint, data.getRawValue());
  }

  postData(data: any, endpoint: string){
    return this.http.post(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/' + endpoint, data.getRawValue());
  }

  //Non-form posts
  postObjectData(data: any, endpoint: string){
    return this.http.post(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/' + endpoint, data);
  }

  downloadData(data: any, endpoint: string){
    return this.http.post(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/' + endpoint, data.getRawValue(), {responseType: 'blob' });
  }

  downloadObjectData(endpoint: string){
    return this.http.post(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/' + endpoint, {}, {responseType: 'blob' });
  }

  deleteData(id: number, endpoint: string) {
    return this.http.delete(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/' + endpoint + '/' + id);
  }

  patchData(data: any, endpoint: string){
    return this.http.patch(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/' + endpoint, data.getRawValue());
  }

  patchObjectData(data: any, endpoint: string){
    return this.http.patch(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/' + endpoint, data);
  }
}

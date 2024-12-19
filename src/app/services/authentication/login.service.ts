import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})

// handles all login related operations 

export class LoginService {

  //observeables that signal the login status of the user. If the user is an admin, the adminLoadValues$ observable will emit the user ID. 
  // If the user is not an admin, the loadValues$ observable will emit the user ID.

  // the login service is responsible for immediately triggering the get functions when a user is logged in, as services 
  // are constructed or initialized in different timings, even when the user is still logged out. 

  // for instance, the inventory-store is responsible for all inventory related operations. inventory store service will trigger the get, but it will
  // do so even without the user being logged in, because it is a component that initializes/constructs regardless of the user's login status.

  // and if it does trigger the get functions, it will not have the user ID to fetch the inventory data. Hence, the login service that
  // it can decode and extract the userID in the token, and then emit it to the inventory-store service, so that it can fetch the inventory data.

  private _loadValues = new BehaviorSubject<number | null>(null);
  loadValues$ = this._loadValues.asObservable();

  private _adminLoadValues = new BehaviorSubject<number | null>(null);
  adminLoadValues$ = this._adminLoadValues.asObservable();

  constructor(private tokenService: TokenService) { 
    const token = this.tokenService.getToken();
    if (token) {
      this.LoggedIn();
    }
  }

  public LoggedIn(): void {
    const userID = this.tokenService.userIDToken(this.tokenService.decodeToken());
    const userRole = this.tokenService.userRoleToken(this.tokenService.decodeToken());

    if(userRole === 'admin') {
      this._adminLoadValues.next(userID);
    } else {
      this._loadValues.next(userID);

    }

  }
  
  public userLoggedOut(): void {
    this._loadValues.next(null);
    this._adminLoadValues.next(null);
  }

}
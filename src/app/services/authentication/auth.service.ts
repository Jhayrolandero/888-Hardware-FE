import { Injectable } from '@angular/core';
import { TokenService } from './token.service';

@Injectable({
    providedIn: 'root'
})

// handles all authentication related operations and communicates with the token service

export class AuthService {
    
  [x: string]: any;
  constructor(private tokenService: TokenService) { }

  setToken(token: string): void {
    this.tokenService.setToken(token);
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getToken();
  }

  getRole(): string {
    console.log("from auth service this is the role of the user: ", this.tokenService.userRoleToken(this.tokenService.decodeToken()));
    return this.tokenService.userRoleToken(this.tokenService.decodeToken());
  }

}
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../authentication/auth.service';
import { jwtDecode } from "jwt-decode";
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../authentication/token.service';
// import "core-js/stable/atob"; // <- polyfill here

export const authGuard: CanActivateFn = (route, state) => {

  //Decode current token held
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = inject(TokenService)

  if(token.getToken() === null) {
    return false;
  }

  const decoded = token.decodeToken();
  const priv = token.userRoleToken(decoded);
  console.log(priv);

  const urlRoot = state.url.split("/")[1];
  // Logging on to Admin page

  return true;

};

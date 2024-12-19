import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthService } from '../services/authentication/auth.service';
import { LoginService } from '../services/authentication/login.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})


export class LoginComponent implements OnInit, OnDestroy{
  hide = true;
  password: any;
  router: any;
  errorMessage: string = '';
  isLoading = false;
  form: FormGroup;
  private subscriptions = new Subscription();
  constructor(
    private authService: AuthService, 
    private loginService: LoginService, 
    private titleService: Title, 
    private formBuilder: FormBuilder, private routers: Router, private dataService: DataService) {
    this.form = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
    // to dynamically remove the error messag ewhen the user types in something new
    this.titleService.setTitle('Login - 888 HARDWARE TRADING');
    const usernameSubscription = this.form.get('username')!.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });
    const passwordSubscription = this.form.get('password')!.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });
    this.subscriptions.add(usernameSubscription);
    this.subscriptions.add(passwordSubscription);
  }

  toggleVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hide = !this.hide;
  }

  setTokenInCookie(token: string) {
    let expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + (60 * 60 * 1000));
    document.cookie = `token=${token}; ${expireDate}; path=/`
  }

  navigateBasedOnRole() {
    console.log("Loggin in!")
    let role = this.authService.getRole();
    if (role === 'admin'){
      this.routers.navigate(['/dashboard']);
    } else {
      this.routers.navigate(['/order-landing']);
    }
  }

  onLogin() {
    this.isLoading = true;
    this.dataService.login(this.form, 'login').subscribe({
      next: (res: any) => {
        if(res.code !== 403){
          this.isLoading = false;
          console.log('Login successful:', res);
          this.setTokenInCookie(res.token);
          this.navigateBasedOnRole();  
          this.loginService.LoggedIn();
          //this.openDialog("Email or password is incorrect. Please try again.");
          this.isLoading = false;
        }
        else {

          console.log('Login not successful ', res);
          this.errorMessage = "Username or password is incorrect. Please try again.";
          this.isLoading = false;
        }

      },
      error: (err) => {
        console.log(err);
        console.log('Login unsucessful:', err.message);
        this.errorMessage = "Error Logging in. Please try again.";
        this.isLoading = false;
      }
    });
    
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}


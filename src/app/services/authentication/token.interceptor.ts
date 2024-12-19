import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpResponse} from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { DataService } from '../data.service';

@Injectable()

export class TokenInterceptor implements HttpInterceptor {

  constructor(
    private tokenService: TokenService, 
    private router: Router,
    private dataService : DataService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if(req.url.includes('/login')) {
      const {headers} = req;
      //if logging in, proceed to not adding the token
      return next.handle(req);
    }
    
    //for all other requests, add an authorization header
    const token = this.tokenService.getToken();
    //create a clone request
    const newCloneRequest = req.clone( {
      setHeaders:{
        Authorization: `Bearer ${token}`
      }
    })
    
    return next.handle(newCloneRequest).pipe(
      //Runs after the request is completed
      tap((event: HttpEvent<any>) => {
        let apiCall = req.url.split('/')[req.url.split('/').length - 1];
        //If the request is anything but a get request, log the action
        let isNotLogger = apiCall !== 'logAction';
        let isNotExport = apiCall !== 'exportSupplierTransaction' && apiCall !== 'exportYearlySales';
        
        if(event instanceof HttpResponse && req.method !== 'GET' && isNotLogger && isNotExport) {
          console.log("HERE!", event.body.relevant_action);
          this.dataService.postObjectData({
            //Gets the API call endpoint of the url request.
            log_action: req.url,
            log_description: event.body.relevant_action,
            log_type: req.method
          }, 'logAction').subscribe({
            next: (value: any) => {
              console.log("Logging action...", value);
            },
            error: (error) => {
              console.log(error);
            }
          })
        }
      }),

      catchError((error: HttpErrorResponse) => {
        if(error.status === 403) {
          // this.tokenService.flushToken();
          // this.router.navigate(['/login']);

        }
      
        return throwError(error);
     })
    );
  }

}
import { Component } from '@angular/core';
import { TokenService } from '../../services/authentication/token.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-logout-dialog',
  templateUrl: './logout-dialog.component.html',
  styleUrl: './logout-dialog.component.css'
})
export class LogoutDialogComponent {
  constructor(
    private tokenService: TokenService,
    private router: Router,
    private dialogRef: MatDialogRef<LogoutDialogComponent>
  ) { }

  logout(){
    this.tokenService.flushToken();
    this.dialogRef.close();
    this.router.navigate(['/login']);
  }

  cancel(){
    this.dialogRef.close();
  }
}

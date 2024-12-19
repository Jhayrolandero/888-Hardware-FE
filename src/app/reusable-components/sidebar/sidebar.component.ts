import { Component, ViewChild, Output, EventEmitter } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../../services/authentication/token.service';
import { MatDialog } from '@angular/material/dialog';
import { LogoutDialogComponent } from '../logout-dialog/logout-dialog.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @ViewChild('drawer') drawer!: MatDrawer;
  currentUrl = '';
  @Output() closePanel = new EventEmitter();
  expandedPanel: string | null = null;
  routesList = ['dashboard', 'manage-warehouse', 'manage-employees', 'manage-orders', 'manage-customers', 'manage-reports', 'manage-settings'];
  priv: string = '';
  isExpanded = false; // Add this variable

  constructor(
    private tokenService: TokenService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ){
    const decoded = tokenService.decodeToken();
    this.priv = tokenService.userRoleToken(decoded);
    this.currentUrl = this.router.url.split('/')[2];
    console.log(this.currentUrl)
  }

  togglePanel(panelId: string) {
    if (this.expandedPanel === panelId) {
      this.isExpanded = false;
      this.expandedPanel = null;
    } else {
      this.isExpanded = true;
      this.expandedPanel = panelId;
    }
  }
  

  goTo(url: string){
    this.router.navigate(['/' + url]);
    this.currentUrl = url;
    this.closePanel.emit();
    this.isExpanded = false;
    this.expandedPanel = null; 
  }

  onLogout(){
    this.dialog.open(LogoutDialogComponent);
  }
}
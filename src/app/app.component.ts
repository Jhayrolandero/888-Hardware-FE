import { Component } from '@angular/core';
import { TokenService } from './services/authentication/token.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'hardware-trading';  
}

// Global variables
export const mainPort = "https://green-anteater-976545.hostingersite.com";
//export const mainPort = "http://localhost";
export const categories = ["Household", "Electronics", "Furniture", "Hardware", "Plumbing", "Clothing", "Footwear", "Appliance"];

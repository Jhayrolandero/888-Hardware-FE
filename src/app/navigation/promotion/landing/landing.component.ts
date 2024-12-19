import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { mainPort } from '../../../app.component';
import { DataService } from '../../../services/data.service';
import { OnInit } from '@angular/core';
import { PromoService } from '../../../services/promo.service';
import { Title } from '@angular/platform-browser';
import { Promo } from '../../../interface/product';
import { Product } from '../../../interface/product';


import { MatDialog } from '@angular/material/dialog';
import { PromoPreviewComponent } from '../../manage-warehouse/promo-preview/promo-preview.component';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit {
  promo: Promo[] | null = null;
  filteredPromo: Promo[] | null = null;
  
  currentUrl = '';
  isLoading = false;
  port = mainPort;
  searchFilter = 'Promotion Name';
  searchKey = '';
  toFilter!: Date | null;
  fromFilter!: Date | null;
  switchInfo = false;
  promoInfo!: Promo;

  errorMessage = '';
  statusFilter = 'All';
  typeFilter: string = 'all'

  isDropdown = false;
  constructor(    
    private router: Router,
    private promoService: PromoService,
    private titleService: Title,
    private loaderService: LoadingService
  ) {
    this.currentUrl = this.router.url.split('/')[2];

  }

  ngOnInit(): void {
    this.titleService.setTitle('Promotions');
    this.promoService.promotion$.subscribe({
      next: (value: any) => {
        this.promo = value;
        this.filteredPromo = value;
        // this.isLoading = false;
      },
      error: (error: any) => {
        console.log("Something went wrong with fetching promotions: ", error);
      },
      complete: () => {
        console.log('complete');
      }
    });

    this.loaderService.isLoading$(this.promoService.loaderState).subscribe(res => this.isLoading = res)
  }

  getUniqueProducts(promo: Promo): Product[] {
    const unique = new Map<number, Product>();
    promo.products.forEach(product => {
      unique.set(product.product_ID, product);
    });

    return Array.from(unique.values());
  }
  goTo(url: string){
    this.router.navigate(['/promotions/' + url]);
    this.currentUrl = url;
  }

  reset(){
    this.filteredPromo = this.promo
    this.searchFilter = '';
    this.searchKey = '';
    this.fromFilter = null;
    this.toFilter = null;
    this.errorMessage = '';
  }


  // Filter factory
  filter(filterType?:string, filter?: string) {
    switch(filterType) {
      case 'type':
        this.typeFilter = filter! 
        break;
      case 'status':
        this.statusFilter = filter!
        break;
    }

    this.errorMessage = ''
    this.filterSearch()

    if(this.errorMessage) return
    this.filterDate()

    this.filterType()

    this.filterStatus()
  }

  filterSearch() {
    if(this.searchFilter === '' && this.searchKey !== ''){
      this.errorMessage = "Please select a filter";
      return
    }

    if(this.searchKey === '' && (this.fromFilter === null && this.toFilter === null)){
      this.errorMessage = "Please enter a search key or select a date range";
      return;
      
    }

    if(this.searchFilter == 'Product Name'){
      this.filteredPromo = this.promo!.filter((x) => {
        //check if product name exists in the product list
        return x.products.some((y) => {
          return y.product_name.toLowerCase().includes(this.searchKey.toLowerCase());
        });
      })
    }
    else if (this.searchFilter == 'Promotion Name'){
      this.filteredPromo = this.promo!.filter((x) => {
        return x.promotion_name.toLowerCase().includes(this.searchKey.toLowerCase());
      })
    }


  }

  filterDate() {
    if(this.fromFilter || this.toFilter){

      this.filteredPromo = this.promo!.filter((x) => {
        if(this.fromFilter && this.toFilter){
          console.log("Filter date range");
          return new Date(x.promotion_from) >= new Date(this.fromFilter) && new Date(x.promotion_to) <= new Date(this.toFilter);
        }
        else if(this.fromFilter){
          console.log("Filter from date", new Date(x.promotion_from) >= new Date(this.fromFilter));
          return new Date(x.promotion_from) >= new Date(this.fromFilter);
        }
        else if (this.toFilter){ 
          console.log("Filter to date");
          return new Date(x.promotion_to) <= new Date(this.toFilter);
        } else {
          return true;
        }
        });
      }
  }

  filterType() {
    if(this.promo && this.typeFilter === 'all') {
      this.filteredPromo = this.filteredPromo
    } else if(this.promo) {
      this.filteredPromo = this.filteredPromo!.filter(x => x.promotion_type.trim().toLowerCase() === this.typeFilter.trim().toLowerCase());
    }    
  }

  filterStatus() {
    if(this.promo && this.statusFilter === 'All') {
      this.filteredPromo = this.filteredPromo
    } else if(this.promo) {
      this.filteredPromo = this.filteredPromo!.filter(x => x.status.trim().toLowerCase() === this.statusFilter.trim().toLowerCase());
    }
  }
  // filterPromo(){
  //   if(this.searchFilter === '' && this.searchKey !== ''){
  //     this.errorMessage = "Please select a filter";
  //     return
  //   }

  //   if(this.searchKey === '' && (this.fromFilter === null && this.toFilter === null)){
  //     this.errorMessage = "Please enter a search key or select a date range";
  //     return;
  //   }


  //   if(this.searchFilter == 'Product Name'){
  //     this.filteredPromo = this.filteredPromo!.filter((x) => {
  //       //check if product name exists in the product list
  //       return x.products.some((y) => {
  //         return y.product_name.toLowerCase().includes(this.searchKey.toLowerCase());
  //       });
  //     })
  //   }
  //   else if (this.searchFilter == 'Promotion Name'){
  //     this.filteredPromo = this.filteredPromo!.filter((x) => {
  //       return x.promotion_name.toLowerCase().includes(this.searchKey.toLowerCase());
  //     })
  //   }


  //   // if(this.fromFilter === null && this.toFilter === null) {
  //   //   this.errorMessage = "Please enter a date range";
  //   //   return;
  //   // }

  //   this.errorMessage = '';
  //   this.filteredPromo = this.promo;

  //   if(this.fromFilter || this.toFilter){
  //     this.filteredPromo = this.promo!.filter((x) => {
  //       if(this.fromFilter && this.toFilter){
  //         console.log("Filter date range");
  //         return new Date(x.promotion_from) >= new Date(this.fromFilter) && new Date(x.promotion_to) <= new Date(this.toFilter);
  //       }
  //       else if(this.fromFilter){
  //         console.log("Filter from date", new Date(x.promotion_from) >= new Date(this.fromFilter));
  //         return new Date(x.promotion_from) >= new Date(this.fromFilter);
  //       }
  //       else if (this.toFilter){ 
  //         console.log("Filter to date");
  //         return new Date(x.promotion_to) <= new Date(this.toFilter);
  //       } else {
  //         return true;
  //       }
  //     });
  //   }
  //   // console.log("Filtered Promo Before Search: ", this.filteredPromo);
  //   if(this.searchFilter == 'Product Name'){
  //     this.filteredPromo = this.filteredPromo!.filter((x) => {
  //       //check if product name exists in the product list
  //       return x.products.some((y) => {
  //         return y.product_name.toLowerCase().includes(this.searchKey.toLowerCase());
  //       });
  //     })
  //   }
  //   else if (this.searchFilter == 'Promotion Name'){
  //     this.filteredPromo = this.filteredPromo!.filter((x) => {
  //       return x.promotion_name.toLowerCase().includes(this.searchKey.toLowerCase());
  //     })
  //   }

  //   // console.log("Filtered Promo Final: ", this.filteredPromo, this.isLoading, this.promo!.length);
  // }

  // filterStatus(){
  //   if(this.statusFilter == 'Active'){
  //     this.filteredPromo = this.promo.filter((x) => {
  //       return this.checkStatus(x) == 'Active';
  //     });
  //   }
  //   else if(this.statusFilter == 'Expired'){
  //     this.filteredPromo = this.promo.filter((x) => {
  //       return this.checkStatus(x) == 'Expired';
  //     });
  //   }
  //   else if(this.statusFilter == 'Upcoming'){
  //     this.filteredPromo = this.promo.filter((x) => {
  //       return this.checkStatus(x) == 'Upcoming';
  //     });
  //   }
  //   else {
  //     this.filteredPromo = this.promo;
  //   }
  // }

  checkStatus(promo: Promo){
    //return Expired if date today is greated that the promo.promotion_to
    if(new Date(promo.promotion_to) < new Date()){
      return 'Expired';
    } else if(new Date(promo.promotion_from) > new Date()){
      return 'Upcoming';
    } 
    else{
      return 'Active';
    }
    
  }

  openInfo(promo: Promo){
    this.promoInfo = promo;
    this.switchInfo = true;
  }

  closeInfo(){
    this.switchInfo = false;
    this.promoInfo = {} as Promo;
  }

}

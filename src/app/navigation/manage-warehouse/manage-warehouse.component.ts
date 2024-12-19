import { Component, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Product } from '../../interface/product';
import { categories, mainPort } from '../../app.component';
import { Variant, VariantGroup } from '../../interface/variant';
import { ProductService } from '../../services/store/product.service';
import { VariantService } from '../../services/store/variant.service';
import { CopyService } from '../../services/copy.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BackgroundSyncService } from '../../services/store/background-sync.service';
import { MatDialog } from '@angular/material/dialog';
import { AddStockDialogComponent } from './add-stock-dialog/add-stock-dialog.component';
import { Title } from '@angular/platform-browser';
import { SupplierService } from '../../services/store/supplier.service';
import { DeleteDialogComponent } from '../../reusable-components/delete-dialog/delete-dialog.component';
import { DateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SupplierProductPopup } from '../../interface/supplier-product-popup';
import { MatSidenav } from '@angular/material/sidenav';


@Component({
  selector: 'app-manage-warehouse',
  templateUrl: './manage-warehouse.component.html',
  styleUrl: './manage-warehouse.component.css'
})

export class ManageWarehouseComponent implements OnInit{
  port = mainPort;
  categoriesMain = categories
  addSwitch = false;
  massSwitch = false;
  products: Product[] = [];
  variants: Variant[] = [];
  isDropdownFilter = false;
  isLoading = false;
  selectedProductID = 0
  editVariantItem: boolean = false
  currentlyEditing: number = 0;
  searchParam: string = '';
  searchFilter: string = '';
  showPanel = false
  variantBrandGroup = new Map<string, Map<string, any[]>>();

  options = this._formBuilder.group({
    bottom: 0,
    fixed: false,
    top: 0,
  });

  variantForm = new FormGroup({
    variant_ID: new FormControl<number>(0),
    variant_name: new FormControl<string>(''),
    variant_stock_price: new FormControl<number>(0),
    variant_unit_price: new FormControl<number>(0),
  });


  isDeleting = false;
  deleteProductID = 0;
  currentUrl: string = '';

  currentlyDropped: number = 0;
  
  constructor(
    private router: Router,
    private dataService: DataService,
    private productService: ProductService,
    private variantService: VariantService,
    private supplierService: SupplierService,
    private _formBuilder: FormBuilder,
    private copyService: CopyService,
    private snackBar: MatSnackBar,
    private backgroundSync: BackgroundSyncService,
    private dialog: MatDialog,
    private titleService: Title,
    private elementRef: ElementRef
  ) {
    console.log('Initially ' + (window.navigator.onLine ? 'on' : 'off') + 'line');
    
  }



  supplierProductPopup: SupplierProductPopup[] = [];
  name: string = '';
  searchParamPanel = '';
  selectedFilter = '';
  isLoadingPanel = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<any>(this.supplierProductPopup);

  ngAfterViewInit() {
    console.log("Supplier Product: ", this.supplierProductPopup);
    this.dataSource.paginator = this.paginator;
  }

  parseDiscountDisplay(discount: any){
    return discount.replace(/\d+/g, (match: any) => `${match}%`);
  }



  onChangeSearchPanel() {
    console.log(this.searchParam);  
    let temp = this.supplierService.getSupplierProductPopupState()[0];

    switch(this.selectedFilter){
      case 'DR No.':
        this.supplierProductPopup = temp.filter((product: { dr_number: string; }) => {
          console.log(product.dr_number);
          return product.dr_number.toLowerCase().includes(this.searchParam.toLowerCase())
        });
        break;


      case '':
      case 'Supplier Name':
        this.supplierProductPopup = temp.filter((product: any) => {
          console.log(product.supplier_name);
          return product.supplier_name.toLowerCase().includes(this.searchParam.toLowerCase())
        });
        break;

    }


    console.log(this.supplierProductPopup);
    this.dataSource = new MatTableDataSource<any>(this.supplierProductPopup);
    this.dataSource.paginator = this.paginator;
  }



  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
  }











  toggleDropdown(prod: Product) {
    if (prod.product_ID === this.currentlyDropped) {
      prod.isDropdown = false;
      this.currentlyDropped = 0;
    } else {
      prod.isDropdown = true;
      this.currentlyDropped = prod.product_ID;
    }
  }

  printDropped(prodID: number){
    console.log("Product ID ", prodID);
    console.log("Product ID of currently Dropped", this.currentlyDropped);
  }

  searchForm = new FormGroup({
    product_name: new FormControl<string>(''), 
    brand: new FormControl<string>(''),
    category: new FormControl<string>(''),
    stockOperation: new FormControl<string>(''),
    stock: new FormControl<number>(0),
    stockPriceOperation: new FormControl<string>(''),
    stockPrice: new FormControl<number>(0),
    priceOperation: new FormControl<string>(''),
    price: new FormControl<number>(0),
  });

  onChangeSearch(){
    let product = this.productService.getProductstate();

    //Name Filter
    product = product.filter((product) => {
      switch(this.searchFilter){
        case 'Product Name':
          return product.product_name.toLowerCase().includes(this.searchParam!.toLowerCase());
        case 'Product Code':
          return product.product_code.toLowerCase().includes(this.searchParam!.toLowerCase());
        case 'Brand':
          return product.brand.toLowerCase().includes(this.searchParam!.toLowerCase());
      }
      return product.product_name.toLowerCase().includes(this.searchParam!.toLowerCase());
    });
    this.products = product;
  }

  groupVariantsByBrand(product_ID: number){
    if(this.variantBrandGroup.has(product_ID.toString())){
      return;
    }


    let tempVariants = this.variants.filter((variant) => {
      return variant.product_ID === product_ID;
    });

    let variantTypeGroup = new Map<string, Variant[]>([]);
    let variantBrandGroup = new Map<string, any[]>();

    tempVariants.forEach(variant => {
      if(variantTypeGroup.has(variant.variant_type)){
        let temp = variantTypeGroup.get(variant.variant_type);
        temp?.push(variant);
        variantTypeGroup.set(variant.variant_type, temp!);
      } else {
        variantTypeGroup.set(variant.variant_type, [variant]);
      }
    })

    variantTypeGroup.forEach((value, key) => {
      let brandName = value[0].variant_group_name
      if(variantBrandGroup.has(brandName)){
        let temp = variantBrandGroup.get(brandName);
        temp?.push(value);
        variantBrandGroup.set(brandName, temp!);
      }
      else{
        variantBrandGroup.set(brandName, [value]);
      }
    })
    console.log(variantBrandGroup);

    this.variantBrandGroup.set(product_ID.toString(), variantBrandGroup);
  }

  goTo(url: string){
    this.router.navigate(['/manage-warehouse/' + url]);
    this.currentUrl = url;
  }


  doFilter(){
    console.log(this.searchParam);
    console.log(this.searchForm.value);

    let product = this.products;
    let productName = this.searchForm.get('product_name')?.value;
    let brand = this.searchForm.get('brand')?.value;
    let category = this.searchForm.get('category')?.value;
    let stockOperation = this.searchForm.get('stockOperation')?.value;
    let stock = this.searchForm.get('stock')?.value;
    let stockPriceOperation = this.searchForm.get('stockPriceOperation')?.value;
    let stockPrice = this.searchForm.get('stockPrice')?.value;
    let priceOperation = this.searchForm.get('priceOperation')?.value;
    let price = this.searchForm.get('price')?.value;

    //Name Filter
    if(productName !== ''){
      product = product.filter((product) => {
        return product.product_name.toLowerCase().includes(productName!.toLowerCase());
      });
      this.products = product;
    }

    if(brand !== ''){
      product = product.filter((product) => {
        return product.brand.toLowerCase().includes(brand!.toLowerCase());
      });
      this.products = product;
    }

    //Category Filter
    if(category !==   ''){
      product = product.filter((product) => {
        return product.category_name.toLowerCase().includes(category!.toLowerCase());
      });
      this.products = product;
    }

    //Stock Filter
    if(stockOperation !== ''){
      product = product.filter((product) => {
        if(stockOperation === '>'){
          return product.product_stock > stock!;
        } else if(stockOperation === '<'){
          return product.product_stock < stock!;
        } else {
          return product.product_stock === stock;
        }
      });
      this.products = product;
    }

    //Stock Price Filter
    if(stockPriceOperation !== ''){
      product = product.filter((product) => {
        if(stockPriceOperation === '>'){
          return product.default_stock_price > stockPrice!;
        } else if(stockPriceOperation === '<'){
          return product.default_stock_price < stockPrice!;
        } else {
          return product.default_stock_price === stockPrice;
        }
      });
      this.products = product;
    }

    //Price Filter
    if(priceOperation !== ''){
      product = product.filter((product) => {
        if(priceOperation === '>'){
          return product.unit_price > price!;
        } else if(priceOperation === '<'){
          return product.unit_price < price!;
        } else {
          return product.unit_price === price;
        }
      });
      this.products = product;
    }
  }

  openProductPreview(prod: Product) {
    // let variantPreview: Variant[] = [];
    // if(prod.has_variant) {
    //   console.log("Has variant");
    //   variantPreview = this.variantService.findVariants(prod.product_ID);

    // }
    // this.dialog.open(ProducPreviewComponent, {
    //   width: '650px',
    //   height: '350px',
    //   data: {
    //     product: prod,
    //     variant: variantPreview

    //   }
    // });
  }

  openAddStock(prod: any){
    this.dialog.open(AddStockDialogComponent, {
      width: '650px',
      data: {
        product: prod
      }
    });
  }


  //Updates form category everytime something is selected
  updateCategory(event: Event){
    let category = (<HTMLInputElement>event.target).value;
  }

  editProduct(id: number){
    // this.selectedProductID = id;
    // this.addSwitch = true;
    this.router.navigate(['/manage-warehouse/edit-product', id.toString()]);
  }

  editVariant(id: number, product_ID: number) {  
    console.log("trying");
    this.editVariantItem = true;
    this.currentlyEditing = id;
    
    const variant = this.variantService.getVariant(product_ID, id);
    if (variant) {
        this.variantForm.patchValue({
            variant_ID: id,
            variant_name: variant.variant_name,
            variant_stock_price: variant.variant_stock_price,
            variant_unit_price: variant.variant_unit_price,
        });

        console.log("new form values", this.variantForm.value);
    } else {
        console.error("Variant not found");
    }
  }

  editVariantSubmit(id: number){
    //submit heree
    this.editVariantItem = false;
    this.currentlyEditing = 0;

    this.variantService.quickEditVariant(this.variantForm, id);

    this.dataService.patchData(this.variantForm, "editVariant").subscribe({
      next: (value: any) => {
        console.log(value);
        // this.productService.editProduct(value.product);
        //this.variantService.editVariant(value.variants);
      },
      error: (error) => {
        // console.log("Error catches please just show oh my god im gonna lose it: ", error);
        this.backgroundSync.addNewRequest([this.variantForm.getRawValue(), 'editVariant'], "PATCH");
        this.backgroundSync.trafficHandler();
        // console.log(error);
        // this.goBack();
      },
      complete: () => {
        // this.goBack();
      }
    });

  }

  cancelEditVariant(){
    this.editVariantItem = false;
    this.currentlyEditing = 0;
  }


  deleteProduct(product: Product){  

    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        product: product
      },
      width: '300px',
      height: '220px'
    });

    dialogRef.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {
          this.deleteProductID = product.product_ID;
          this.isDeleting = true;
          // this.dataService.deleteData(product.product_ID, 'deleteProduct').subscribe({
          this.dataService.deleteData(product.product_ID, 'archiveProduct').subscribe({
            next: (value: any) => {
              this.productService.deleteProduct(product.product_ID);
              this.productService.addProductArchive(value.data)

              this.snackBar.open('Product successfully archived!', 'Close', {
                duration: 2000,
              });
              this.isDeleting = false;
              this.deleteProductID = 0;
            },
            error: (error) => {
              this.backgroundSync.addNewRequest([product.product_ID, 'archiveProduct'], "DELETE");
              this.backgroundSync.trafficHandler();
              console.log(error);
              this.isDeleting = false;
              this.deleteProductID = 0;
            },
          });
        }
      },
      error: (error: any) => {
        console.log(error);
        this.isDeleting = false;
        this.deleteProductID = 0;
      }
    });

  }
  // deleteProduct(product: Product){  

  //   const dialogRef = this.dialog.open(DeleteDialogComponent, {
  //     data: {
  //       product: product
  //     },
  //     width: '300px',
  //     height: '220px'
  //   });

  //   dialogRef.afterClosed().subscribe({
  //     next: (result: boolean) => {
  //       if (result) {
  //         this.deleteProductID = product.product_ID;
  //         this.isDeleting = true;
  //         this.dataService.deleteData(product.product_ID, 'deleteProduct').subscribe({
  //           next: (value: any) => {
  //             this.productService.deleteProduct(product.product_ID);
  //             this.snackBar.open('Product successfully deleted!', 'Close', {
  //               duration: 2000,
  //             });
  //             this.isDeleting = false;
  //             this.deleteProductID = 0;
  //           },
  //           error: (error) => {
  //             this.backgroundSync.addNewRequest([product.product_ID, 'deleteProduct'], "DELETE");
  //             this.backgroundSync.trafficHandler();
  //             console.log(error);
  //             this.isDeleting = false;
  //             this.deleteProductID = 0;
  //           },
  //         });
  //       }
  //     },
  //     error: (error: any) => {
  //       console.log(error);
  //       this.isDeleting = false;
  //       this.deleteProductID = 0;
  //     }
  //   });

  // }

  getProductVariantSum(id: number): number {

    // NOTE: add a clause na if maay variant_stock yung main product in the future. 

    let count = 0;
    this.variants.forEach((variant) => {
      if (variant.product_ID === id) {
        count += variant.variant_stock;
      }
    });
    return count;
  }

  deleteVariant(variant: Variant){
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        variant: variant
      },
      width: '300px',
      height: '220px'
    });

    dialogRef.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {
          this.dataService.deleteData(variant.variant_ID, 'archiveVariant').subscribe({
            next: (value: any) => {
              this.variantService.deleteVariant(variant);
              this.productService.addProductArchive(value.data)
              this.snackBar.open('Variant successfully archived!', 'Close', {
                duration: 2000,
              });
            },
            error: (error) => {
              this.backgroundSync.addNewRequest([variant.product_ID, 'archiveVariant'], "DELETE");
              this.backgroundSync.trafficHandler();
              console.log(error);
            },
          });
        }
      },
      error: (error: any) => {
        console.log(error);
      }
    });

    

  }
  // deleteVariant(variant: Variant){

  //   const dialogRef = this.dialog.open(DeleteDialogComponent, {
  //     data: {
  //       variant: variant
  //     },
  //     width: '300px',
  //     height: '220px'
  //   });

  //   dialogRef.afterClosed().subscribe({
  //     next: (result: boolean) => {
  //       if (result) {
  //         this.dataService.deleteData(variant.variant_ID, 'deleteVariant').subscribe({
  //           next: (value: any) => {
  //             this.variantService.deleteVariant(variant);
  //             this.snackBar.open('Variant duccessfully deleted!', 'Close', {
  //               duration: 2000,
  //             });
  //           },
  //           error: (error) => {
  //             this.backgroundSync.addNewRequest([variant.product_ID, 'deleteVariant'], "DELETE");
  //             this.backgroundSync.trafficHandler();
  //             console.log(error);
  //           },
  //         });
  //       }
  //     },
  //     error: (error: any) => {
  //       console.log(error);
  //     }
  //   });

    

  // }

  checkProdVariants(id: number): boolean {
    let count = 0;
    this.variants.forEach((variant) => {
      if (variant.product_ID === id) {
        count++;
      }
    });
    return count > 1;
  }

  copyProductDetails(id: number){
    this.copyService.copyProductDetails(id);
    this.snackBar.open('Copied to clipboard', 'Close', {
      duration: 2000,
    });

  }

  ngOnInit(): void {
    this.titleService.setTitle("Manage Warehouse - 888 Hardware Trading");
    
    this.productService.product$.subscribe((data) => {
      this.products = data;

    if(this.products.length === 0){
        this.isLoading = true;
      } 
      else {
        this.isLoading = false;
      }
    });

    this.variantService.variant$.subscribe((data) => {
      this.variants = data;
    });


    this.supplierService.supplierProductPopup$.subscribe((data) => {
      console.log("Supplier product data: ", data);
      this.supplierProductPopup = data[0];
      this.name = data[1];
      this.dataSource = new MatTableDataSource<any>(this.supplierProductPopup);


    });
  }

  @ViewChild('sidenav') sidenav!: MatSidenav;

  initializePanel(inventory: any, nameProd?: any){
    if(inventory.has_variant){
      this.snackBar.open('Please select from one of the variants of this product.', 'Close', {
        duration: 2000,
      });
      return;
    }

    let name = nameProd === undefined ? inventory.product_name : nameProd;
    let payload = {...inventory, prod_name: name};

    payload = inventory.variant_name ? {...payload, type: "variant"} : {...payload, type: 'product'};
    console.log("Payload", payload);
    this.dataService.postObjectData(payload, "getSupplierProductPopup").subscribe({
      next: (value: any) => {
        let data = value.data;
        this.supplierService.setSupplierProductPopupState([data, name]);

        if(data.length === 0){
          this.snackBar.open('No supplier data found for this product.', 'Close', {
            duration: 2000,
          });
          this.showPanel = false;
          return;
        }
        if(!this.sidenav.opened){
          this.sidenav.toggle();
        }
      },
      error: (error) => {
        console.log(error);
      }
    });
  }
  discountDisplayParser(discount: any){
    let discountSplit = discount.split(",");
    let discountParsed = discountSplit.map((x: any) => x + "%");
    return discountParsed.join(", ");
  }


  manageProductListBuilder(prodID: number) {
    const isLowStock = this.variants.filter(x => 
      x.product_ID === prodID)
      .map(y => 
        {
          return y.variant_stock < 1 || y.variant_stock <= y.low_stock_level || y.variant_stock <= y.critical_stock_level
        })

        return isLowStock.includes(true)
  }

}

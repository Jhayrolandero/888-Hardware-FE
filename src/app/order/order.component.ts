import { Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { mainPort } from '../app.component';
import { Client } from '../interface/client';
import { DiscountPromo, Order, Product, Promo, StockDiscountEntry } from '../interface/product';
import { Transaction } from '../interface/transaction';
import { Variant } from '../interface/variant';
import { DataService } from '../services/data.service';
import { LoadingService } from '../services/loading.service';
import { OrderService } from '../services/order.service';
import { PromoService } from '../services/promo.service';
import { BundleService } from '../services/store/bundle.service';
import { ClientService } from '../services/store/client.service';
import { DiscountService } from '../services/store/discount.service';
import { ProductService } from '../services/store/product.service';
import { TransactionService } from '../services/store/transaction.service';
import { VariantService } from '../services/store/variant.service';
import { OrderDetailsDialogComponent } from './order-details-dialog/order-details-dialog.component';
import { CanComponentDeactivate } from '../services/guard/can-deactivate.guard';
import { OfflineService } from '../services/offline.service';


@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrl: './order.component.css',
})
export class OrderComponent implements OnInit, CanComponentDeactivate {
  
  canDeactivate(): boolean {
    // Check if form is dirty and not submitted
    if (this.orders.length > 0) {
      return confirm('You have unsaved changes! Do you really want to leave?');
    }
    return true;
  }

  @ViewChild('clientNameInput') clientNameInput!: ElementRef;
  @ViewChild('clientAddressInput') clientAddressInput!: ElementRef;
  @ViewChild('clientContactInput') clientContactInput!: ElementRef;


  port = mainPort
  isLoading: boolean = true
  products: Product[] = [];
  variants: Variant[] = [];
  orders: Order[] = [];
  clients: Client[] = [];
  category: any[][] = [];
  tierOpen = [[], [], [], []];
  categSelectedBread: string[] = ['', '', '', ''];
  categBread: string[] = ['', '', '', ''];
  selectedCategory: string = '';

  sideNavOpen = false
  
  selectedVariant: number | null = null;
  selectedFilter = '';
  orderForm: FormGroup;
  clientForm: FormGroup;
  addingDiscount: boolean = false;
  searchParam = '';
  poutOfStock = false;
  isEditing= false;

  //Checker for initial edit add, this prevents quantity errors for existing orders
  initialEditAdd = false;

  isSubmitting = false;
  transactionEdit: Transaction | null = null;

  //Totals
  subtotalAmount: number = 0;
  totalAmount: number = 0;
  testVal= 0;

  //for discounts
  tempDiscount: number = 0;
  discountAmount: number = 0;
  //orderDiscount: number[] = [];
  productDiscount: { [key: number]: { variant_ID: number | null; discount: number; }[] } = {};
  bundleGroup: { [key: number]: { order: Order, deal_name: string , bundle_tier: any[] }[] } = {};
  //for client search filter
  filteredClients: Client[] = [];
  userSelected: boolean = false;
  displayedColumns: string[] = ['client_name'];
  clientSearchTerm: string = '';
  selectedClient: Client | null = null;

  clientAdded = false;
  categories: any[] = []

  promo: Promo[] = []
  discountPromo: DiscountPromo[] = []
  ongoingDiscount: DiscountPromo[] = []
  stockDiscountEntry: StockDiscountEntry[] = []

  readonly panelOpenState = signal(false);

  quantities: {[key: number]: number} = {};
  variantIDs: {[key: number]: number} = {}; 
  groupedVariants: { [key: string]: { variant_name: string, variant_id: number }[] } = {};

  
  selectedGroupAndNames: { [key: number]: {variant_name:string, variant_group_name: string} } = {};

  errorMessage = '';
  ascending = true;
  currentUrl = '';

  screenSize: string = ''
  options = this._formBuilder.group({
    bottom: 0,
    fixed: true,
    top: 0,
  });
  orderLoading: boolean = false
  
  stockEntry: Object[] = []
  stockEntryForm: Object[] = []

  constructor(
    private router: Router,
    private clientService: ClientService, 
    private dataService: DataService, 
    private orderService: OrderService, 
    private productService: ProductService, 
    private variantService: VariantService, 
    private transactionService: TransactionService, 
    private promoService: PromoService,
    private bundleService: BundleService,
    private titleService: Title,
    private discountService: DiscountService,
    private snackBar: MatSnackBar,
    private loaderService: LoadingService,
    private dialog: MatDialog,
    private _formBuilder: FormBuilder,
    private routers: Router,
    public offlineService: OfflineService
  ) { 

    this.currentUrl = this.router.url.split('/')[2];

    this.orderForm = new FormGroup({
      transaction_ID : new FormControl<number | null>(null),
      client_ID: new FormControl<number | null>(null),
      client_name: new FormControl<string | null>(''),
      client_address: new FormControl<string | null>(''),
      client_contact: new FormControl<string | null>(''),
      subtotal_price: new FormControl<number>(0),
      total_discount: new FormControl<number>(0),
      transaction_date: new FormControl(new Date().toLocaleString("en-US")),
      term: new FormControl<string>(''),
      transaction_detail: new FormControl<string>(''),
      is_paid: new FormControl<number>(0),
      order: new FormControl<Order[]>([]),
      date_now: new FormControl<string>(''),
      lowest_id: new FormControl<null | number>(null)
    });


    this.clientForm = new FormGroup({
      client_name: new FormControl<string>('', [Validators.required]),
      client_address: new FormControl<string>('', [Validators.required]),
      client_contact: new FormControl<string>('', [Validators.required]),
    });

    this.productService.category$.subscribe((category) => {
      let tempCateg: any[][] = [];
      category.forEach((categ) => {
        tempCateg.push(categ.category_name.split("/"));
      });
      this.category = tempCateg;
      console.log("Category has been initialized!", this.category);
    });

    this.orderService.editTransactionInstance$.subscribe((transaction: any) => {
      this.transactionEdit = transaction;
    });

    this.orderService.order$.subscribe((order) => {
      if(this.isEditing){
        console.log("Currently editing:")
        this.initialEditAdd = true;
        //Iterate through each to-add-order
        order.forEach((odr) => {
          if(odr.has_variant){
            this.variantIDs[odr.product_ID] = odr.variant_ID!;
            this.addToCart(odr as Product);
            this.updateQuantity(odr.product_ID, odr.variant_ID, odr.quantity);
          }
          else{
            this.addToCart(odr as Product);
            this.updateQuantity(odr.product_ID, null, odr.quantity);
          }
          this.quantities[odr.product_ID] = odr.quantity;

          odr.discount.split(',').forEach((discount: number) => {
            if(discount < 0){
              this.minusProductDiscount(odr.product_ID, odr.variant_ID, discount, null);
            }
            else{
              this.addProductDiscount(odr.product_ID, odr.variant_ID, discount, null);
            }
          });
        });
        this.initialEditAdd = false;

        let transaction = this.transactionEdit
        let client_ID = transaction!.client_ID ? transaction!.client_ID : null
        if(transaction){
          this.orderForm.patchValue({
            transaction_ID: transaction.transaction_ID,
            client_ID: client_ID,
            client_name: transaction.client_name,
            client_address: transaction.client_address,
            client_contact: transaction.client_contact,
            subtotal_price: transaction.subtotal_price,
            total_discount: transaction.discount,
            transaction_date: transaction.transaction_date
          });

          this.clientForm.patchValue({
            client_name: transaction.client_name,
            client_address: transaction.client_address,
            client_contact: transaction.client_contact
          });
        }

        this.clientAdded = true;

        this.updateOrderOnBundleDisplay();
        this.calculateTotalPrice();
      }
    });

    this.orderService.isEditing$.subscribe((isEditing) => {
      this.isEditing = isEditing;
    });

    this.routers.events.subscribe((val) => {
      if(val instanceof NavigationEnd){
        this.orderService.setCloseEdit();
      }
    });
  }

  getOrderInventoryPrice(order: any){
    if(order.variant_ID === null || order.variant_ID === -1){
      return this.productService.findProduct(order.product_ID)!.unit_price;
    }
    else{
      return this.variantService.getVariant(order.product_ID, order.variant_ID)!.variant_unit_price;
    }
  }

  getOrderInventoryCode(order: any){
    if(order.variant_ID === null || order.variant_ID === -1){
      return this.productService.findProduct(order.product_ID)!.product_code;
    }
    else{
      return this.variantService.getVariant(order.product_ID, order.variant_ID)!.variant_code;
    }
  }

  getOrderInventoryQuantity(order: any){
    if(order.variant_ID === null || order.variant_ID === -1){
      return this.productService.findProduct(order.product_ID)!.product_stock;
    }
    else{
      return this.variantService.getVariant(order.product_ID, order.variant_ID)!.variant_stock;
    }
  }

  revertBreadCrumb(){
    this.products = this.productService.getProductstate();
    this.categSelectedBread = ['', '', '', ''];
    this.categBread = ['', '', '', ''];
    this.selectedCategory = '';
  }

  goTo(url: string){
    this.router.navigate(['/order-landing/' + url]);
    this.currentUrl = url;
  }

  selectCategory(selectedCategory: string){
    console.log("Function trigger");
    this.selectedCategory = selectedCategory;
    let temp = [...this.categBread];
    this.categSelectedBread = temp;
    console.log(this.categBread);
    console.log(this.categSelectedBread);
    let mainFilter = '';
    this.categSelectedBread.forEach((categ) => {
      if(categ != ''){
        mainFilter = categ;
      }
    });

    console.log("mainFilter: ", mainFilter);
    console.log(this.products);
    let tempProducts = this.productService.getProductstate();
    this.products = tempProducts.filter((product) => {
      return product.category_name ? product.category_name.includes(mainFilter) : false;
    });
  }

  categHasTier(categ: string, tier: number){
    let hasTier = false;
    this.category.forEach((cat) => {
      if(cat[tier] != undefined){
        if(cat[tier-1].includes(categ)){
          hasTier = true;
        }
      }
    });
    return hasTier;
  }

  setSelectedCategory(categ: string, tier: number){
    switch (tier) {
      case 1:
        let uniqueTierOne: any = [];
        this.category.forEach((cat) => {
          if(!uniqueTierOne.includes(cat[0])){
            uniqueTierOne.push(cat[0]);
          }
        });
        this.tierOpen[0] = uniqueTierOne;
        break;

      case 2:
        this.categBread = [categ, '', '', ''];
        let iterTierTwo: any = this.category.filter((cat) => {
          return cat[0].includes(categ);
        });

        let uniqueTierTwo: any = [];
        iterTierTwo.forEach((cat: any) => {
          if(!uniqueTierTwo.includes(cat[1])){
            uniqueTierTwo.push(cat[1]);
          }
        });
        console.log(iterTierTwo, uniqueTierTwo);

        this.tierOpen[1] = uniqueTierTwo;
        break;
    
      case 3:
        this.categBread[3] = '';
        this.categBread[2] = '';
        this.categBread[1] = categ;
        let iterTierThree: any = this.category.filter((cat) => {
          if(cat.length > 2){
            return cat[1].includes(categ);
          }
        });
        let uniqueTierThree: any = [];
        iterTierThree.forEach((cat: any) => {
          if(!uniqueTierThree.includes(cat[2])){
            uniqueTierThree.push(cat[2]);
          }
        });
        this.tierOpen[2] = uniqueTierThree;
        break;

      case 4:
        this.categBread[3] = '';
        this.categBread[2] = categ;
        let iterTierFour: any = this.category.filter((cat) => {
          if(cat.length > 3){
            return cat[2].includes(categ);
          }
        });
        let uniqueTierFour: any = [];
        iterTierFour.forEach((cat: any) => {
          if(!uniqueTierFour.includes(cat[3])){
            uniqueTierFour.push(cat[3]);
          }
        });

        this.tierOpen[3] = uniqueTierFour;
        break;

      default:
        break;
    }
  }
  
  tickOrder(){
    console.log(this.orders);
    this.testVal = this.testVal += 1;
  }

  dragPosition = {x: 0, y: 0};

  ngOnInit(): void {
    this.titleService.setTitle('Order Page - 888 Hardware Trading');
    
    combineLatest([
      this.loaderService.isLoading$(this.discountService.loaderState),
      this.loaderService.isLoading$(this.promoService.loaderState),
      this.loaderService.isLoading$(this.productService.loaderState),
      this.loaderService.isLoading$(this.variantService.loaderState),
      this.loaderService.isLoading$(this.clientService.loaderState),
    ]).subscribe(([
      discountLoadState,
      promoLoadState,
      productLoadState,
      variantLoadState,
      clientLoadState,
    ]) => {
      const loadStates = [discountLoadState, promoLoadState, productLoadState, variantLoadState, clientLoadState]

      if (loadStates.every(state => state === false)) {
        this.isLoading = false
      } else {
        this.isLoading = true
      }
    })


    combineLatest([
      this.discountService.discountProduct$,
      this.promoService.promotion$,
      this.productService.product$,
      this.variantService.variant$,
      this.clientService.client$,
      this.productService.stockDiscountEntry$
    ]).subscribe(([
      discountPromo, 
      promo,
      product,
      variant,
      client,
      stockDiscount
    ]) => {
      console.log("Something updated!!!!!!!!!!");
      this.discountPromo = discountPromo;
      this.promo = promo;    
      this.ongoingDiscount = this.getProductDiscount();
      this.products = [...product]
      
      this.products.forEach((product) => {
        this.quantities[product.product_ID] = 1;
      })
 
      this.variants = variant;
      this.clients = client;
      this.stockDiscountEntry = stockDiscount
    });
  }

  onChangeSearch(){
    // console.log(this.selectedFilter);
    let product = this.productService.getProductstate();

    switch (this.selectedFilter) {
      case "Product Code":
        product = product.filter((product) => {
          return product.product_code.toString().includes(this.searchParam!.toLowerCase());
        });
        break;

      case "Product Name":
        //Name Filter
        product = product.filter((product) => {
          return product.product_name.toLowerCase().includes(this.searchParam!.toLowerCase());
        });
        break;

      case "":
        //Name Filter
        product = product.filter((product) => {
          return product.product_name.toLowerCase().includes(this.searchParam!.toLowerCase());
        });
        break;

      case "Product Brand":
        product = product.filter((product) => {
          return product.brand.toLowerCase().includes(this.searchParam!.toLowerCase());
        });
        break;

      case "In Stock":
        product = product.filter((product) => {
          return product.product_stock > 0 || product.has_variant == true;
        });
        break;
    
      default:
        break;
    }

    this.products = product;
    // console.log("This is product now: ", this.products);
  }

  searchForClient() {
    if (this.clientSearchTerm) {
      this.filteredClients = this.clients.filter(client =>
        client.client_name.toLowerCase().includes(this.clientSearchTerm.toLowerCase())
      );
    } else {
      this.filteredClients = [];
    }
  }

  selectUser(client: Client) {
    this.userSelected = true;
    this.selectedClient = client;
    this.clientForm.patchValue({
      client_ID: null,
      client_name: client.client_name,
      client_address: client.client_address,
      client_contact: client.client_contact
    })
    this.orderForm.patchValue({
      client_ID: null,
      client_name: client.client_name,
      client_address: client.client_address,
      client_contact: client.client_contact,
    });

    this.clientAdded = true;
  }

  clearSearch() {
    this.clientSearchTerm = '';
    this.filteredClients = [];
    this.userSelected = false;
    this.selectedClient = null;
    this.clientAdded = false;

    if (this.clientNameInput) this.clientNameInput.nativeElement.value = '';
    if (this.clientAddressInput) this.clientAddressInput.nativeElement.value = '';
    if (this.clientContactInput) this.clientContactInput.nativeElement.value = '';

    this.snackBar.open('Client details cleared.', 'Close', {
      duration: 1000,
    });
  }

  confirmCustomerDetails() {
    //Get the value from the manual input fields
    const name = (document.getElementById('client_name') as HTMLInputElement).value;
    const address = (document.getElementById('client_address') as HTMLInputElement).value;
    const contact = (document.getElementById('client_contact') as HTMLInputElement).value;

    //Edge case for any empty fields
    if (name === '' || address === '' || contact === '') {
      this.snackBar.open('Please fill out all fields.', 'Close', {
        duration: 2000,
      });
      return;
    }

    //Slap the value of the manual input fields to the form
    this.orderForm.patchValue({
      client_ID: null,
      client_name: name,
      client_address: address,
      client_contact: contact,
    });
    this.snackBar.open('Client details confirmed.', 'Close', {
      duration: 2000,
    });
    this.clientAdded = true;
  }

  getProductByID(productID: number){
    //
    // getProductByID(productId: number) {
    // 
    //   return this.products.find(product => product.id === productId);
    // }
    return this.productService.findProduct(productID);
  }

  logValues(productId: number) {    
    // NOTE: This is for debugging purposes only. Will imporve this later on
    const product = this.getProductByID(productId);
    if (product) {
      const maxStock = product.product_stock;
      const currentQuantity = this.quantities[productId];

      if (currentQuantity > maxStock) {
        this.errorMessage = 'Quantity exceeds stock';
        this.quantities[productId] = maxStock;
      } else if (currentQuantity < 1) {
        this.quantities[productId] = 1;
      }
    }
  
    const selectedVariantId = this.variantIDs[productId];
    const selectedGroup = Object.entries(this.groupedVariants).find(([groupName, variants]) =>
      variants.some(variant => variant.variant_id === selectedVariantId)
    );

    if (selectedGroup) {
        const [groupName, variants] = selectedGroup;
        const selectedVariant = variants.find(variant => variant.variant_id === selectedVariantId);
        if (selectedVariant) {
            this.selectedGroupAndNames[productId] = {
              variant_name: selectedVariant.variant_name,
              variant_group_name: groupName
            };
        }
    }
  }

  findVariantPrice(varID: number) {
    return this.variants.find(x => x.variant_ID == varID)?.variant_unit_price
  }

  findVariantPriceRange(prodID: number) {

    const varArr = this.variants.filter(x => x.product_ID == prodID) 
    const lowestPrice = varArr.reduce((prev, curr) => {
      return prev.variant_unit_price < curr.variant_unit_price ? prev : curr
    })

    const highestPrice = varArr.reduce((prev, curr) => {
      return prev.variant_unit_price > curr.variant_unit_price ? prev : curr
    })

    if(lowestPrice.variant_unit_price == highestPrice.variant_unit_price) {
      return `₱${lowestPrice.variant_unit_price}`
    } else {
      return `₱${lowestPrice.variant_unit_price} - ₱${highestPrice.variant_unit_price}`
    }

  }

  findVariantDiscountPriceRange(prodID: number) {
    const varArr = this.ongoingDiscount.filter(x => x.product_ID == prodID)

    if(varArr.length == 0) return false
    const lowestPrice = varArr.reduce((prev, curr) => {
      return prev.discounted_price < curr.discounted_price ? prev : curr
    })

    const highestPrice = varArr.reduce((prev, curr) => {
      return prev.discounted_price > curr.discounted_price ? prev : curr
    })

    if(lowestPrice.discounted_price == highestPrice.discounted_price) {
      return `₱${this.findVariantDiscount(lowestPrice.variant_ID)}`
    } else {
      return `₱${this.findVariantDiscount(lowestPrice.variant_ID)} - ₱${this.findVariantDiscount(highestPrice.variant_ID)}`
    }

  }

  // based on shopee, they only display the lowest value of percentage discount
  findLowestPercentageDiscount(prodID: number) {
    const varArr = this.ongoingDiscount.filter(x => x.product_ID == prodID)

    if(varArr.length == 0) return false
    const lowestValue = varArr.reduce((prev, curr) => {
      return prev.discounted_price < curr.discounted_price ? prev : curr
    })

    return lowestValue.discount_value
  }

  getProductDiscount() {
    // Get ongoing promo
    const ongoingPromo = this.promo.filter(x => x.status.toLowerCase() === 'ongoing' && x.promotion_type.toLowerCase() === 'discount')

    if (ongoingPromo.length == 0) return []

    const productOngoing = ongoingPromo.map(x => (x.type_Promo_ID))
    
    const discountArr = this.discountPromo.filter(x => productOngoing.includes(x.discount_ID))

    return discountArr
  }

  // Product without variants
  findProductDiscount(prodID : number) {
    return this.ongoingDiscount.find(x => x.product_ID == prodID)?.discounted_price
  }

  // Getting percentage for display
  findProductDiscountPercent(prodID : number) {
    return this.ongoingDiscount.find(x => x.product_ID == prodID)?.discount_value
  }

  // Variant discount when selected
  findVariantDiscount(varID: number) {
    return this.ongoingDiscount.find(x => x.variant_ID == varID)?.discounted_price
  }

  // Display percentage too
  findVariantDiscountPercent(varID: number) {
    return this.ongoingDiscount.find(x => x.variant_ID == varID)?.discount_value
  }

  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    let product = this.productService.getProductstate();

    //Special case that immediately takes effect
    if(this.selectedFilter === 'In Stock') {
      product = product.filter((product) => {
        // console.log(product.product_stock > 0 || product.has_variant == true);
        return product.product_stock > 0 || product.has_variant == true;
      });
    }
    this.products = product;
    this.searchParam = '';
    // console.log('Selected Filter:', this.selectedFilter);
  }

  // increaseQuantity(product: Product) {
  //   if (product.has_variant) {
  //     let selectedVariantId = this.variantIDs[product.product_ID];
  //     if (selectedVariantId === null || selectedVariantId === undefined || selectedVariantId === 0) {
  //       // console.log('Please select a variant first');
  //       return;
  //     }
  //     const selectedVariant = this.variants.find((variant) => 
  //       variant.variant_ID === selectedVariantId
  //     );

  //     if (selectedVariant) {
  //       if (this.quantities[product.product_ID] < selectedVariant.variant_stock) {
  //         this.quantities[product.product_ID] = this.quantities[product.product_ID] + 1;
  //       } else {
  //         // console.log('No more stock available for the selected variant');
          
  //       }
  //     } else {
  //       // console.log('Selected variant not found');
  //     }
  //   } else {
  //     // console.log('Product stock:', product.product_stock);
  //       if (this.quantities[product.product_ID] < product.product_stock) {
          
  //           this.quantities[product.product_ID] = this.quantities[product.product_ID] + 1;
  //       } else {
  //           // console.log('No more stock available for the product');
  //       }
  //   }
  // }


  // decreaseQuantity(product: Product) {
  //   if(this.quantities[product.product_ID] > 1) {
  //     this.quantities[product.product_ID] = this.quantities[product.product_ID] - 1;
  //   } else {
  //     // console.log(this.quantities[product.product_ID]);
  //   }
  // }

  // outOfStock(product: Product, quantity: number, variantId: number | null): boolean {
  //   if (variantId === null || variantId === undefined || variantId === 0) {
  //     return product.product_stock - quantity === 0;
  //   } else {
  //     const variant = this.variants.find(v => v.product_ID === product.product_ID && v.variant_ID === variantId);
  //     if (variant) {
  //       return variant.variant_stock - quantity === 0;
  //     }
  //   }
  //   return false;
  // }

  productExists(product: Product, variantId: number | null): boolean {
    if(product.has_variant) {
      // console.log('Product exists');
      return this.orders.some(order => order.product_ID === product.product_ID && order.variant_ID === variantId);
    }
    return this.orders.some(order => order.product_ID === product.product_ID);
  }

  addToCart(product: any) {
    // console.log("Initial edit state: ", this.initialEditAdd);
    // console.log("Quantities: ", this.quantities);
    console.log("GLORIOYUS EVOLUTION: ", product);
    if(this.orderLoading) {
      this.snackBar.open('You cannot add while submitting an order', 'Close', {
        duration: 2000,
      });
      return;
    }

    if(this.productExists(product, this.variantIDs[product.product_ID])){
      this.snackBar.open('Product already exists in cart.', 'Close', {
        duration: 2000,
      });
      return;
    }

    console.log("current product list", this.products, this.variants);
    if(this.validateHasVariant(product)) {
      return;
    }

    let order : Order = {
      transaction_ID: null,
      product_ID: product.product_ID,
      variant_ID: this.variantIDs[product.product_ID],
      quantity: 1,
      bonus_quantity: 0,
      flat_discount: 0,
      percentage_discount: 0,
      discount: [],
      final_total : 0,
      lowest_ID: product.latest_stock_entry_id
    }

    order.quantity = this.isEditing ? this.quantities[product.product_ID] : 1;

    console.log("Initialized order to pass: ", order);



    let hasBundle = false;

    //List of products associated with a bundle deal
    let productBundles = this.bundleService.getCurrDiscountState();
    //Check if product has same product id as productBundle iterable

    productBundles.forEach((bundle) => {
      //If product exists in any active bundle
      if(bundle.product_ID === product.product_ID){
        //Initialize bundleGroup if it doesnt exist
        if (!this.bundleGroup[bundle.deal_ID!]) {
          this.bundleGroup[bundle.deal_ID!] = [];
        }
        //Fetch bundle tier for the current bundle
        let bundleTier = this.bundleService.getOneBundleTier(bundle.deal_ID!);

        //Filter for bundle type
        let tempOrder = this.tierBundleUpdater(bundle, order);

        console.log("Bundle: ", bundle);
        this.bundleGroup[bundle.deal_ID!].push({
          order: order,
          deal_name: bundle.deal_name,
          bundle_tier: bundleTier
        });
        hasBundle = true;
      }
    });
    if(!hasBundle){
      if (!this.bundleGroup[-1]) {
        this.bundleGroup[-1] = [];
      }

      this.bundleGroup[-1].push({
        order: order,
        deal_name: '',
        bundle_tier: []
      });
    }

    this.orders.push(order);

    this.updateAllPercentage();
    // if(!this.initialEditAdd){
    //   this.updateArrayValues(product, this.variantIDs[product.product_ID], order);
    // }



    if(order.variant_ID === undefined){order.variant_ID = null;}
    if(product.unit_price_discount || product.variant_unit_discount){
      let discountArr = [];

      discountArr = product.has_variant? 
                    product.variant_unit_discount.split(',').map((disc: any) => +disc) : 
                    product.unit_price_discount.split(',').map((disc: any) => +disc);

      let variantTemp = product.has_variant? this.variantIDs[product.product_ID] : null;
      console.log("Discount array: ", discountArr, "Variant ID: ", variantTemp);
      discountArr.forEach((discount: any) => {
        this.submitProductDiscount(product.product_ID, variantTemp, +discount, null);
      });
    }

    //remove variant for a product after adding
    if (product.has_variant) {
      // console.log("before delete: ", this.selectedGroupAndNames[product.product_ID]);
      delete this.selectedGroupAndNames[product.product_ID];
      // console.log("after delete: ", this.selectedGroupAndNames[product.product_ID]);
      this.variantIDs[product.product_ID] = -1;
    }

    this.updateOrderOnBundleDisplay();
    this.calculateTotalPrice();


    this.snackBar.open('Added to cart!', '', {
      duration: 2000,
    })
  }

  updateQuantity(product_ID: number, variant_ID: number | null, quantity: any) {
    console.log("Product BH on updateQuantity: ", this.productService.getProductstate());
    this.products = [...this.productService.getProductstate()];
    if(variant_ID === -1){ 
      variant_ID = null;
    }
    //Get input value on form
    let inputID = `input-${product_ID}-${variant_ID}`;
    let input = document.getElementById(inputID) as HTMLInputElement;

    if(quantity < 1) {
      this.snackBar.open('Quantity must be greater than 0.', 'Close', {
        duration: 2000,
      });
      input.value = (quantity * -1).toString();
      return;
    }
    
    // if(!Number.isInteger(this.quantities[product.product_ID])) {
    //   this.snackBar.open('Quantity must be a whole number', 'Close', {
    //     duration: 2000,
    //   });
    //   return;
    // }
    //Initially checks if the quantity exceeds the stock, if so, terminate the function
    if(Object.keys(this.variantIDs).length !== 0 && this.initialEditAdd === false){
      if (variant_ID !== -1 && variant_ID !== undefined && variant_ID !== null){
        if(quantity > this.variantService.getVariant(product_ID, variant_ID)!.variant_stock) {
          // debugger
          this.quantities[product_ID] = 1;
          delete this.variantIDs[product_ID];
          delete this.selectedGroupAndNames[product_ID];
          this.snackBar.open('Variant Quantity exceeds available stock.', 'Close', {
            duration: 2000,
          });
          let maxVariant = this.variantService.getVariant(product_ID, variant_ID)!.variant_stock.toString();
          
          console.log(maxVariant)
          input.value = maxVariant;
          quantity = maxVariant;
        }
      }
    }
    else if(quantity > this.productService.findProduct(product_ID)!.product_stock && this.initialEditAdd === false) { 
      // console.log("Checking product"); ;
      this.snackBar.open('Quantity exceeds available stock.', 'Close', {
        duration: 2000,
      });
      let maxProduct = this.productService.findProduct(product_ID)!.product_stock.toString();
      input.value = maxProduct;
      quantity = maxProduct;
    }
    console.log("Before subtractingf quantity: ", this.products); 

    // Updates quantity of local product each form change.
    if(variant_ID === null){
      this.products = this.products.map((product) => {
        if(product.product_ID === product_ID){
          return { ...product, product_stock: product.product_stock - quantity };
        }
        return product;
      });
    }
    else{
      this.variants = this.variants.map((variant) => {
        if(variant.product_ID === product_ID && variant.variant_ID === variant_ID){
          return { ...variant, variant_stock: variant.variant_stock - quantity };
        }
        return variant;
      });
    }

    //Change order quantity value each form change.
    this.orders = this.orders.map((order) => {
      if(order.variant_ID === null){
        if(order.product_ID === product_ID){
          return { ...order, quantity: +quantity };
        }
      }
      else{
        if(order.product_ID === product_ID && order.variant_ID === variant_ID){
          return { ...order, quantity: +quantity };
        }
      }
      return order;
    });

    console.log(this.products);
    this.updateOrderOnBundleDisplay();
    this.calculateTotalPrice();
  }

  updateProductQuantity(order: any){

  }

  tierBundleUpdater(bundle: any, order: Order){
    let bundleTier = this.bundleService.getOneBundleTier(bundle.deal_ID!);
    switch (bundle.deal_type) {
      case 'percentage':
        //Tier price checker
        bundleTier.forEach((tier) => {
          if(order.quantity >= tier.required_qty){
            order.percentage_discount = tier.percentage!;
          }
        });
        break;
    
      default:
        break;
    }
    return order;
  }

  updateAllPercentage(){
    Object.entries(this.bundleGroup).forEach(([key, value]) => {
      //Total all quantity on each bundleGroup
      let totalQuantity = 0;
      value.forEach((bundle) => {
        totalQuantity += bundle.order.quantity;
      });
      value[0].bundle_tier.forEach((tier) => {
        if(totalQuantity >= tier.required_qty){
          //Apply tier percentage to all orders in the bundleGroup
          value.forEach((bundle) => {
            if(tier.percentage){
              this.applyPercentageToOrder(bundle.order, tier.percentage!);
            }
            else if(tier.amount){
              this.applyAmountToOrder(bundle.order, tier.amount!);
            }
          });
        }
      });
    });
  }

  //End my suffering
  applyPercentageToOrder(order: Order, percentage: number){
    //Find given order in orders, and apply percentage discount
    this.orders.forEach((o) => {
      if(o.variant_ID){
        if(o.product_ID === order.product_ID && o.variant_ID === order.variant_ID){
          o.percentage_discount = percentage;
        }
      }
      else{
        if(o.product_ID === order.product_ID){
          o.percentage_discount = percentage;
        }
      }
    });
  }

  applyAmountToOrder(order: Order, amount: number){
    //Find given order in orders, and apply amount discount
    this.orders.forEach((o) => {
      if(o.variant_ID){
        if(o.product_ID === order.product_ID && o.variant_ID === order.variant_ID){
          o.flat_discount = amount;
        }
      }
      else{
        if(o.product_ID === order.product_ID){
          o.flat_discount = amount;
        }
      }
    });
  }

  updateOrderOnBundleDisplay(){
    //Iterate through orders and replace bundleGroup order with the iterated order
    this.orders.forEach((order) => {
      if(this.bundleGroup[-1]){
        this.bundleGroup[-1].forEach((bundle) => {
          if(bundle.order.product_ID === order.product_ID && bundle.order.variant_ID === order.variant_ID){
            bundle.order = order;
          }
        });
      }
      Object.entries(this.bundleGroup).forEach(([key, value]) => {
        value.forEach((bundle) => {
          if(bundle.order.product_ID === order.product_ID && bundle.order.variant_ID === order.variant_ID){
            bundle.order = order;
          }
        });
      });
    });
    console.log("Bundle Group: ", this.bundleGroup);
  }

  updateArrayValues(product: Product, variantId: number | null, order: any) {
    // console.log("Updating array values", product, variantId, order);
    if (this.variantIDs[product.product_ID] === null || this.variantIDs[product.product_ID] === undefined || this.variantIDs[product.product_ID] === -1) {
      const foundProduct = this.products.find(p => p.product_ID === product.product_ID);
      if (foundProduct) {
        foundProduct.product_stock -= order.quantity;
      }
    } else {
      const foundVariant = this.variants.find(v => v.product_ID === product.product_ID && v.variant_ID === this.variantIDs[product.product_ID]);
      if (foundVariant) {
        foundVariant.variant_stock -= order.quantity;
      }
    }
    this.resetProductValues(product);
  }

  removeFromCart(order: Order) {
    console.log("Removing from cart...", order);



    //Add back quantity removed and remove discount
    if(order.variant_ID === null){  
      delete this.productDiscount[order.product_ID];
      this.products.forEach((product) => {
        if(product.product_ID === order.product_ID){
          product.product_stock += order.quantity;
        }
      });
    }
    else{
      if (this.productDiscount[order.product_ID]) {
        this.productDiscount[order.product_ID] = this.productDiscount[order.product_ID].filter(
            (disc, index) => !(disc.variant_ID === order.variant_ID)
        );
  
        if (this.productDiscount[order.product_ID].length === 0) {
          delete this.productDiscount[order.product_ID];
      }
      this.variants.forEach((variant) => {
        if(variant.product_ID === order.product_ID && variant.variant_ID === order.variant_ID){
          variant.variant_stock += order.quantity;
        }
      });
    }
  }
    
    //Remove order from orders
    this.orders = this.orders.filter((o) => {
      if(o.variant_ID === null){
        return o.product_ID !== order.product_ID;
      }
      else{
        return o.product_ID !== order.product_ID || o.variant_ID !== order.variant_ID;
      }
    });
    

    //Remove order from bundleGroup
    Object.entries(this.bundleGroup).forEach(([key, value]: any) => {
      this.bundleGroup[key] = value.filter((bundle: any) => {
        if(bundle.order.variant_ID === null){
          return bundle.order.product_ID !== order.product_ID;
        }
        else{
          return bundle.order.product_ID !== order.product_ID || bundle.order.variant_ID !== order.variant_ID;
        }
      });
    });
    console.log("product and variant", this.products, this.variants);

    this.updateOrderOnBundleDisplay();
    this.calculateTotalPrice();
  }

  addDiscount() {
    if (this.tempDiscount > 0 && this.tempDiscount <= 99) {
      this.addingDiscount = false;
    }
  }

  getFilteredDiscounts(productID: number, variantID: number | null) {
    if(variantID){
      return this.productDiscount[productID]?.filter(d => d.variant_ID === variantID) || [];
    }
    else{
      return this.productDiscount[productID];
    }
  }

  submitProductDiscount(productID: number, variantID: number | null, discount: number, inputElement: HTMLInputElement | null, overwriteStockEntry?: boolean) {
    if(discount === null || discount === undefined || discount === 0){
      this.snackBar.open('Please input a valid discount value.', 'Close', {
        duration: 2000,
      });
      return;
    }
    if (discount >= 1 && discount < 100) {
      this.addProductDiscount(productID, variantID, discount, inputElement, overwriteStockEntry);
    } else if (discount <= -1 && discount > -99) {
      this.minusProductDiscount(productID, variantID, discount, inputElement, overwriteStockEntry);
    }
  }


  addProductDiscount(productID: number, variantID: number | null, discount: number, inputElement: HTMLInputElement | null, overwriteStockEntry?: boolean) {
    if (discount < 1 || discount > 100) {
        return;
    }
    if (!this.productDiscount[productID]) {
        this.productDiscount[productID] = [];
    }

    if(variantID === null || variantID === undefined) {
      this.productDiscount[productID].push({
        variant_ID: null,
        discount: discount
      });
      this.orders.forEach(order => {
        if(order.product_ID === productID){
          order.discount!.push(discount);
          if(overwriteStockEntry) {
            order.lowest_ID = null
          }
        }
      });
    } else{
      this.productDiscount[productID].push({
        variant_ID: variantID,
        discount: discount
      });
      this.orders.forEach(order => {
        if(order.product_ID === productID && order.variant_ID === variantID){
          order.discount!.push(discount);
          if(overwriteStockEntry) {
            order.lowest_ID = null
          }
        }
      });
    }
    if(inputElement){
      inputElement.value = ''; 
    }


    // console.log(this.productDiscount[productID])
    // console.log(this.productDiscount);
    this.calculateTotalPrice();
    console.log("Product Discount: ", this.productDiscount);
    console.log("Order after discount ", this.orders);
    // console.log(this.orders);
    console.log(discount)
  }

  minusProductDiscount(productID: number, variantID: number | null, discount: number, inputElement: HTMLInputElement | null,overwriteStockEntry?: boolean) {
    if (!this.productDiscount[productID]) {
        this.productDiscount[productID] = [];
    }

    let discountToAdd = 0;

    //Edge case for literal negative value
    if (discount < 0) {
      discountToAdd = discount;
    }
    else{
      discountToAdd = discount * -1;
    }


    if (variantID === null || variantID === undefined) {
        this.productDiscount[productID].push({
            variant_ID: null,
            discount: discountToAdd
        });
        this.orders.forEach(order => {
            if (order.product_ID === productID) {
                order.discount!.push(discountToAdd);
                if(overwriteStockEntry) {
                  order.lowest_ID = null
                }
            }
        });
    } else {
        this.productDiscount[productID].push({
            variant_ID: variantID,
            discount: discountToAdd
        });
        this.orders.forEach(order => {
            if (order.product_ID === productID && order.variant_ID === variantID) {
                order.discount!.push(discountToAdd);
                if(overwriteStockEntry) {
                order.lowest_ID = null
                }
            }
        });
    }
    if(inputElement){
      inputElement.value = '';
    }
    this.calculateTotalPrice();
    // console.log(this.productDiscount[productID]);
  }

  deleteProductDiscount(id: number, variantID: number | null, discount: number, discountIDX: number) {
    console.log(this.productDiscount);
    if (this.productDiscount[id]) {
      this.productDiscount[id] = this.productDiscount[id].filter(
          (disc, index) =>  !(disc.variant_ID === variantID && index === discountIDX)
      );

      this.orders.forEach(order => {
        if(order.product_ID === id){
          if(order.discount) {
            order.discount = order.discount.filter((discount, index) => !(index === discountIDX))

          }
        }
      });

      if (this.productDiscount[id].length === 0) {
          delete this.productDiscount[id];
      }
    }
    this.calculateTotalPrice();
  }

  calculateCompoundDiscount(discount: any, price: any, quantity: any){
    let mainValue = price;
    let discountArr = discount
    console.log("Discount to calculater: ", discount);
    if(!Array.isArray(discount)){
      if(discount === null || discount === undefined || discount === '') return price * quantity;
      if(discount.includes(",")){
        discountArr = discount.split(',');
      }
      else{
        discountArr.push(discount);
      }
    }
    // let discountArr: any[] = [];

    discountArr.forEach((element: any) => {
      // console.log("The element and value: ", element, mainValue);
      // console.log("The discount: ", parseFloat(mainValue) + ((+element / 100) * +mainValue))
      mainValue = (parseFloat(mainValue) + ((+element / 100) * +mainValue));
      // mainValue = (parseFloat(mainValue) - ((+element / 100) * +mainValue));
      // console.log("Mainvalue of: ", mainValue);
    });
    return mainValue * quantity;
  }

  calculateSubTotalPrice(): number {
    console.log("Calculating subtotal price...");
    let subtotalPrice = 0;
    this.orders.forEach(order => {
      let item;
      let orderFinal = 0;

      if(order.variant_ID){
        item = this.variantService.getVariant(order.product_ID, order.variant_ID);
        orderFinal = this.calculateCompoundDiscount(order.discount, item!.variant_unit_price, order.quantity);
      }
      else{
        item = this.productService.findProduct(order.product_ID);
        orderFinal = this.calculateCompoundDiscount(order.discount, item!.unit_price, order.quantity);
      }
      let orderFinalBundle = orderFinal - (orderFinal * (order.percentage_discount! / 100));
      order.final_total = orderFinalBundle;
      subtotalPrice += orderFinal;
    });
    this.subtotalAmount = subtotalPrice;
    return subtotalPrice;
  }

  calculateDiscountBundle(bundle: any){
    let total = 0;
    bundle.value.forEach((b: any) => {
      if(b.order.variant_ID){
        let item = this.variantService.getVariant(b.order.product_ID, b.order.variant_ID);
        total += (item!.variant_unit_price * b.order.quantity);
      }
      else
      {
        let item = this.productService.findProduct(b.order.product_ID);
        total += (item!.unit_price * b.order.quantity);
      }
      total = total - b.order.final_total;
    });
    return total;
  }
  //Free me
  calculateDiscountBundleCopy(bundle: any){
    let total = 0;
    bundle.forEach((b: any) => {
      if(b.order.variant_ID){
        let item = this.variantService.getVariant(b.order.product_ID, b.order.variant_ID);
        total += (item!.variant_unit_price * b.order.quantity);
      }
      else
      {
        let item = this.productService.findProduct(b.order.product_ID);
        total += (item!.unit_price * b.order.quantity);
      }
      total = total - b.order.final_total;
    });
    return total;
  }

  calculateTotalBundleDiscount(){
    //Calculate all types of bundle discounts in the bundleGroup
    let totalDiscount = 0;
    // console.log("Bundle group: ", this.bundleGroup);
    Object.entries(this.bundleGroup).forEach(([key, value]) => {
      try {
        if(value[0].order.percentage_discount){
          totalDiscount += this.calculateDiscountBundleCopy(value);
        }
        else if(value[0].order.flat_discount){
          totalDiscount += value[0].order.flat_discount;
        }
      } catch (error) {
        console.log("Error in calculating bundle discount, it's probably empty.");
      }

    });
    return totalDiscount;
  }

  calculateTotalPrice() {
    const subTotal = this.calculateSubTotalPrice();
    if(subTotal === 0){
      this.totalAmount = 0;
    }


    this.discountAmount = (subTotal * this.tempDiscount) / 100;
    if(subTotal - this.discountAmount <= 0) {
      // console.log("Discount exceeds total price");
      this.tempDiscount = 0;
    }
    this.totalAmount = (subTotal - this.discountAmount) - this.calculateTotalBundleDiscount();
    // return (subTotal - this.discountAmount) - this.calculateTotalBundleDiscount();
    return this.totalAmount
  }


  calculateDiscount(): number {
    const subTotal = this.subtotalAmount
    return (subTotal * this.tempDiscount) / 100;
  }

  getDateNow() {
    return new Date().toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '/');

  }

  onSubmitOrder() {
    if(!this.clientAdded) {
      this.snackBar.open('Please add a client first.', 'Close', {
        duration: 2000,
      });
      return;
    }

    if (this.orders.length === 0) {
      this.snackBar.open('No Orders to Submit.', 'Close', {
        duration: 2000,
      });
      return;
    }
    let hasZero = false;
    //Check if an order in cart has 0 quantity
    this.orders.forEach((order) => {
      if(order.quantity === 0){
        this.snackBar.open('Please remove or change orders with 0 quantity.', 'Close', {
          duration: 2000,
        });
        hasZero = true;
        return;
      }
    });
    if(hasZero){return;}

    const dialogRef = this.dialog.open(OrderDetailsDialogComponent);

    dialogRef.afterClosed().subscribe({
      next: (result: boolean) => {
        if(result){
          //Selected client can be undefined if user is manually inputted, thereby leaving it empty can causes bugs.
          //This ensures that the client_ID is not undefined, but is null when passed to backend.
          let clientID = this.selectedClient ? this.selectedClient.client_ID : null;
          this.isSubmitting = true;
          this.orderForm.patchValue({
            client_ID: clientID,
            subtotal_price: this.totalAmount,
            total_discount: this.tempDiscount,
            term: null,
            transaction_detail: null,
            is_paid: false,
            order: this.orders,
            date_now: this.getDateNow(),
          });


          let request = null;
          if(this.isEditing){
            request = this.dataService.patchData(this.orderForm, "editOrderDraft");
          }
          else{
            request = this.dataService.postData(this.orderForm, "addTransaction");
          }

          this.orderLoading = true
          request.subscribe({
            next: (value: any) => {
              const transaction = value as Transaction;
              console.log("Edit return value: ", transaction);
              this.isSubmitting = false;
              this.transactionService.updateTransaction(transaction);
              // console.log(value);
              this.orderForm.reset();
              this.clearSearch();
            
              //Order finished
              this.snackBar.open('Order has successfully been recorded to transactions.', 'Close', {
                duration: 2000,
              });
              this.orderLoading = false

              this.productDiscount = {};
              this.variantIDs = {};
              this.groupedVariants = {};
              this.selectedGroupAndNames = {};
              
              this.bundleGroup = {};
              this.orders = [];
      
              this.clientSearchTerm = '';
              this.filteredClients = [];
              this.userSelected = false;
              this.selectedClient = null;
              this.clientAdded = false;
              this.productService.initProduct();
              this.variantService.initVariant();
              this.routers.navigate(['/order-landing/manage-order-drafts']);

            },
            error: (error) => {
              console.log("Error in editing: ", error);
              this.orderLoading = false

              // this.backgroundSync.addNewRequest([this.inventoryForm.getRawValue(), 'editProduct'], "PATCH");
              // this.backgroundSync.trafficHandler();
              // this.goBack();
            }
          });
          console.log("Products after submitting: ", this.products);
          console.log("BH after submitting: ", this.productService.getProductstate());
          console.log(this.orderForm.getRawValue());
        }

      },
      error: (error: any) => {

        this.isSubmitting = false;
      }
    });
  }

  test() {
    this.isSubmitting = true
    setTimeout(() => {
      this.isSubmitting = false
      
    }, 5000);
  }

  exitEdit(){
    this.routers.navigate(['/order-landing/manage-order-drafts']);
    this.orderService.setCloseEdit();
  }

  parseDiscountDisplay(discount: any, prodID: number){
    return discount.replace(/\d+/g, (match: any) => `${match}%`);
  }

  addClient() {
    const vals = this.clientForm.getRawValue() 
    if(!this.clientForm.valid) {
      let error;
      if (vals.client_name.length === 0) {
        error = "Customer's name"
      } else if(vals.client_address.length === 0) {
        error = "Customer's address"
      } else if (vals.client_contact.length === 0) {
        error = "Customer's contact"
      }

      this.snackBar.open(`${error} cannot be empty!`, 'Close', {
        duration: 2000,
      })
      return 
    }

    // Checker if customer info exists    
    const sameCustomerName = this.clients.filter(x => x.client_name.trim().toLowerCase() === vals.client_name.trim().toLowerCase())
    
    if(sameCustomerName.length >= 1) {
      this.snackBar.open(`Customer's name already exists.`, 'Close', {
        duration: 2000,
      })
      return 
    }
    let clientReturnedID = null;

  
    
    this.dataService.postData(this.clientForm, "addClient").subscribe({
      next: (value: any) => {

        this.clientService.addClient(value)
        clientReturnedID = value.client_ID
        // console.log(value)
        this.snackBar.open("Customer information is added successfully!", 'Close', {
          duration: 2000,
        });  
        this.clientAdded = true;
      },
      error: (error) => {
        const errMSG = error.errmsg 
        this.snackBar.open(`${errMSG}`, 'Close', {
          duration: 2000,
        });  
      },
    });

    this.orderForm.patchValue({
      client_ID: clientReturnedID,
      client_name: vals.client_name,
      client_address: vals.client_address,
      client_contact: vals.client_contact,
    });
  }

  validateHasVariant(product: Product): boolean {
    if(product.has_variant && (this.variantIDs[product.product_ID] === null || this.variantIDs[product.product_ID] === undefined || this.variantIDs[product.product_ID] === -1)) {
      // console.log('Please select a variant first');
      return true;
    }
    return false;
  }

  resetProductValues(product: Product) {
    this.quantities[product.product_ID] = 1;
    delete this.variantIDs[product.product_ID];
  }

  getGroupedVariants(productId: number){
    this.groupedVariants = {}
    
    this.variants.forEach(variant => {
        if (variant.product_ID === productId) {
            if (!this.groupedVariants[variant.variant_group_name]) {
              this.groupedVariants[variant.variant_group_name] = [];
            }
            this.groupedVariants[variant.variant_group_name].push({
                variant_name: variant.variant_name,
                variant_id: variant.variant_ID
            });
        }
    });
    // console.log('Grouped Variants:', this.groupedVariants);
    this.groupedVariants;
  }

  getSelectedVariantStock(productId: number): number {
    const variantId = this.variantIDs[productId];
    if (variantId !== -1 || variantId !== null || variantId !== undefined) {
      const variant = this.variantService.getVariant(productId, variantId);
      return variant ? variant.variant_stock : 0;
    }
    return 0;
  }

  mergeSelectedVariantToProduct(product: any) {
    const variantId = this.variantIDs[product.product_ID];
    let mergedData = product;
    if (variantId !== -1 || variantId !== null || variantId !== undefined) {
      const variant = this.variantService.getVariant(product.product_ID, variantId);
      mergedData =  {...mergedData, ...variant};
    }
    console.log('Merged Data:', mergedData);
    return mergedData;
  }

  changeProductUnitDiscount(prodDiscounts: string[], prodID: number, varID: number | null, lowest_id: number) {
    // debugger
    // console.log(prodDiscounts)
    const prodDiscountsNum = prodDiscounts.map(x => parseFloat(x))
    let value = prodDiscountsNum.map(x => ({variant_ID: (varID ? varID : null), discount: x}))
    // let value = {}
    // console.log(value)
    this.productDiscount[prodID] = value
    
    if(varID) {


      this.orders.forEach(order => {
        if(order.product_ID === prodID && order.variant_ID === varID){
          order.discount! = [...prodDiscountsNum]
          order.lowest_ID = lowest_id 
        }
      });

    } else {

      this.orders.forEach(order => {
        if(order.product_ID === prodID){
          order.discount! = [...prodDiscountsNum];
          order.lowest_ID = lowest_id 
        }
      });
    }

    console.log(this.orders)
   
    this.calculateTotalPrice();
  }

parseDiscountEntry(currProdId:number, stockDiscountEntry: StockDiscountEntry[], CurrVarId:number | null ) {
    if(CurrVarId) {
      return stockDiscountEntry.filter(x => x.variant_id === CurrVarId)
    } else if(currProdId) {
      return stockDiscountEntry.filter(x => x.product_id === currProdId)
    } else {
      return []
    }
  }
}

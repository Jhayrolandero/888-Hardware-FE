import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { mainPort } from '../../app.component';
import { Product, ProductArchive, ProductLowStock, StockDiscountEntry, Volume } from '../../interface/product';
import { LoadingService } from '../loading.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private product = new BehaviorSubject<Product[]>([]);
  product$ = this.product.asObservable();
  loaderState: string = "product"

  private productLowStock = new BehaviorSubject<ProductLowStock[]>([])
  productLowStock$ = this.productLowStock.asObservable()
  lowStockState: string = "productLowStock"

  private category = new BehaviorSubject<any[]>([]);
  category$ = this.category.asObservable();

  private volume = new BehaviorSubject<any[]>([]);
  volume$ = this.volume.asObservable();

  private stockDiscountEntry = new BehaviorSubject<StockDiscountEntry[]>([])
  stockDiscountEntry$ = this.stockDiscountEntry.asObservable()

  private productArchive = new BehaviorSubject<ProductArchive[]>([])
  productArchive$ = this.productArchive.asObservable()
  archiveState: string = "productArchive"
  

  constructor(
    private http: HttpClient,
    private loaderService: LoadingService
  ) { 
    this.initProduct();
    this.initCategories();
    this.initVolume();
    this.initProductLowStock();
    this.initStockDiscountEntry();
    this.initProductArchive()
  }

  initProductArchive() {
    this.loaderService.initLoading(this.archiveState)
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getArchivedProduct').subscribe({
      next: (value: any) => {
        console.log("Loading Archive: ", value.data)
        this.loaderService.stopLoading(this.archiveState)
        this.setProductArchiveState(value.data)
      },
      error: (error) => {
        console.error(`Product Archive error: ${error}`)
        this.loaderService.stopLoading(this.archiveState)
      }
    })
  }
  
  initProductLowStock() {
    this.loaderService.initLoading(this.lowStockState)
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getLowStock').subscribe({
      next: (value: any) => {
        console.log("Loading Lowstock...", value);
        this.setProductLowState(value.data)
        this.loaderService.stopLoading(this.lowStockState)
      },
      error: (error) => {
        console.log(error);
        this.loaderService.stopLoading(this.lowStockState)        
      }
    })
    
  }
  
  initProduct(){
    this.loaderService.initLoading(this.loaderState)
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getProduct').subscribe({
      next: (value: any) => {
        console.log("Loading Product...", value);
        this.setProductState(value.data);
        this.loaderService.stopLoading(this.loaderState)
      },
      error: (error) => {
        console.log(error);
        this.loaderService.stopLoading(this.loaderState)
      }
    })
  }

  initCategories(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getCategory').subscribe({
      next: (value: any) => {
        console.log("Loading Categories...", value);
        this.setCategoryState(value.data);
      },
      error: (error) => {
        console.log(error);
      }
    })
  }

  initVolume(){
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getVolume').subscribe({
      next: (value: any) => {
        console.log("Loading Volume...", value);
        this.setVolumeState(value.data);
      },
      error: (error) => {
        console.log(error);
      }
    })
  }

  initStockDiscountEntry() {
    return this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getStockDiscountEntry').subscribe({
      next: (value: any) => {
        console.log("Loading Discount Entry...", value);
        this.setStockDiscountEntry(value.data);
      },
      error: (error) => {
        console.log(error);
      }
    })

  }

  createProduct(form: FormGroup){
    let drop = false;
    if(form.value.has_variant === true){
      drop = true;
    }

    let product: Product = {
      product_ID: form.value.product_ID,
      category_ID: form.value.category_ID,
      category_name: form.value.category_name,
      product_name: form.value.product_name,
      product_code: form.value.product_code,
      product_stock: form.value.product_stock,
      product_stock_discount: form.value.product_stock_discount,
      unit_price: form.value.default_sell_price,
      unit_price_discount: form.value.unit_price_discount,
      default_stock_price: form.value.default_stock_price,
      description: form.value.description,
      product_image: form.value.product_image,
      brand: form.value.brand,
      unit_name: form.value.unit_name,
      has_variant: form.value.has_variant,
      has_volume: form.value.has_volume,
      low_stock_level: form.value.low_stock_level,
      critical_stock_level: form.value.critical_stock_level,
      isDropdown: drop,
      showTransaction: false,
      discount_value: null,
      discounted_price: null,
      latest_stock_entry_id: null,
      is_archived: false
    }


    return product;
  }

  addCategory(category: any){
    let oldState = this.category.getValue();
    let newState = [...oldState, category];
    this.setCategoryState(newState);
  }

 
  addVolume(volumes: Volume[]) {
    let oldState = this.volume.getValue();
    let newState = [...oldState];

    volumes.forEach(volume => {
        newState.push(volume);
    });

    console.log("new state on add product", newState);
    this.setVolumeState(newState);
  }

  editProduct(product: Product) {
    let id = product.product_ID;
    let oldState = this.product.getValue();
    
    let newState = oldState.map((oldProduct) => {
      if (oldProduct.product_ID === id) {
        return product; 
      }

      return oldProduct; 
    });

    this.setProductState(newState); 
  }

  editCategory(id: number, categoryName: string) {
    let oldState = this.category.getValue();
    let newState = oldState.map((oldCategory) => {
      if (oldCategory.category_ID === id) {
        return {
          ...oldCategory,
          category_name: categoryName
        };
      }
      return oldCategory;
    });
  
    this.setCategoryState(newState);
  }

  editVolume(volumes: Volume[]) {
    console.log("On editing the product, this is the volume array passed", volumes);
    let oldState = this.volume.getValue();
    
    let newState = oldState.map((oldVolume) => {
        let updatedVolume = volumes.find(v => v.volume_ID === oldVolume.volume_ID);
        return updatedVolume ? { ...oldVolume, ...updatedVolume } : oldVolume;
    });

    volumes.forEach((newVolume) => {
      if (!oldState.some(oldVolume => oldVolume.volume_ID === newVolume.volume_ID)) {
          newState.push(newVolume);
      }
    });

    console.log("Updated volume state", newState);
    this.setVolumeState(newState); 
  }

  deleteVolume(id: number){
    let oldState = this.volume.getValue();
    let newState = oldState.filter((v) => v.volume_ID !== id);
    console.log("deleted a volume", newState);
    this.setVolumeState(newState);
  }

  getProductstate() {
    return [...this.product.getValue()];
  }

  getCategoryState(){
    return this.category.getValue();
  }

  setProductState(data: Product[]){
    this.product.next([...data]);
  }

  setProductArchiveState(data: ProductArchive[]) {
    this.productArchive.next([...data])
  }

  setProductLowState(data: ProductLowStock[]){
    this.productLowStock.next([...data]);
  }

  setCategoryState(data: string[]){
    this.category.next([...data]);
  }

  setVolumeState(data: any[]){
    this.volume.next([...data]);
  }

  setStockDiscountEntry(data: StockDiscountEntry[]) {
    this.stockDiscountEntry.next([...data])
  }

  getVolumeState(){
    return this.volume.getValue();
  }

  addProduct(product: Product){ 
    console.log("Original product", product);
    let oldState = this.product.getValue();
    let newState = [...oldState, product];
    this.setProductState(newState);
  }

  addProductByID(product_ID: number, product: Product) {
    console.log("Adding product...: ", product);

    // Get the current state
    let oldState = this.product.getValue();

    // Ensure the product_ID comparison is correct and filter the old state
    let newState = oldState.filter(item => item.product_ID !== product_ID);

    // Add the new product
    let updatedState = [...newState, product];

    // Update the BehaviorSubject state
    this.product.next(updatedState); // Use `.next()` to push the new state

    // Log the new state
    console.log("Updated State: ", this.product.getValue());
}


  removeProductArchiveByID(product_ID: number) {
    console.log("Removing product...")
    let oldState = this.productArchive.getValue();
    let newState = oldState.filter(item => item.product_ID !== product_ID );
  
    this.setProductArchiveState(newState)
  }

  removeVariantArchiveByID(variant_ID: number) {
    console.log("Removing variant...")
    let oldState = this.productArchive.getValue();
    let newState = oldState.filter(item => item.variant_ID !== variant_ID);
  
    this.setProductArchiveState(newState)
  }

  addProductArchive(data: ProductArchive[]) {
    let oldState = this.productArchive.getValue()
    console.log("Orig: ", oldState)
    let newState = [...oldState, ...data]
    console.log("new: ", newState)

    this.setProductArchiveState(newState)
  }

  deleteProduct(id: number){
    let oldState = this.product.getValue();
    let newState = oldState.filter((product) => product.product_ID !== id);
    
    this.setProductState(newState);

    //to do: pag nag error, balik m ona lang yung previous state
  }

  addQuantity(inventory: any){
    console.log("Original inventory", this.product.getValue());
    let oldState = [...this.product.getValue()];
    let newState = oldState.map((product) => {
      if(product.product_ID === inventory.product_ID){
        return { ...product, product_stock: product.product_stock + inventory.quantity };
      }
      return product;
    });
    this.setProductState(newState);
  }

  deleteCategory(id: number){
    let oldState = this.category.getValue();
    let newState = oldState.filter((category) => category.category_ID !== id);
    this.setCategoryState(newState);

  }

  findProduct(id: number){
    //console.log("looking for product with id: ", id);
    let currentState = this.product.getValue();
    let product = currentState.find((product) => product.product_ID === id);
    return product;
  }

  findCategory(id: number){
    let currentState = this.category.getValue();
    let category = currentState.find((category) => category.category_ID === id);
    return category;
  }

  findVolume(id: number): Volume[] {
    let currentState = this.volume.getValue();
    let volume = currentState.filter((value) => value.product_ID === id);
    return volume;
  }

  updateOrderStock(quantity: number, product_ID: number){
    // console.log("this is the product id", product_ID);
    // console.log("old state", this.product.getValue());
    let oldState = this.product.getValue();
    let newState = oldState.map((product) => {
      if(product.product_ID === product_ID){
        product.product_stock = product.product_stock - quantity;
      }
      return product;
    });
    console.log("new state", newState);
    this.setProductState(newState);
  }

  updateSupplierStock(product: any){
    let oldState = this.product.getValue();
    let newState = oldState.map((prod) => {
      if(prod.product_ID === product.product_ID){
        prod.product_stock = prod.product_stock + product.incoming_quantity;
        prod.unit_price = product.unit_price;
        prod.default_stock_price = product.default_stock_price;
        prod.product_stock_discount = product.discount.join(", ");
      }
      return prod;
    });
    this.setProductState(newState);
  }

}

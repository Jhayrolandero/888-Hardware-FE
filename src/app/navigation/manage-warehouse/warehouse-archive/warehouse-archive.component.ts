import { Component } from '@angular/core';
import { mainPort } from '../../../app.component';
import { ProductArchive } from '../../../interface/product';
import { LoadingService } from '../../../services/loading.service';
import { ProductService } from '../../../services/store/product.service';
import { DataService } from '../../../services/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VariantService } from '../../../services/store/variant.service';
@Component({
  selector: 'app-warehouse-archive',
  templateUrl: './warehouse-archive.component.html',
  styleUrl: './warehouse-archive.component.css'
})
export class WarehouseArchiveComponent {

  productArchive: ProductArchive[] = []
  productArchiveDisplay: ProductArchive[] = []
  productArchiveLoading: boolean = true
  mainPort = mainPort

  constructor(
    private loaderService: LoadingService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private dataService: DataService,
    private variantService: VariantService
  ){  }
  

  ngOnInit() {
    this.loaderService.isLoading$(this.productService.archiveState).subscribe((loadState) => {
      this.productArchiveLoading = loadState
    })
    this.productService.productArchive$.subscribe(data => {
      this.productArchive = data

      this.productArchiveDisplay = this.parseArchiveDisplay()
    })
  }

  parseArchiveDisplay() {
    const grouped: { [key: number]: ProductArchive } = {};

    this.productArchive.forEach((item) => {
      const {
        product_ID,
        product_name,
        product_image,
        product_stock,
        product_code,
        archived_at,
        has_variant,
        variant_name,
        variant_code,
        variant_stock,
        variant_image,
        variant_archived_at,
        variant_ID,
        show_accordion,
        product_is_archived,
        variant_is_archive
      } = item;
  
      if (!grouped[product_ID]) {
        grouped[product_ID] = {
          product_ID,
          product_name,
          product_image,
          product_stock,
          product_code,
          archived_at,
          has_variant: Boolean(has_variant),
          variants: [],
          variant_name,
          variant_code,
          variant_stock,
          variant_image,
          variant_archived_at,
          variant_ID,
          show_accordion,
          product_is_archived,
          variant_is_archive
        };
      }
  
      if (has_variant && variant_ID !== null) {
        grouped[product_ID].variants.push({
          variant_name,
          variant_code,
          variant_stock,
          variant_image,
          variant_archived_at: variant_archived_at,
          variant_ID,
          variant_is_archive
        });
      }
    });
  
    return Object.values(grouped);
  }

  displayVariant(product_ID: number) {
    this.productArchiveDisplay = this.productArchiveDisplay.map(item =>
      item.product_ID === product_ID
        ? { ...item, show_accordion: !item.show_accordion }
        : item
    );
  }

  restoreProduct(product_ID: number) {
    this.dataService.patchObjectData({product_ID}, "restoreProduct").subscribe({
      next: (res:any) => {
        this.snackBar.open("Product Restore Successfully!", "Close", {
          duration: 2000,
        });

        this.productService.removeProductArchiveByID(product_ID)
        this.productService.addProductByID(product_ID, res.data.product[0])

        if(res.data.variant.length > 0) {
          this.variantService.addVariantByID(product_ID, res.data.variant)
        }
      },
      error: error => {
        this.snackBar.open("Error Restoring Product", "Close", {
          duration: 2000,
        });

        console.error("Restore Product: ",error)
      }
    })
  }

  restoreVariant(product_ID: number, variant_ID: number) {
    this.dataService.patchObjectData({product_ID, variant_ID}, "restoreVariant").subscribe({
      next: (res: any) => {
        this.snackBar.open("Variant Restore Successfully!", "Close", {
          duration: 2000,
        });

        this.productService.removeVariantArchiveByID(variant_ID)
        this.variantService.addVariantByID(product_ID, res.data.variant)
        
        if(res.data.product.length > 0) {
          this.productService.addProductByID(product_ID, res.data.product[0])
        }
      },
      error: error => {
        this.snackBar.open("Error Restoring Variant", "Close", {
          duration: 2000,
        });      
        console.error("Restore Variant: ",error)
      }
    })
  }
}

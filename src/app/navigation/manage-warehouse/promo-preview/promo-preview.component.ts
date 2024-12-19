
import { Component, Inject, Input, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product, Promo } from '../../../interface/product';
import { Router } from '@angular/router';
import { mainPort } from '../../../app.component';
import { EventEmitter } from '@angular/core';
@Component({
  selector: 'app-promo-preview',
  templateUrl: './promo-preview.component.html',
  styleUrl: './promo-preview.component.css'
})
export class PromoPreviewComponent {
  @Input() promo!: any;
  @Output() closePreview = new EventEmitter();
  port = mainPort;
  groupedVariants: { [key: string]: any[] } = {};
  promoType = '';

  constructor(
    private router: Router,
    
  ) {
  }

  ngOnInit() {
    if (this.promo.promotion_type === 'Discount') {
      this.promoType = 'Discount';
    } else {
      this.promoType = 'Bundle';
    }
    console.log(this.promo);
  }

  // variantSum(variants: Variant[]) {
  //   let sum = 0;
  //   variants.forEach((v) => {
  //     sum += v.variant_stock;
  //   });
  //   return sum;
  // }

  goTo(){
    this.closePreview.emit();
    
  }

  getUniqueProducts(promo: Promo): Product[] {
    const unique = new Map<number, Product>();
    promo.products.forEach(product => {
      unique.set(product.product_ID, product);
    });

    return Array.from(unique.values());
  }

  groupVariantsByProduct(promo: Promo): { [key: number]: Product[] } {
    const groupedVariants: { [key: number]: Product[] } = {};
    promo.products.forEach(product => {
      if (!groupedVariants[product.product_ID]) {
        groupedVariants[product.product_ID] = [];
      }
      groupedVariants[product.product_ID].push(product);
    });
  
    return groupedVariants;
  }
}

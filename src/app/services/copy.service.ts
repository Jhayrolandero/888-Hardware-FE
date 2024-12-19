import { Injectable } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { ProductService } from './store/product.service';
import { VariantService } from './store/variant.service';

import { Variant } from '../interface/variant';

@Injectable({
  providedIn: 'root'
})
export class CopyService {

  constructor(
    private productService: ProductService,
    private variantService: VariantService,
    private clipboardService: ClipboardService
  ) { }


  copyProductDetails(productId: number) {
    console.log("hehhe");
    const product = this.productService.findProduct(productId);
    if (!product) {
      console.log("Product not found");
      return;
    }
  
    if (product.has_variant) {
      console.log("Product has variant");
      const variants = this.variantService.findVariants(productId);
      let variantDetails = `${product.product_name} \n`;
  
      if (product.unit_price === 0) {
        variantDetails = `${product.product_name} \n\n`;
      }
  
      const groupedVariants = variants.reduce((groups, variant) => {
        const capitalizedGroupName = variant.variant_group_name.toUpperCase();
        if (!groups[capitalizedGroupName]) {
          groups[capitalizedGroupName] = {};
        }

        // Group by variant_type within each variant_group_name
        if (!groups[capitalizedGroupName][variant.variant_type]) {
          groups[capitalizedGroupName][variant.variant_type] = [];
        }

        // Add the variant to the appropriate group
        groups[capitalizedGroupName][variant.variant_type].push(variant);

        return groups;
      }, {} as { [key: string]: { [key: string]: Variant[] } });
      console.log("Grouped Variants ", groupedVariants);

      // Construct the details string
      for (const groupName in groupedVariants) {
        variantDetails += `\n${groupName}\n`;

        for(const variantType in groupedVariants[groupName]) {
          console.log(variantType === 'null');
          if(variantType != "null") variantDetails += `[${variantType}]\n`;

          let longestName = groupedVariants[groupName][variantType].reduce((max: string, variant: any) => variant.variant_name.length > max.length ? variant.variant_name : max, "");
          console.log("Longest Name: ", longestName);
          groupedVariants[groupName][variantType].forEach((variant: any) => {
            let variantDiscountString = variant.variant_unit_discount ? 
                                        variant.variant_unit_discount.split(",").map((disc: any) => disc+"%").join(" ") : 
                                        "";
            let formattedVariantName = variant.variant_name.padEnd(longestName.length, ' ');
            variantDetails += `${formattedVariantName}    P${variant.variant_unit_price}     ${variantDiscountString}\n`;
          });
        }
      }
  
      this.clipboardService.copyFromContent(variantDetails);
    } else {
      console.log("Product has no variant");
      const productDetails = `${product.brand}\n\n${product.product_name}\nPhp ${product.unit_price}`;
      this.clipboardService.copyFromContent(productDetails);
    }
  }
}


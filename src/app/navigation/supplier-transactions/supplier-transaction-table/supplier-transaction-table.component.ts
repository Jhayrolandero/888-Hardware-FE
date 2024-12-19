import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ProductService } from '../../../services/store/product.service';
import { VariantService } from '../../../services/store/variant.service';

@Component({
  selector: 'app-supplier-transaction-table',
  templateUrl: './supplier-transaction-table.component.html',
  styleUrl: './supplier-transaction-table.component.css'
})
export class SupplierTransactionTableComponent {
  @Input() data: any[] = [];
  
  dataSource = new MatTableDataSource<any>(this.data);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  ngAfterViewInit() {
    this.dataSource = new MatTableDataSource<any>(this.data);
    this.dataSource.paginator = this.paginator;
    console.log("Data: ", this.data);
  }

  constructor(
    private productService: ProductService,
    private variantService: VariantService,
  ) {
  }

  parseDiscountDisplay(discount: any){
    return discount.replace(/\d+/g, (match: any) => `${match}%`);
  }

  nameFetch(element: any){
    if(element.variant_ID === null){
      return this.productService.findProduct(element.product_ID)!.product_name;
    }
    else{
      return this.variantService.getVariant(element.product_ID, element.variant_ID)!.variant_name + " - " + this.productService.findProduct(element.product_ID)!.product_name;
    }
  }
}

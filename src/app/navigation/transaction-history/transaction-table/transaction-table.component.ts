import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-transaction-table',
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.css'
})
export class TransactionTableComponent {
  @Input() data: any[] = [];
  
  dataSource = new MatTableDataSource<any>(this.data);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  ngAfterViewInit() {
    this.dataSource = new MatTableDataSource<any>(this.data);
    this.dataSource.paginator = this.paginator;
    console.log(this.data)
  }

  parseDiscountDisplay(discount: any){
    return discount.replace(/\d+/g, (match: any) => `${match}%`);
  }

}

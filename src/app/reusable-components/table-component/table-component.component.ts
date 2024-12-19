import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-table-component',
  templateUrl: './table-component.component.html',
  styleUrl: './table-component.component.css'
})
export class TableComponentComponent {
  @Input() data: any[] = [];
  @Input() columns: object[] = [];
  header: string[] = []
  body: any[] =[]
  dataSource = new MatTableDataSource<any>(this.data);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 5; // Number of items per page
  currentPage = 1; // Current page number
  ngOnInit() {
    this.header = this.columns.map(x => Object.keys(x)[0])
    this.body = this.columns.map(x => Object.values(x)[0])
  }

  ngAfterViewInit() {
    this.dataSource = new MatTableDataSource<any>(this.data);
    this.dataSource.paginator = this.paginator;
    console.log(this.data)
  }

  parseDiscountDisplay(discount: any){
    return discount.replace(/\d+/g, (match: any) => `${match}%`);
  }

  get paginatedItems() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.data.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.data.length / this.pageSize);
  }

   // Change page
   changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getHeaderLengthArray(): number[] {
    return Array.from({ length: this.header.length }, (_, i) => i);
  }
}

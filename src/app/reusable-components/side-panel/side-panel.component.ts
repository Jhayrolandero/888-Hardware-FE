import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { SupplierProductPopup } from '../../interface/supplier-product-popup';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SupplierService } from '../../services/store/supplier.service';

@Component({
  selector: 'app-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.css'
})
export class SidePanelComponent {
  supplierProductPopup: SupplierProductPopup[] = [];
  name: string = '';
  searchParam = '';
  selectedFilter = '';
  isLoading = false;

  @Output() panelClosed = new EventEmitter<boolean>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<any>(this.supplierProductPopup);

  constructor(
    private supplierService: SupplierService
  ) {
    console.log('Initially ' + (window.navigator.onLine ? 'on' : 'off') + 'line');
  }

  ngAfterViewInit() {
    console.log("Supplier Product: ", this.supplierProductPopup);
    this.dataSource.paginator = this.paginator;
  }
  ngOnInit(){
    this.supplierService.supplierProductPopup$.subscribe((data) => {
      console.log("Supplier product data: ", data);
      this.supplierProductPopup = data[0];
      this.name = data[1];
      this.dataSource = new MatTableDataSource<any>(this.supplierProductPopup);

      if(this.supplierProductPopup.length === 0){
        this.isLoading = true;
      }
      else{
        this.isLoading = false;
      }
    });
  }

  parseDiscountDisplay(discount: any){
    return discount.replace(/\d+/g, (match: any) => `${match}%`);
  }

  onChangeSearch() {
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

  closePanel() {
    this.panelClosed.emit(false)
  }

  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
  }
  
  @ViewChild('resizablePane') resizablePane!: ElementRef;
  @ViewChild('container') container!: ElementRef;
  mouseIsDown = false;
  startY = 0;
  startHeight = 0;
  startContainerHeight = 0;

  onMouseDown(event: MouseEvent): void {
    this.mouseIsDown = true;
    this.startY = event.clientY;
    this.startHeight = this.resizablePane.nativeElement.offsetHeight;
    this.startContainerHeight = this.container.nativeElement.offsetHeight;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.mouseIsDown) return;

    const deltaY = -(event.clientY - this.startY);

    // console.log("Delta: ",deltaY)
    const newHeight = this.startHeight + deltaY;
    
    // console.log("New Height: ", newHeight)
    this.resizablePane.nativeElement.style.height = `${newHeight}px`;
    this.container.nativeElement.style.height = `${this.startContainerHeight + deltaY}px`;
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.mouseIsDown = false;
  }
}

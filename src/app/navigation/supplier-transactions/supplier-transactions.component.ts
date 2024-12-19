import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { Supplier, SupplierProduct, SupplierTransaction } from '../../interface/supplier';
import { DataService } from '../../services/data.service';
import { LoadingService } from '../../services/loading.service';
import { SupplierService } from '../../services/store/supplier.service';
import { SupplierTransactionDialogComponent } from './supplier-transaction-dialog/supplier-transaction-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../services/store/product.service';
import { VariantService } from '../../services/store/variant.service';
import { OfflineService } from '../../services/offline.service';
import { Transaction } from '../../interface/transaction';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-supplier-transactions',
  templateUrl: './supplier-transactions.component.html',
  styleUrl: './supplier-transactions.component.css'
})
export class SupplierTransactionsComponent {
  date = new Date();
  month = this.date.toLocaleString('default', { month: 'long' });
  year = this.date.getFullYear();
  searchFilter = '';
  searchParam = '';
  isLoading = false;
  selectedPaidList: any[] = []
  parsedSupplierProduct = new Map<number, any[]>();
  partialTransaction = new Map<string, SupplierTransaction[]>();
  hasPaid = false;
  hasUnpaid = false;
  hasPartial = false;

  selectingDate: boolean = false
  selectedMonthStart: string = ''
  selectedMonthEnd: string = ''
  sortDate: boolean = true

  filterPaid: boolean | undefined = undefined

  dropdownTransaction: SupplierTransaction | null = null
  supplierTransactions: SupplierTransaction[] = [];
  displayTransactions: SupplierTransaction[] = [];
  supplierProducts: SupplierProduct[] = [];

  sortAlphabetical: boolean = true // True = A-Z False = Z-A

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<any>(this.supplierProducts);

  ngAfterViewInit() {
    console.log("Supplier Product: ", this.supplierProducts);
    this.dataSource = new MatTableDataSource<any>(this.supplierProducts);
    this.dataSource.paginator = this.paginator;
  }

  updateDropdown(transaction: SupplierTransaction) {
    if (this.dropdownTransaction === transaction) {
      this.dropdownTransaction = null
    } else {
      this.dropdownTransaction = transaction
    }

  }
  

  constructor(
    private supplierService: SupplierService,
    private titleService: Title,
    private dataService: DataService,
    private productService: ProductService,
    private variantService: VariantService,
    private dialog: MatDialog,
    private loaderService: LoadingService,
    private snackBar: MatSnackBar,
    public offlineService: OfflineService

  ) {}

  ngOnInit(){
    this.titleService.setTitle("Supplier Transaction - 888 Hardware Trading");

    this.supplierService.supplierTransaction$.subscribe({
      next: (value: SupplierTransaction[]) => {
        console.log("Supplier Transaction has updated ", value);
        this.supplierTransactions = value;
        this.displayTransactions = [...this.supplierTransactions]
        this.hasPaid = this.displayTransactions.some(transaction => transaction.is_paid);
        this.hasUnpaid = this.displayTransactions.some(transaction => !transaction.is_paid && !transaction.paid_amount);
        this.hasPartial = this.displayTransactions.some(transaction => !transaction.is_paid && transaction.paid_amount);
        console.log("Has Paid: ", this.hasPaid, "Has Unpaid: ", this.hasUnpaid, "Has Partial: ", this.hasPartial);
        console.log(this.displayTransactions);

        this.displayTransactions = this.displayTransactions.map((transaction) => {
          console.log(transaction);
          let totalPaid = 0;

          let unixDates: any = [];
          if(transaction.paid_date_unix?.includes(',')){
            console.log("Multiple Dates: ", transaction.paid_date_unix.split(','));
            unixDates = transaction.paid_date_unix.split(',').map((date) => {
              return this.unixToDate(+date);
            });
          }
          else{
            unixDates = [this.unixToDate(+transaction.paid_date_unix!)];
          }
          console.log("Date: ", unixDates);
          console.log ("Initilalized Supplier Transaction: ", { ...transaction, is_paid: !!transaction.is_paid, unix_dates: unixDates });
          return {...transaction, is_paid: !!transaction.is_paid, unix_dates: unixDates};
      })
    }
    });

    this.supplierService.supplierProduct$.subscribe({
      next: (value: SupplierProduct[]) => {
        console.log("Supplier Product has updated ", value);
        this.supplierProducts = value;
        this.ngAfterViewInit();
      }
    });
  }

  changeTableContent(transactionID: number){
    let selectedTransactionProducts: any[] = []
    this.supplierProducts.forEach((product) => {
      if(product.supplier_transaction_ID === transactionID){
        selectedTransactionProducts.push(product);
      }
    });
    this.dataSource = new MatTableDataSource<any>(selectedTransactionProducts);
    this.dataSource.paginator = this.paginator;
  }

  dropdownChecker(transaction: SupplierTransaction){
    console.log(this.displayTransactions);
    this.displayTransactions.forEach((transact) => {
      if(transaction.supplier_transaction_ID === transact.supplier_transaction_ID){
        console.log("Dropped Down: ", transact);
        this.changeTableContent(transact.supplier_transaction_ID);
        transact.is_dropdown = !transact.is_dropdown;

      }
      else{
        transact.is_dropdown = false;
      }
    
    });
  }

  calculateTotalPayable(transactArr: any){

    return transactArr.reduce((acc: number, val: any) => {
      return acc += parseFloat(val.total_cost);
    }, 0);
  }

  unixToDate(unixTimestamp: number, inMilliseconds: boolean = false): string {
    const date = new Date(inMilliseconds ? unixTimestamp : unixTimestamp * 1000);

    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month}-${day}-${year}`;
}



  parseSupplierProduct(supplier: any){
    if(this.parsedSupplierProduct.has(supplier.supplier_transaction_ID)){
      return;
    }
    else{
      let temp = this.supplierProducts
      .filter(product => product.supplier_transaction_ID === supplier.supplier_transaction_ID)
      .map(product => {
        const prodTemp = this.productService.findProduct(product.product_ID);
        let variantTemp = null;
    
        if (prodTemp?.has_variant) {
          variantTemp = this.variantService.getVariant(product.product_ID, product.variant_ID);
        }
    
        console.log("Product Temp: ", prodTemp);
        console.log("Variant Temp: ", variantTemp);
    
        // Merge objects with a fallback for undefined values
        return { ...product, ...prodTemp, ...variantTemp };
      });
    


      this.parsedSupplierProduct.set(supplier.supplier_transaction_ID, temp);
    }
    console.log("Parsed Supplier Product: ", this.parsedSupplierProduct);
  }

  onChangeSearch(){
    let supTemp = this.supplierService.getSupplierTransactionState();

    //Name Filter
    supTemp = supTemp.filter((product) => {
      switch(this.searchFilter){
        case 'Supplier Name':
          return product.supplier_name.toLowerCase().includes(this.searchParam!.toLowerCase());
        case 'DR No.':
          return product.dr_number.toLowerCase().includes(this.searchParam!.toLowerCase());
        case 'Method of Payment':
          return product.method_of_payment.toLowerCase().includes(this.searchParam!.toLowerCase());
      }
      return product.supplier_name.toLowerCase().includes(this.searchParam!.toLowerCase());
    });
    this.displayTransactions = supTemp;
  }

  sameClientChecker(transaction: any){
    return this.selectedPaidList.length > 0 && this.selectedPaidList[0].supplier_name !== transaction.supplier_name;
  }

  checkboxUpdate(event:any, transaction: any){
    if(event.checked){
      this.selectedPaidList.push(transaction);
    }
    else{
      let index = this.selectedPaidList.indexOf(transaction);
      this.selectedPaidList.splice(index, 1);
    }


    console.log("Selected Paid List: ", this.selectedPaidList);
  }

  supplierTransactionProductParse(supp: SupplierTransaction){
    let temp = this.supplierProducts.filter((product) => {
      return product.supplier_transaction_ID === supp.supplier_transaction_ID;
    });


    return temp;
  }

  processPartiallyPaidGroup(event?: any){
    this.partialTransaction.clear();
    //Only for paid tabs
    if(event?.index === 1 || event === null){
      //Iterate through current transaction BH
      this.displayTransactions.forEach((transaction: SupplierTransaction) => {
        //Only for cases of partially paid and delivered
        if((transaction.paid_date_unix !== '0') && (!transaction.is_paid) && (transaction.paid_date_unix)){

          if(this.partialTransaction.has(transaction.paid_date_unix)){
            let temp = this.partialTransaction.get(transaction.paid_date_unix)!;
            temp.push(transaction);
            this.partialTransaction.set(transaction.paid_date_unix, temp);
          }
          else{
            this.partialTransaction.set(transaction.paid_date_unix, [transaction]);
          }
  
        }
      });
      console.log("Partial Transaction: ", this.partialTransaction);
    }

  }




  parseDiscountDisplay(discount: any){
    return discount.replace(/\d+/g, (match: any) => `${match}%`);
  }

  transactionProductParse(supp: SupplierTransaction): SupplierProduct[] {
    let temp = this.supplierProducts.filter((product) => {
      return product.supplier_transaction_ID! === supp.supplier_transaction_ID;
    });

    return temp;
  }

  parseTransactionProduct(transaction: any){
    if(this.parsedSupplierProduct.has(transaction.supplier_transaction_ID)){
      return;
    }
    else{
      let localTransactionProduct = this.supplierProducts.filter((product: any) => product.supplier_transaction_ID === transaction.supplier_transaction_ID);
      this.parsedSupplierProduct.set(transaction.supplier_transaction_ID, localTransactionProduct);
      console.log(localTransactionProduct);
      console.log(this.parsedSupplierProduct);
    }
  }

  paidDialog(supp?: any){
    let transactID = this.selectedPaidList.length > 0 ? this.selectedPaidList : [supp!];
    let totalToPay = transactID.reduce((acc: number, val: SupplierTransaction) => acc + +val.total_cost, 0);

    let dialog = this.dialog.open(SupplierTransactionDialogComponent, {
      width: '600px',
      data: {
        subtotal: totalToPay,
        discount: transactID[0]?.discount,
        method_of_payment: transactID[0]?.method_of_payment,
        paid_amount: transactID[0]?.paid_amount,
        selected_list: transactID
      }
    });

    dialog.afterClosed().subscribe({
      next: (value: any) => {
        if(value[0]){
          console.log("value: ...", value);
          let paidAmount = '';
          let paymentDetail = '';
          
          //Assign new paid value and payment details to parse and concatenate
          if(transactID[0].paid_amount){
            console.log("Has existing paid amount");
            paidAmount += transactID[0].paid_amount + (',' + value[2]);
            paymentDetail += transactID[0].method_of_payment + (',' + value[1]);
          }
          else{
            console.log("No existing paid amount");
            paidAmount = value[2]+'';
            paymentDetail = value[1];
          }
          
          //Calculate total payment based on paid amount array column
          let totalPaid = 0;

          if(paidAmount.includes(',')){
            totalPaid = paidAmount.split(',').reduce((acc: number, val: string) => acc + parseFloat(val), 0);
          }
          else{
            totalPaid = parseFloat(paidAmount);
          }
          console.log("Paid Amount: ", paidAmount, totalPaid);
          
          //Determine if payment is satisfied
          let isPaid = false;
          console.log(totalToPay, totalPaid);
          if(+totalToPay == totalPaid){
            isPaid = true;
          }

          this.dataService.patchObjectData({
            transactionList: transactID,
            total_price: transactID[0].total_cost,
            method_of_payment: paymentDetail,
            paid_amount: paidAmount,
            is_paid: isPaid,
            payment_date: transactID[0].payment_date,
            }
            , 'updateSupplierTransactionPaid').subscribe({
            next: (ret: any) => {
              console.log("Supplier Transaction has been updated", value);
              if(this.selectedPaidList.length > 0){
                console.log(this.selectedPaidList);
                this.supplierService.updateSupplierTransactionPaid(this.selectedPaidList, paymentDetail, ret.date, ret.is_paid, paidAmount, ret.paid_date_unix, totalPaid);
              }
              else{
                this.supplierService.updateSupplierTransactionPaid([supp!], paymentDetail, ret.date, ret.is_paid, paidAmount, ret.paid_date_unix, totalPaid);
              }

              this.snackBar.open("Payment has been confirmed", "Close", {
                duration: 2000
              });

              this.processPartiallyPaidGroup(null);
              this.selectedPaidList = [];
            },
            error: (error) => {
              console.log(error);
              this.snackBar.open("An error has occured", "Close", {
                duration: 2000
              });
              this.selectedPaidList = [];
            }
          });
        }
      }
    })


  }

  sortSupplierName() {

    // True A-Z
    if(this.sortAlphabetical) {
      this.displayTransactions = this.displayTransactions.sort((a, b) => a.supplier_name.localeCompare(b.supplier_name))
    } 
    // Z - A
    else {
      this.displayTransactions = this.displayTransactions.sort((a, b) => b.supplier_name.localeCompare(a.supplier_name))
    }
  }


  filterDateByMonthRange() {
    if (!(this.selectedMonthStart && this.selectedMonthEnd)) {
      this.selectingDate = false;
      this.displayTransactions = [...this.supplierTransactions];
      return;

    }


    // Convert selected range to date objects for comparison
    const startDate = new Date(`${this.selectedMonthStart}-1`);
    const endDate = new Date(`${this.selectedMonthEnd}-1`);

    if(startDate > endDate) {
      this.snackBar.open('Invalid date range!', 'Close', {
        duration: 2000,
      })
      return 
    }

    endDate.setMonth(endDate.getMonth() + 1); // Move to the first day of the next month for inclusive range
  
    this.displayTransactions = this.supplierTransactions.filter(x => {
      const transactionDate = new Date(x.date);
      return transactionDate >= startDate && transactionDate < endDate;
    });
      
  }
  

  sortDateMonth() {
    if(this.sortDate) {
      this.displayTransactions = this.displayTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else {
      this.displayTransactions = this.displayTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  }

  filterPaidFunc() {
    switch(this.filterPaid) {
      case true:
        this.displayTransactions = this.supplierTransactions.filter(x => x.is_paid)
        break;
      case false:
        this.displayTransactions = this.supplierTransactions.filter(x => !x.is_paid)
        break;
      case undefined:
        this.displayTransactions = [...this.supplierTransactions]
        break;
      default:
          break;
    }
  }

  filterSupplier(type: string, filter: Event | boolean | undefined) {
    // console.log("Before: ", this.displayTransactions)
    // this.filterDateByMonthRange();

    switch (type) {
      case 'name':
        this.sortAlphabetical = filter as boolean;
        this.sortSupplierName(); 
        break;
      case 'dateStart': {
        this.displayTransactions = [...this.supplierTransactions]  
        const inputStart = filter as Event;
        const inputStartElem = inputStart.target as HTMLInputElement;
        this.selectedMonthStart = inputStartElem.value;
        this.filterDateByMonthRange(); 
        break;
}      case 'dateEnd':
        this.displayTransactions = [...this.supplierTransactions]  
        const inputEnd = filter as Event;
        const inputEndElem = inputEnd.target as HTMLInputElement;
        this.selectedMonthEnd = inputEndElem.value;
        this.filterDateByMonthRange(); 
        break;
      case 'dateSort':
        this.sortDate = filter as boolean;
        this.sortDateMonth(); 
        break;
      case 'filterPaid':
        this.filterPaid = filter as boolean
        this.filterPaidFunc()
        break;
      default:
          break;
    }
  }

  exportSupplierTransaction(){
    this.dataService.downloadObjectData("exportSupplierTransaction").subscribe({
      next: (value: any) => {
        console.log(value);
        const url = window.URL.createObjectURL(value);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Supplier Transactions Report 2024.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.log(error);
        // this.snackBar.open("Error Updating Client", "Close", {
        //   duration: 2000,
        // });
      }
    });
  }

  
}

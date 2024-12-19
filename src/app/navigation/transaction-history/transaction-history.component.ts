import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { Order } from '../../interface/product';
import { Transaction } from '../../interface/transaction';
import { DataService } from '../../services/data.service';
import { TransactionService } from '../../services/store/transaction.service';
import { PaymentConfirmDialogComponent } from './payment-confirm-dialog/payment-confirm-dialog.component';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivityLogComponent } from '../activity-log/activity-log.component';
import { HttpClient } from '@angular/common/http';
import { mainPort } from '../../app.component';
import { OfflineService } from '../../services/offline.service';


@Component({
  selector: 'app-transaction-history',
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.css'
})
export class TransactionHistoryComponent {
  date = new Date();
  month = this.date.toLocaleString('default', { month: 'long' });
  year = this.date.getFullYear();
  parsedTransactionProduct = new Map<number, any[]>();
  transactions: Transaction[] = [];
  displayTransactions: Transaction[] = [];
  partialTransaction = new Map<string, Transaction[]>();
  transactionProduct: any[] = [];
  searchFilter = '';
  searchParam = '';
  isLoading = false;
  selectedPaidList: Transaction[] = [];
  hasPaid = false;
  hasUnpaid = false;
  hasPartial = false;

  isEditing = false;
  new_dr_number = '';
  new_transaction_date = '';  
  currentlyEditing: Transaction | null = null;
  currentUrl = '';
  selectedMonthStart: string = ''
  selectedMonthEnd: string = ''

  constructor(
    private router: Router,
    private transactionService: TransactionService,
    private titleService: Title,
    private dataService: DataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    public offlineService: OfflineService
  ){
    this.currentUrl = this.router.url.split('/')[2];
  }


  editForm = new FormGroup({
    transaction_ID: new FormControl<number>(0),
    dr_number: new FormControl<string>(''),
    transaction_detail: new FormControl<string | null>(''),
  });

  ngOnInit(){
    this.titleService.setTitle("Sales - 888 Hardware Trading");
    console.log(this.displayTransactions);
    this.transactionService.sales$.subscribe({
      next: (value: Transaction[]) => {
        console.log(value)
        this.transactions = value;
        this.displayTransactions = [...this.transactions]
        this.hasPaid = this.displayTransactions.some(transaction => transaction.is_paid);
        this.hasUnpaid = this.displayTransactions.some(transaction => !transaction.is_paid);
        this.hasPartial = this.displayTransactions.some(transaction => transaction.is_delivered && !transaction.is_paid && transaction.paid_amount);
        console.log(this.hasPaid, this.hasUnpaid, this.hasPartial);
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

          return {...transaction, is_paid: !!transaction.is_paid, is_delivered: !!transaction.is_delivered, unix_dates: unixDates};
        });
        console.log(" Supplier Transaction has updated ", this.displayTransactions);
        console.log("Has Paid: ", this.hasPaid);
        this.processPartiallyPaidGroup(null);
      }
    });

    this.transactionService.transactionProduct$.subscribe({
      next: (value: Order[]) => {
        console.log("Transaction Product has updated ", value);
        this.transactionProduct = value;
      }
    });

    this.transactionService.salesLoader$.subscribe({
      next: (value: boolean) => {
        this.isLoading = value;
      }
    });

    this.displayTransactions = this.displayTransactions.map((transaction) => {
      transaction.is_dropdown = false;
      return transaction;
    });
  }



  unixToDate(unixTimestamp: number, inMilliseconds: boolean = false): string {
    const date = new Date(inMilliseconds ? unixTimestamp : unixTimestamp * 1000);

    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month}-${day}-${year}`;
}

  goTo(url: string){
    this.router.navigate(['/order-landing/' + url]);
    this.currentUrl = url;
  }

  processPartiallyPaidGroup(event?: any){
    this.partialTransaction.clear();
    //Only for paid tabs
    if(event?.index === 1 || event === null){
      //Iterate through current transaction BH
      this.displayTransactions.forEach((transaction) => {
        //Only for cases of partially paid and delivered
        if((transaction.paid_date_unix !== '0') && (!transaction.is_paid) && (transaction.is_delivered) && (transaction.paid_date_unix)){

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

  parseTransactionProduct(transaction: any){
    if(this.parsedTransactionProduct.has(transaction.transaction_ID)){
      return;
    }
    else{
      let localTransactionProduct = this.transactionProduct.filter((product: any) => product.transaction_ID === transaction.transaction_ID);
      this.parsedTransactionProduct.set(transaction.transaction_ID, localTransactionProduct);
      console.log(localTransactionProduct);
      console.log(this.parsedTransactionProduct);
    }
  }
  
  exportYearlySales(){
    this.dataService.downloadObjectData("exportYearlySales").subscribe({
      next: (value: any) => {
        console.log(value);
        const url = window.URL.createObjectURL(value);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Sales Report 2024.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  filterMonthRange(dateType: string, date: Event) {

    switch(dateType) {
      case 'start': {
        const inputStart = date;
        const inputStartElem = inputStart.target as HTMLInputElement;
        this.selectedMonthStart = inputStartElem.value;
        break
      }
      case 'end': {
        const inputEnd = date;
        const inputEndElem = inputEnd.target as HTMLInputElement;
        this.selectedMonthEnd = inputEndElem.value;
        break
      }
      default:
        break
    }

    if (!(this.selectedMonthStart && this.selectedMonthEnd)) {
      // this.selectingDate = false;
      this.displayTransactions = [...this.transactions];
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
  
    this.displayTransactions = this.transactions.filter(x => {
      const transactionDate = new Date(x.transaction_date);
      return transactionDate >= startDate && transactionDate < endDate;
    });

  }

  sameClientChecker(transaction: Transaction){
    return this.selectedPaidList.length > 0 && this.selectedPaidList[0].client_name !== transaction.client_name;
  }

  checkboxUpdate(event:any, transaction: Transaction){
    if(event.checked){
      this.selectedPaidList.push(transaction);
    }
    else{
      let index = this.selectedPaidList.indexOf(transaction);
      this.selectedPaidList.splice(index, 1);
    }


    console.log("Selected Paid List: ", this.selectedPaidList);
  }

  transactionProductParse(supp: Transaction): Transaction[] {
    let temp = this.transactionProduct.filter((product) => {
      return product.transaction_ID! === supp.transaction_ID;
    });

    return temp;
  }

  onChangeSearch(){
    const searchWord = this.searchParam.toLowerCase().trim()
    console.log(this.transactions);
    console.log("Search Word: ", searchWord);
    switch(this.searchFilter.toLowerCase()) {
      case 'client name':
      case '':
        this.displayTransactions = this.transactions.filter(x => x.client_name.toLowerCase().includes(searchWord));
        break;
      case 'dr no':
        this.displayTransactions = this.transactions.filter(x => (x.dr_number ?? '').toLowerCase().includes(searchWord));
        break;
      case 'payment details':
        this.displayTransactions = this.transactions.filter(x => x.transaction_detail?.toLowerCase().includes(searchWord));
        break;
      default:
        break
    }
  }

  calculateTotalPayable(transactArr: any){

    return transactArr.reduce((acc: number, val: any) => {
      return acc += parseFloat(val.subtotal_price);
    }, 0);
  }


  confirmPaymentDetails(transaction?: Transaction){
    let transactID = this.selectedPaidList.length > 0 ? this.selectedPaidList : [transaction!];
    let totalToPay = transactID.reduce((acc: number, val: Transaction) => acc + +val.subtotal_price, 0);

    let dialogRef = this.dialog.open(PaymentConfirmDialogComponent, {
      width: '50%',
      data: {
        subtotal: totalToPay,
        discount: transactID[0]?.discount,
        transaction_detail: transactID[0]?.transaction_detail,
        paid_amount: transactID[0]?.paid_amount,
        selected_list: transactID
      }
    });

    dialogRef.afterClosed().subscribe({
      next: (value: any) => {

        if(value[0]){

          console.log("value: ...", value);
          let paidAmount = '';
          let paymentDetail = '';
          
          //Assign new paid value and payment details to parse and concatenate
          if(transactID[0].paid_amount){
            console.log("Has existing paid amount");
            paidAmount += transactID[0].paid_amount + (',' + value[2]);
            paymentDetail += transactID[0].transaction_detail + (',' + value[1]);
          }
          else{
            console.log("No existing paid amount");
            paidAmount = value[2]+'';
            paymentDetail = value[1];
          }
          
          //Calculate total payment based on paid amount array column
          let totalPaid = 0;
          console.log("Paid Amount: ", paidAmount);
          if(paidAmount.includes(',')){
            totalPaid = paidAmount.split(',').reduce((acc: number, val: string) => acc + parseFloat(val), 0);
          }
          else{
            totalPaid = parseFloat(paidAmount);
          }

          
          //Determine if payment is satisfied
          let isPaid = false;
          console.log(totalToPay, totalPaid);
          if(+totalToPay == totalPaid){
            isPaid = true;
          }

          let dr = this.selectedPaidList.length > 0 ? this.selectedPaidList.reduce((acc: any, val) => acc + "DR No." + val.dr_number + ", ", "") : transaction!.dr_number;
          this.dataService.patchObjectData({
            transactionList: transactID,
            subtotal_price: transactID[0].subtotal_price,
            payment_method: paymentDetail,
            paid_amount: paidAmount,
            is_paid: isPaid,
            payment_date: transactID[0].paid_date,
            dr_number: dr
          }, 'payOrder').subscribe({
            next: (res: any) => {
              //Statefulness
              if(this.selectedPaidList.length > 0){
                this.transactionService.updatePaymentStatus(this.selectedPaidList, paymentDetail, res.date, res.is_paid, res.paid_amount, res.paid_date_unix, totalPaid)
              }
              else{
                this.transactionService.updatePaymentStatus([transaction!], paymentDetail, res.date, res.is_paid, res.paid_amount, res.paid_date_unix, totalPaid,)
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
          })
        }
      }
    });
  }

  // edit functionality here

  editRow(trans: Transaction){
    trans.is_dropdown = false;
    this.isEditing = true;
    this.currentlyEditing = trans;

    this.editForm.patchValue({
      transaction_ID: this.currentlyEditing?.transaction_ID,
      dr_number: trans.dr_number,
      transaction_detail: trans.transaction_detail
    });
  }

  cancelChanges() {
    this.isEditing = false;
    this.currentlyEditing = null;
    this.editForm.reset();
  }

  submitChanges() {
    if (this.editForm && this.editForm.valid) {
      const updatedTransaction = {
        ...this.currentlyEditing,
        dr_number: this.editForm.value.dr_number,
        transaction_detail: this.editForm.value.transaction_detail
      };


      this.transactionService.editTransaction(updatedTransaction);

      this.dataService.patchData(this.editForm, "editSales").subscribe({
        next: (value: any) => {
          this.snackBar.open("Sale Transaction has been updated", "Close", {
            duration: 2000
          });

          this.isEditing = false;
          this.currentlyEditing = null;
          this.editForm.reset();
        },
        error: (error) => {
          console.log(error);

          this.snackBar.open("Error Updating Sale Transaction", "Close", {
            duration: 2000
          });


          if (this.currentlyEditing) {
            this.transactionService.editTransaction(this.currentlyEditing);
          }

          this.isEditing = false;
          this.currentlyEditing = null;
          this.editForm.reset();
        }
      });
  
    }
  }


}


import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BestPerformanceProduct, ProductHistory, SalesAnalytics, SaleVsExpenses, TodoListNumber } from '../interface/analytics';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from './loading.service';
import { mainPort } from '../app.component';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  private productPerformance = new BehaviorSubject<BestPerformanceProduct[]>([])
  productPerformance$ = this.productPerformance.asObservable()
  productPerformanceLoaderState: string = "productPerformance"

  private salesAnalytics = new BehaviorSubject<SalesAnalytics | null>(null)
  salesAnalytics$ = this.salesAnalytics.asObservable()
  salesAnalyticsState = "salesAnalytics"

  private salesVsExpensesAnalytics = new BehaviorSubject<SaleVsExpenses>({sales: [], expenses: []})
  salesVsExpensesAnalytics$ = this.salesVsExpensesAnalytics.asObservable()
  salesVsExpensesAnalyticsState = 'salesVsExpensesAnalytics'

  private todoListNumber = new BehaviorSubject<TodoListNumber>({unpaid_clients: 0, unpaid_transaction: 0, to_deliver: 0})
  todoListNumber$ = this.todoListNumber.asObservable()
  todoListNumberState = 'todoListNumber'

  private productHistory = new BehaviorSubject<ProductHistory[]>([]);
  productHistory$ = this.productHistory.asObservable();
  productHistoryState = 'productHistory'

  constructor(
    private http: HttpClient,
    private loaderService: LoadingService
  ) { 

    this.initBestPerformanceProduct()
    this.initSalesAnalytics()
    this.initSalesVsExpenses()
    this.initTodoListNumber()
    this.initProductHistory()
  }


  initBestPerformanceProduct() {
    this.loaderService.initLoading(this.productPerformanceLoaderState)
    this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getPerformanceProducts').subscribe({
      next: (value:any) => {
        this.loaderService.stopLoading(this.productPerformanceLoaderState)
        this.setBestPerformanceProduct(value.data)
      } ,
      error: (error) => {
        console.log("Best Performance error: ",error);
        this.loaderService.stopLoading(this.productPerformanceLoaderState)
      }     
    })
  }

  initSalesAnalytics() {
    this.loaderService.initLoading(this.salesAnalyticsState)
    this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getSalesAnalytics').subscribe({
      next: (value:any) => {
        this.loaderService.stopLoading(this.salesAnalyticsState)
        this.setSalesAnalytics(value.data)
      },
      error: (error) => {
        console.error("Sale analytics error: ",error)
        this.loaderService.stopLoading(this.salesAnalyticsState)
      }
    })
  }

  initSalesVsExpenses(query: string = 'this_month') {
    this.loaderService.initLoading(this.salesVsExpensesAnalyticsState)
    this.http.get(mainPort + `/888-Hardware-Trading/API-hardware-trading/main/getSalesVsExpenses?show_by=${query}`).subscribe({
      next: (value : any) => {
        this.loaderService.stopLoading(this.salesVsExpensesAnalyticsState)
        this.setSaleVsExpenses(value.data)
      },
      error: (error) => {
        console.error("Sale vs Expenses error: ",error)
        this.loaderService.stopLoading(this.salesVsExpensesAnalyticsState)
      }
    })
  }

  initTodoListNumber() {
    this.loaderService.initLoading(this.todoListNumberState)
    this.http.get(mainPort + '/888-Hardware-Trading/API-hardware-trading/main/getTodoListNumber').subscribe({
      next: (value : any) => {
        this.loaderService.stopLoading(this.todoListNumberState)
        this.setTodoListNumber(value.data)
      },
      error: (error) => {
        console.error("Todo List Number error: ",error)
        this.loaderService.stopLoading(this.todoListNumberState)
      }
    })

  }

  initProductHistory(query: string = 'recent') {
    this.loaderService.initLoading(this.productHistoryState)
    this.http.get(mainPort + `/888-Hardware-Trading/API-hardware-trading/main/getProductHistory?filter_by=${query}`).subscribe({
      next: (value:any) => {
        this.loaderService.stopLoading(this.productHistoryState)
        this.setProductHistory(value.data)
      },
      error: (error) => {
        console.error("Product History error: ",error)
        this.loaderService.stopLoading(this.productHistoryState)
      }
    })
  }

  setBestPerformanceProduct(data: BestPerformanceProduct[]) {
    console.log('Performance: ',data)
    this.productPerformance.next([...data])
  }

  setSalesAnalytics(data: SalesAnalytics) {
    console.log('Sales analytics: ',data)
    this.salesAnalytics.next(data)
  }

  setSaleVsExpenses(data: SaleVsExpenses) {
    console.log('Sales vs Expenses: ',data)
    this.salesVsExpensesAnalytics.next(data)
  }

  setTodoListNumber(data: TodoListNumber) {
    this.todoListNumber.next(data)
  }

  setProductHistory(data: ProductHistory[]) {
    const sortedData = data.sort((a, b) => {
      if (!a.recent_transaction_date) return 1; // Treat null as last in sort
      if (!b.recent_transaction_date) return -1;
      return new Date(b.recent_transaction_date).getTime() - new Date(a.recent_transaction_date).getTime();
    });
    this.productHistory.next(sortedData)
  }

  queryProductHistory(query:string) {
    this.initProductHistory(query)
  }

  querySaleVsRevenue(query:string) {
    this.initSalesVsExpenses(query)
  }

  timeSince(date: string) {
    const now = new Date();
    const givenDate = new Date(date); // Ensure the input is a Date object
    const diffInMs = now.getTime() - givenDate.getTime();
  
    const seconds = Math.floor(diffInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
  
    if (seconds < 60) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
  
}

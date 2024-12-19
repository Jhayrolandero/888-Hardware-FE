import { Component, effect, OnInit, signal, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { mainPort } from '../../app.component';
import { BestPerformanceProduct, ProductHistory, SalesAnalytics, SaleVsExpenses, TodoListNumber } from '../../interface/analytics';
import { ProductLowStock } from '../../interface/product';
import { AnalyticsService } from '../../services/analytics.service';
import { TokenService } from '../../services/authentication/token.service';
import { LoadingService } from '../../services/loading.service';
import { ProductService } from '../../services/store/product.service';
import { TransactionService } from '../../services/store/transaction.service';
import { VariantService } from '../../services/store/variant.service';
import { OfflineService } from '../../services/offline.service';
import { DataService } from '../../services/data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements  OnInit {
  productLowStock : ProductLowStock[] = []
  lowStockLoading : boolean = false
  stockFilterTerm: string = ''

  mainPort = mainPort 

  salesAnalytics: SalesAnalytics|null = null
  salesAnalyticsLoading: boolean = false

  private saleVsExpensesChart: Chart | null = null;
  saleVsExpenses: SaleVsExpenses = {sales : [], expenses : []}
  saleVsExpensesLoading: boolean = false
  
  private bestProductChart: Chart | null = null;
  bestPerformanceProduct: BestPerformanceProduct[] = []
  bestPerformanceFilter = signal('quantity')

  productHistory: ProductHistory[] = []
  productHistoryLoading: boolean = false

  toDoListNumber: TodoListNumber = {unpaid_clients: 0, unpaid_transaction: 0, to_deliver: 0}
  toDoListNumberLoading: boolean = false

  totalSales = 0
  orderDraftsLength = 0
  salesOfMonthLength = 0

  // transactions products of the month (transaction products has no delivery date : ( )
  salesOfMonth : any[] = []
  transactionsOfMonth : any[] = []

  screenWidth: number = 0;


  port = mainPort
  constructor(
    private productService: ProductService,
    private loaderService: LoadingService,
    private variantService: VariantService,
    private dataService: DataService,
    private salesService: TransactionService,
    private titleService: Title,
    private tokenService: TokenService,
    public analyticsService: AnalyticsService,
    public router: Router,
    public offlineService: OfflineService
  ) {
    effect(() => {
      this.parseBestProduct(this.bestPerformanceFilter(), this.bestPerformanceProduct)
    })
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

  ngOnInit(): void {
    this.screenWidth = window.innerWidth;  

    this.titleService.setTitle("Dashboard - 888 Hardware Trading");
    // this.createBestProductChart();
    // this.createLineChart();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-based month
    const currentYear = currentDate.getFullYear();

    
    this.analyticsService.productPerformance$.subscribe((data) => {
      this.bestPerformanceProduct = data
      this.parseBestProduct('quantity', data)

    })

    this.analyticsService.salesAnalytics$.subscribe((data) => {
      this.salesAnalytics = data
      console.log("From dashboard: ",this.salesAnalytics)
    })

    this.analyticsService.salesVsExpensesAnalytics$.subscribe((data) => {
      this.saleVsExpenses = data
      console.log("From dashboard: ",this.saleVsExpenses)
      this.createLineChart()

    })

    this.analyticsService.todoListNumber$.subscribe((data) => {
      this.toDoListNumber = data
    })

    this.productService.productLowStock$.subscribe((data) => {
      this.productLowStock = data
    })

    this.analyticsService.productHistory$.subscribe((data) => {
      this.productHistory = data
    })

    this.loaderService.isLoading$(this.productService.lowStockState).subscribe(loadState => {
      this.lowStockLoading = loadState
    })

    this.loaderService.isLoading$(this.analyticsService.salesAnalyticsState).subscribe(loadState => {
      this.salesAnalyticsLoading = loadState
    })

    this.loaderService.isLoading$(this.analyticsService.salesVsExpensesAnalyticsState).subscribe(loadState => {
      this.saleVsExpensesLoading = loadState
    })

    this.loaderService.isLoading$(this.analyticsService.todoListNumberState).subscribe(loadState => {
      this.toDoListNumberLoading = loadState
    })

    this.loaderService.isLoading$(this.analyticsService.productHistoryState).subscribe(loadState => {
      console.log("Loading: ",loadState)
      this.productHistoryLoading = loadState
    })



  }


  getUserName() {
    return this.tokenService.getUsername();
  }

  monthNow() {
    const date = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = date.getMonth();
    return monthNames[month];
  }

  

  yearNow() {
    const date = new Date();
    return date.getFullYear();
  }

  goTo(url: string){
    this.router.navigate(['/order-landing/' + url]);
  }

  parseBestProduct(type: string, data: BestPerformanceProduct[]) {
    let result: BestPerformanceProduct[] = []
    switch(type) {
      case 'quantity':
        result = data.sort((a, b) => parseFloat(b.total_quantity_sold) - parseFloat(a.total_quantity_sold));
        break;
      case 'revenue':
        result = data.sort((a, b) => b.total_revenue - a.total_revenue);
        break;
      default:
        break;
    }

    this.createBestProductChart(result)
  }

  createBestProductChart(dataBestPerformance: BestPerformanceProduct[]): void {
    if (this.bestProductChart) {
      this.bestProductChart.destroy(); // Destroy the existing chart
    }

    const length = 5
  
    const labels = dataBestPerformance.slice(0,length).map(x => x.has_variant ? x.variant_name : x.product_name);

    let rawData = []

    if(this.bestPerformanceFilter() === 'revenue') {
      rawData = dataBestPerformance.slice(0,length).map(x => x.total_revenue);
    } else {
      rawData = dataBestPerformance.slice(0,length).map(x => parseFloat(x.total_quantity_sold));
    }
  
    // Apply logarithmic transformation
    const dataInput = rawData.map(value => Math.log(value + 1));
  
    const data = {
      labels: labels,
      datasets: [{
        label: 'Most sold quantity',
        data: dataInput,
        backgroundColor: [
          'rgba(235, 143, 113, 0.8)',
          'rgba(235, 143, 113, 0.8)',
          'rgba(235, 143, 113, 0.8)',
          'rgba(235, 143, 113, 0.8)',
        ],
        borderWidth: 1,
        barThickness: 50,
      }]
    };
  
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: data,
      options: {
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.bestPerformanceFilter() === 'quantity' ? 'Quantity Sold' : 'Total Revenue',
              
            },
            // max: Math.max(...rawData)
          },
          x: {  
            ticks:{
                display: false // Hides only the labels of the x-axis 
              
            },
        }
        },
        plugins: {

          legend: {
            display: false,
          },
          tooltip: {
            callbacks : {
              label : (item : any) => {
                console.log("callback item: ",item)
                return this.bestPerformanceFilter() === 'quantity' 
                ? 
                `Quantity sold: ${rawData[item.dataIndex]}` 
                : 
                `Total Revenue: ₱${rawData[item.dataIndex].toLocaleString(undefined,{ minimumFractionDigits: 2 })}`
              }
            }
          },
        },
        
        elements: {
          bar: {
            borderRadius: 10,
          },
        },
       
      },
    };
  
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    this.bestProductChart = new Chart(canvas, config);
  }
  
  thisYear() {
    return new Date().getFullYear()
  }
  

  createLineChart(): void {
    if (this.saleVsExpensesChart) {
      this.saleVsExpensesChart.destroy(); // Destroy the existing chart
    }

    let inputLabel = []

    if(this.saleVsExpenses.sales.length > 5) {

      inputLabel = this.saleVsExpenses!.sales.map(x => `Month ${x.dates}`)
    } else {

      inputLabel = this.saleVsExpenses!.sales.map(x => `Week ${x.dates}`)
    }


    console.log("Input label: ", inputLabel)
    
    const salesInput = this.saleVsExpenses!.sales.map(x => (x.cost))
    console.log("Input label: ", salesInput)
    
    const expensesInput = this.saleVsExpenses!.expenses.map(x => (x.cost))
    console.log("Input label: ", expensesInput)

    const data = {
      labels: inputLabel,
      datasets: [{
        label: 'Sales',
        data: salesInput,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },{
        label: 'Expenses',
        data: expensesInput,
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
    };

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: data,
      options: {
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true
          }
        },
        elements: {
          line: {
            tension: 0.4 
          }
        }
      }
    };

    this.saleVsExpensesChart = new Chart(
      document.getElementById('revenueChart') as HTMLCanvasElement,
      config
    );
  }


  createPieChart() {
    const data = {
      labels: [
        'Category A',
        'Category B',
        'Category C',

      ],
      datasets: [
        {
          // label: ['Cheque', 'Cash'],
          data: [300,180, 210],
          backgroundColor: [
            'rgb(235,143,113)',
            'rgb(83,104,138)',
            'rgb(91, 202, 216)'
          ],
          hoverOffset: 2
        }

    
      ]
  //   };

  //   const config: ChartConfiguration<'pie'> = {
  //     type: 'pie',
  //     data: data,
  //     options: {
  //       maintainAspectRatio: false
  //     }
  //   };

  //   const myChart = new Chart(
  //     document.getElementById('pieChart') as HTMLCanvasElement,
  //     config
  //   );
  // }
      }
    }}

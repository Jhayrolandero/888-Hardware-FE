import { Component, OnInit, signal, ChangeDetectorRef, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { LogService } from '../../services/store/log.service';
import { Log } from '../../interface/log';
import { LoadingService } from '../../services/loading.service';
import { OfflineService } from '../../services/offline.service';
@Component({
  selector: 'app-activity-log',
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.css'
})
export class ActivityLogComponent implements OnInit {
  logs: Log[] = [];
  //Make array of logs grouped by date
  groupedLogs: { date: string; logs: Log[] }[] = [];
  // paginatedLogs: { [number]: this.groupedLogs : { date: string; logs: Log[] }[]}

  isLoading = true

  readonly panelOpenState = signal(false);
  Object: any;

ngOnInit(): void {
  // debugger
  this.titleService.setTitle('Activity Logs - 888 Hardware Trading');

  this.loaderService.isLoading$(this.logService.logState).subscribe(
    res => {
      this.isLoading = res
    }
  )
  
  this.logService.logs$.subscribe({
    next: (value: Log[]) => {
      this.groupLogsByDate(value);
      console.log('Logs have updated', value);
    },
  });
}

  constructor(
    private titleService: Title,
    private logService: LogService,
    private cdr: ChangeDetectorRef,
    private loaderService: LoadingService,
    public offlineService: OfflineService
  ) { }

  nextPage() {
    this.logService.callPagination()
  }

  isLastPage() {
    return this.logService.stopPagination
  }

  parseMainAction(action: Log) {
    let addedString = "Created ";
    let editedString = "Edited ";
    let deletedString = "Deleted ";

    let apiEndpoint = action.log_action.split("/")[action.log_action.split("/").length - 1];
    let apiDeleteEndpoint = action.log_action.split("/")[action.log_action.split("/").length - 2].replace("delete", "");
    
    switch (action.log_type) {
      case "POST":
        switch (apiEndpoint) {
          case "addProduct":
          case "addCategory":
          case "addClient":
          case "addPromo":
          case "addSupplier":
            return addedString + action.log_description + " as a new " + apiEndpoint.substring(3);
          case "addMassTransaction":
            return "Added bundle of new inventory stocks"

          case "addTransaction":
            return "Created order draft " + action.log_description;
          default:
            return "Added Something";
        }

      case "PATCH":
        switch (apiEndpoint) {
          case "editProduct":
          case "editCategory":
          case "editVariant":
          case "editSales":
          case "editClient":
          case "editSupplier":
          case "editPromo":
            return editedString + action.log_description + " in " + apiEndpoint.substring(4);
          case "editOrderDraft":
            return editedString + action.log_description + "'s order in drafts"
          case "payOrder":
            return "Order for " + action.log_description + " has been paid";
          case "deliverOrder":
            return "Order for " + action.log_description + " has been delivered";
          default:
            return "Edited Something";
        }
        
      case "DELETE":
        return deletedString + action.log_description + " in " + apiDeleteEndpoint;
      default:
        return "did something";
    }
  }

  // Groups logs based on their date
  groupLogsByDate(logs: Log[]) {
    const groupedLogsMap: { [key: string]: Log[] } = {};
    logs.forEach((log) => {
      const date = new Date(log.log_date).toDateString();
      if (!groupedLogsMap[date]) {
        groupedLogsMap[date] = [];
      }
      groupedLogsMap[date].push(log);
    });

    // Convert to array for sorting
    this.groupedLogs = Object.entries(groupedLogsMap)
    .map(([date, logs]) => ({ date, logs }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

}

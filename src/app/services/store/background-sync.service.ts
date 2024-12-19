import { Injectable } from '@angular/core';
import { db } from './indexeddb'
import { TokenService } from '../authentication/token.service';

interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

declare global {
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager;
  }

  interface SyncEvent {
    readonly lastChance: boolean;
    readonly tag: string;
  }

  interface ServiceWorkerGlobalScopeEventMap {
    sync: SyncEvent;
  }
}

@Injectable({
  providedIn: 'root'
})
export class BackgroundSyncService {
  private  token = this.tokenService.getToken();

  constructor(private tokenService: TokenService) {
    console.log("Pizza tarantella i love chris tmas");
    // Register service worker for some reason
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./custom-service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            registration.update();
          }, (error) => {
            console.log('ServiceWorker registration failed: ', error);
          });
      });
    }
   }

  
   //Creates a new record on IndexedDB
  async addNewRequest(body: any, request: string) {
    await db.requestLists.add({
      package: body,
      requestType: request
    })
  }

  async trafficHandler() {
    const registration = await navigator.serviceWorker.ready;
    const tags = await registration.sync.getTags();
    console.log("Tags: ", tags);
    if(!tags.includes('queue-data')) {
      this.backgroundSync();
    }
    else{
      console.log("Background sync already registered!");
    }
  }

  backgroundSync() {
    navigator.serviceWorker.ready.then((registration) => {
      registration.active!.postMessage(
        this.token
      );
    });
    setTimeout(() =>
      {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.sync.register('queue-data');
          });
        }
      }, 2000);

  }
}

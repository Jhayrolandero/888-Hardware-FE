import { Component } from '@angular/core';
import { liveQuery } from 'dexie';
import { db } from '../../../services/store/indexeddb';

@Component({
  selector: 'app-pending-request',
  templateUrl: './pending-request.component.html',
  styleUrl: './pending-request.component.css'
})
export class PendingRequestComponent {
  requestLists$ = liveQuery(() => db.requestLists.toArray());

  constructor(){
    // Listen to BroadcastChannel for updates
    const broadcast = new BroadcastChannel('dexie-updates');
    broadcast.onmessage = (event) => {
      if (event.data.type === 'delete') {
        // Trigger Dexie's liveQuery to refresh
        db.requestLists.where('id').equals(event.data.id).delete();
      }
    };
  }
}

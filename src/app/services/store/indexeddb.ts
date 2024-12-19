// db.ts
import Dexie, { Table } from 'dexie';

export interface Request {
  id?: number;
  package: any;
  requestType: string;
}
export class AppDB extends Dexie {
  requestLists!: Table<Request, number>;

  constructor() {
    super('888-Hardware-DB');
    this.version(3).stores({
        requestLists: '++id',
    });
  }
}

export const db = new AppDB();

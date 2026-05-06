import Dexie, { type EntityTable } from 'dexie';

export interface Note {
  id?: number;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export class AppDB extends Dexie {
  notes!: EntityTable<Note, 'id'>;

  constructor() {
    super('pwa-vorlage');
    this.version(1).stores({
      notes: '++id, createdAt, updatedAt',
    });
  }
}

export const db = new AppDB();

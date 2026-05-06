import { useLiveQuery } from 'dexie-react-hooks';
import { type Note, db } from './schema';

export function useNotes(): Note[] {
  const result = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []);
  return result ?? [];
}

export async function addNote(title: string, body: string): Promise<number> {
  const now = Date.now();
  return db.notes.add({ title, body, createdAt: now, updatedAt: now }) as Promise<number>;
}

export function deleteNote(id: number): Promise<void> {
  return db.notes.delete(id);
}

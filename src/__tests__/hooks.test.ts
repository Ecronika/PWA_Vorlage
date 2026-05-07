import { addNote, deleteNote } from '@/db/hooks';
import { db } from '@/db/schema';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(async () => {
  await db.notes.clear();
});

describe('addNote', () => {
  it('inserts a note with timestamps and returns the id', async () => {
    const before = Date.now();
    const id = await addNote('titel', 'body');
    const after = Date.now();

    expect(typeof id).toBe('number');
    const stored = await db.notes.get(id);
    expect(stored?.title).toBe('titel');
    expect(stored?.body).toBe('body');
    expect(stored?.createdAt).toBeGreaterThanOrEqual(before);
    expect(stored?.createdAt).toBeLessThanOrEqual(after);
    expect(stored?.updatedAt).toBe(stored?.createdAt);
  });
});

describe('deleteNote', () => {
  it('removes the note with the given id', async () => {
    const id = await addNote('todo', '');
    await deleteNote(id);
    const stored = await db.notes.get(id);
    expect(stored).toBeUndefined();
  });
});

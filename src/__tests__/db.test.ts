import { db } from '@/db/schema';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(async () => {
  await db.notes.clear();
});

describe('db.notes', () => {
  it('persists a note and reads it back', async () => {
    const id = await db.notes.add({
      title: 'erste',
      body: 'inhalt',
      createdAt: 1000,
      updatedAt: 1000,
    });
    const note = await db.notes.get(id);
    expect(note).toMatchObject({
      title: 'erste',
      body: 'inhalt',
      createdAt: 1000,
      updatedAt: 1000,
    });
  });

  it('returns notes ordered by updatedAt descending', async () => {
    await db.notes.add({ title: 'alt', body: '', createdAt: 1, updatedAt: 1 });
    await db.notes.add({ title: 'neu', body: '', createdAt: 2, updatedAt: 2 });
    const notes = await db.notes.orderBy('updatedAt').reverse().toArray();
    expect(notes.map((n) => n.title)).toEqual(['neu', 'alt']);
  });
});

import { addNote } from '@/db/hooks';
import { type FormEvent, useState } from 'react';

export function NoteForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await addNote(title.trim(), body.trim());
    setTitle('');
    setBody('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg bg-slate-800 p-4 shadow"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-300">Titel</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-brand-500"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-300">Inhalt</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="rounded bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-brand-500"
        />
      </label>
      <button
        type="submit"
        className="self-start rounded bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-600"
      >
        Hinzufügen
      </button>
    </form>
  );
}

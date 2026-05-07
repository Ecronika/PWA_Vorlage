import { deleteNote, useNotes } from '@/db/hooks';

export function NoteList() {
  const notes = useNotes();

  if (notes.length === 0) {
    return <p className="text-slate-400">Noch keine Notizen.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded-lg bg-slate-800 p-4 shadow ring-1 ring-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-slate-100">{note.title}</h3>
              {note.body && <p className="mt-1 whitespace-pre-wrap text-slate-300">{note.body}</p>}
            </div>
            <button
              type="button"
              onClick={() => note.id !== undefined && deleteNote(note.id)}
              aria-label={`Löschen ${note.title}`}
              className="shrink-0 rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-100"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

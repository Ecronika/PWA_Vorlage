import { NoteForm } from './components/NoteForm';
import { NoteList } from './components/NoteList';
import { UpdateBanner } from './components/UpdateBanner';

export function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <UpdateBanner />
      <header>
        <h1 className="text-3xl font-bold text-brand-500">PWA Vorlage</h1>
        <p className="text-slate-400">Notizen, lokal in IndexedDB.</p>
      </header>
      <NoteForm />
      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-200">Deine Notizen</h2>
        <NoteList />
      </section>
    </main>
  );
}

import { useUpdatePrompt } from '@/lib/pwa';

export function UpdateBanner() {
  const { needRefresh, dismiss, refresh } = useUpdatePrompt();
  if (!needRefresh) return null;

  return (
    <output className="flex items-center justify-between gap-3 rounded-lg bg-brand-500 px-4 py-3 text-white">
      <span>Neue Version verfügbar.</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={refresh}
          className="rounded bg-white/20 px-3 py-1 hover:bg-white/30"
        >
          Neu laden
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded px-2 py-1 hover:bg-white/10"
          aria-label="Hinweis schließen"
        >
          ✕
        </button>
      </div>
    </output>
  );
}

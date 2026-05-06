# PWA-Vorlage Grundstruktur Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lauffähige, wiederverwendbare PWA-Vorlage mit Notiz-Beispielanwendung, ausgeliefert über Caddy in einem Docker-Container.

**Architecture:** Vite kompiliert React+TypeScript+Tailwind v4 zu statischem Bundle; `vite-plugin-pwa` injiziert einen Workbox-basierten Service Worker; Dexie persistiert Notizen in IndexedDB; Multi-Stage-Docker baut die App und serviert sie über Caddy mit lokal vertrauenswürdiger TLS-CA.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Tailwind CSS v4, Dexie 4, Workbox 7 (via vite-plugin-pwa), Vitest + React Testing Library + fake-indexeddb, Biome, Caddy, Docker.

**Spec:** [`docs/superpowers/specs/2026-05-06-pwa-vorlage-grundstruktur-design.md`](../specs/2026-05-06-pwa-vorlage-grundstruktur-design.md)

---

## Datei-Struktur (was am Ende existieren muss)

| Pfad | Verantwortung |
| --- | --- |
| `package.json` | Abhängigkeiten + npm-Scripts |
| `tsconfig.json` | Strict-TS-Konfig fürs App-Bundle |
| `tsconfig.node.json` | TS-Konfig für `vite.config.ts` |
| `vite.config.ts` | Vite + React + Tailwind + PWA + Vitest |
| `biome.json` | Linter + Formatter |
| `index.html` | Vite-Einstiegspunkt |
| `.gitignore` | Standard Node + Vite-Ignores |
| `.dockerignore` | Schließt `node_modules`, `.git`, `dist` aus |
| `src/main.tsx` | React-Bootstrap + SW-Registrierung |
| `src/App.tsx` | Layout, lädt UpdateBanner + NoteForm + NoteList |
| `src/index.css` | Tailwind v4 `@import` + `@theme`-Tokens |
| `src/sw.ts` | Custom Service Worker (Workbox `injectManifest`) |
| `src/db/schema.ts` | Dexie-Klasse + `Note`-Interface |
| `src/db/hooks.ts` | `useNotes`, `addNote`, `deleteNote` |
| `src/lib/pwa.ts` | `useUpdatePrompt`-Hook (wraps `useRegisterSW`) |
| `src/components/NoteForm.tsx` | Formular zum Anlegen einer Notiz |
| `src/components/NoteList.tsx` | Liste vorhandener Notizen mit Lösch-Button |
| `src/components/UpdateBanner.tsx` | Hinweis-Banner für SW-Updates |
| `src/test/setup.ts` | Vitest-Setup (fake-indexeddb, RTL-Cleanup) |
| `src/__tests__/db.test.ts` | Dexie-Schema-Test |
| `src/__tests__/hooks.test.ts` | Hooks-Tests |
| `src/__tests__/NoteForm.test.tsx` | NoteForm-Test |
| `src/__tests__/NoteList.test.tsx` | NoteList-Test |
| `public/favicon.svg` | App-Favicon |
| `public/icons/icon-192.png` | PWA-Icon-Platzhalter |
| `public/icons/icon-512.png` | PWA-Icon-Platzhalter |
| `public/icons/icon-maskable-512.png` | PWA-Maskable-Icon-Platzhalter |
| `Caddyfile` | Caddy-Konfig (HTTP- + HTTPS-Profil) |
| `Dockerfile` | Multi-Stage Build (Node → Caddy) |
| `docker-compose.yml` | Lokales Deploy mit persistenten Caddy-Volumes |
| `README.md` | Anleitung "Vorlage benutzen" |

---

## Task 1: Projekt-Bootstrap (package.json, tsconfig, .gitignore)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `.gitignore`

- [ ] **Step 1: `package.json` anlegen**

```json
{
  "name": "pwa-vorlage",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "description": "Wiederverwendbare PWA-Grundstruktur",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "biome check .",
    "format": "biome format --write .",
    "docker:build": "docker build -t pwa-vorlage .",
    "docker:up": "docker compose up -d --build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "dexie": "^4.0.10",
    "dexie-react-hooks": "^1.1.7"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vite-plugin-pwa": "^0.20.5",
    "vitest": "^2.1.2",
    "workbox-expiration": "^7.1.0",
    "workbox-precaching": "^7.1.0",
    "workbox-routing": "^7.1.0",
    "workbox-strategies": "^7.1.0"
  }
}
```

- [ ] **Step 2: `tsconfig.json` anlegen**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["vite/client", "vite-plugin-pwa/client", "vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: `tsconfig.node.json` anlegen**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "emitDeclarationOnly": true,
    "composite": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

> Note: composite projects must emit; `emitDeclarationOnly: true` prevents JS output (Vite already handles that) while keeping the `.tsbuildinfo` + `.d.ts` artifacts that `composite` requires. Those artifacts are gitignored in Step 4.

- [ ] **Step 4: `.gitignore` anlegen**

```
node_modules
dist
dist-ssr
*.local
.DS_Store
.vscode/*
!.vscode/extensions.json
.idea
*.log
coverage
*.tsbuildinfo
*.d.ts
```

- [ ] **Step 5: `npm install` ausführen**

Run: `npm install`
Expected: ohne Fehler, `node_modules/` und `package-lock.json` werden angelegt.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json .gitignore
git commit -m "chore: bootstrap pwa-vorlage with deps and tsconfig"
```

---

## Task 2: Vite + React-Skelett (ohne Tailwind, ohne PWA)

**Files:**
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`

- [ ] **Step 1: `vite.config.ts` (minimal — wird in späteren Tasks erweitert)**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(projectRoot, 'src') }
  },
  server: { host: true }
})
```

> Note: `__dirname` is not defined in ESM. Resolving the project root via
> `import.meta.url` is the portable, idiomatic ESM pattern.

- [ ] **Step 2: `index.html`**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#1e293b" />
    <title>PWA Vorlage</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: `src/App.tsx` (Skelett, wird in Task 10 erweitert)**

```tsx
export function App() {
  return (
    <main>
      <h1>PWA Vorlage</h1>
      <p>Skelett — wird in späteren Tasks befüllt.</p>
    </main>
  )
}
```

- [ ] **Step 5: `src/index.css` (leer, wird in Task 3 mit Tailwind befüllt)**

```css
/* Tailwind kommt in Task 3 */
```

- [ ] **Step 6: `public/favicon.svg` anlegen**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1e293b"/><text x="32" y="42" font-size="32" font-family="sans-serif" fill="#e0e7ff" text-anchor="middle">P</text></svg>
```

- [ ] **Step 7: Dev-Server starten und prüfen**

Run: `npm run dev`
Expected: Vite startet auf `http://localhost:5173`, Browser zeigt "PWA Vorlage". Server stoppen mit `Ctrl+C`.

- [ ] **Step 8: Build prüfen**

Run: `npm run build`
Expected: TypeScript compile OK, `dist/` enthält `index.html` + Assets.

- [ ] **Step 9: Commit**

```bash
git add vite.config.ts index.html src/ public/favicon.svg
git commit -m "feat: vite + react skeleton renders"
```

---

## Task 3: Tailwind v4 integrieren

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/index.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Tailwind-Plugin in `vite.config.ts` einfügen**

Modify `vite.config.ts` — add Tailwind plugin:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  server: { host: true }
})
```

- [ ] **Step 2: `src/index.css` mit Tailwind v4 + Theme-Tokens**

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.55 0.15 260);
  --color-brand-600: oklch(0.48 0.16 260);
}

html, body, #root {
  height: 100%;
}
body {
  @apply bg-slate-900 text-slate-100 antialiased;
}
```

- [ ] **Step 3: `src/App.tsx` mit Tailwind-Klassen testen**

```tsx
export function App() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-brand-500">PWA Vorlage</h1>
      <p className="mt-2 text-slate-300">Tailwind v4 läuft.</p>
    </main>
  )
}
```

- [ ] **Step 4: Dev-Server starten und visuell prüfen**

Run: `npm run dev`
Expected: Heading erscheint in Brand-Farbe (blauviolett), dunkler Hintergrund, leichter Padding-Abstand. `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/index.css src/App.tsx
git commit -m "feat: integrate tailwind v4 with brand tokens"
```

---

## Task 4: Biome (Lint + Format)

**Files:**
- Create: `biome.json`

- [ ] **Step 1: `biome.json` anlegen**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": {
    "ignore": ["dist", "node_modules", "coverage", "package-lock.json"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

- [ ] **Step 2: Lint ausführen**

Run: `npm run lint`
Expected: Keine Fehler, ggf. Warnungen ohne Build-Bruch.

- [ ] **Step 3: Format ausführen**

Run: `npm run format`
Expected: Dateien werden ggf. einheitlich formatiert; danach `git diff` prüfen.

- [ ] **Step 4: Commit**

```bash
git add biome.json src/ vite.config.ts
git commit -m "chore: add biome lint+format config"
```

---

## Task 5: Vitest + Test-Setup

**Files:**
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/__tests__/smoke.test.ts`

- [ ] **Step 1: `vite.config.ts` um Vitest-Block erweitern**

Add a `test` block. Final shape of the file:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  server: { host: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true
  }
})
```

- [ ] **Step 2: `src/test/setup.ts` anlegen**

```ts
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 3: Smoke-Test schreiben (failing)**

Create `src/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('runs and finds expect/jest-dom matchers', () => {
    expect(1 + 1).toBe(2)
  })

  it('has indexedDB available (fake-indexeddb)', () => {
    expect(typeof indexedDB).toBe('object')
    expect(indexedDB).not.toBeNull()
  })
})
```

- [ ] **Step 4: Tests ausführen**

Run: `npm run test:run`
Expected: 2 passing tests in `smoke.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/test src/__tests__/smoke.test.ts
git commit -m "test: vitest + jsdom + fake-indexeddb setup"
```

---

## Task 6: Dexie-Schema (TDD)

**Files:**
- Create: `src/__tests__/db.test.ts`
- Create: `src/db/schema.ts`

- [ ] **Step 1: Test schreiben (failing)**

Create `src/__tests__/db.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { db } from '@/db/schema'

afterEach(async () => {
  await db.notes.clear()
})

describe('db.notes', () => {
  it('persists a note and reads it back', async () => {
    const id = await db.notes.add({
      title: 'erste',
      body: 'inhalt',
      createdAt: 1000,
      updatedAt: 1000,
    })
    const note = await db.notes.get(id)
    expect(note).toMatchObject({
      title: 'erste',
      body: 'inhalt',
      createdAt: 1000,
      updatedAt: 1000,
    })
  })

  it('returns notes ordered by updatedAt descending', async () => {
    await db.notes.add({ title: 'alt', body: '', createdAt: 1, updatedAt: 1 })
    await db.notes.add({ title: 'neu', body: '', createdAt: 2, updatedAt: 2 })
    const notes = await db.notes.orderBy('updatedAt').reverse().toArray()
    expect(notes.map((n) => n.title)).toEqual(['neu', 'alt'])
  })
})
```

- [ ] **Step 2: Test ausführen, sicherstellen dass er fehlschlägt**

Run: `npm run test:run -- db.test`
Expected: FAIL — `Cannot find module '@/db/schema'`.

- [ ] **Step 3: Minimale Implementierung in `src/db/schema.ts`**

```ts
import Dexie, { type EntityTable } from 'dexie'

export interface Note {
  id?: number
  title: string
  body: string
  createdAt: number
  updatedAt: number
}

export class AppDB extends Dexie {
  notes!: EntityTable<Note, 'id'>

  constructor() {
    super('pwa-vorlage')
    this.version(1).stores({
      notes: '++id, createdAt, updatedAt',
    })
  }
}

export const db = new AppDB()
```

- [ ] **Step 4: Test ausführen, sicherstellen dass er passt**

Run: `npm run test:run -- db.test`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/__tests__/db.test.ts
git commit -m "feat(db): dexie schema for notes"
```

---

## Task 7: Dexie-Hooks (TDD)

**Files:**
- Create: `src/__tests__/hooks.test.ts`
- Create: `src/db/hooks.ts`

- [ ] **Step 1: Test schreiben (failing)**

Create `src/__tests__/hooks.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { db } from '@/db/schema'
import { addNote, deleteNote } from '@/db/hooks'

afterEach(async () => {
  await db.notes.clear()
})

describe('addNote', () => {
  it('inserts a note with timestamps and returns the id', async () => {
    const before = Date.now()
    const id = await addNote('titel', 'body')
    const after = Date.now()

    expect(typeof id).toBe('number')
    const stored = await db.notes.get(id)
    expect(stored?.title).toBe('titel')
    expect(stored?.body).toBe('body')
    expect(stored?.createdAt).toBeGreaterThanOrEqual(before)
    expect(stored?.createdAt).toBeLessThanOrEqual(after)
    expect(stored?.updatedAt).toBe(stored?.createdAt)
  })
})

describe('deleteNote', () => {
  it('removes the note with the given id', async () => {
    const id = await addNote('todo', '')
    await deleteNote(id)
    const stored = await db.notes.get(id)
    expect(stored).toBeUndefined()
  })
})
```

- [ ] **Step 2: Test ausführen, fehlschlagen lassen**

Run: `npm run test:run -- hooks.test`
Expected: FAIL — module `@/db/hooks` nicht gefunden.

- [ ] **Step 3: `src/db/hooks.ts` implementieren**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Note } from './schema'

export function useNotes(): Note[] {
  const result = useLiveQuery(
    () => db.notes.orderBy('updatedAt').reverse().toArray(),
    []
  )
  return result ?? []
}

export async function addNote(title: string, body: string): Promise<number> {
  const now = Date.now()
  return db.notes.add({ title, body, createdAt: now, updatedAt: now })
}

export function deleteNote(id: number): Promise<void> {
  return db.notes.delete(id)
}
```

- [ ] **Step 4: Tests ausführen**

Run: `npm run test:run -- hooks.test`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/db/hooks.ts src/__tests__/hooks.test.ts
git commit -m "feat(db): hooks (useNotes, addNote, deleteNote)"
```

---

## Task 8: NoteForm-Komponente (TDD)

**Files:**
- Create: `src/__tests__/NoteForm.test.tsx`
- Create: `src/components/NoteForm.tsx`

- [ ] **Step 1: Test schreiben (failing)**

Create `src/__tests__/NoteForm.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteForm } from '@/components/NoteForm'
import { db } from '@/db/schema'

afterEach(async () => {
  await db.notes.clear()
})

describe('<NoteForm />', () => {
  it('persists a note when submitted and clears the inputs', async () => {
    const user = userEvent.setup()
    render(<NoteForm />)

    await user.type(screen.getByLabelText(/titel/i), 'Einkaufen')
    await user.type(screen.getByLabelText(/inhalt/i), 'Brot, Milch')
    await user.click(screen.getByRole('button', { name: /hinzufügen/i }))

    const stored = await db.notes.toArray()
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ title: 'Einkaufen', body: 'Brot, Milch' })

    expect((screen.getByLabelText(/titel/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/inhalt/i) as HTMLTextAreaElement).value).toBe('')
  })

  it('does not submit when the title is empty', async () => {
    const user = userEvent.setup()
    render(<NoteForm />)
    await user.click(screen.getByRole('button', { name: /hinzufügen/i }))
    const stored = await db.notes.toArray()
    expect(stored).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Test fehlschlagen lassen**

Run: `npm run test:run -- NoteForm.test`
Expected: FAIL — module `@/components/NoteForm` nicht gefunden.

- [ ] **Step 3: `src/components/NoteForm.tsx` implementieren**

```tsx
import { useState, type FormEvent } from 'react'
import { addNote } from '@/db/hooks'

export function NoteForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await addNote(title.trim(), body.trim())
    setTitle('')
    setBody('')
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
  )
}
```

- [ ] **Step 4: Tests ausführen**

Run: `npm run test:run -- NoteForm.test`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/NoteForm.tsx src/__tests__/NoteForm.test.tsx
git commit -m "feat(ui): NoteForm component"
```

---

## Task 9: NoteList-Komponente (TDD)

**Files:**
- Create: `src/__tests__/NoteList.test.tsx`
- Create: `src/components/NoteList.tsx`

- [ ] **Step 1: Test schreiben (failing)**

Create `src/__tests__/NoteList.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteList } from '@/components/NoteList'
import { db } from '@/db/schema'

afterEach(async () => {
  await db.notes.clear()
})

describe('<NoteList />', () => {
  it('shows an empty-state message when no notes exist', async () => {
    render(<NoteList />)
    expect(await screen.findByText(/noch keine notizen/i)).toBeInTheDocument()
  })

  it('renders existing notes after they are added', async () => {
    await db.notes.add({ title: 'A', body: 'a-body', createdAt: 1, updatedAt: 1 })
    await db.notes.add({ title: 'B', body: 'b-body', createdAt: 2, updatedAt: 2 })

    render(<NoteList />)
    expect(await screen.findByText('A')).toBeInTheDocument()
    expect(await screen.findByText('B')).toBeInTheDocument()
  })

  it('removes a note when its delete button is clicked', async () => {
    const user = userEvent.setup()
    await db.notes.add({ title: 'weg', body: '', createdAt: 1, updatedAt: 1 })
    render(<NoteList />)

    const button = await screen.findByRole('button', { name: /löschen weg/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.queryByText('weg')).not.toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Test fehlschlagen lassen**

Run: `npm run test:run -- NoteList.test`
Expected: FAIL — `@/components/NoteList` nicht gefunden.

- [ ] **Step 3: `src/components/NoteList.tsx` implementieren**

```tsx
import { useNotes, deleteNote } from '@/db/hooks'

export function NoteList() {
  const notes = useNotes()

  if (notes.length === 0) {
    return <p className="text-slate-400">Noch keine Notizen.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((note) => (
        <li
          key={note.id}
          className="rounded-lg bg-slate-800 p-4 shadow ring-1 ring-slate-700"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-slate-100">
                {note.title}
              </h3>
              {note.body && (
                <p className="mt-1 whitespace-pre-wrap text-slate-300">
                  {note.body}
                </p>
              )}
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
  )
}
```

- [ ] **Step 4: Tests ausführen**

Run: `npm run test:run -- NoteList.test`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/NoteList.tsx src/__tests__/NoteList.test.tsx
git commit -m "feat(ui): NoteList component with delete"
```

---

## Task 10: App-Komposition + visueller Smoke-Check

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/App.tsx` mit Layout + Komponenten füllen**

```tsx
import { NoteForm } from './components/NoteForm'
import { NoteList } from './components/NoteList'

export function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
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
  )
}
```

- [ ] **Step 2: Komplette Test-Suite ausführen**

Run: `npm run test:run`
Expected: alle Tests grün (smoke + db + hooks + NoteForm + NoteList).

- [ ] **Step 3: Dev-Server starten und manuell testen**

Run: `npm run dev`
Manuell prüfen:
1. App öffnet auf `http://localhost:5173`
2. Eine Notiz anlegen → erscheint in Liste
3. Reload → Notiz noch da
4. Löschen → Notiz verschwindet
Stop: `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: compose App with NoteForm and NoteList"
```

---

## Task 11: PWA-Manifest + Icon-Platzhalter

**Files:**
- Modify: `vite.config.ts`
- Create: `scripts/gen-placeholder-icons.mjs`
- Create: `public/icons/icon-192.png` (generiert)
- Create: `public/icons/icon-512.png` (generiert)
- Create: `public/icons/icon-maskable-512.png` (generiert)

- [ ] **Step 1: Icon-Generator-Skript anlegen**

Create `scripts/gen-placeholder-icons.mjs`:

```js
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { join } from 'node:path'

const dir = 'public/icons'
mkdirSync(dir, { recursive: true })

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crcBuf])
}

function makePng(size, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor RGB
  const raw = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 3)
    raw[row] = 0 // filter type: none
    for (let x = 0; x < size; x++) {
      raw[row + 1 + x * 3] = r
      raw[row + 2 + x * 3] = g
      raw[row + 3 + x * 3] = b
    }
  }
  const idat = chunk('IDAT', deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend])
}

const slate800 = [0x1e, 0x29, 0x3b]
writeFileSync(join(dir, 'icon-192.png'), makePng(192, slate800))
writeFileSync(join(dir, 'icon-512.png'), makePng(512, slate800))
writeFileSync(join(dir, 'icon-maskable-512.png'), makePng(512, slate800))
console.log('Placeholder icons written to', dir)
```

- [ ] **Step 2: Skript ausführen**

Run: `node scripts/gen-placeholder-icons.mjs`
Expected: `Placeholder icons written to public/icons` und drei PNG-Dateien existieren in `public/icons/` (jeweils einfarbig slate-800).

- [ ] **Step 3: PWA-Plugin in `vite.config.ts` einbinden**

Replace the file with this final version:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
      },
      manifest: {
        name: 'PWA Vorlage',
        short_name: 'PWAVorlage',
        description: 'Wiederverwendbare PWA-Grundstruktur',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'de',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(projectRoot, 'src') },
  },
  server: { host: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

> Note: `srcDir: 'src'` + `filename: 'sw.ts'` means the build expects `src/sw.ts` to exist. We create it in Task 12. Do NOT run `npm run build` yet — it would fail. The build verification happens at the end of Task 12.

- [ ] **Step 4: Tests ausführen (sollten weiter grün sein)**

Run: `npm run test:run`
Expected: alle bisherigen Tests grün.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts public/icons scripts/gen-placeholder-icons.mjs
git commit -m "feat(pwa): manifest + placeholder icons"
```

---

## Task 12: Service Worker (`src/sw.ts`)

**Files:**
- Create: `src/sw.ts`

- [ ] **Step 1: `src/sw.ts` anlegen**

```ts
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  new NavigationRoute(
    async () => {
      const cache = await caches.open('workbox-precache-v2')
      const match = await cache.match('/index.html', { ignoreSearch: true })
      return match ?? Response.error()
    },
    { allowlist: [/^\/(?!api).*/] }
  )
)

registerRoute(
  ({ request }) =>
    ['style', 'script', 'font', 'image'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
)
```

- [ ] **Step 2: Production-Build ausführen**

Run: `npm run build`
Expected: Build läuft durch, `dist/` enthält `sw.js`, `manifest.webmanifest`, `registerSW.js`, `index.html`, hashed Assets.

- [ ] **Step 3: Vorschau starten und PWA-Installierbarkeit prüfen**

Run: `npm run preview`
In Chromium-Browser öffnen (`http://localhost:4173`):
- DevTools → Application → Manifest: keine Fehler, Icons sichtbar
- DevTools → Application → Service Workers: SW aktiv
- Adress-Leiste zeigt Install-Icon
Stop: `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add src/sw.ts
git commit -m "feat(pwa): custom workbox service worker"
```

---

## Task 13: SW-Registrierung & Update-Banner

> Hinweis: `useRegisterSW()` aus `virtual:pwa-register/react` registriert den
> Service Worker beim ersten Render, daher ist keine Änderung an `main.tsx`
> nötig. Die Registrierung passiert implizit, sobald `<UpdateBanner />` (oder
> ein anderer Konsument von `useUpdatePrompt`) im Komponentenbaum gerendert wird.

**Files:**
- Create: `src/lib/pwa.ts`
- Create: `src/components/UpdateBanner.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/lib/pwa.ts` anlegen**

```ts
import { useRegisterSW } from 'virtual:pwa-register/react'

export function useUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('SW registration failed', error)
    },
  })

  return {
    needRefresh,
    dismiss: () => setNeedRefresh(false),
    refresh: () => updateServiceWorker(true),
  }
}
```

- [ ] **Step 2: `src/components/UpdateBanner.tsx` anlegen**

```tsx
import { useUpdatePrompt } from '@/lib/pwa'

export function UpdateBanner() {
  const { needRefresh, dismiss, refresh } = useUpdatePrompt()
  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-lg bg-brand-500 px-4 py-3 text-white"
    >
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
    </div>
  )
}
```

- [ ] **Step 3: `src/App.tsx` um Banner erweitern**

```tsx
import { NoteForm } from './components/NoteForm'
import { NoteList } from './components/NoteList'
import { UpdateBanner } from './components/UpdateBanner'

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
  )
}
```

- [ ] **Step 4: Build prüfen**

Run: `npm run build`
Expected: Build OK; in `dist/` weiterhin `sw.js` + `registerSW.js`.

- [ ] **Step 5: Tests prüfen**

Run: `npm run test:run`
Expected: alle Tests grün. Vitest mockt `virtual:pwa-register/react` nicht — falls ein Test darüber stolpert, prüfen, ob der Banner irgendwo gerendert wird, der von Tests betroffen ist (sollte nicht; nur `<App />` rendert ihn, und es gibt aktuell keinen App-Test).

- [ ] **Step 6: Manuell Update-Flow prüfen** (optional, kann übersprungen werden)

Run: `npm run build && npm run preview` → App im Browser laden → SW installiert. Im Source `src/App.tsx` Text ändern → erneut `npm run build` → Browser-Tab refreshen → Banner sollte erscheinen. Stop: `Ctrl+C`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/pwa.ts src/components/UpdateBanner.tsx src/App.tsx
git commit -m "feat(pwa): update prompt banner"
```

---

## Task 14: Caddyfile

**Files:**
- Create: `Caddyfile`

- [ ] **Step 1: `Caddyfile` anlegen**

```caddy
{
  auto_https off
}

# HTTP — geeignet hinter einem Reverse-Proxy oder zum lokalen Testen
:80 {
  root * /srv
  file_server
  encode gzip zstd

  @sw path /sw.js /registerSW.js
  header @sw Cache-Control "no-cache"

  @assets path *.js *.css *.woff2 *.png *.svg *.webp
  header @assets Cache-Control "public, max-age=31536000, immutable"

  try_files {path} /index.html
}

# HTTPS — direkt im LAN nutzbar; Caddy erstellt eine lokale Root-CA.
# Endgeräte müssen dieser CA einmal vertrauen
# (siehe README, Abschnitt "TLS im LAN").
:443 {
  tls internal

  root * /srv
  file_server
  encode gzip zstd

  @sw path /sw.js /registerSW.js
  header @sw Cache-Control "no-cache"

  @assets path *.js *.css *.woff2 *.png *.svg *.webp
  header @assets Cache-Control "public, max-age=31536000, immutable"

  try_files {path} /index.html
}
```

- [ ] **Step 2: Syntax via Caddy validieren**

Run: `docker run --rm -v "$(pwd)/Caddyfile:/etc/caddy/Caddyfile" caddy:alpine caddy validate --config /etc/caddy/Caddyfile`

> On Windows-Bash, if `$(pwd)` produces a path Docker can't mount, fall back to: `docker run --rm -v "/$(pwd -W)/Caddyfile:/etc/caddy/Caddyfile" caddy:alpine caddy validate --config /etc/caddy/Caddyfile` — or skip this step and rely on the Task 15 build verification.

Expected: `Valid configuration`.

- [ ] **Step 3: Commit**

```bash
git add Caddyfile
git commit -m "feat(deploy): caddy config with HTTP and tls-internal HTTPS profiles"
```

---

## Task 15: Dockerfile + docker-compose.yml + .dockerignore

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

- [ ] **Step 1: `.dockerignore` anlegen**

```
node_modules
dist
.git
.gitignore
.vscode
.idea
coverage
*.log
docs
README.md
```

- [ ] **Step 2: `Dockerfile` (Multi-Stage) anlegen**

```dockerfile
# ── Stage 1: Build ──────────────────────────────────
FROM node:lts-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────
FROM caddy:alpine AS runner
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
```

- [ ] **Step 3: `docker-compose.yml` anlegen**

```yaml
services:
  pwa:
    build: .
    container_name: pwa-vorlage
    restart: unless-stopped
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

- [ ] **Step 4: Image bauen**

Run: `docker compose build`
Expected: Build erfolgt in zwei Stufen, am Ende ein Image `pwa-vorlage_pwa` (oder ähnlich).

- [ ] **Step 5: Container starten**

Run: `docker compose up -d`
Expected: Container läuft. `docker compose ps` zeigt `running`.

- [ ] **Step 6: HTTP-Endpoint testen**

Run: `curl -I http://localhost:8080/`
Expected: `HTTP/1.1 200 OK`, Content-Type `text/html`.

- [ ] **Step 7: HTTPS-Endpoint testen** (mit `-k`, weil Caddys lokale CA nicht im Trust-Store von curl ist)

Run: `curl -kI https://localhost:8443/`
Expected: `HTTP/2 200`.

- [ ] **Step 8: SW-Header prüfen**

Run: `curl -I http://localhost:8080/sw.js`
Expected: `Cache-Control: no-cache` ist im Response-Header.

Run: `curl -I http://localhost:8080/assets/$(curl -s http://localhost:8080/ | grep -oE 'assets/[^"]+\.js' | head -1)`
Expected: `Cache-Control: public, max-age=31536000, immutable`.

- [ ] **Step 9: Container stoppen**

Run: `docker compose down`
Expected: Container weg, Volumes bleiben.

- [ ] **Step 10: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "feat(deploy): multi-stage docker build serving via caddy"
```

---

## Task 16: README + finale Akzeptanzprüfung

**Files:**
- Create: `README.md`

- [ ] **Step 1: `README.md` schreiben**

```markdown
# PWA Vorlage

Wiederverwendbare Grundstruktur für Progressive Web Apps im lokalen Netzwerk.
Stack: React 18 · TypeScript · Vite · Tailwind v4 · Workbox · Dexie.js · Biome · Caddy · Docker.

## Schnellstart

```bash
npm ci
npm run dev          # http://localhost:5173 (HMR)
```

## Vorlage als neue App benutzen

1. **Skelett klonen, Git neu initialisieren**
   ```bash
   git clone <vorlage-url> meine-app
   rm -rf meine-app/.git
   cd meine-app
   git init
   ```

2. **App-Identität anpassen**
   - `package.json`: `name`, `description`
   - `vite.config.ts`: `manifest.name`, `manifest.short_name`, `manifest.theme_color`
   - `index.html`: `<title>` und `<meta name="theme-color">`
   - `public/icons/`: 192/512/maskable-PNGs ersetzen (siehe unten)
   - `Caddyfile`: optional `host`-Zeile, falls Domain genutzt

3. **Daten-Layer anpassen**
   - `src/db/schema.ts`: `Note` durch dein Modell ersetzen
   - `src/db/hooks.ts`: Hooks an dein Modell anpassen oder neue ergänzen
   - Komponenten/Tests entsprechend ersetzen

4. **Entwickeln**
   ```bash
   npm run dev          # Dev-Server
   npm run test         # Tests im Watch-Mode
   npm run lint         # Biome
   ```

5. **Deployment auf den Server**
   ```bash
   docker compose up -d --build
   # → http://<server-ip>:8080  (HTTP)
   # → https://<server-ip>:8443 (HTTPS, lokale CA)
   ```

## TLS im LAN

Caddy erzeugt im Container eine lokale Root-CA. Endgeräte müssen ihr einmal
vertrauen, sonst wird das Zertifikat als unsicher angezeigt:

```bash
# Root-CA aus Container holen (Pfad in caddy_data persistiert)
docker compose cp pwa:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

Diese `caddy-root.crt` auf den Endgeräten installieren (Windows: in
"Vertrauenswürdige Stammzertifizierungsstellen", Android: "CA-Zertifikat
installieren"), oder alternativ einen Reverse-Proxy mit echtem Zertifikat
davorschalten und in `Caddyfile` nur das `:80`-Profil aktiv lassen.

## Icons ersetzen

Die mitgelieferten Icons sind reine Platzhalter (einfarbige PNGs). Ersetze:

```
public/icons/icon-192.png            (192×192)
public/icons/icon-512.png            (512×512)
public/icons/icon-maskable-512.png   (512×512, mit Safe-Area-Padding für maskable)
```

## Scripts

| Script | Was es tut |
| --- | --- |
| `npm run dev` | Vite-Dev-Server mit HMR |
| `npm run build` | TypeScript-Check + Production-Bundle nach `dist/` |
| `npm run preview` | Lokales Preview des Production-Builds |
| `npm run test` | Vitest im Watch-Mode |
| `npm run test:run` | Vitest einmalig |
| `npm run lint` | Biome (Check) |
| `npm run format` | Biome (Format-Write) |
| `npm run docker:build` | Docker-Image bauen |
| `npm run docker:up` | Container starten (build + up -d) |

## Architektur-Übersicht

- `src/main.tsx` → React-Bootstrap
- `src/App.tsx` → Layout, Update-Banner, Notiz-Form, Notiz-Liste
- `src/db/` → Dexie-Schema und reaktive Hooks
- `src/lib/pwa.ts` → SW-Update-Hook
- `src/sw.ts` → Workbox Service Worker (Precache + StaleWhileRevalidate)
- `Caddyfile` → SPA-Fallback, korrekte Cache-Header für SW und Assets
- `Dockerfile` → Multi-Stage (Node-Build → Caddy-Serve)

Spec: `docs/superpowers/specs/2026-05-06-pwa-vorlage-grundstruktur-design.md`
```

- [ ] **Step 2: Akzeptanzprüfung — alle Punkte aus Spec §12 durchgehen**

Mark each as you verify:

- [ ] `npm run dev` startet ohne Fehler, HMR funktioniert (Quelldatei ändern → Browser updated)
- [ ] `npm run build && npm run preview` zeigt installierbare PWA (Browser zeigt Install-Icon)
- [ ] `npm run test:run` läuft grün (alle Tests aus Tasks 5–9)
- [ ] `npm run lint` läuft grün
- [ ] Notiz anlegen → Reload → Notiz noch da
- [ ] Offline-Modus (DevTools → Network: offline) → App-Shell + bestehende Notizen weiter nutzbar
- [ ] `docker compose up -d --build` → `https://localhost:8443` (mit `-k` oder Trust-Store) zeigt App
- [ ] Lighthouse-PWA-Audit auf `http://localhost:4173` (preview) oder `https://localhost:8443`: alle Pflicht-Checks grün
- [ ] `README.md` enthält die "Vorlage benutzen"-Anleitung

Sollte einer fehlschlagen: Issue identifizieren, fixen, Test/Build wiederholen, danach den Punkt erneut prüfen.

- [ ] **Step 3: Container stoppen, falls noch laufend**

Run: `docker compose down`
Expected: keine laufenden Container.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README with usage and deployment instructions"
```

---

## Erledigt

Mit Abschluss von Task 16 erfüllt die Vorlage alle Akzeptanzkriterien aus dem Spec. Der nächste Schritt für eine konkrete Folge-App ist: Repo klonen, App-Identität anpassen (Schritte 1–2 im README), Daten-Layer ersetzen (Schritt 3), entwickeln.

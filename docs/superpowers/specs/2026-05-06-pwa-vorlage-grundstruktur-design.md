# PWA-Vorlage — Grundstruktur (Design)

**Status:** Genehmigt — bereit für Implementierungs-Plan
**Datum:** 2026-05-06

## 1. Zweck

Eine wiederverwendbare Grundstruktur für Progressive Web Apps, die im lokalen Netzwerk in einem Docker-Container betrieben werden. Die Vorlage liefert eine kleine, lauffähige Notiz-App ("Hello World"-Niveau, aber mit echter Datenpersistenz) und ein klares Muster, das beim Klonen für neue Apps angepasst oder entfernt werden kann.

**Nicht-Ziele:** Auth, Backend-Sync, Mehr-Seiten-Routing, i18n, State-Management-Bibliotheken — bewusst weggelassen, ergänzbar pro Folge-App.

## 2. Stack-Entscheidungen

| Bereich | Entscheidung | Begründung |
| --- | --- | --- |
| Sprache | TypeScript (`strict: true`) | Vorlage wird mehrfach abgeleitet, Typen verhindern stille Bugs |
| Frontend | React | Vom User vorgegeben |
| Build | Vite | Vom User vorgegeben |
| PWA | `vite-plugin-pwa` mit `injectManifest`-Strategie, Workbox-Bausteine | Eigener SW möglich, gleichzeitig Workbox-Komfort |
| Daten | Dexie.js + `dexie-react-hooks` (`useLiveQuery`) | Reaktive Queries ohne separaten State-Manager |
| UI | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-First-Konfig) | Vom User vorgegeben |
| Lint/Format | Biome | Eine Konfig statt ESLint+Prettier, schneller |
| Tests | Vitest + React Testing Library + `fake-indexeddb` | Native Vite-Integration, gleiche Konfig |
| Browser-Baseline | Baseline 2023+ (`target: ES2022`) | Chromium / WebKit / Gecko desktop+mobile |
| Dev-Workflow | Lokal (`npm run dev`), Docker nur für Deploy | HMR mit Volume-Mounts unter Windows fragil |
| Webserver | Caddy (`caddy:alpine`) | LAN-TLS via `tls internal`, kleiner Footprint |
| Container | Multi-Stage `Dockerfile` (Node-Build → Caddy-Serve), `docker-compose.yml` | Standard-Pattern für statische SPAs |

## 3. Architektur

```
Build-Zeit
  Vite kompiliert TS+React+Tailwind → dist/
  vite-plugin-pwa (injectManifest) bündelt eigenen SW (src/sw.ts)
  Workbox-Manifest wird beim Build in den SW injiziert (__WB_MANIFEST)

Runtime im Browser
  index.html → main.tsx → React rendert App
  React-Komponenten lesen/schreiben via Dexie → IndexedDB
  Service Worker:
    - Precache: App-Shell (HTML, JS, CSS, Fonts, Icons)
    - StaleWhileRevalidate: weitere statische Assets
    - NavigationRoute: SPA-Fallback auf index.html
  Update-Flow: registerType: 'prompt' — Banner, Nutzer entscheidet

Deploy
  Multi-Stage Docker: builder (node:lts-alpine) → runner (caddy:alpine)
  Caddy serviert /srv (= dist/), terminiert TLS via `tls internal`
  Cache-Control-Header: SW = no-cache, Hashed Assets = immutable 1 Jahr
```

## 4. Verzeichnisstruktur

```
PWA_Vorlage/
├── .dockerignore
├── .gitignore
├── biome.json
├── Caddyfile
├── docker-compose.yml
├── Dockerfile
├── index.html
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts              inkl. Vitest-Konfig (`test`-Block)
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon-maskable-512.png
│   └── favicon.svg
├── src/
│   ├── main.tsx                Einstiegspunkt + SW-Registrierung
│   ├── App.tsx                 Layout, lädt NoteList + NoteForm + UpdateBanner
│   ├── index.css               Tailwind v4 @import + @theme-Block
│   ├── sw.ts                   Custom Service Worker (Workbox)
│   ├── components/
│   │   ├── NoteList.tsx
│   │   ├── NoteForm.tsx
│   │   └── UpdateBanner.tsx
│   ├── db/
│   │   ├── schema.ts           Dexie-Klasse + Note-Interface
│   │   └── hooks.ts            useNotes, addNote, deleteNote
│   ├── lib/
│   │   └── pwa.ts              registerSW + Update-Prompt-Hook
│   ├── test/
│   │   └── setup.ts            fake-indexeddb-Bootstrapping
│   └── __tests__/
│       └── NoteList.test.tsx
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-06-pwa-vorlage-grundstruktur-design.md
```

**Begründung:** `db/` separat von `components/` (Persistenz-Code unabhängig testbar). `sw.ts` neben `main.tsx`, weil Vite es als zweites Entry behandelt. `lib/` für stack-übergreifende Helfer, die beim Klonen meist erhalten bleiben.

## 5. Konfigurationsdateien (Kerninhalte)

### 5.1 `vite.config.ts`
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-plugin-pwa`
- PWA-Optionen:
  ```ts
  VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    registerType: 'prompt',
    injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    manifest: { /* siehe 5.4 */ },
    devOptions: { enabled: false }
  })
  ```
- Pfad-Alias `@ → src`

### 5.2 `tsconfig.json`
- `target: "ES2022"`, `lib: ["ES2022", "DOM", "DOM.Iterable", "WebWorker"]`
- `module: "ESNext"`, `moduleResolution: "bundler"`
- `strict: true`, `noUncheckedIndexedAccess: true`
- `jsx: "react-jsx"`
- `paths: { "@/*": ["./src/*"] }`
- `tsconfig.node.json` für `vite.config.ts` separat

### 5.3 `biome.json`
- Recommended-Regeln aktiv
- 2 Spaces, Semikolons "always", Quotes single
- Ersetzt ESLint und Prettier komplett

### 5.4 PWA-Manifest (in `vite.config.ts`)
```ts
{
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
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}
```

### 5.5 Tailwind v4
- `package.json`: `tailwindcss@^4`, `@tailwindcss/vite@^4`
- Keine `tailwind.config.ts` — Konfig in `src/index.css`:
  ```css
  @import "tailwindcss";
  @theme {
    --color-brand-500: oklch(0.55 0.15 260);
    /* weitere Tokens nach Bedarf */
  }
  ```

### 5.6 `package.json`-Scripts
```
dev          → vite
build        → tsc -b && vite build
preview      → vite preview
test         → vitest
test:run     → vitest run
lint         → biome check .
format       → biome format --write .
docker:build → docker build -t pwa-vorlage .
docker:up    → docker compose up -d --build
```

## 6. PWA-Layer

### 6.1 Service Worker (`src/sw.ts`)
- Workbox-Bausteine über `injectManifest`
- `precacheAndRoute(self.__WB_MANIFEST)` — App-Shell
- `cleanupOutdatedCaches()` — beim Aktivieren alte Caches löschen
- `NavigationRoute` für SPA-Fallback (offline → cached `index.html`)
- `StaleWhileRevalidate` für Bilder/Fonts/Skripte (Cache "assets")
- `ExpirationPlugin`: max 60 Einträge, 30 Tage

### 6.2 Update-Flow (`src/lib/pwa.ts`)
- `useRegisterSW()` aus `virtual:pwa-register/react`
- `registerType: 'prompt'` → kein automatisches Aktivieren
- Wenn `needRefresh`: `<UpdateBanner>` rendert Hinweis und Button "Neu laden"
- Klick → `updateSW(true)` → `skipWaiting` + reload

### 6.3 Datenstrategie
- App-Shell + Assets: SW-Cache (Workbox)
- Nutzerdaten (Notizen): IndexedDB via Dexie
- Kein Background-Sync, kein Conflict-Resolution — bewusst YAGNI

## 7. Daten-Layer

### 7.1 Dexie-Schema (`src/db/schema.ts`)
```ts
interface Note {
  id?: number;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

class AppDB extends Dexie {
  notes!: EntityTable<Note, 'id'>;
  constructor() {
    super('pwa-vorlage');
    this.version(1).stores({
      notes: '++id, createdAt, updatedAt'
    });
  }
}
export const db = new AppDB();
```

### 7.2 Hooks (`src/db/hooks.ts`)
- `useNotes()` → `useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray())`, fällt auf `[]` zurück solange undefined
- `addNote(title, body)` → setzt `createdAt`/`updatedAt` auf `Date.now()`
- `deleteNote(id)` → `db.notes.delete(id)`

## 8. UI-Komponenten

| Komponente | Verantwortung |
| --- | --- |
| `App.tsx` | Layout-Skelett (Header + Container), rendert `<UpdateBanner>`, `<NoteForm>`, `<NoteList>` |
| `NoteForm.tsx` | Kontrolliertes Formular (Titel + Body), `onSubmit` ruft `addNote()`, leert Felder |
| `NoteList.tsx` | Konsumiert `useNotes()`, rendert Karten, Lösch-Button pro Karte |
| `UpdateBanner.tsx` | Zeigt sich nur wenn neue SW-Version bereit; Button "Neu laden" |

Tailwind-Stil: schlicht, responsive, Dark-Mode-fähig. Eigene Tokens nur als Demo (z.B. `--color-brand-500` im `@theme`-Block); ansonsten Tailwind-Defaults (slate/indigo) direkt nutzen.

## 9. Tests

- `src/test/setup.ts`: importiert `fake-indexeddb/auto`, registriert RTL-Cleanup
- Vitest-Konfig im `test`-Block von `vite.config.ts` (kein separates `vitest.config.ts`): `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, `globals: true`
- Beispiel-Test `__tests__/NoteList.test.tsx`:
  - rendert `<NoteList />`
  - schreibt eine Notiz direkt via `db.notes.add(...)`
  - wartet, bis sie im DOM erscheint (`findByText`)
- Demonstriert das Pattern; reale Apps erweitern.

## 10. Docker & Caddy

### 10.1 `Dockerfile` (Multi-Stage)
```dockerfile
FROM node:lts-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
```

### 10.2 `docker-compose.yml`
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

### 10.3 `Caddyfile` (zwei Profile in einer Datei)
```caddy
{
  auto_https off
}

:80 {
  root * /srv
  file_server
  encode gzip zstd
  try_files {path} /index.html

  @sw path /sw.js /registerSW.js
  header @sw Cache-Control "no-cache"
  @assets path *.js *.css *.woff2 *.png *.svg *.webp
  header @assets Cache-Control "public, max-age=31536000, immutable"
}

:443 {
  tls internal
  root * /srv
  file_server
  encode gzip zstd
  try_files {path} /index.html

  @sw path /sw.js /registerSW.js
  header @sw Cache-Control "no-cache"
  @assets path *.js *.css *.woff2 *.png *.svg *.webp
  header @assets Cache-Control "public, max-age=31536000, immutable"
}
```

Wer einen Reverse-Proxy davor hat, mappt nur `:80`. Wer direkt zugreift, vertraut Caddys lokaler Root-CA einmal pro Endgerät (Caddy erzeugt sie unter `caddy_data/pki/authorities/local/`).

## 11. README — "Vorlage benutzen"

```
1. Skelett klonen, neuen Namen geben
   git clone <vorlage> meine-app && rm -rf meine-app/.git && git init meine-app

2. Anpassen
   - package.json:    "name", "description"
   - vite.config.ts:  manifest.name, short_name, theme_color
   - index.html:      <title>
   - public/icons/:   192/512/maskable PNGs ersetzen
   - Caddyfile:       (optional) host-Zeile, falls Domain genutzt

3. Entwickeln
   npm ci
   npm run dev          → http://localhost:5173

4. Deploy
   docker compose up -d --build
   → https://<server-ip>:8443
```

## 12. Akzeptanzkriterien

Vorlage gilt als "fertig", wenn alle Punkte zutreffen:

- `npm run dev` startet ohne Fehler, HMR funktioniert
- `npm run build && npm run preview` zeigt installierbare PWA (Browser zeigt Install-Icon)
- `npm run test` läuft grün (mind. 1 grüner Test in `__tests__/`)
- `npm run lint` läuft grün
- Notiz anlegen → Reload → Notiz noch da (Dexie persistiert)
- Offline-Modus (DevTools → Network: offline) → App-Shell und bestehende Notizen weiter nutzbar
- `docker compose up -d --build` → `https://localhost:8443` zeigt App
- Lighthouse-PWA-Audit: alle Pflicht-Checks grün
- README enthält die "Vorlage benutzen"-Anleitung aus Abschnitt 11

## 13. Bewusste Nicht-Features (YAGNI)

- Kein Routing (React Router)
- Kein Auth, kein Backend, kein Sync
- Kein State-Manager (Zustand/Redux)
- Keine i18n-Library
- Kein Background-Sync, keine Push-Notifications
- Keine CI-Pipeline (kann pro Folge-App ergänzt werden)

Jede Folge-App kann diese Bausteine bei Bedarf addieren — die Vorlage soll klein und löschbar bleiben.

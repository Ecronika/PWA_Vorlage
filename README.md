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

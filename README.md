# Tagflix

An open-source media aggregator built with **SolidJS + TypeScript**.

![Tagflix](https://img.shields.io/badge/Tagflix-v2.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Mac%20%7C%20Linux%20%7C%20Android-brightgreen)

## Architecture

| Layer | Technology | Target |
|-------|-----------|--------|
| UI | SolidJS + TypeScript | All platforms |
| Styling | Tailwind CSS v4 | All platforms |
| Desktop | Native browser `--app` mode via `tagflix.exe` | Windows / Mac / Linux |
| Mobile & TV | Capacitor v6+ | Android APK / Fire OS |

## Features

- **Stremio-inspired UI** — sidebar navigation, media rows, modern glass design
- **Embedded iframe players** — no proxy server needed
- **Multiple streaming sources** — VidCore, VidKing (add more in `src/lib/sources.ts`)
- **Season/episode browser** — rich episode cards with thumbnails and ratings
- **Continue watching** — tracks your progress across movies and TV shows
- **Favourites / library** — save content for later
- **Customizable themes** — 4 skins + 8 accent colours
- **D-Pad navigation** — Firestick / Android TV remote support
- **Responsive design** — desktop sidebar → mobile bottom tabs
- **No console window** — PE header patched from CONSOLE to GUI subsystem
- **Landscape mode** — opens at 1280×720 in `--app` mode
- **Auto-exit** — server shuts down when browser windows close

## Setup

```bash
# Install dependencies
npm install

# Dev server (Vite)
npm run dev

# Build & launch as standalone app window
npm run start

# Build standalone .exe (no Node.js required for end users)
npm run package
```

### Packaging for distribution

`npm run package` builds the frontend and compiles everything into a single `dist-app/tagflix.exe`. Ship the `dist-app/` folder — end users just double-click `tagflix.exe` (no Node.js required).

The build process:

1. `vite build` — bundles the SolidJS frontend into `dist/`
2. `pkg` — compiles `server.cjs` + Node.js runtime into `tagflix.exe` (~36MB)
3. **PE header patch** — converts the exe from CONSOLE (subsystem 3) to GUI (subsystem 2), so Windows doesn't create a console window
4. Copies `dist/` alongside the exe for the built-in HTTP server

### How `npm start` works

`npm run build && node server.cjs` does three things:

1. Builds the frontend into `dist/`
2. Starts a local HTTP server on `127.0.0.1:5173`
3. Detects Edge / Chrome / Brave and opens the app in `--app` mode

### How `tagflix.exe` works

The packaged exe runs the same server but with these extras:

- **No console window** — PE header is patched to GUI subsystem
- **Landscape mode** — Edge opens at 1280×720 via `--window-size`
- **Separate profile** — uses `~/.tagflix/browser-profile` so Edge doesn't show first-run pages
- **Server reuse** — if server is already running on port 5173, just opens a new tab
- **Auto-exit** — polls for Edge processes every 2s, exits when all windows close
- **No sync** — Edge launched with `--disable-sync` to avoid Microsoft account prompts

## Project Structure

```
src/
  lib/
    tmdb.ts           # TMDB API with rotating free keys
    sources.ts         # Streaming source definitions
    storage.ts         # LocalStorage helpers
    navigation.ts      # D-Pad / remote control navigation
  components/
    MediaCard.tsx       # Movie/TV card component
    MediaRow.tsx        # Horizontal scroll row
    IframePlayer.tsx    # Embedded iframe player
  pages/
    Home.tsx            # Hero + trending + continue watching
    Detail.tsx          # Movie/TV info + source picker + seasons
    Player.tsx          # Fullscreen iframe player
    Search.tsx          # Multi-search
    Movies.tsx          # Browse movies
    TVShows.tsx         # Browse TV shows
    Favourites.tsx      # Saved library
    Settings.tsx        # Theme, accent, source settings
server.cjs             # Local server + browser launcher (--app mode)
build-pkg.js           # Build script (pkg + PE header patch)
```

## Embed Sources

| Source | URL Pattern | Status |
|--------|-------------|--------|
| **VidCore** | `vidcore.io/{type}/{id}/{season}/{episode}` | ✅ Primary |
| **VidKing** | `vidking.net/embed/{type}/{id}` | ✅ Fallback |

Add more sources in `src/lib/sources.ts`.

## License

MIT

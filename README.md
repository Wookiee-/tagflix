# Tagflix

An open-source media aggregator built with **SolidJS + TypeScript**.

![Tagflix](https://img.shields.io/badge/Tagflix-v2.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Mac%20%7C%20Linux%20%7C%20Android-brightgreen)

## Architecture

| Layer | Technology | Target |
|-------|-----------|--------|
| UI | SolidJS + TypeScript | All platforms |
| Styling | Tailwind CSS v4 | All platforms |
| Desktop | Native browser `--app` mode | Windows / Mac / Linux |
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

### How `npm start` works

`npm run build && node server.cjs` does three things:

1. Builds the frontend into `dist/`
2. Starts a local Express server on `127.0.0.1:5173`
3. Detects Edge / Chrome / Brave and opens the app in `--app` mode

`--app` mode opens the browser as a **standalone window** (no address bar, no tabs) — looks like a native app but runs as a real Chromium browser. Streaming sources work natively with no sandbox detection or CORS issues.

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
```

## Embed Sources

| Source | URL Pattern | Status |
|--------|-------------|--------|
| **VidCore** | `vidcore.io/{type}/{id}/{season}/{episode}` | ✅ Primary |
| **VidKing** | `vidking.net/embed/{type}/{id}` | ✅ Fallback |

Add more sources in `src/lib/sources.ts`.

## License

MIT

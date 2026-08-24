# Tagflix

An open-source, community-driven media aggregator built with **SolidJS + TypeScript**.

## Architecture

| Layer | Technology | Target |
|-------|-----------|--------|
| UI | SolidJS + TypeScript | All platforms |
| Styling | Tailwind CSS v4 | All platforms |
| Desktop | Electron | Windows / Mac / Linux |
| Mobile & TV | Capacitor v6+ | Android APK / Fire OS |

## Embed Sources

Tagflix uses iframe-based embed players — no proxy needed:

| Source | URL | Status |
|--------|-----|--------|
| **VidCore** | vidcore.io | ✅ Primary |
| VidSrc | vidsrc.sbs | ✅ Fallback |
| VidKing | vidking.net | ✅ Fallback |

More sources can be added in `src/lib/sources.ts`.

## Setup

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Build for production
npm run build

# Desktop (Electron)
npm run electron:dev
npm run electron:build

# Mobile (Capacitor)
npm run cap:build
```

## Project Structure

```
src/
  lib/
    tmdb.ts          # TMDB API integration
    sources.ts       # Streaming source definitions
    storage.ts       # LocalStorage helpers
    navigation.ts    # D-Pad / remote control navigation
  components/
    MediaCard.tsx     # Movie/TV card component
    MediaRow.tsx      # Horizontal scroll row
    IframePlayer.tsx  # Embedded iframe player
  pages/
    Home.tsx          # Trending + popular rows
    Detail.tsx        # Movie/TV info + source picker + episodes
    Player.tsx        # Fullscreen iframe player
    Search.tsx        # Multi-search
    Movies.tsx        # Browse movies
    TVShows.tsx       # Browse TV shows
    Favourites.tsx    # Saved library
    Settings.tsx      # Theme, accent, source settings
electron/
  main.cjs           # Electron main process
capacitor.config.ts  # Capacitor configuration
```

## Features

- Stremio-inspired UI (sidebar nav, media rows)
- Embedded iframe players (no proxy server needed)
- Multiple streaming sources
- Season/episode browser for TV shows
- D-Pad navigation for Firestick / Android TV remotes
- Customizable themes (4 skins + 8 accent colours)
- Continue watching progress tracking
- Favourites / library
- Responsive: desktop sidebar → mobile bottom tabs

## License

MIT

# Tagflix

An open-source media aggregator built with **SolidJS + TypeScript + Electron**.

![Tagflix](https://img.shields.io/badge/Tagflix-v2.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Mac%20%7C%20Linux%20%7C%20Android-brightgreen)

## Architecture

| Layer | Technology | Target |
|-------|-----------|--------|
| UI | SolidJS + TypeScript | All platforms |
| Styling | Tailwind CSS v4 | All platforms |
| Desktop | Electron | Windows / Mac / Linux |
| Mobile & TV | Capacitor v6+ | Android APK / Fire OS |

## Features

- **Stremio-inspired UI** — sidebar navigation, media rows, modern glass design
- **Embedded iframe players** — no proxy server needed
- **Multiple streaming sources** — VidCore, VidKing (add more in `src/lib/sources.ts`)
- **Season/episode browser** — rich episode cards with thumbnails and ratings
- **Built-in ad blocker** — blocks 50+ ad/tracking domains at the network level
- **GPU hardware acceleration** — smooth 60fps video seeking via Chromium GPU flags
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

# Dev with Electron (one command)
npm run electron:dev

# Build for production
npm run build

# Package Electron app (installer + portable)
npm run electron:build
```

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
electron/
  main.cjs             # Electron main process (GPU accel, ad blocker, stealth)
  preload.cjs          # Preload script (hides Electron markers)
```

## Electron Optimizations

The Electron build includes several performance and security fixes:

| Feature | Description |
|---------|-------------|
| **GPU Acceleration** | Forces H.264/HEVC decoding to the graphics card via Chromium flags |
| **Secure CORS** | Uses `onHeadersReceived` injection instead of disabling `webSecurity` |
| **Ad Blocker** | Network-level blocking of 50+ ad/tracking/cryptominer domains |
| **Stealth Mode** | UA spoofing, webdriver hiding, Referer injection for embeds |
| **Background Throttling** | Reduces CPU usage when app is idle |

## Embed Sources

| Source | URL Pattern | Status |
|--------|-------------|--------|
| **VidCore** | `vidcore.io/{type}/{id}/{season}/{episode}` | ✅ Primary |
| **VidKing** | `vidking.net/embed/{type}/{id}` | ✅ Fallback |

Add more sources in `src/lib/sources.ts`.

## License

MIT

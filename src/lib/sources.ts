// ═══ Streaming Sources ═══
// Each source provides iframe embed URLs for movies and TV shows.
// Sources are tried in order; users can pick from the player.

export interface StreamSource {
  id: string;
  name: string;
  /** Build the embed URL for a movie */
  movieUrl: (tmdbId: number, imdbId?: string) => string;
  /** Build the embed URL for a TV episode */
  tvUrl: (tmdbId: number, season: number, episode: number, imdbId?: string) => string;
}

export const SOURCES: StreamSource[] = [
  {
    id: 'vidcore',
    name: 'VidCore',
    movieUrl: (tmdbId) => `https://vidcore.io/embed/movie/${tmdbId}`,
    tvUrl: (tmdbId, season, episode) =>
      `https://vidcore.io/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    movieUrl: (tmdbId, imdbId) =>
      `https://vidsrc.sbs/embed/movie/${imdbId || tmdbId}`,
    tvUrl: (tmdbId, season, episode, imdbId) =>
      `https://vidsrc.sbs/embed/tv/${imdbId || tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidking',
    name: 'VidKing',
    movieUrl: (tmdbId) =>
      `https://vidking.net/embed/movie/${tmdbId}`,
    tvUrl: (tmdbId, season, episode) =>
      `https://vidking.net/embed/tv/${tmdbId}/${season}/${episode}`,
  },
];

export function getSource(id: string): StreamSource | undefined {
  return SOURCES.find(s => s.id === id);
}

export function getDefaultSource(): StreamSource {
  return SOURCES[0];
}

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
    id: 'cinesrc',
    name: 'CineSrc',
    movieUrl: (tmdbId) => `https://cinesrc.st/embed/movie/${tmdbId}`,
    tvUrl: (tmdbId, season, episode) =>
      `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}`,
  },
];

export function getSource(id: string): StreamSource | undefined {
  return SOURCES.find(s => s.id === id);
}

export function getDefaultSource(): StreamSource {
  return SOURCES[0];
}

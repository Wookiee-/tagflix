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
    movieUrl: (tmdbId) => `https://vidcore.io/movie/${tmdbId}?autoPlay=true&ad=false`,
    tvUrl: (tmdbId, season, episode) =>
      `https://vidcore.io/tv/${tmdbId}/${season}/${episode}?autoPlay=true&ad=false`,
  },
  {
    id: 'vidking',
    name: 'VidKing',
    movieUrl: (tmdbId) =>
      `https://www.vidking.net/embed/movie/${tmdbId}?autoPlay=true`,
    tvUrl: (tmdbId, season, episode) =>
      `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextEpisode=true&episodeSelector=true`,
  },
];

export function getSource(id: string): StreamSource | undefined {
  return SOURCES.find(s => s.id === id);
}

export function getDefaultSource(): StreamSource {
  return SOURCES[0];
}

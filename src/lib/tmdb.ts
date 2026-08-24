// ═══ TMDB API Integration ═══
// Uses the free TMDB API for metadata, images, and search.

const API_KEY = '1e7e6e3f197f82d2790bea0964950360'; // v3 public key
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';

export function imageUrl(path: string | null, size: string = 'w500'): string {
  if (!path) return '';
  return `${IMG}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: string = 'w1280'): string {
  if (!path) return '';
  return `${IMG}/${size}${path}`;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ─── Types ───
export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: string;
}

export interface TMDBMovieDetail extends TMDBMedia {
  runtime: number;
  belongs_to_collection?: { id: number; name: string } | null;
}

export interface TMDBTvDetail extends TMDBMedia {
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TMDBSeason[];
  episode_run_time: number[];
}

export interface TMDBSeason {
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  episode_count: number;
  air_date: string;
}

export interface TMDBEpisode {
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}

export interface TMDBSearchResult {
  results: TMDBMedia[];
  total_pages: number;
  total_results: number;
}

// ─── API Calls ───
export async function getTrending(): Promise<TMDBMedia[]> {
  const data = await tmdbFetch<{ results: TMDBMedia[] }>('/trending/all/week');
  return data.results.map(r => ({ ...r, media_type: r.media_type || (r.title ? 'movie' : 'tv') }));
}

export async function getPopularMovies(): Promise<TMDBMedia[]> {
  const data = await tmdbFetch<{ results: TMDBMedia[] }>('/movie/popular');
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getPopularTV(): Promise<TMDBMedia[]> {
  const data = await tmdbFetch<{ results: TMDBMedia[] }>('/tv/popular');
  return data.results.map(r => ({ ...r, media_type: 'tv' }));
}

export async function getTopRatedMovies(): Promise<TMDBMedia[]> {
  const data = await tmdbFetch<{ results: TMDBMedia[] }>('/movie/top_rated');
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getTopRatedTV(): Promise<TMDBMedia[]> {
  const data = await tmdbFetch<{ results: TMDBMedia[] }>('/tv/top_rated');
  return data.results.map(r => ({ ...r, media_type: 'tv' }));
}

export async function getMovieDetail(id: number): Promise<TMDBMovieDetail> {
  return tmdbFetch<TMDBMovieDetail>(`/movie/${id}`, { append_to_response: 'credits,videos' });
}

export async function getTvDetail(id: number): Promise<TMDBTvDetail> {
  return tmdbFetch<TMDBTvDetail>(`/tv/${id}`, { append_to_response: 'credits' });
}

export async function getSeasonEpisodes(tvId: number, seasonNumber: number): Promise<TMDBEpisode[]> {
  const data = await tmdbFetch<{ episodes: TMDBEpisode[] }>(`/tv/${tvId}/season/${seasonNumber}`);
  return data.episodes;
}

export async function searchMulti(query: string): Promise<TMDBMedia[]> {
  const data = await tmdbFetch<TMDBSearchResult>('/search/multi', { query, include_adult: 'false' });
  return data.results
    .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
    .map(r => ({ ...r, media_type: r.media_type || (r.title ? 'movie' : 'tv') }));
}

export async function discoverMovies(page: number = 1): Promise<TMDBMedia[]> {
  const data = await tmdbFetch<{ results: TMDBMedia[] }>('/discover/movie', {
    sort_by: 'popularity.desc',
    page: String(page),
  });
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function discoverTV(page: number = 1): Promise<TMDBMedia[]> {
  const data = await tmdbFetch<{ results: TMDBMedia[] }>('/discover/tv', {
    sort_by: 'popularity.desc',
    page: String(page),
  });
  return data.results.map(r => ({ ...r, media_type: 'tv' }));
}

// ─── Helpers ───
export function mediaTitle(m: TMDBMedia): string {
  return m.title || m.name || 'Untitled';
}

export function mediaYear(m: TMDBMedia): string {
  const d = m.release_date || m.first_air_date;
  return d ? d.slice(0, 4) : '';
}

export function mediaType(m: TMDBMedia): 'movie' | 'tv' {
  if (m.media_type) return m.media_type as 'movie' | 'tv';
  return m.title ? 'movie' : 'tv';
}

export function imdbIdFromExternalIds(ids: { imdb_id?: string }): string {
  return ids.imdb_id || '';
}

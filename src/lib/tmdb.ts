// ═══ TMDB API Integration ═══
// Uses rotating free API keys (from freekeys). No registration needed.

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';

// Free TMDB API keys (rotated on each request)
const TMDB_KEYS = [
  'fb7bb23f03b6994dafc674c074d01761',
  'e55425032d3d0f371fc776f302e7c09b',
  '8301a21598f8b45668d5711a814f01f6',
  '8cf43ad9c085135b9479ad5cf6bbcbda',
  'da63548086e399ffc910fbc08526df05',
  '13e53ff644a8bd4ba37b3e1044ad24f3',
  '269890f657dddf4635473cf4cf456576',
  'a2f888b27315e62e471b2d587048f32e',
  '8476a7ab80ad76f0936744df0430e67c',
  '5622cafbfe8f8cfe358a29c53e19bba0',
  'ae4bd1b6fce2a5648671bfc171d15ba4',
  '257654f35e3dff105574f97fb4b97035',
  '2f4038e83265214a0dcd6ec2eb3276f5',
  '9e43f45f94705cc8e1d5a0400d19a7b7',
  'af6887753365e14160254ac7f4345dd2',
  '06f10fc8741a672af455421c239a1ffc',
  '09ad8ace66eec34302943272db0e8d2c',
];

function randomKey(): string {
  return TMDB_KEYS[Math.floor(Math.random() * TMDB_KEYS.length)];
}

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
  url.searchParams.set('api_key', randomKey());
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

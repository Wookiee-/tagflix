// ═══ Local Storage Helpers ═══
// Typed wrappers for localStorage with the tagflix_ prefix.

function prefixed(key: string): string {
  return `tagflix_${key}`;
}

export function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(prefixed(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(prefixed(key), JSON.stringify(value));
}

export function removeItem(key: string): void {
  localStorage.removeItem(prefixed(key));
}

// ─── Continue Watching ───
export interface ContinueWatching {
  key: string;       // tmdbId:season:episode
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title: string;
  poster: string;
  progress: number;  // 0-100 percentage
  timestamp: number; // Date.now()
}

export function getContinueWatching(): ContinueWatching[] {
  return getItem<ContinueWatching[]>('continue_watching', []);
}

export function saveContinueWatching(entry: ContinueWatching): void {
  const list = getContinueWatching().filter(e => e.key !== entry.key);
  list.unshift(entry);
  // Keep last 50
  setItem('continue_watching', list.slice(0, 50));
}

export function removeContinueWatching(key: string): void {
  const list = getContinueWatching().filter(e => e.key !== key);
  setItem('continue_watching', list);
}

// ─── Favourites ───
export interface Favourite {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  poster: string;
  timestamp: number;
}

export function getFavourites(): Favourite[] {
  return getItem<Favourite[]>('favourites', []);
}

export function toggleFavourite(entry: Omit<Favourite, 'timestamp'>): boolean {
  const list = getFavourites();
  const idx = list.findIndex(f => f.tmdbId === entry.tmdbId && f.mediaType === entry.mediaType);
  if (idx >= 0) {
    list.splice(idx, 1);
    setItem('favourites', list);
    return false;
  } else {
    list.unshift({ ...entry, timestamp: Date.now() });
    setItem('favourites', list);
    return true;
  }
}

export function isFavourite(tmdbId: number, mediaType: string): boolean {
  return getFavourites().some(f => f.tmdbId === tmdbId && f.mediaType === mediaType);
}

// ─── Settings ───
export function getAccentColor(): string {
  return getItem<string>('accent', '#6366f1');
}

export function setAccentColor(color: string): void {
  setItem('accent', color);
  document.documentElement.style.setProperty('--accent', color);
  window.dispatchEvent(new CustomEvent('tagflix-accent-change', { detail: color }));
}

export function getSkin(): string {
  return getItem<string>('skin', 'dark');
}

export function setSkin(skin: string): void {
  setItem('skin', skin);
  window.dispatchEvent(new CustomEvent('tagflix-skin-change', { detail: skin }));
}

export function getActiveSource(): string {
  return getItem<string>('active_source', 'vidcore');
}

export function setActiveSource(sourceId: string): void {
  setItem('active_source', sourceId);
}

export function getAutoplayNext(): boolean {
  return getItem<boolean>('autoplay_next', true);
}

export function setAutoplayNext(val: boolean): void {
  setItem('autoplay_next', val);
}

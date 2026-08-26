import { createSignal, onMount, Show, For } from 'solid-js';
import { Bookmark } from 'lucide-solid';
import { getFavourites, type Favourite } from '../lib/storage';
import { imageUrl, mediaTitle, type TMDBMedia } from '../lib/tmdb';
import MediaCard from '../components/MediaCard';

export default function FavouritesPage() {
  const [items, setItems] = createSignal<Favourite[]>([]);

  onMount(() => {
    setItems(getFavourites());
  });

  const toMedia = (f: Favourite): TMDBMedia => ({
    id: f.tmdbId,
    media_type: f.mediaType,
    title: f.title,
    name: f.title,
    poster_path: f.poster,
    backdrop_path: null,
    overview: '',
    vote_average: 0,
    vote_count: 0,
    release_date: '',
    first_air_date: '',
  });

  return (
    <div class="p-4 md:p-8 pb-20">
      <div class="flex items-center gap-3 mb-6">
        <h1 class="text-2xl font-black" style={{ color: 'var(--text-white)' }}>My Library</h1>
        <Show when={items().length > 0}>
          <span class="text-xs font-bold px-2 py-0.5 rounded-md glass-strong text-white/40">
            {items().length}
          </span>
        </Show>
      </div>

      <Show when={items().length > 0} fallback={
        <div class="flex flex-col items-center justify-center py-24">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4 glass-card">
            <Bookmark size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <p class="text-lg font-bold" style={{ color: 'var(--text-white)' }}>No favourites yet</p>
          <p class="text-sm text-white/40 mt-1">Tap "Tag It" on any movie or show to save it here</p>
        </div>
      }>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          <For each={items()}>
            {(item) => <MediaCard item={toMedia(item)} size="md" />}
          </For>
        </div>
      </Show>
    </div>
  );
}

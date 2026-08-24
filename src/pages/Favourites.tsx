import { createSignal, onMount, Show, For } from 'solid-js';
import { getFavourites, type Favourite } from '../lib/storage';
import { imageUrl, mediaTitle, type TMDBMedia } from '../lib/tmdb';
import MediaCard from '../components/MediaCard';

export default function FavouritesPage() {
  const [items, setItems] = createSignal<Favourite[]>([]);

  onMount(() => {
    setItems(getFavourites());
  });

  // Convert Favourite to TMDBMedia for MediaCard
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
    <div class="p-4 md:p-8">
      <h1 class="text-2xl font-black mb-6" style={{ color: 'var(--text-white)' }}>Favourites</h1>

      <Show when={items().length > 0} fallback={
        <div class="text-center py-20 opacity-50">
          <p class="text-lg font-bold" style={{ color: 'var(--text-white)' }}>No favourites yet</p>
          <p class="text-sm mt-1">Add movies and shows to your library</p>
        </div>
      }>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          <For each={items()}>
            {(item) => <MediaCard item={toMedia(item)} size="md" />}
          </For>
        </div>
      </Show>
    </div>
  );
}

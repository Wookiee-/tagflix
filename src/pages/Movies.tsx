import { createSignal, createResource, For, Show } from 'solid-js';
import { getPopularMovies, getTopRatedMovies, discoverMovies, type TMDBMedia } from '../lib/tmdb';
import MediaCard from '../components/MediaCard';
import MediaRow from '../components/MediaRow';

export default function MoviesPage() {
  const [popular] = createResource(() => getPopularMovies());
  const [topRated] = createResource(() => getTopRatedMovies());

  return (
    <div class="pb-8">
      <div class="p-4 md:p-8 pb-0">
        <h1 class="text-2xl font-black" style={{ color: 'var(--text-white)' }}>Movies</h1>
      </div>

      <MediaRow
        title="Popular"
        items={popular() || []}
        loading={popular.loading}
        size="md"
      />

      <MediaRow
        title="Top Rated"
        items={topRated() || []}
        loading={topRated.loading}
        size="md"
      />
    </div>
  );
}

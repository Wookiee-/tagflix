import { createResource } from 'solid-js';
import { getPopularTV, getTopRatedTV } from '../lib/tmdb';
import MediaRow from '../components/MediaRow';

export default function TVShowsPage() {
  const [popular] = createResource(() => getPopularTV());
  const [topRated] = createResource(() => getTopRatedTV());

  return (
    <div class="pb-8">
      <div class="p-4 md:p-8 pb-0">
        <h1 class="text-2xl font-black" style={{ color: 'var(--text-white)' }}>TV Shows</h1>
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

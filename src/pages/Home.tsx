import { createSignal, onMount, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { TMDBMedia } from '../lib/tmdb';
import { getTrending, getPopularMovies, getPopularTV, imageUrl, mediaTitle, mediaYear, mediaType } from '../lib/tmdb';
import { getContinueWatching } from '../lib/storage';
import MediaRow from '../components/MediaRow';

// ═══ Hero banner for the top trending item ═══
function HeroBanner(props: { item: TMDBMedia }) {
  const navigate = useNavigate();
  const type = () => mediaType(props.item);

  return (
    <div class="relative w-full h-[400px] md:h-[500px] overflow-hidden mb-6">
      {/* Backdrop image */}
      <Show when={props.item.backdrop_path}>
        <img
          src={imageUrl(props.item.backdrop_path, 'w1280')}
          alt=""
          class="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlays */}
        <div class="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 60%)' }} />
        <div class="absolute inset-0" style={{ background: 'linear-gradient(to right, var(--bg) 0%, transparent 50%)' }} />
      </Show>

      {/* Content */}
      <div class="absolute bottom-0 left-0 p-6 md:p-10 max-w-2xl z-10">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--accent)', color: 'white' }}>
            {type() === 'movie' ? 'MOVIE' : 'TV'}
          </span>
          <Show when={props.item.vote_average > 0}>
            <span class="text-yellow-400 text-xs">★ {props.item.vote_average.toFixed(1)}</span>
          </Show>
          <span class="text-xs opacity-60">{mediaYear(props.item)}</span>
        </div>
        <h1 class="text-3xl md:text-5xl font-black mb-3 leading-tight" style={{ color: 'white' }}>
          {mediaTitle(props.item)}
        </h1>
        <p class="text-sm opacity-70 line-clamp-3 mb-4 max-w-lg">{props.item.overview}</p>
        <button
          class="px-6 py-2.5 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent)' }}
          onClick={() => navigate(`/${type()}/${props.item.id}`)}
        >
          Watch Now
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [trending, setTrending] = createSignal<TMDBMedia[]>([]);
  const [popularMovies, setPopularMovies] = createSignal<TMDBMedia[]>([]);
  const [popularTV, setPopularTV] = createSignal<TMDBMedia[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [continueWatching, setContinueWatching] = createSignal(getContinueWatching());

  onMount(async () => {
    try {
      const [t, pm, ptv] = await Promise.all([
        getTrending(),
        getPopularMovies(),
        getPopularTV(),
      ]);
      setTrending(t);
      setPopularMovies(pm);
      setPopularTV(ptv);
    } catch (e) {
      console.error('[Home] Failed to load:', e);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div class="pb-8">
      {/* Hero */}
      <Show when={trending().length > 0}>
        <HeroBanner item={trending()[0]} />
      </Show>

      {/* Continue Watching */}
      <Show when={continueWatching().length > 0}>
        <MediaRow
          title="Continue Watching"
          items={continueWatching().map(cw => ({
            id: cw.tmdbId,
            media_type: cw.mediaType,
            title: cw.title,
            name: cw.title,
            poster_path: cw.poster,
            backdrop_path: null,
            overview: '',
            vote_average: 0,
            vote_count: 0,
            release_date: '',
            first_air_date: '',
          }))}
          size="md"
        />
      </Show>

      {/* Trending */}
      <MediaRow
        title="Trending This Week"
        items={trending().slice(1)}
        loading={loading()}
        size="md"
      />

      {/* Popular Movies */}
      <MediaRow
        title="Popular Movies"
        items={popularMovies()}
        loading={loading()}
        size="md"
      />

      {/* Popular TV */}
      <MediaRow
        title="Popular TV Shows"
        items={popularTV()}
        loading={loading()}
        size="md"
      />
    </div>
  );
}

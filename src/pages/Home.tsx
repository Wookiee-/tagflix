import { createSignal, onMount, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { TMDBMedia } from '../lib/tmdb';
import { getTrending, getPopularMovies, getPopularTV, imageUrl, backdropUrl, mediaTitle, mediaYear, mediaType } from '../lib/tmdb';
import { getContinueWatching } from '../lib/storage';
import { Play, Star, ChevronRight } from 'lucide-solid';

/* ═══ Hero Banner ═══ */
function HeroBanner(props: { item: TMDBMedia }) {
  const navigate = useNavigate();
  const type = () => mediaType(props.item);

  return (
    <div class="relative w-full h-[55vh] min-h-[380px] max-h-[560px] overflow-hidden mb-8">
      <Show when={props.item.backdrop_path} fallback={
        <div class="absolute inset-0" style={{ background: 'var(--surface)' }} />
      }>
        <img
          src={backdropUrl(props.item.backdrop_path, 'original')}
          alt=""
          class="absolute inset-0 w-full h-full object-cover"
        />
      </Show>

      <div class="absolute inset-0" style={{
        background: 'linear-gradient(to top, var(--bg) 2%, rgba(0,0,0,0.5) 40%, transparent 100%)',
      }} />
      <div class="absolute inset-0" style={{
        background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
      }} />

      <div class="absolute bottom-0 left-0 p-6 md:p-10 max-w-2xl z-10">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md"
            style={{ background: 'var(--accent)', color: 'white' }}>
            {type() === 'movie' ? 'Movie' : 'TV Series'}
          </span>
          <Show when={props.item.vote_average > 0}>
            <span class="flex items-center gap-1 text-xs font-bold text-yellow-400">
              <Star size={12} fill="currentColor" /> {props.item.vote_average.toFixed(1)}
            </span>
          </Show>
          <span class="text-xs text-white/50">{mediaYear(props.item)}</span>
        </div>

        <h1 class="text-3xl md:text-5xl font-black mb-3 leading-[1.1] tracking-tight" style={{ color: 'white' }}>
          {mediaTitle(props.item)}
        </h1>

        <p class="text-sm text-white/60 line-clamp-3 mb-5 max-w-lg leading-relaxed">
          {props.item.overview}
        </p>

        <button
          class="px-7 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'var(--accent)' }}
          onClick={() => navigate(`/${type()}/${props.item.id}`)}
        >
          <Play size={18} fill="white" /> Watch Now
        </button>
      </div>
    </div>
  );
}

/* ═══ Section Header ═══ */
function SectionHeader(props: { title: string; onSeeAll?: () => void }) {
  return (
    <div class="flex items-center justify-between px-4 md:px-10 mb-3">
      <h2 class="text-lg md:text-xl font-bold tracking-tight" style={{ color: 'white' }}>
        {props.title}
      </h2>
      <Show when={props.onSeeAll}>
        <button
          class="flex items-center gap-1 text-xs font-semibold transition-colors"
          style={{ color: 'var(--accent)' }}
          onClick={props.onSeeAll}
        >
          See All <ChevronRight size={14} />
        </button>
      </Show>
    </div>
  );
}

/* ═══ Poster Card ═══ */
function PosterCard(props: { item: TMDBMedia }) {
  const navigate = useNavigate();
  const type = () => mediaType(props.item);

  return (
    <button
      class="shrink-0 w-[130px] md:w-[170px] group cursor-pointer"
      onClick={() => navigate(`/${type()}/${props.item.id}`)}
    >
      <div class="relative w-full aspect-[2/3] rounded-xl overflow-hidden mb-2 ring-1 ring-white/[0.06]">
        <Show when={props.item.poster_path} fallback={
          <div class="w-full h-full flex items-center justify-center px-2 text-center text-xs font-bold leading-tight"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            {mediaTitle(props.item)}
          </div>
        }>
          <img
            src={imageUrl(props.item.poster_path, 'w342')}
            alt={mediaTitle(props.item)}
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Show>

        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
          <div class="flex items-center gap-1">
            <Play size={14} fill="white" style={{ color: 'white' }} />
            <span class="text-white text-xs font-bold">Watch</span>
          </div>
        </div>

        <Show when={props.item.vote_average > 0}>
          <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm flex items-center gap-0.5">
            <Star size={9} fill="#facc15" style={{ color: '#facc15' }} />
            <span class="text-[10px] font-bold text-white">{props.item.vote_average.toFixed(1)}</span>
          </div>
        </Show>
      </div>

      <p class="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
        {mediaTitle(props.item)}
      </p>
      <p class="text-[10px] opacity-40">{mediaYear(props.item)}</p>
    </button>
  );
}

/* ═══ Continue Watching Card ═══ */
function ContinueCard(props: { item: { tmdbId: number; mediaType: string; title: string; poster: string; progress: number } }) {
  const navigate = useNavigate();

  return (
    <button
      class="shrink-0 w-[130px] md:w-[170px] group cursor-pointer"
      onClick={() => navigate(`/${props.item.mediaType}/${props.item.tmdbId}`)}
    >
      <div class="relative w-full aspect-[2/3] rounded-xl overflow-hidden mb-2 ring-1 ring-white/[0.06]">
        <Show when={props.item.poster} fallback={
          <div class="w-full h-full flex items-center justify-center px-2 text-center text-xs font-bold leading-tight"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            {props.item.title}
          </div>
        }>
          <img
            src={imageUrl(props.item.poster, 'w342')}
            alt={props.item.title}
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </Show>

        {/* Progress bar */}
        <Show when={props.item.progress > 0}>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div class="h-full rounded-r" style={{ width: `${Math.min(props.item.progress, 100)}%`, background: 'var(--accent)' }} />
          </div>
        </Show>

        {/* Hover overlay */}
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play size={20} fill="black" class="ml-0.5" style={{ color: 'black' }} />
          </div>
        </div>
      </div>

      <p class="text-xs font-semibold truncate">{props.item.title}</p>
    </button>
  );
}

/* ═══ Horizontal Scroll Row ═══ */
function MediaRow(props: { title: string; items: TMDBMedia[]; loading?: boolean }) {
  return (
    <div class="mb-8">
      <SectionHeader title={props.title} />
      <Show when={!props.loading} fallback={
        <div class="flex gap-3 px-4 md:px-10 overflow-hidden">
          <For each={[1, 2, 3, 4, 5, 6, 7]}>
            {() => (
              <div class="shrink-0 w-[130px] md:w-[170px]">
                <div class="w-full aspect-[2/3] rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
                <div class="h-3 rounded mt-2 animate-pulse w-3/4" style={{ background: 'var(--surface)' }} />
              </div>
            )}
          </For>
        </div>
      }>
        <div class="flex gap-3 px-4 md:px-10 overflow-x-auto pb-2 scroll-smooth">
          <For each={props.items}>
            {(item) => <PosterCard item={item} />}
          </For>
        </div>
      </Show>
    </div>
  );
}

/* ═══ Home Page ═══ */
export default function HomePage() {
  const navigate = useNavigate();
  const [trending, setTrending] = createSignal<TMDBMedia[]>([]);
  const [popularMovies, setPopularMovies] = createSignal<TMDBMedia[]>([]);
  const [popularTV, setPopularTV] = createSignal<TMDBMedia[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [continueWatching] = createSignal(getContinueWatching());

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
        <div class="mb-8">
          <SectionHeader title="Continue Watching" />
          <div class="flex gap-3 px-4 md:px-10 overflow-x-auto pb-2">
            <For each={continueWatching()}>
              {(cw) => <ContinueCard item={cw} />}
            </For>
          </div>
        </div>
      </Show>

      {/* Rows */}
      <MediaRow title="🔥 Trending This Week" items={trending().slice(1)} loading={loading()} />
      <MediaRow title="Popular Movies" items={popularMovies()} loading={loading()} />
      <MediaRow title="Popular TV Shows" items={popularTV()} loading={loading()} />
    </div>
  );
}

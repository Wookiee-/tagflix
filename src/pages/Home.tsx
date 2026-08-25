import { createSignal, onMount, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { TMDBMedia } from '../lib/tmdb';
import { getTrending, getPopularMovies, getPopularTV, imageUrl, backdropUrl, mediaTitle, mediaYear, mediaType } from '../lib/tmdb';
import { getContinueWatching, removeContinueWatching, clearAllContinueWatching, type ContinueWatching } from '../lib/storage';
import { Play, Star, ChevronRight, X } from 'lucide-solid';

/* ═══ Hero Banner ═══ */
function HeroBanner(props: { item: TMDBMedia }) {
  const navigate = useNavigate();
  const type = () => mediaType(props.item);

  return (
    <div class="relative w-full h-[50vh] min-h-[340px] max-h-[500px] overflow-hidden mb-8">
      <Show when={props.item.backdrop_path} fallback={
        <div class="absolute inset-0" style={{ background: 'var(--surface)' }} />
      }>
        <img
          src={backdropUrl(props.item.backdrop_path, 'original')}
          alt=""
          class="absolute inset-0 w-full h-full object-cover object-top animate-fade-in"
          style={{ 'object-position': 'center 20%' }}
        />
      </Show>

      <div class="absolute inset-0" style={{
        background: 'linear-gradient(to top, var(--bg) 0%, rgba(0,0,0,0.3) 35%, transparent 70%)',
      }} />
      <div class="absolute inset-0" style={{
        background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 45%, transparent 80%)',
      }} />
      <div class="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 20% 80%, var(--accent-glow) 0%, transparent 50%)',
      }} />

      <div class="absolute bottom-0 left-0 p-6 md:p-10 max-w-2xl z-10 animate-fade-in">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-lg glass-strong"
            style={{ color: 'white' }}>
            {type() === 'movie' ? 'Movie' : 'TV Series'}
          </span>
          <Show when={props.item.vote_average > 0}>
            <span class="flex items-center gap-1 text-xs font-bold text-yellow-400">
              <Star size={12} fill="currentColor" /> {props.item.vote_average.toFixed(1)}
            </span>
          </Show>
          <span class="text-xs text-white/40">{mediaYear(props.item)}</span>
        </div>

        <h1 class="text-3xl md:text-5xl font-black mb-3 leading-[1.05] tracking-tight" style={{ color: 'white' }}>
          {mediaTitle(props.item)}
        </h1>

        <p class="text-sm text-white/55 line-clamp-3 mb-6 max-w-lg leading-relaxed">
          {props.item.overview}
        </p>

        <div class="flex items-center gap-3">
          <button
            class="px-8 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center gap-2.5 transition-all duration-200 hover:brightness-110 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: 'var(--accent)',
              'box-shadow': '0 4px 20px var(--accent-glow), 0 0 40px var(--accent-glow)',
            }}
            onClick={() => navigate(`/${type()}/${props.item.id}`)}
          >
            <Play size={18} fill="white" /> Watch Now
          </button>
          <button
            class="w-12 h-12 rounded-2xl flex items-center justify-center glass transition-all duration-200 hover:scale-105"
            onClick={() => navigate(`/${type()}/${props.item.id}`)}
          >
            <span class="text-lg" style={{ color: 'white' }}>ℹ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Section Header ═══ */
function SectionHeader(props: { title: string; onSeeAll?: () => void; onClear?: () => void }) {
  return (
    <div class="flex items-center justify-between px-4 md:px-10 mb-4">
      <h2 class="text-base md:text-lg font-bold tracking-tight" style={{ color: 'white' }}>
        {props.title}
      </h2>
      <div class="flex items-center gap-3">
        <Show when={props.onClear}>
          <button
            class="text-xs font-semibold opacity-40 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text)' }}
            onClick={props.onClear}
          >
            Clear All
          </button>
        </Show>
        <Show when={props.onSeeAll}>
          <button
            class="flex items-center gap-1 text-xs font-semibold transition-all hover:gap-2"
            style={{ color: 'var(--accent)' }}
            onClick={props.onSeeAll}
          >
            See All <ChevronRight size={14} />
          </button>
        </Show>
      </div>
    </div>
  );
}

/* ═══ Poster Card ═══ */
function PosterCard(props: { item: TMDBMedia; delay?: number }) {
  const navigate = useNavigate();
  const type = () => mediaType(props.item);

  return (
    <button
      class="shrink-0 w-[130px] md:w-[170px] group cursor-pointer animate-fade-in"
      style={{ 'animation-delay': `${(props.delay || 0) * 50}ms` }}
      onClick={() => navigate(`/${type()}/${props.item.id}`)}
    >
      <div class="relative w-full aspect-[2/3] rounded-2xl overflow-hidden mb-2 ring-1 ring-white/[0.06] transition-all duration-300 group-hover:ring-white/20 group-hover:shadow-lg"
        style={{ 'box-shadow': '0 4px 20px rgba(0,0,0,0.3)' }}>
        <Show when={props.item.poster_path} fallback={
          <div class="w-full h-full flex items-center justify-center px-2 text-center text-xs font-bold leading-tight"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            {mediaTitle(props.item)}
          </div>
        }>
          <img
            src={imageUrl(props.item.poster_path, 'w185')}
            alt={mediaTitle(props.item)}
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </Show>

        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
          <div class="flex items-center gap-1.5 mb-1">
            <div class="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
              <Play size={12} fill="black" class="ml-0.5" style={{ color: 'black' }} />
            </div>
            <span class="text-white text-xs font-bold">Watch</span>
          </div>
        </div>

        <Show when={props.item.vote_average > 0}>
          <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg glass-strong flex items-center gap-0.5">
            <Star size={9} fill="#facc15" style={{ color: '#facc15' }} />
            <span class="text-[10px] font-bold text-white">{props.item.vote_average.toFixed(1)}</span>
          </div>
        </Show>
      </div>

      <p class="text-xs font-semibold truncate transition-colors group-hover:text-white" style={{ color: 'var(--text)' }}>
        {mediaTitle(props.item)}
      </p>
      <p class="text-[10px] opacity-35 mt-0.5">{mediaYear(props.item)}</p>
    </button>
  );
}

/* ═══ Continue Watching Card (with delete) ═══ */
function ContinueCard(props: {
  item: ContinueWatching;
  onDelete: (key: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div class="shrink-0 w-[130px] md:w-[170px] group relative animate-fade-in">
      {/* Delete button */}
      <button
        class="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-black/80 text-white/70 hover:text-white hover:bg-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
        onClick={(e) => { e.stopPropagation(); props.onDelete(props.item.key); }}
      >
        <X size={16} />
      </button>

      <button
        class="w-full cursor-pointer"
        onClick={() => navigate(`/${props.item.mediaType}/${props.item.tmdbId}`)}
      >
        <div class="relative w-full aspect-[2/3] rounded-2xl overflow-hidden mb-2 ring-1 ring-white/[0.06] transition-all duration-300 group-hover:ring-white/20"
          style={{ 'box-shadow': '0 4px 20px rgba(0,0,0,0.3)' }}>
          <Show when={props.item.poster} fallback={
            <div class="w-full h-full flex items-center justify-center px-2 text-center text-xs font-bold leading-tight"
              style={{ background: 'var(--surface)', color: 'var(--text)' }}>
              {props.item.title}
            </div>
          }>
            <img
              src={imageUrl(props.item.poster, 'w185')}
              alt={props.item.title}
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </Show>

          <div class="absolute inset-0" style={{
            background: 'linear-gradient(to top, var(--accent-glow) 0%, transparent 30%)',
            opacity: 0.4,
          }} />

          <Show when={props.item.progress > 0}>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
              <div class="h-full rounded-r-full transition-all duration-300" style={{
                width: `${Math.min(props.item.progress, 100)}%`,
                background: 'var(--accent)',
                'box-shadow': '0 0 8px var(--accent-glow)',
              }} />
            </div>
          </Show>

          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300"
              style={{ 'box-shadow': '0 4px 20px rgba(0,0,0,0.4)' }}>
              <Play size={18} fill="black" class="ml-0.5" style={{ color: 'black' }} />
            </div>
          </div>
        </div>

        <p class="text-xs font-semibold truncate transition-colors group-hover:text-white">{props.item.title}</p>
      </button>
    </div>
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
                <div class="w-full aspect-[2/3] rounded-2xl skeleton" />
                <div class="h-3 rounded-lg mt-2 skeleton w-3/4" />
              </div>
            )}
          </For>
        </div>
      }>
        <div class="flex gap-3 px-4 md:px-10 overflow-x-auto pb-2 scroll-smooth">
          <For each={props.items}>
            {(item, i) => <PosterCard item={item} delay={i()} />}
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
  const [cwItems, setCwItems] = createSignal(getContinueWatching());

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

  const deleteEntry = (key: string) => {
    removeContinueWatching(key);
    setCwItems(getContinueWatching());
  };

  const clearAll = () => {
    clearAllContinueWatching();
    setCwItems([]);
  };

  return (
    <div class="pb-8">
      <Show when={trending().length > 0}>
        <HeroBanner item={trending()[0]} />
      </Show>

      <Show when={cwItems().length > 0}>
        <div class="mb-8">
          <SectionHeader title="Continue Watching" onClear={clearAll} />
          <div class="flex gap-3 px-4 md:px-10 overflow-x-auto pb-2">
            <For each={cwItems()}>
              {(cw) => <ContinueCard item={cw} onDelete={deleteEntry} />}
            </For>
          </div>
        </div>
      </Show>

      <MediaRow title="🔥 Trending This Week" items={trending().slice(1)} loading={loading()} />
      <MediaRow title="Popular Movies" items={popularMovies()} loading={loading()} />
      <MediaRow title="Popular TV Shows" items={popularTV()} loading={loading()} />
    </div>
  );
}

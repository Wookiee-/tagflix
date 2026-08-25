import { createSignal, onMount, onCleanup, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { TMDBMedia } from '../lib/tmdb';
import { getTrending, getPopularMovies, getPopularTV, imageUrl, backdropUrl, mediaTitle, mediaYear, mediaType } from '../lib/tmdb';
import { getContinueWatching, removeContinueWatching, clearAllContinueWatching, type ContinueWatching } from '../lib/storage';
import { Play, Star, ChevronRight, ChevronLeft, Info, X } from 'lucide-solid';

/* ═══ Netflix-style Hero Carousel ═══ */
function HeroCarousel(props: { items: TMDBMedia[] }) {
  const navigate = useNavigate();
  const [current, setCurrent] = createSignal(0);
  const [paused, setPaused] = createSignal(false);
  let timer: ReturnType<typeof setInterval>;

  const type = (item: TMDBMedia) => mediaType(item);

  // Auto-rotate every 6 seconds
  onMount(() => {
    timer = setInterval(() => {
      if (!paused()) {
        setCurrent((c) => (c + 1) % Math.min(props.items.length, 5));
      }
    }, 6000);
  });

  onCleanup(() => clearInterval(timer));

  const go = (dir: number) => {
    setCurrent((c) => {
      const len = Math.min(props.items.length, 5);
      return (c + dir + len) % len;
    });
  };

  return (
    <div
      class="relative w-full h-[65vh] min-h-[450px] max-h-[700px] overflow-hidden mb-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <For each={props.items.slice(0, 5)}>
        {(item, i) => (
          <div
            class="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: current() === i() ? 1 : 0, 'z-index': current() === i() ? 1 : 0 }}
          >
            {/* Backdrop image */}
            <Show when={item.backdrop_path} fallback={
              <div class="absolute inset-0" style={{ background: 'var(--surface)' }} />
            }>
              <img
                src={backdropUrl(item.backdrop_path, 'original')}
                alt=""
                class="absolute inset-0 w-full h-full object-cover object-top"
                style={{ 'object-position': 'center 15%' }}
              />
            </Show>

            {/* Gradient overlays */}
            <div class="absolute inset-0" style={{
              background: 'linear-gradient(to top, var(--bg) 0%, rgba(10,10,15,0.5) 30%, transparent 60%)',
            }} />
            <div class="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(10,10,15,0.8) 0%, rgba(10,10,15,0.3) 40%, transparent 70%)',
            }} />
            <div class="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, rgba(10,10,15,0.4) 0%, transparent 15%)',
            }} />

            {/* Content */}
            <div class="absolute bottom-0 left-0 p-8 md:p-14 max-w-3xl z-10">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg glass-strong text-white/90">
                  {type(item) === 'movie' ? '🎬 Movie' : '📺 TV Series'}
                </span>
                <Show when={item.vote_average > 0}>
                  <span class="flex items-center gap-1.5 text-sm font-bold text-yellow-400">
                    <Star size={14} fill="currentColor" /> {item.vote_average.toFixed(1)}
                  </span>
                </Show>
                <span class="text-sm text-white/40 font-medium">{mediaYear(item)}</span>
              </div>

              <h1 class="text-4xl md:text-6xl font-black mb-4 leading-[1.05] tracking-tight text-white drop-shadow-lg">
                {mediaTitle(item)}
              </h1>

              <p class="text-base md:text-lg text-white/60 line-clamp-3 mb-8 max-w-xl leading-relaxed">
                {item.overview}
              </p>

              <div class="flex items-center gap-4">
                <button
                  class="btn-primary"
                  onClick={() => navigate(`/${type(item)}/${item.id}`)}
                >
                  <Play size={22} fill="white" /> Watch Now
                </button>
                <button
                  class="btn-secondary"
                  onClick={() => navigate(`/${type(item)}/${item.id}`)}
                >
                  <Info size={20} /> More Info
                </button>
              </div>
            </div>
          </div>
        )}
      </For>

      {/* Navigation arrows */}
      <button
        class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 transition-all border border-white/10"
        onClick={() => go(-1)}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 transition-all border border-white/10"
        onClick={() => go(1)}
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <For each={props.items.slice(0, 5)}>
          {(_, i) => (
            <button
              class={`carousel-dot ${current() === i() ? 'active' : ''}`}
              onClick={() => setCurrent(i())}
            />
          )}
        </For>
      </div>
    </div>
  );
}

/* ═══ Section Header ═══ */
function SectionHeader(props: { title: string; icon?: string; onSeeAll?: () => void; onClear?: () => void }) {
  return (
    <div class="flex items-center justify-between px-6 md:px-12 mb-5">
      <h2 class="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
        {props.icon && <span>{props.icon}</span>}
        {props.title}
      </h2>
      <div class="flex items-center gap-4">
        <Show when={props.onClear}>
          <button
            class="text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
            onClick={props.onClear}
          >
            Clear All
          </button>
        </Show>
        <Show when={props.onSeeAll}>
          <button
            class="flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5"
            style={{ color: 'var(--accent)' }}
            onClick={props.onSeeAll}
          >
            See All <ChevronRight size={16} />
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
      class="shrink-0 w-[140px] md:w-[185px] group cursor-pointer animate-fade-in"
      style={{ 'animation-delay': `${(props.delay || 0) * 60}ms` }}
      onClick={() => navigate(`/${type()}/${props.item.id}`)}
    >
      <div class="relative w-full aspect-[2/3] rounded-xl overflow-hidden mb-2.5 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/30 group-hover:shadow-2xl group-hover:scale-[1.04]"
        style={{ 'box-shadow': '0 8px 30px rgba(0,0,0,0.4)' }}>
        <Show when={props.item.poster_path} fallback={
          <div class="w-full h-full flex items-center justify-center px-3 text-center text-xs font-bold leading-tight"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            {mediaTitle(props.item)}
          </div>
        }>
          <img
            src={imageUrl(props.item.poster_path, 'w342')}
            alt={mediaTitle(props.item)}
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </Show>

        {/* Hover overlay */}
        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
              <Play size={14} fill="black" class="ml-0.5" style={{ color: 'black' }} />
            </div>
            <span class="text-white text-sm font-bold">Watch</span>
          </div>
        </div>

        {/* Rating badge */}
        <Show when={props.item.vote_average > 0}>
          <div class="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg glass-strong flex items-center gap-1">
            <Star size={10} fill="#facc15" style={{ color: '#facc15' }} />
            <span class="text-[11px] font-bold text-white">{props.item.vote_average.toFixed(1)}</span>
          </div>
        </Show>
      </div>

      <p class="text-sm font-semibold truncate transition-colors group-hover:text-white" style={{ color: 'var(--text)' }}>
        {mediaTitle(props.item)}
      </p>
      <p class="text-xs text-white/30 mt-0.5 font-medium">{mediaYear(props.item)}</p>
    </button>
  );
}

/* ═══ Continue Watching Card ═══ */
function ContinueCard(props: {
  item: ContinueWatching;
  onDelete: (key: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div class="shrink-0 w-[140px] md:w-[185px] group relative animate-fade-in">
      {/* Delete button */}
      <button
        class="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-black/80 text-white/60 hover:text-white hover:bg-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg border border-white/10"
        onClick={(e) => { e.stopPropagation(); props.onDelete(props.item.key); }}
      >
        <X size={14} />
      </button>

      <button
        class="w-full cursor-pointer"
        onClick={() => navigate(`/${props.item.mediaType}/${props.item.tmdbId}`)}
      >
        <div class="relative w-full aspect-[2/3] rounded-xl overflow-hidden mb-2.5 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/30 group-hover:shadow-2xl"
          style={{ 'box-shadow': '0 8px 30px rgba(0,0,0,0.4)' }}>
          <Show when={props.item.poster} fallback={
            <div class="w-full h-full flex items-center justify-center px-3 text-center text-xs font-bold leading-tight"
              style={{ background: 'var(--surface)', color: 'var(--text)' }}>
              {props.item.title}
            </div>
          }>
            <img
              src={imageUrl(props.item.poster, 'w342')}
              alt={props.item.title}
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </Show>

          {/* Accent glow at bottom */}
          <div class="absolute inset-0" style={{
            background: 'linear-gradient(to top, var(--accent-glow) 0%, transparent 25%)',
            opacity: 0.3,
          }} />

          {/* Progress bar */}
          <Show when={props.item.progress > 0}>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
              <div class="h-full rounded-r-full transition-all duration-300" style={{
                width: `${Math.min(props.item.progress, 100)}%`,
                background: 'var(--accent)',
                'box-shadow': '0 0 10px var(--accent-glow)',
              }} />
            </div>
          </Show>

          {/* Play overlay */}
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div class="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl"
              style={{ 'box-shadow': '0 4px 24px rgba(0,0,0,0.5)' }}>
              <Play size={20} fill="black" class="ml-0.5" style={{ color: 'black' }} />
            </div>
          </div>
        </div>

        <p class="text-sm font-semibold truncate transition-colors group-hover:text-white">{props.item.title}</p>
        <p class="text-xs text-white/30 mt-0.5 font-medium">S{props.item.season} E{props.item.episode}</p>
      </button>
    </div>
  );
}

/* ═══ Horizontal Scroll Row ═══ */
function MediaRow(props: { title: string; icon?: string; items: TMDBMedia[]; loading?: boolean }) {
  return (
    <div class="mb-10">
      <SectionHeader title={props.title} icon={props.icon} />
      <Show when={!props.loading} fallback={
        <div class="flex gap-4 px-6 md:px-12 overflow-hidden">
          <For each={[1, 2, 3, 4, 5, 6, 7]}>
            {() => (
              <div class="shrink-0 w-[140px] md:w-[185px]">
                <div class="w-full aspect-[2/3] rounded-xl skeleton" />
                <div class="h-3.5 rounded-lg mt-3 skeleton w-3/4" />
              </div>
            )}
          </For>
        </div>
      }>
        <div class="flex gap-4 px-6 md:px-12 overflow-x-auto pb-3 scroll-smooth">
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
    <div class="pb-10">
      {/* Netflix-style hero carousel */}
      <Show when={trending().length > 0}>
        <HeroCarousel items={trending()} />
      </Show>

      {/* Continue Watching */}
      <Show when={cwItems().length > 0}>
        <div class="mb-10">
          <SectionHeader title="Continue Watching" icon="▶️" onClear={clearAll} />
          <div class="flex gap-4 px-6 md:px-12 overflow-x-auto pb-3">
            <For each={cwItems()}>
              {(cw) => <ContinueCard item={cw} onDelete={deleteEntry} />}
            </For>
          </div>
        </div>
      </Show>

      <MediaRow title="Trending This Week" icon="🔥" items={trending().slice(1)} loading={loading()} />
      <MediaRow title="Popular Movies" icon="🎬" items={popularMovies()} loading={loading()} />
      <MediaRow title="Popular TV Shows" icon="📺" items={popularTV()} loading={loading()} />
    </div>
  );
}

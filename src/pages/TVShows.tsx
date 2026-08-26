import { createSignal, createResource, Show, For, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Play, Info } from 'lucide-solid';
import { getPopularTV, getTopRatedTV, getTrending, backdropUrl, mediaTitle, mediaYear, matchPercent, type TMDBMedia } from '../lib/tmdb';
import MediaRow from '../components/MediaRow';

export default function TVShowsPage() {
  const navigate = useNavigate();
  const [popular] = createResource(() => getPopularTV());
  const [topRated] = createResource(() => getTopRatedTV());
  const [trending] = createResource(() => getTrending());
  const [heroIndex, setHeroIndex] = createSignal(0);

  const heroShows = () => (popular() || []).slice(0, 3);

  onMount(() => {
    setInterval(() => {
      setHeroIndex((c) => (c + 1) % Math.min(heroShows().length || 1, 3));
    }, 7000);
  });

  return (
    <div class="pb-10">
      {/* Hero Banner */}
      <Show when={heroShows().length > 0}>
        <div class="relative w-full h-[50vh] min-h-[350px] max-h-[550px] overflow-hidden mb-6">
          <For each={heroShows()}>
            {(show, i) => (
              <div
                class="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{ opacity: heroIndex() === i() ? 1 : 0, 'z-index': heroIndex() === i() ? 1 : 0 }}
              >
                <Show when={show.backdrop_path} fallback={
                  <div class="absolute inset-0" style={{ background: 'var(--surface)' }} />
                }>
                  <img
                    src={backdropUrl(show.backdrop_path, 'original')}
                    alt=""
                    class="absolute inset-0 w-full h-full object-cover object-top"
                    style={{ 'object-position': 'center 15%' }}
                  />
                </Show>
                <div class="absolute inset-0" style={{
                  background: 'linear-gradient(to top, var(--bg) 0%, rgba(10,10,15,0.5) 30%, transparent 60%)',
                }} />
                <div class="absolute inset-0" style={{
                  background: 'linear-gradient(to right, rgba(10,10,15,0.8) 0%, rgba(10,10,15,0.3) 40%, transparent 70%)',
                }} />

                <div class="absolute bottom-0 left-0 p-6 md:p-10 max-w-2xl z-10">
                  <span class="text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-md glass-strong text-white/70 mb-3 inline-block">
                    Featured Series
                  </span>
                  <h1 class="text-3xl md:text-5xl font-black mb-2 leading-[1.05] tracking-tight text-white drop-shadow-lg">
                    {mediaTitle(show)}
                  </h1>
                  <div class="flex items-center gap-2 mb-3 text-sm">
                    <Show when={show.vote_average > 0}>
                      <span class="font-bold text-green-400">{matchPercent(show.vote_average)}% Match</span>
                    </Show>
                    <span class="text-white/30">•</span>
                    <span class="text-white/60 font-medium">{mediaYear(show)}</span>
                  </div>
                  <p class="text-sm text-white/50 line-clamp-2 mb-4 max-w-lg">{show.overview}</p>
                  <div class="flex items-center gap-3">
                    <button
                      class="btn-primary btn-sm tv-focusable"
                      onClick={() => navigate(`/tv/${show.id}`)}
                    >
                      <Play size={16} fill="white" /> Play
                    </button>
                    <button
                      class="btn-secondary btn-sm tv-focusable"
                      onClick={() => navigate(`/tv/${show.id}`)}
                    >
                      <Info size={16} /> More Info
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>

          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            <For each={heroShows()}>
              {(_, i) => (
                <button
                  class={`carousel-dot ${heroIndex() === i() ? 'active' : ''}`}
                  onClick={() => setHeroIndex(i())}
                />
              )}
            </For>
          </div>
        </div>
      </Show>

      <MediaRow
        title="Popular Shows"
        icon="🔥"
        items={popular() || []}
        loading={popular.loading}
        size="md"
      />
      <MediaRow
        title="Top Rated"
        icon="⭐"
        items={topRated() || []}
        loading={topRated.loading}
        size="md"
      />
      <MediaRow
        title="Trending Now"
        icon="📈"
        items={(trending() || []).filter(m => m.media_type === 'tv')}
        loading={trending.loading}
        size="md"
      />
    </div>
  );
}

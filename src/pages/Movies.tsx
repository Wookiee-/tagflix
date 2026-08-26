import { createSignal, createResource, Show, For, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Play, Info, Star } from 'lucide-solid';
import { getPopularMovies, getTopRatedMovies, getTrending, imageUrl, backdropUrl, mediaTitle, mediaYear, matchPercent, type TMDBMedia } from '../lib/tmdb';
import MediaRow from '../components/MediaRow';

export default function MoviesPage() {
  const navigate = useNavigate();
  const [popular] = createResource(() => getPopularMovies());
  const [topRated] = createResource(() => getTopRatedMovies());
  const [trending] = createResource(() => getTrending());
  const [heroIndex, setHeroIndex] = createSignal(0);

  // Hero: top 3 popular movies
  const heroMovies = () => (popular() || []).slice(0, 3);

  // Auto-rotate hero
  onMount(() => {
    setInterval(() => {
      setHeroIndex((c) => (c + 1) % Math.min(heroMovies().length || 1, 3));
    }, 7000);
  });

  return (
    <div class="pb-10">
      {/* Hero Banner */}
      <Show when={heroMovies().length > 0}>
        <div class="relative w-full h-[50vh] min-h-[350px] max-h-[550px] overflow-hidden mb-6">
          <For each={heroMovies()}>
            {(movie, i) => (
              <div
                class="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{ opacity: heroIndex() === i() ? 1 : 0, 'z-index': heroIndex() === i() ? 1 : 0 }}
              >
                <Show when={movie.backdrop_path} fallback={
                  <div class="absolute inset-0" style={{ background: 'var(--surface)' }} />
                }>
                  <img
                    src={backdropUrl(movie.backdrop_path, 'original')}
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
                    Featured Movie
                  </span>
                  <h1 class="text-3xl md:text-5xl font-black mb-2 leading-[1.05] tracking-tight text-white drop-shadow-lg">
                    {mediaTitle(movie)}
                  </h1>
                  <div class="flex items-center gap-2 mb-3 text-sm">
                    <Show when={movie.vote_average > 0}>
                      <span class="font-bold text-green-400">{matchPercent(movie.vote_average)}% Match</span>
                    </Show>
                    <span class="text-white/30">•</span>
                    <span class="text-white/60 font-medium">{mediaYear(movie)}</span>
                  </div>
                  <p class="text-sm text-white/50 line-clamp-2 mb-4 max-w-lg">{movie.overview}</p>
                  <div class="flex items-center gap-3">
                    <button
                      class="btn-primary btn-sm tv-focusable"
                      onClick={() => navigate(`/movie/${movie.id}`)}
                    >
                      <Play size={16} fill="white" /> Play
                    </button>
                    <button
                      class="btn-secondary btn-sm tv-focusable"
                      onClick={() => navigate(`/movie/${movie.id}`)}
                    >
                      <Info size={16} /> More Info
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>

          {/* Dots */}
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            <For each={heroMovies()}>
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
        title="Popular Movies"
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
        items={(trending() || []).filter(m => m.media_type === 'movie')}
        loading={trending.loading}
        size="md"
      />
    </div>
  );
}

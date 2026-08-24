import { createSignal, createResource, Show, For, Switch, Match, onMount } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { ArrowLeft, Bookmark, BookmarkCheck, Play, Star, Calendar, Clock } from 'lucide-solid';
import {
  getMovieDetail, getTvDetail, getSeasonEpisodes,
  imageUrl, backdropUrl, mediaTitle, mediaYear, mediaType,
  type TMDBMedia, type TMDBMovieDetail, type TMDBTvDetail, type TMDBEpisode,
} from '../lib/tmdb';
import { SOURCES, type StreamSource } from '../lib/sources';
import { isFavourite, toggleFavourite, getActiveSource, setActiveSource, saveContinueWatching } from '../lib/storage';

export default function DetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const tmdbId = () => Number(params.id);
  const isTv = () => window.location.pathname.startsWith('/tv/');

  // Fetch detail data
  const [detail] = createResource(tmdbId, async (id) => {
    if (isTv()) return getTvDetail(id);
    return getMovieDetail(id);
  });

  // Season/episode state for TV
  const [activeSeason, setActiveSeason] = createSignal(1);
  const [episodes, setEpisodes] = createSignal<TMDBEpisode[]>([]);

  // Episodes resource
  createResource(activeSeason, async (season) => {
    if (!isTv()) return;
    try {
      const eps = await getSeasonEpisodes(tmdbId(), season);
      setEpisodes(eps);
    } catch (e) {
      console.error('[Detail] Failed to load episodes:', e);
    }
  });

  // Source picker
  const [activeSource, setActiveSrc] = createSignal(getActiveSource());
  const [selectedSource, setSelectedSource] = createSignal<StreamSource | null>(null);

  // Favourite state
  const [fav, setFav] = createSignal(false);
  onMount(() => {
    setFav(isFavourite(tmdbId(), isTv() ? 'tv' : 'movie'));
  });

  const toggleFav = () => {
    const d = detail();
    if (!d) return;
    const added = toggleFavourite({
      tmdbId: d.id,
      mediaType: isTv() ? 'tv' : 'movie',
      title: mediaTitle(d),
      poster: d.poster_path || '',
    });
    setFav(added);
  };

  // Play with source
  const playWithSource = (source: StreamSource) => {
    const d = detail();
    if (!d) return;

    // Build the embed URL
    const embedUrl = isTv()
      ? source.tvUrl(d.id, activeSeason(), episodes()[0]?.episode_number || 1)
      : source.movieUrl(d.id);

    setActiveSource(source.id);
    navigate('/player', {
      state: {
        embedUrl,
        title: mediaTitle(d),
        tmdbId: d.id,
        mediaType: isTv() ? 'tv' : 'movie',
        season: isTv() ? activeSeason() : undefined,
        episode: isTv() ? episodes()[0]?.episode_number : undefined,
        poster: d.poster_path,
        backdrop: d.backdrop_path,
        sourceId: source.id,
        sources: SOURCES,
        // For episode navigation
        episodes: isTv() ? episodes() : undefined,
        activeSeason: isTv() ? activeSeason() : undefined,
      },
    });
  };

  const playEpisode = (ep: TMDBEpisode) => {
    const d = detail();
    if (!d) return;
    const source = SOURCES.find(s => s.id === activeSource()) || SOURCES[0];
    const embedUrl = source.tvUrl(d.id, ep.season_number, ep.episode_number);
    navigate('/player', {
      state: {
        embedUrl,
        title: `${mediaTitle(d)} S${ep.season_number}E${ep.episode_number}`,
        tmdbId: d.id,
        mediaType: 'tv',
        season: ep.season_number,
        episode: ep.episode_number,
        poster: d.poster_path,
        backdrop: d.backdrop_path,
        sourceId: source.id,
        sources: SOURCES,
        episodes: episodes(),
        activeSeason: activeSeason(),
      },
    });
  };

  return (
    <div class="min-h-screen">
      {/* Loading state */}
      <Show when={detail() === undefined}>
        <div class="flex items-center justify-center h-[60vh]">
          <div class="w-10 h-10 rounded-full border-2 animate-spin" style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }} />
        </div>
      </Show>

      <Show when={detail()}>
        {(d) => {
          const data = d();
          return (
            <div>
              {/* Backdrop hero */}
              <div class="relative h-[300px] md:h-[400px] overflow-hidden">
                <Show when={data.backdrop_path}>
                  <img src={backdropUrl(data.backdrop_path)} alt="" class="absolute inset-0 w-full h-full object-cover" />
                  <div class="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 70%)' }} />
                </Show>

                {/* Back button */}
                <button
                  class="absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              {/* Content */}
              <div class="relative px-4 md:px-8 -mt-24 z-10">
                <div class="flex gap-6">
                  {/* Poster */}
                  <Show when={data.poster_path}>
                    <div class="shrink-0 w-[130px] md:w-[180px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
                      <img src={imageUrl(data.poster_path, 'w342')} alt="" class="w-full h-full object-cover" />
                    </div>
                  </Show>

                  {/* Info */}
                  <div class="flex-1 pt-16 md:pt-20">
                    <h1 class="text-2xl md:text-4xl font-black mb-2" style={{ color: 'var(--text-white)' }}>
                      {mediaTitle(data)}
                    </h1>

                    <div class="flex items-center gap-3 mb-4 text-sm">
                      <Show when={data.vote_average > 0}>
                        <span class="flex items-center gap-1 text-yellow-400">
                          <Star size={14} /> {data.vote_average.toFixed(1)}
                        </span>
                      </Show>
                      <span class="opacity-50">{mediaYear(data)}</span>
                      <Show when={isTv() && (data as TMDBTvDetail).number_of_seasons}>
                        <span class="opacity-50">{(data as TMDBTvDetail).number_of_seasons} season{(data as TMDBTvDetail).number_of_seasons > 1 ? 's' : ''}</span>
                      </Show>
                      <Show when={!isTv() && (data as TMDBMovieDetail).runtime}>
                        <span class="opacity-50">{(data as TMDBMovieDetail).runtime} min</span>
                      </Show>
                    </div>

                    <Show when={data.genres?.length}>
                      <div class="flex gap-2 mb-4 flex-wrap">
                        <For each={data.genres}>
                          {(g) => (
                            <span class="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                              {g.name}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>

                    <p class="text-sm leading-relaxed mb-4 opacity-80 max-w-2xl">{data.overview}</p>

                    {/* Actions */}
                    <div class="flex gap-3 flex-wrap">
                      <button
                        class="px-6 py-3 rounded-lg font-bold text-sm text-white flex items-center gap-2 transition-opacity hover:opacity-90"
                        style={{ background: 'var(--accent)' }}
                        onClick={() => {
                          const source = SOURCES.find(s => s.id === activeSource()) || SOURCES[0];
                          playWithSource(source);
                        }}
                      >
                        <Play size={18} /> Play
                      </button>
                      <button
                        class="px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-opacity hover:opacity-80"
                        style={{ background: 'var(--surface)', color: 'var(--text-white)' }}
                        onClick={toggleFav}
                      >
                        <Show when={fav()} fallback={<Bookmark size={18} />}>
                          <BookmarkCheck size={18} />
                        </Show>
                        {fav() ? 'Favourited' : 'Favourite'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Source Picker */}
                <div class="mt-8 mb-6">
                  <h3 class="text-sm font-bold mb-3 uppercase tracking-wider opacity-50">Source</h3>
                  <div class="flex gap-2 flex-wrap">
                    <For each={SOURCES}>
                      {(source) => (
                        <button
                          class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                          style={{
                            background: activeSource() === source.id ? 'var(--accent)' : 'var(--surface)',
                            color: activeSource() === source.id ? 'white' : 'var(--text)',
                          }}
                          onClick={() => {
                            setActiveSrc(source.id);
                            playWithSource(source);
                          }}
                        >
                          {source.name}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                {/* TV Season / Episode Browser */}
                <Show when={isTv()}>
                  <div class="mt-6">
                    {/* Season tabs */}
                    <Show when={(data as TMDBTvDetail).seasons?.length}>
                      <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
                        <For each={(data as TMDBTvDetail).seasons.filter(s => s.season_number > 0)}>
                          {(season) => (
                            <button
                              class="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shrink-0"
                              style={{
                                background: activeSeason() === season.season_number ? 'var(--accent)' : 'var(--surface)',
                                color: activeSeason() === season.season_number ? 'white' : 'var(--text)',
                              }}
                              onClick={() => setActiveSeason(season.season_number)}
                            >
                              Season {season.season_number}
                            </button>
                          )}
                        </For>
                      </div>
                    </Show>

                    {/* Episodes */}
                    <div class="flex flex-col gap-2">
                      <For each={episodes()}>
                        {(ep) => (
                          <button
                            class="flex gap-4 p-3 rounded-lg text-left transition-colors hover:bg-white/5"
                            style={{ background: 'var(--surface)' }}
                            onClick={() => playEpisode(ep)}
                          >
                            <Show when={ep.still_path}>
                              <img src={imageUrl(ep.still_path, 'w300')} alt="" class="w-28 h-16 object-cover rounded shrink-0" />
                            </Show>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-semibold truncate" style={{ color: 'var(--text-white)' }}>
                                {ep.episode_number}. {ep.name}
                              </p>
                              <p class="text-xs opacity-60 line-clamp-2 mt-1">{ep.overview}</p>
                            </div>
                            <div class="shrink-0 flex items-center">
                              <Play size={16} class="opacity-50" />
                            </div>
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          );
        }}
      </Show>
    </div>
  );
}


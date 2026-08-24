import { createSignal, createResource, Show, For, onMount } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import {
  ArrowLeft, Bookmark, BookmarkCheck, Play, Star, Clock, ChevronDown,
} from 'lucide-solid';
import {
  getMovieDetail, getTvDetail, getSeasonEpisodes,
  imageUrl, backdropUrl, mediaTitle, mediaYear, mediaType,
  type TMDBMedia, type TMDBMovieDetail, type TMDBTvDetail, type TMDBEpisode,
} from '../lib/tmdb';
import { SOURCES } from '../lib/sources';
import {
  isFavourite, toggleFavourite, getActiveSource, setActiveSource,
} from '../lib/storage';

export default function DetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const tmdbId = () => Number(params.id);
  const isTv = () => window.location.pathname.startsWith('/tv/');

  // Fetch detail
  const [detail] = createResource(tmdbId, async (id) => {
    if (isTv()) return getTvDetail(id);
    return getMovieDetail(id);
  });

  // Season/episode state
  const [activeSeason, setActiveSeason] = createSignal(1);
  const [episodes, setEpisodes] = createSignal<TMDBEpisode[]>([]);

  createResource(activeSeason, async (season) => {
    if (!isTv()) return;
    try {
      const eps = await getSeasonEpisodes(tmdbId(), season);
      setEpisodes(eps);
    } catch (e) {
      console.error('[Detail] Failed to load episodes:', e);
    }
  });

  // Source
  const [activeSource, setActiveSrc] = createSignal(getActiveSource());

  // Favourite
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

  // Play
  const playWithSource = (sourceId?: string) => {
    const d = detail();
    if (!d) return;
    const sid = sourceId || activeSource();
    const source = SOURCES.find(s => s.id === sid) || SOURCES[0];
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
        episodes: isTv() ? episodes() : undefined,
        activeSeason: isTv() ? activeSeason() : undefined,
      },
    });
  };

  const playEpisode = (ep: TMDBEpisode) => {
    const d = detail();
    if (!d) return;
    const source = SOURCES.find(s => s.id === activeSource()) || SOURCES[0];
    navigate('/player', {
      state: {
        embedUrl: source.tvUrl(d.id, ep.season_number, ep.episode_number),
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
      {/* Loading */}
      <Show when={detail() === undefined}>
        <div class="flex items-center justify-center h-[60vh]">
          <div class="w-10 h-10 rounded-full border-2 animate-spin" style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }} />
        </div>
      </Show>

      <Show when={detail()}>
        {(d) => {
          const data = d();
          const tvData = () => data as TMDBTvDetail;
          const movieData = () => data as TMDBMovieDetail;
          const runtime = () => isTv()
            ? (tvData().episode_run_time?.[0] || 0)
            : movieData().runtime || 0;

          return (
            <div>
              {/* ═══ Hero Backdrop ═══ */}
              <div class="relative w-full h-[45vh] min-h-[320px] max-h-[520px] overflow-hidden">
                <Show when={data.backdrop_path} fallback={
                  <div class="absolute inset-0" style={{ background: 'var(--surface)' }} />
                }>
                  <img
                    src={backdropUrl(data.backdrop_path, 'original')}
                    alt=""
                    class="absolute inset-0 w-full h-full object-cover"
                  />
                </Show>

                {/* Gradient overlays */}
                <div class="absolute inset-0" style={{
                  background: 'linear-gradient(to top, var(--bg) 5%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.2) 100%)',
                }} />
                <div class="absolute inset-0" style={{
                  background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 60%)',
                }} />

                {/* Back button */}
                <button
                  class="absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              {/* ═══ Content ═══ */}
              <div class="relative px-4 md:px-10 -mt-40 z-10 pb-10">
                {/* Poster + Info row */}
                <div class="flex gap-6 md:gap-8">
                  {/* Poster */}
                  <Show when={data.poster_path}>
                    <div class="shrink-0 w-[120px] md:w-[180px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                      <img src={imageUrl(data.poster_path, 'w342')} alt="" class="w-full h-full object-cover" />
                    </div>
                  </Show>

                  {/* Info */}
                  <div class="flex-1 pt-20 md:pt-24">
                    {/* Title */}
                    <h1 class="text-2xl md:text-5xl font-black mb-3 leading-tight tracking-tight" style={{ color: 'white' }}>
                      {mediaTitle(data)}
                    </h1>

                    {/* Meta row */}
                    <div class="flex items-center gap-3 mb-4 text-sm flex-wrap">
                      <Show when={data.vote_average > 0}>
                        <span class="flex items-center gap-1 font-bold text-yellow-400">
                          <Star size={15} fill="currentColor" /> {data.vote_average.toFixed(1)}
                        </span>
                      </Show>
                      <span class="text-white/40">•</span>
                      <span class="text-white/70 font-medium">{mediaYear(data)}</span>
                      <Show when={runtime() > 0}>
                        <span class="text-white/40">•</span>
                        <span class="text-white/70 font-medium flex items-center gap-1">
                          <Clock size={13} />
                          {Math.floor(runtime() / 60)}h {runtime() % 60}m
                        </span>
                      </Show>
                      <Show when={isTv()}>
                        <span class="text-white/40">•</span>
                        <span class="text-white/70 font-medium">
                          {tvData().number_of_seasons} Season{tvData().number_of_seasons > 1 ? 's' : ''}
                        </span>
                      </Show>
                    </div>

                    {/* Genres */}
                    <Show when={data.genres?.length}>
                      <div class="flex gap-2 mb-4 flex-wrap">
                        <For each={data.genres}>
                          {(g) => (
                            <span
                              class="text-xs px-3 py-1 rounded-full font-medium"
                              style={{ background: 'var(--accent)', color: 'white', opacity: 0.85 }}
                            >
                              {g.name}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>

                    {/* Overview */}
                    <p class="text-sm leading-relaxed text-white/70 max-w-2xl mb-6">
                      {data.overview || 'No description available.'}
                    </p>

                    {/* Action buttons */}
                    <div class="flex gap-3 flex-wrap mb-8">
                      <button
                        class="px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'var(--accent)' }}
                        onClick={() => playWithSource()}
                      >
                        <Play size={20} fill="white" /> Play
                      </button>
                      <button
                        class="px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:brightness-110"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                        onClick={toggleFav}
                      >
                        <Show when={fav()} fallback={<Bookmark size={18} />}>
                          <BookmarkCheck size={18} />
                        </Show>
                        {fav() ? 'In Library' : 'Add to Library'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ═══ Source Picker ═══ */}
                <div class="mt-4 mb-8">
                  <h3 class="text-xs font-bold mb-3 uppercase tracking-widest text-white/40">Play Source</h3>
                  <div class="flex gap-2 flex-wrap">
                    <For each={SOURCES}>
                      {(source) => (
                        <button
                          class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                          style={{
                            background: activeSource() === source.id ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                            color: activeSource() === source.id ? 'white' : 'var(--text)',
                            border: activeSource() === source.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                          }}
                          onClick={() => {
                            setActiveSrc(source.id);
                            playWithSource(source.id);
                          }}
                        >
                          {source.name}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                {/* ═══ TV Seasons & Episodes ═══ */}
                <Show when={isTv()}>
                  <div class="mt-2">
                    {/* Season selector */}
                    <Show when={tvData().seasons?.length}>
                      <div class="flex items-center gap-2 mb-5">
                        <h3 class="text-xs font-bold uppercase tracking-widest text-white/40 mr-2">Seasons</h3>
                        <div class="flex gap-2 overflow-x-auto pb-1">
                          <For each={tvData().seasons.filter(s => s.season_number > 0)}>
                            {(season) => (
                              <button
                                class="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shrink-0"
                                style={{
                                  background: activeSeason() === season.season_number ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                                  color: activeSeason() === season.season_number ? 'white' : 'var(--text)',
                                  border: activeSeason() === season.season_number ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                }}
                                onClick={() => setActiveSeason(season.season_number)}
                              >
                                S{season.season_number}
                              </button>
                            )}
                          </For>
                        </div>
                      </div>
                    </Show>

                    {/* Episode list */}
                    <div class="flex flex-col gap-2">
                      <For each={episodes()}>
                        {(ep) => (
                          <button
                            class="flex gap-4 p-3 rounded-xl text-left transition-all hover:bg-white/[0.06] group"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                            onClick={() => playEpisode(ep)}
                          >
                            {/* Episode thumbnail */}
                            <div class="shrink-0 w-[140px] aspect-video rounded-lg overflow-hidden bg-black/30 relative">
                              <Show when={ep.still_path} fallback={
                                <div class="w-full h-full flex items-center justify-center text-white/20 text-xs">No image</div>
                              }>
                                <img src={imageUrl(ep.still_path, 'w300')} alt="" class="w-full h-full object-cover" />
                              </Show>
                              {/* Play overlay */}
                              <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play size={16} fill="black" class="ml-0.5" style={{ color: 'black' }} />
                                </div>
                              </div>
                              {/* Duration badge */}
                              <div class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white">
                                {ep.episode_number}
                              </div>
                            </div>

                            {/* Episode info */}
                            <div class="flex-1 min-w-0 py-0.5">
                              <p class="text-sm font-bold truncate" style={{ color: 'white' }}>
                                {ep.episode_number}. {ep.name}
                              </p>
                              <Show when={ep.air_date}>
                                <p class="text-[11px] text-white/40 mt-0.5">{ep.air_date}</p>
                              </Show>
                              <Show when={ep.overview}>
                                <p class="text-xs text-white/50 line-clamp-2 mt-1.5 leading-relaxed">{ep.overview}</p>
                              </Show>
                            </div>

                            {/* Episode rating */}
                            <Show when={ep.vote_average > 0}>
                              <div class="shrink-0 flex items-start pt-1">
                                <span class="text-xs font-bold text-yellow-400 flex items-center gap-0.5">
                                  <Star size={11} fill="currentColor" /> {ep.vote_average.toFixed(1)}
                                </span>
                              </div>
                            </Show>
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

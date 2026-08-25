import { createSignal, createResource, Show, For, onMount } from 'solid-js';
import { useNavigate, useParams, useLocation } from '@solidjs/router';
import {
  ArrowLeft, Bookmark, BookmarkCheck, Play, Star, Clock, Film, Tv,
  Calendar, DollarSign, TrendingUp, User, Clapperboard,
} from 'lucide-solid';
import {
  getMovieDetail, getTvDetail, getSeasonEpisodes,
  imageUrl, backdropUrl, mediaTitle, mediaYear, mediaType,
  type TMDBMedia, type TMDBMovieDetail, type TMDBTvDetail, type TMDBEpisode,
  type TMDBCastMember, type TMDBCrewMember,
} from '../lib/tmdb';
import { SOURCES } from '../lib/sources';
import {
  isFavourite, toggleFavourite, getActiveSource, setActiveSource,
} from '../lib/storage';

/* ═══ Actor Card ═══ */
function ActorCard(props: { actor: TMDBCastMember }) {
  return (
    <div class="shrink-0 w-[100px] md:w-[120px] text-center group">
      <div class="w-full aspect-[2/3] rounded-xl overflow-hidden mb-2 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/20"
        style={{ 'box-shadow': '0 4px 16px rgba(0,0,0,0.4)' }}>
        <Show when={props.actor.profile_path} fallback={
          <div class="w-full h-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <User size={28} style={{ color: 'var(--text-dim)' }} />
          </div>
        }>
          <img
            src={imageUrl(props.actor.profile_path, 'w185')}
            alt={props.actor.name}
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </Show>
      </div>
      <p class="text-xs font-bold text-white truncate">{props.actor.name}</p>
      <p class="text-[11px] text-white/35 truncate mt-0.5">{props.actor.character}</p>
    </div>
  );
}

/* ═══ Info Pill ═══ */
function InfoPill(props: { icon: any; label: string; value: string }) {
  return (
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <props.icon size={13} style={{ color: 'var(--accent)' }} />
      <span class="text-[11px] text-white/35 font-medium">{props.label}</span>
      <span class="text-xs font-bold text-white/80">{props.value}</span>
    </div>
  );
}

export default function DetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const tmdbId = () => Number(params.id);
  const isTv = () => location.pathname.startsWith('/tv/');

  const [detail] = createResource(tmdbId, async (id) => {
    if (isTv()) return getTvDetail(id);
    return getMovieDetail(id);
  });

  const [activeSeason, setActiveSeason] = createSignal(1);
  const [episodes, setEpisodes] = createSignal<TMDBEpisode[]>([]);

  createResource(
    () => ({ id: tmdbId(), season: activeSeason() }),
    async ({ id, season }) => {
      if (!isTv()) return;
      try {
        const eps = await getSeasonEpisodes(id, season);
        setEpisodes(eps);
      } catch (e) {
        console.error('[Detail] Failed to load episodes:', e);
      }
    }
  );

  const [activeSource, setActiveSrc] = createSignal(getActiveSource());
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
        sourceIds: SOURCES.map(s => s.id),
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
        sourceIds: SOURCES.map(s => s.id),
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
          <div class="w-12 h-12 rounded-full border-2 animate-spin" style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }} />
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

          const director = () => {
            const credits = isTv() ? tvData().credits : movieData().credits;
            return credits?.crew?.find(c => c.job === 'Director');
          };

          const topCast = () => {
            const credits = isTv() ? tvData().credits : movieData().credits;
            return credits?.cast?.slice(0, 12) || [];
          };

          return (
            <div>
              {/* Hero Backdrop */}
              <div class="relative w-full h-[50vh] min-h-[350px] max-h-[550px] overflow-hidden">
                <Show when={data.backdrop_path} fallback={
                  <div class="absolute inset-0" style={{ background: 'var(--surface)' }} />
                }>
                  <img
                    src={backdropUrl(data.backdrop_path, 'original')}
                    alt=""
                    class="absolute inset-0 w-full h-full object-cover object-top"
                    style={{ 'object-position': 'center 15%' }}
                  />
                </Show>

                <div class="absolute inset-0" style={{
                  background: 'linear-gradient(to top, var(--bg) 5%, rgba(10,10,15,0.5) 40%, rgba(10,10,15,0.2) 100%)',
                }} />
                <div class="absolute inset-0" style={{
                  background: 'linear-gradient(to right, rgba(10,10,15,0.7) 0%, transparent 60%)',
                }} />

                {/* Back button */}
                <button
                  class="absolute top-5 left-5 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-colors border border-white/10"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={18} />
                </button>
              </div>

              {/* Content */}
              <div class="relative px-6 md:px-12 -mt-44 z-10 pb-12">
                <div class="flex gap-6 md:gap-10">
                  {/* Poster */}
                  <Show when={data.poster_path}>
                    <div class="shrink-0 w-[130px] md:w-[190px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                      style={{ 'box-shadow': '0 16px 50px rgba(0,0,0,0.5)' }}>
                      <img src={imageUrl(data.poster_path, 'w342')} alt="" class="w-full h-full object-cover" />
                    </div>
                  </Show>

                  {/* Info */}
                  <div class="flex-1 pt-20 md:pt-24">
                    <h1 class="text-3xl md:text-5xl font-black mb-4 leading-tight tracking-tight text-white">
                      {mediaTitle(data)}
                    </h1>

                    {/* Metadata pills */}
                    <div class="flex items-center gap-2 mb-4 text-sm flex-wrap">
                      <Show when={data.vote_average > 0}>
                        <span class="flex items-center gap-1.5 font-bold text-yellow-400 text-sm">
                          <Star size={14} fill="currentColor" /> {data.vote_average.toFixed(1)}
                        </span>
                      </Show>
                      <span class="text-white/20">•</span>
                      <span class="text-white/60 font-medium text-sm">{mediaYear(data)}</span>
                      <Show when={runtime() > 0}>
                        <span class="text-white/20">•</span>
                        <span class="text-white/60 font-medium text-sm flex items-center gap-1">
                          <Clock size={12} />
                          {Math.floor(runtime() / 60)}h {runtime() % 60}m
                        </span>
                      </Show>
                      <Show when={isTv()}>
                        <span class="text-white/20">•</span>
                        <span class="text-white/60 font-medium text-sm">
                          {tvData().number_of_seasons} Season{tvData().number_of_seasons > 1 ? 's' : ''}
                        </span>
                      </Show>
                      <Show when={data.status}>
                        <span class="text-white/20">•</span>
                        <span class="text-white/50 font-medium text-xs px-2 py-0.5 rounded-md glass">{data.status}</span>
                      </Show>
                    </div>

                    {/* Genres */}
                    <Show when={data.genres?.length}>
                      <div class="flex gap-2 mb-4 flex-wrap">
                        <For each={data.genres}>
                          {(g) => (
                            <span
                              class="text-xs px-3 py-1 rounded-full font-medium glass"
                              style={{ color: 'var(--accent)' }}
                            >
                              {g.name}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>

                    {/* Director */}
                    <Show when={director()}>
                      <p class="text-xs text-white/40 mb-3">
                        <span class="font-semibold text-white/60">Director:</span>{' '}
                        {director()!.name}
                      </p>
                    </Show>

                    {/* Overview */}
                    <p class="text-sm leading-relaxed text-white/55 max-w-2xl mb-6">
                      {data.overview || 'No description available.'}
                    </p>

                    {/* Action buttons - smaller */}
                    <div class="flex gap-3 flex-wrap mb-8">
                      <button class="btn-primary btn-sm" onClick={() => playWithSource()}>
                        <Play size={16} fill="white" /> Play
                      </button>
                      <button class="btn-secondary btn-sm" onClick={toggleFav}>
                        <Show when={fav()} fallback={<Bookmark size={16} />}>
                          <BookmarkCheck size={16} />
                        </Show>
                        {fav() ? 'In Library' : 'Add to Library'}
                      </button>
                    </div>

                    {/* Extra info row */}
                    <Show when={isTv()}>
                      <div class="flex gap-4 flex-wrap mb-2">
                        <InfoPill icon={Tv} label="Seasons" value={`${tvData().number_of_seasons}`} />
                        <InfoPill icon={Film} label="Episodes" value={`${tvData().number_of_episodes}`} />
                        <Show when={tvData().created_by?.length}>
                          <InfoPill icon={User} label="Created by" value={tvData().created_by![0].name} />
                        </Show>
                      </div>
                    </Show>
                    <Show when={!isTv()}>
                      <div class="flex gap-4 flex-wrap mb-2">
                        <Show when={movieData().budget && movieData().budget! > 0}>
                          <InfoPill icon={DollarSign} label="Budget" value={`$${(movieData().budget! / 1_000_000).toFixed(0)}M`} />
                        </Show>
                        <Show when={movieData().revenue && movieData().revenue! > 0}>
                          <InfoPill icon={TrendingUp} label="Revenue" value={`$${(movieData().revenue! / 1_000_000).toFixed(0)}M`} />
                        </Show>
                        <Show when={movieData().belongs_to_collection}>
                          <InfoPill icon={Clapperboard} label="Collection" value={movieData().belongs_to_collection!.name} />
                        </Show>
                      </div>
                    </Show>
                  </div>
                </div>

                {/* Cast section */}
                <Show when={topCast().length > 0}>
                  <div class="mt-10">
                    <h3 class="text-xs font-bold mb-4 uppercase tracking-widest text-white/30">Cast</h3>
                    <div class="flex gap-3 overflow-x-auto pb-3">
                      <For each={topCast()}>
                        {(actor) => <ActorCard actor={actor} />}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* Source Picker */}
                <div class="mt-8 mb-8">
                  <h3 class="text-xs font-bold mb-3 uppercase tracking-widest text-white/30">Play Source</h3>
                  <div class="flex gap-2 flex-wrap">
                    <For each={SOURCES}>
                      {(source) => (
                        <button
                          class="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                          style={{
                            background: activeSource() === source.id ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                            color: activeSource() === source.id ? 'white' : 'var(--text)',
                            border: activeSource() === source.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            'box-shadow': activeSource() === source.id ? '0 2px 12px var(--accent-glow)' : 'none',
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

                {/* TV Seasons & Episodes */}
                <Show when={isTv()}>
                  <div class="mt-4">
                    <Show when={tvData().seasons?.length}>
                      <h3 class="text-xs font-bold mb-3 uppercase tracking-widest text-white/30">Seasons</h3>
                      <div class="flex gap-3 overflow-x-auto pb-3 mb-6">
                        <For each={tvData().seasons.filter(s => s.season_number > 0)}>
                          {(season) => {
                            const isActive = () => activeSeason() === season.season_number;
                            return (
                              <button
                                class="shrink-0 w-[100px] md:w-[120px] text-left transition-all group"
                                onClick={() => setActiveSeason(season.season_number)}
                              >
                                <div
                                  class="w-full aspect-[2/3] rounded-xl overflow-hidden mb-2 relative transition-all duration-300"
                                  style={{
                                    opacity: isActive() ? 1 : 0.55,
                                    'box-shadow': isActive() ? '0 0 0 3px var(--accent-glow)' : 'none',
                                  }}
                                >
                                  <Show when={season.poster_path} fallback={
                                    <div class="w-full h-full flex items-center justify-center text-sm font-bold"
                                      style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                                      S{season.season_number}
                                    </div>
                                  }>
                                    <img
                                      src={imageUrl(season.poster_path, 'w185')}
                                      alt={`Season ${season.season_number}`}
                                      class="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </Show>
                                </div>
                                <p class="text-xs font-bold truncate" style={{ color: isActive() ? 'var(--accent)' : 'white' }}>
                                  {season.name || `Season ${season.season_number}`}
                                </p>
                                <p class="text-[11px] text-white/30 mt-0.5 font-medium">
                                  {season.episode_count} ep{season.episode_count !== 1 ? 's' : ''}
                                </p>
                              </button>
                            );
                          }}
                        </For>
                      </div>
                    </Show>

                    <div class="flex flex-col gap-2">
                      <For each={episodes()}>
                        {(ep) => (
                          <button
                            class="flex gap-4 p-3 rounded-xl text-left transition-all hover:bg-white/[0.06] group glass-card"
                            onClick={() => playEpisode(ep)}
                          >
                            <div class="shrink-0 w-[140px] aspect-video rounded-lg overflow-hidden bg-black/30 relative">
                              <Show when={ep.still_path} fallback={
                                <div class="w-full h-full flex items-center justify-center text-white/20 text-xs">No image</div>
                              }>
                                <img src={imageUrl(ep.still_path, 'w300')} alt="" class="w-full h-full object-cover" />
                              </Show>
                              <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                                  <Play size={14} fill="black" class="ml-0.5" style={{ color: 'black' }} />
                                </div>
                              </div>
                              <div class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-sm">
                                {ep.episode_number}
                              </div>
                            </div>

                            <div class="flex-1 min-w-0 py-0.5">
                              <p class="text-sm font-bold truncate" style={{ color: 'white' }}>
                                {ep.episode_number}. {ep.name}
                              </p>
                              <Show when={ep.air_date}>
                                <p class="text-[11px] text-white/30 mt-1 font-medium">{ep.air_date}</p>
                              </Show>
                              <Show when={ep.overview}>
                                <p class="text-xs text-white/40 line-clamp-2 mt-1.5 leading-relaxed">{ep.overview}</p>
                              </Show>
                            </div>

                            <Show when={ep.vote_average > 0}>
                              <div class="shrink-0 flex items-start pt-1">
                                <span class="text-xs font-bold text-yellow-400 flex items-center gap-1">
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

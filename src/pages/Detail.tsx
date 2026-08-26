import { createSignal, createResource, Show, For, onMount } from 'solid-js';
import { useNavigate, useParams, useLocation } from '@solidjs/router';
import {
  ArrowLeft, Bookmark, BookmarkCheck, Play, Star, Clock, Film, Tv,
  Calendar, DollarSign, TrendingUp, User, Clapperboard,
} from 'lucide-solid';
import {
  getMovieDetail, getTvDetail, getSeasonEpisodes, getSimilar,
  imageUrl, backdropUrl, mediaTitle, mediaYear, mediaType, matchPercent,
  type TMDBMedia, type TMDBMovieDetail, type TMDBTvDetail, type TMDBEpisode,
  type TMDBCastMember, type TMDBCrewMember,
} from '../lib/tmdb';
import { SOURCES } from '../lib/sources';
import {
  isFavourite, toggleFavourite, getActiveSource, setActiveSource,
} from '../lib/storage';

/* ═══ Circular Actor Card ═══ */
function ActorCard(props: { actor: TMDBCastMember }) {
  return (
    <div class="shrink-0 w-[90px] md:w-[105px] text-center group">
      <div class="w-[72px] md:w-[85px] h-[72px] md:h-[85px] mx-auto rounded-full overflow-hidden mb-2 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/30 group-hover:scale-105"
        style={{ 'box-shadow': '0 4px 16px rgba(0,0,0,0.4)' }}>
        <Show when={props.actor.profile_path} fallback={
          <div class="w-full h-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <User size={24} style={{ color: 'var(--text-dim)' }} />
          </div>
        }>
          <img
            src={imageUrl(props.actor.profile_path, 'w185')}
            alt={props.actor.name}
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </Show>
      </div>
      <p class="text-xs font-bold text-white truncate px-1">{props.actor.name}</p>
      <p class="text-[11px] text-white/40 truncate mt-0.5 px-1">{props.actor.character}</p>
    </div>
  );
}

/* ═══ Similar Card ═══ */
function SimilarCard(props: { item: TMDBMedia }) {
  const navigate = useNavigate();
  const type = () => mediaType(props.item);
  return (
    <button
      class="shrink-0 w-[150px] md:w-[180px] text-left group"
      onClick={() => navigate(`/${type()}/${props.item.id}`)}
    >
      <div class="relative w-full aspect-[2/3] rounded-lg overflow-hidden mb-2 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/20 group-hover:scale-[1.03]"
        style={{ 'box-shadow': '0 4px 16px rgba(0,0,0,0.4)' }}>
        <Show when={props.item.poster_path} fallback={
          <div class="w-full h-full flex items-center justify-center px-2 text-center text-[10px] font-bold"
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
        {/* Hover play overlay */}
        <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
          <div class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Play size={16} fill="black" class="ml-0.5" style={{ color: 'black' }} />
          </div>
        </div>
        <Show when={props.item.vote_average > 0}>
          <div class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm flex items-center gap-0.5">
            <Star size={9} fill="#22c55e" style={{ color: '#22c55e' }} />
            {matchPercent(props.item.vote_average)}%
          </div>
        </Show>
      </div>
      <p class="text-sm font-bold truncate text-white/90 group-hover:text-white">{mediaTitle(props.item)}</p>
    </button>
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

  const [similar] = createResource(tmdbId, async (id) => {
    return getSimilar(id, isTv() ? 'tv' : 'movie');
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
        seasons: isTv() ? tvData().seasons?.filter(s => s.season_number > 0) : undefined,
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
        seasons: tvData().seasons?.filter(s => s.season_number > 0),
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
          const tagline = () => (data as any).tagline || '';

          const topCast = () => {
            const credits = isTv() ? tvData().credits : movieData().credits;
            return credits?.cast?.slice(0, 12) || [];
          };

          return (
            <div>
              {/* Hero Backdrop */}
              <div class="relative w-full h-[55vh] min-h-[380px] max-h-[600px] overflow-hidden">
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

                {/* Gradients */}
                <div class="absolute inset-0" style={{
                  background: 'linear-gradient(to top, var(--bg) 0%, rgba(10,10,15,0.4) 35%, rgba(10,10,15,0.15) 100%)',
                }} />
                <div class="absolute inset-0" style={{
                  background: 'linear-gradient(to right, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.4) 45%, transparent 70%)',
                }} />

                {/* Back button */}
                <button
                  class="absolute top-5 left-5 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 transition-colors border border-white/10"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={16} />
                </button>
              </div>

              {/* Content */}
              <div class="relative px-4 md:px-12 -mt-32 md:-mt-52 z-10 pb-12">
                <div class="flex gap-4 md:gap-8">
                  {/* Poster */}
                  <Show when={data.poster_path}>
                    <div class="shrink-0 w-[100px] md:w-[170px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl"
                      style={{ 'box-shadow': '0 12px 40px rgba(0,0,0,0.6)' }}>
                      <img src={imageUrl(data.poster_path, 'w342')} alt="" class="w-full h-full object-cover" />
                    </div>
                  </Show>

                  {/* Info */}
                  <div class="flex-1 pt-8 md:pt-20">
                    <h1 class="text-xl md:text-4xl font-black mb-2 md:mb-3 leading-tight tracking-tight text-white">
                      {mediaTitle(data)}
                    </h1>

                    {/* Match + Year + Runtime */}
                    <div class="flex items-center gap-2 mb-3 text-sm flex-wrap">
                      <Show when={data.vote_average > 0}>
                        <span class="font-bold text-green-400">
                          {matchPercent(data.vote_average)}% Match
                        </span>
                      </Show>
                      <span class="text-white/25">•</span>
                      <span class="text-white/60 font-medium">{mediaYear(data)}</span>
                      <Show when={runtime() > 0}>
                        <span class="text-white/25">•</span>
                        <span class="text-white/60 font-medium">{Math.floor(runtime() / 60)}h {runtime() % 60}m</span>
                      </Show>
                      <Show when={isTv()}>
                        <span class="text-white/25">•</span>
                        <span class="text-white/60 font-medium">
                          {tvData().number_of_seasons} Season{tvData().number_of_seasons > 1 ? 's' : ''}
                        </span>
                      </Show>
                    </div>

                    {/* Genres inline */}
                    <Show when={data.genres?.length}>
                      <div class="flex items-center gap-1.5 md:gap-2 mb-3 text-xs md:text-sm flex-wrap">
                        <For each={data.genres}>
                          {(g, i) => (
                            <span class="text-white/50 font-medium">
                              {i() > 0 && <span class="text-white/20 mr-2">•</span>}
                              {g.name}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>

                    {/* Tagline */}
                    <Show when={tagline()}>
                      <p class="text-sm italic text-white/40 mb-4 max-w-xl">
                        "{tagline()}"
                      </p>
                    </Show>

                    {/* Action buttons */}
                    <div class="flex gap-2 md:gap-3 flex-wrap mb-6 md:mb-8">
                      <button class="btn-primary btn-sm" onClick={() => playWithSource()}>
                        <Play size={16} fill="white" /> Play
                      </button>
                      <button class="btn-secondary btn-sm" onClick={toggleFav}>
                        <Show when={fav()} fallback={<Bookmark size={16} />}>
                          <BookmarkCheck size={16} />
                        </Show>
                        {fav() ? 'Tagged' : 'Tag It'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cast - circular photos */}
                <Show when={topCast().length > 0}>
                  <div class="mt-6 md:mt-8">
                    <h3 class="text-xs font-bold mb-4 uppercase tracking-widest text-white/30">Cast</h3>
                    <div class="flex gap-2 overflow-x-auto pb-3" style={{ "touch-action": "pan-x" }}>
                      <For each={topCast()}>
                        {(actor) => <ActorCard actor={actor} />}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* TV Episodes - horizontal cards */}
                <Show when={isTv()}>
                  <div class="mt-8">
                    <Show when={tvData().seasons?.length}>
                      <div class="flex items-center gap-4 mb-4">
                        <h3 class="text-xs font-bold uppercase tracking-widest text-white/30">Seasons</h3>
                        <div class="flex gap-2">
                          <For each={tvData().seasons.filter(s => s.season_number > 0)}>
                            {(season) => {
                              const isActive = () => activeSeason() === season.season_number;
                              return (
                                <button
                                  class="px-3 py-1 rounded-md text-xs font-bold transition-all"
                                  style={{
                                    background: isActive() ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                                    color: isActive() ? 'white' : 'var(--text)',
                                  }}
                                  onClick={() => setActiveSeason(season.season_number)}
                                >
                                  {season.name || `S${season.season_number}`}
                                </button>
                              );
                            }}
                          </For>
                        </div>
                      </div>
                    </Show>

                    {/* Horizontal episode cards */}
                    <div class="flex gap-3 overflow-x-auto pb-3" style={{ "touch-action": "pan-x" }}>
                      <For each={episodes()}>
                        {(ep) => (
                          <button
                            class="shrink-0 w-[200px] md:w-[240px] text-left group"
                            onClick={() => playEpisode(ep)}
                          >
                            <div class="relative w-full aspect-video rounded-lg overflow-hidden mb-2 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/20 group-hover:scale-[1.03]"
                              style={{ 'box-shadow': '0 4px 16px rgba(0,0,0,0.4)' }}>
                              <Show when={ep.still_path} fallback={
                                <div class="w-full h-full flex items-center justify-center text-white/15 text-xs" style={{ background: 'var(--surface)' }}>
                                  No Preview
                                </div>
                              }>
                                <img src={imageUrl(ep.still_path, 'w300')} alt="" class="w-full h-full object-cover" />
                              </Show>
                              {/* Hover play */}
                              <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                  <Play size={16} fill="black" class="ml-0.5" style={{ color: 'black' }} />
                                </div>
                              </div>
                              {/* Episode badge */}
                              <div class="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white/70 backdrop-blur-sm">
                                Episode {ep.episode_number}
                              </div>
                              <Show when={ep.vote_average > 0}>
                                <div class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm flex items-center gap-0.5">
                                  <Star size={9} fill="#22c55e" style={{ color: '#22c55e' }} />
                                  {matchPercent(ep.vote_average)}%
                                </div>
                              </Show>
                            </div>
                            <p class="text-xs font-bold truncate text-white/80">{ep.name}</p>
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* More Like This */}
                <Show when={similar() && similar()!.length > 0}>
                  <div class="mt-10">
                    <h3 class="text-xs font-bold mb-4 uppercase tracking-widest text-white/30">More Like This</h3>
                    <div class="flex gap-3 overflow-x-auto pb-3" style={{ "touch-action": "pan-x" }}>
                      <For each={similar()!.slice(0, 12)}>
                        {(item) => <SimilarCard item={item} />}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* Source Picker */}
                <div class="mt-8 mb-4">
                  <h3 class="text-xs font-bold mb-3 uppercase tracking-widest text-white/30">Play Source</h3>
                  <div class="flex gap-2 flex-wrap">
                    <For each={SOURCES}>
                      {(source) => (
                        <button
                          class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: activeSource() === source.id ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
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
              </div>
            </div>
          );
        }}
      </Show>
    </div>
  );
}

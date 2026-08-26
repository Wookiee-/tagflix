import { createSignal, createResource, Show, For } from 'solid-js';
import { useNavigate, useLocation } from '@solidjs/router';
import { ArrowLeft, MonitorPlay, List, ChevronDown } from 'lucide-solid';
import IframePlayer from '../components/IframePlayer';
import { SOURCES, getSource } from '../lib/sources';
import { saveContinueWatching } from '../lib/storage';
import { getSeasonEpisodes, type TMDBEpisode, type TMDBSeason } from '../lib/tmdb';

export default function PlayerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = () => location.state as any;

  const [embedUrl, setEmbedUrl] = createSignal(state()?.embedUrl || '');
  const [title] = createSignal(state()?.title || '');
  const [showSources, setShowSources] = createSignal(false);
  const [showEpisodes, setShowEpisodes] = createSignal(false);
  const [activeSeason, setActiveSeason] = createSignal(state()?.activeSeason || state()?.season || 1);
  const [episodes, setEpisodes] = createSignal<TMDBEpisode[]>(state()?.episodes || []);
  const [seasons] = createSignal<TMDBSeason[]>(state()?.seasons || []);

  // Fetch episodes when season changes
  const [seasonData] = createResource(
    () => ({ id: state()?.tmdbId, season: activeSeason(), mediaType: state()?.mediaType }),
    async ({ id, season, mediaType }) => {
      if (mediaType !== 'tv' || !id) return;
      try {
        const eps = await getSeasonEpisodes(id, season);
        setEpisodes(eps);
        return eps;
      } catch (e) {
        console.error('[Player] Failed to load episodes:', e);
        return [];
      }
    }
  );

  const handleBack = () => {
    if (state()?.tmdbId) {
      saveContinueWatching({
        key: `${state().tmdbId}:${state().season || 0}:${state().episode || 0}`,
        tmdbId: state().tmdbId,
        mediaType: state().mediaType || 'movie',
        season: state().season,
        episode: state().episode,
        title: state().title || '',
        poster: state().poster || '',
        progress: 0,
        timestamp: Date.now(),
      });
    }
    navigate(-1);
  };

  const switchSource = (sourceId: string) => {
    const s = state();
    const source = getSource(sourceId);
    if (!source || !s) return;

    let url: string;
    if (s.mediaType === 'tv') {
      url = source.tvUrl(s.tmdbId, s.season || 1, s.episode || 1);
    } else {
      url = source.movieUrl(s.tmdbId);
    }
    setEmbedUrl(url);
    setShowSources(false);
  };

  const playEpisode = (ep: any) => {
    const s = state();
    const sourceId = s?.sourceId || 'vidcore';
    const source = getSource(sourceId);
    if (!source || !s) return;

    const url = source.tvUrl(s.tmdbId, ep.season_number, ep.episode_number);
    setEmbedUrl(url);
    setActiveSeason(ep.season_number);
    setShowEpisodes(false);

    navigate('/player', {
      state: {
        ...s,
        embedUrl: url,
        season: ep.season_number,
        episode: ep.episode_number,
        activeSeason: ep.season_number,
        title: `${s.title.split(' S')[0]} S${ep.season_number}E${ep.episode_number}`,
      },
      replace: true,
    });
  };

  const switchSeason = (seasonNum: number) => {
    setActiveSeason(seasonNum);
  };

  return (
    <div class="fixed inset-0 z-[50] bg-black">
      <Show when={embedUrl()}>
        <IframePlayer url={embedUrl()} title={title()} onBack={handleBack} />
      </Show>

      {/* Top bar controls */}
      <div class="absolute top-0 left-0 right-0 z-[60] flex items-center gap-3 p-3 md:p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          class="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          onClick={handleBack}
        >
          <ArrowLeft size={20} />
        </button>
        <span class="text-white text-sm font-semibold truncate flex-1">{title()}</span>

        <Show when={state()?.mediaType === 'tv' && state()?.episodes?.length}>
          <button
            class="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            onClick={() => { setShowEpisodes(!showEpisodes()); setShowSources(false); }}
          >
            <List size={20} />
          </button>
        </Show>

        <button
          class="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          onClick={() => { setShowSources(!showSources()); setShowEpisodes(false); }}
        >
          <MonitorPlay size={20} />
        </button>
      </div>

      {/* Source Picker */}
      <Show when={showSources()}>
        <div
          class="absolute bottom-0 left-0 right-0 z-[60] p-4 bg-gradient-to-t from-black/95 via-black/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="flex items-center gap-2 mb-3">
            <MonitorPlay size={14} style={{ color: 'var(--accent)' }} />
            <h3 class="text-xs font-bold uppercase tracking-wider text-white/50">Source</h3>
          </div>
          <div class="flex gap-2 flex-wrap">
            <For each={SOURCES}>
              {(source) => (
                <button
                  class="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all glass-card"
                  style={{
                    background: state()?.sourceId === source.id ? 'var(--accent)' : undefined,
                    color: state()?.sourceId === source.id ? 'white' : 'var(--text)',
                    'box-shadow': state()?.sourceId === source.id ? '0 2px 12px var(--accent-glow)' : undefined,
                  }}
                  onClick={() => switchSource(source.id)}
                >
                  {source.name}
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Episode Picker */}
      <Show when={showEpisodes()}>
        <div
          class="absolute bottom-0 left-0 right-0 z-[60] max-h-[60vh] overflow-y-auto p-4 bg-gradient-to-t from-black/95 via-black/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Season selector */}
          <Show when={seasons().length > 0}>
            <div class="flex items-center gap-2 mb-3">
              <List size={14} style={{ color: 'var(--accent)' }} />
              <h3 class="text-xs font-bold uppercase tracking-wider text-white/50">Seasons</h3>
            </div>
            <div class="flex gap-2 overflow-x-auto pb-3 mb-4">
              <For each={seasons()}>
                {(season) => {
                  const isActive = () => activeSeason() === season.season_number;
                  return (
                    <button
                      class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                      style={{
                        background: isActive() ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                        color: isActive() ? 'white' : 'var(--text)',
                        'box-shadow': isActive() ? '0 2px 12px var(--accent-glow)' : undefined,
                      }}
                      onClick={() => switchSeason(season.season_number)}
                    >
                      {season.name || `S${season.season_number}`}
                    </button>
                  );
                }}
              </For>
            </div>
          </Show>

          {/* Episodes for current season */}
          <div class="flex items-center gap-2 mb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-white/50">
              Season {activeSeason()} — {episodes().length} Episodes
            </h3>
          </div>
          <div class="flex flex-col gap-2">
            <For each={episodes()}>
              {(ep: any) => {
                const isCurrent = ep.season_number === state()?.season && ep.episode_number === state()?.episode;
                return (
                  <button
                    class="flex gap-3 p-3 rounded-xl text-left transition-all glass-card"
                    style={{
                      background: isCurrent ? 'var(--accent)' : undefined,
                      color: isCurrent ? 'white' : 'var(--text)',
                      'box-shadow': isCurrent ? '0 2px 12px var(--accent-glow)' : undefined,
                    }}
                    onClick={() => playEpisode(ep)}
                  >
                    <span class="text-xs font-bold opacity-60 shrink-0 w-6">{ep.episode_number}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold truncate">{ep.name}</p>
                      <Show when={ep.overview}>
                        <p class="text-xs opacity-50 line-clamp-1 mt-0.5">{ep.overview}</p>
                      </Show>
                    </div>
                  </button>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}

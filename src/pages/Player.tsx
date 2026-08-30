import { createSignal, createResource, Show, For, onMount, onCleanup } from 'solid-js';
import { useNavigate, useLocation } from '@solidjs/router';
import { ArrowLeft, MonitorPlay, List, Play, Pause, SkipForward, SkipBack } from 'lucide-solid';
import IframePlayer from '../components/IframePlayer';
import { SOURCES, getSource } from '../lib/sources';
import { saveContinueWatching } from '../lib/storage';
import { getSeasonEpisodes, type TMDBEpisode, type TMDBSeason } from '../lib/tmdb';

/** Detect TV / Firestick / Android TV */
function detectTv(): boolean {
  try {
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes('aft') || ua.includes('smart-tv') || ua.includes('googletv') ||
      ua.includes('androidtv') || ua.includes('roku') || ua.includes('viera') ||
      ua.includes('netcast') || ua.includes('tizen') || ua.includes('webos') ||
      ua.includes('mibox') || ua.includes('chromecast')
    );
  } catch { return false; }
}

export default function PlayerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = () => location.state as any;

  const [embedUrl, setEmbedUrl] = createSignal(state()?.embedUrl || '');
  const [title] = createSignal(state()?.title || '');
  const [showSources, setShowSources] = createSignal(false);
  const [showEpisodes, setShowEpisodes] = createSignal(false);
  const [controlsVisible, setControlsVisible] = createSignal(true);
  const [activeSeason, setActiveSeason] = createSignal(state()?.activeSeason || state()?.season || 1);
  const [episodes, setEpisodes] = createSignal<TMDBEpisode[]>(state()?.episodes || []);
  const [seasons] = createSignal<TMDBSeason[]>(state()?.seasons || []);

  const isTv = detectTv();
  let hideTimer: ReturnType<typeof setTimeout>;

  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer);
    // TV: keep visible for 6s (longer for D-pad navigation)
    // Desktop: 3s auto-hide
    // Never auto-hide while a picker panel is open
    hideTimer = setTimeout(() => {
      if (showSources() || showEpisodes()) {
        // Panel is open — reschedule instead of hiding
        showControls();
        return;
      }
      setControlsVisible(false);
    }, isTv ? 6000 : 3000);
  };

  // ─── D-Pad Key Handling for TV Remotes ───
  const handleDpad = (e: KeyboardEvent) => {
    const key = e.key;
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Select','Play','Pause','MediaPlayPause','MediaFastForward','MediaRewind','Escape','Backspace'].includes(key)) return;

    // Any D-pad / remote key re-shows controls
    showControls();

    // Seek left/right
    if (key === 'ArrowLeft') {
      e.preventDefault();
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ action: 'seek', offset: -10 }, '*');
      }
      return;
    }
    if (key === 'ArrowRight') {
      e.preventDefault();
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ action: 'seek', offset: 10 }, '*');
      }
      return;
    }

    // Escape / Back — close panel or go back
    if (key === 'Escape' || key === 'Backspace') {
      e.preventDefault();
      if (showSources()) { setShowSources(false); return; }
      if (showEpisodes()) { setShowEpisodes(false); return; }
      handleBack();
      return;
    }
  };

  onMount(() => {
    if (isTv) {
      window.addEventListener('keydown', handleDpad, { capture: true });
    }
  });

  onCleanup(() => {
    clearTimeout(hideTimer);
    if (isTv) window.removeEventListener('keydown', handleDpad, { capture: true });
  });

  // Fetch episodes when season changes
  createResource(
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
    const sourceId = s?.sourceId || 'cinesrc';
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

  const toggleEpisodes = () => {
    setShowEpisodes(!showEpisodes());
    setShowSources(false);
    showControls();
  };

  const toggleSources = () => {
    setShowSources(!showSources());
    setShowEpisodes(false);
    showControls();
  };

  return (
    <div class="fixed inset-0 z-[50] bg-black" onMouseMove={showControls} onTouchStart={showControls}>
      <Show when={embedUrl()}>
        <IframePlayer url={embedUrl()} title={title()} onBack={handleBack} />
      </Show>

      {/* Auto-hiding top bar — small, positioned to avoid overlapping iframe controls */}
      <Show when={controlsVisible()}>
        <div
          class="player-controls absolute top-0 left-0 right-0 z-[60] flex items-center gap-2 p-2 md:p-3 transition-opacity duration-300"
          style={{ opacity: controlsVisible() ? 1 : 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
        >
          <button
            class="tv-focusable w-9 h-9 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-colors shrink-0"
            tabindex="0"
            onClick={handleBack}
          >
            <ArrowLeft size={18} />
          </button>
          <span class="text-white/90 text-xs font-medium truncate flex-1">{title()}</span>

          <Show when={state()?.mediaType === 'tv'}>
            <button
              class="tv-focusable w-9 h-9 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70 transition-colors shrink-0"
              tabindex="0"
              onClick={toggleEpisodes}
            >
              <List size={16} />
            </button>
          </Show>

          <button
            class="tv-focusable w-9 h-9 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70 transition-colors shrink-0"
            tabindex="0"
            onClick={toggleSources}
          >
            <MonitorPlay size={16} />
          </button>
        </div>
      </Show>

      {/* Source Picker — bottom panel */}
      <Show when={showSources()}>
        <div
          class="player-controls absolute bottom-0 left-0 right-0 z-[60] p-4 bg-gradient-to-t from-black/95 via-black/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
          onMouseMove={showControls}
          onTouchStart={showControls}
        >
          <div class="flex items-center gap-2 mb-3">
            <MonitorPlay size={14} style={{ color: 'var(--accent)' }} />
            <h3 class="text-xs font-bold uppercase tracking-wider text-white/50">Source</h3>
          </div>
          <div class="flex gap-2 flex-wrap">
            <For each={SOURCES}>
              {(source) => (
                <button
                  class="tv-focusable px-4 py-2.5 rounded-lg text-sm font-semibold transition-all glass-card"
                  tabindex="0"
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

      {/* Episode Picker — bottom panel */}
      <Show when={showEpisodes()}>
        <div
          class="player-controls absolute bottom-0 left-0 right-0 z-[60] max-h-[60vh] overflow-y-auto p-4 bg-gradient-to-t from-black/95 via-black/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
          onMouseMove={showControls}
          onTouchStart={showControls}
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
                      class="tv-focusable px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                      tabindex="0"
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
                    class="tv-focusable flex gap-3 p-3 rounded-xl text-left transition-all glass-card"
                    tabindex="0"
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

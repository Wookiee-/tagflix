import { createSignal, Show, For } from 'solid-js';
import { useNavigate, useLocation } from '@solidjs/router';
import { ArrowLeft, MonitorPlay, List } from 'lucide-solid';
import IframePlayer from '../components/IframePlayer';
import { SOURCES, getSource } from '../lib/sources';
import { saveContinueWatching } from '../lib/storage';

export default function PlayerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = () => location.state as any;

  const [embedUrl, setEmbedUrl] = createSignal(state()?.embedUrl || '');
  const [title] = createSignal(state()?.title || '');
  const [showSources, setShowSources] = createSignal(false);
  const [showEpisodes, setShowEpisodes] = createSignal(false);

  const handleBack = () => {
    // Save progress before leaving
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
    setShowEpisodes(false);

    // Update URL state for episode tracking
    navigate('/player', {
      state: {
        ...s,
        embedUrl: url,
        season: ep.season_number,
        episode: ep.episode_number,
        title: `${s.title.split(' S')[0]} S${ep.season_number}E${ep.episode_number}`,
      },
      replace: true,
    });
  };

  return (
    <div class="fixed inset-0 z-[50] bg-black">
      <Show when={embedUrl()}>
        <IframePlayer url={embedUrl()} title={title()} onBack={handleBack} />
      </Show>

      {/* Overlay controls (top bar) */}
      <div class="absolute top-0 left-0 right-0 z-[60] flex items-center gap-3 p-4 bg-gradient-to-b from-black/80 to-transparent">
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

      {/* Source Picker Panel */}
      <Show when={showSources()}>
        <div
          class="absolute bottom-0 left-0 right-0 z-[60] p-4 bg-gradient-to-t from-black/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 class="text-xs font-bold uppercase tracking-wider opacity-50 mb-3">Source</h3>
          <div class="flex gap-2 flex-wrap">
            <For each={SOURCES}>
              {(source) => (
                <button
                  class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: state()?.sourceId === source.id ? 'var(--accent)' : 'var(--surface)',
                    color: state()?.sourceId === source.id ? 'white' : 'var(--text)',
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

      {/* Episode Picker Panel */}
      <Show when={showEpisodes()}>
        <div
          class="absolute bottom-0 left-0 right-0 z-[60] max-h-[60vh] overflow-y-auto p-4 bg-gradient-to-t from-black/95 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 class="text-xs font-bold uppercase tracking-wider opacity-50 mb-3">
            Season {state()?.activeSeason || state()?.season || 1} — Episodes
          </h3>
          <div class="flex flex-col gap-2">
            <For each={state()?.episodes || []}>
              {(ep: any) => {
                const isCurrent = ep.season_number === state()?.season && ep.episode_number === state()?.episode;
                return (
                  <button
                    class="flex gap-3 p-3 rounded-lg text-left transition-colors"
                    style={{
                      background: isCurrent ? 'var(--accent)' : 'var(--surface)',
                      color: isCurrent ? 'white' : 'var(--text)',
                    }}
                    onClick={() => playEpisode(ep)}
                  >
                    <span class="text-xs font-bold opacity-60 shrink-0 w-6">{ep.episode_number}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold truncate">{ep.name}</p>
                      <Show when={ep.overview}>
                        <p class="text-xs opacity-60 line-clamp-1 mt-0.5">{ep.overview}</p>
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

import { createSignal, Show, onMount, type JSX } from 'solid-js';

interface Props {
  url: string;
  title?: string;
  onBack?: () => void;
}

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export default function IframePlayer(props: Props) {
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal(false);
  const [isElectron, setIsElectron] = createSignal(false);

  onMount(() => {
    // Detect Electron — webview tag is only available in Electron
    setIsElectron(!!(window as any).electron || navigator.userAgent.includes('Electron'));
  });

  return (
    <div class="fixed inset-0 z-[50] bg-black flex flex-col">
      {/* Loading indicator */}
      <Show when={!loaded()}>
        <div class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
          <div
            class="w-10 h-10 rounded-full border-2 animate-spin mb-4"
            style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }}
          />
          <p class="text-sm" style={{ color: 'var(--text)' }}>
            Loading {props.title || 'player'}...
          </p>
        </div>
      </Show>

      {/* Error state */}
      <Show when={error()}>
        <div class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
          <p class="text-lg font-bold text-white mb-2">Failed to load stream</p>
          <p class="text-sm text-gray-400 mb-6">The embed source returned an error.</p>
          <Show when={props.onBack}>
            <button
              class="px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
              style={{ background: 'var(--accent)' }}
              onClick={props.onBack}
            >
              Go Back
            </button>
          </Show>
        </div>
      </Show>

      {/* Electron: use <webview> for isolated TLS context (bypasses Cloudflare) */}
      <Show when={isElectron()}>
        <webview
          src={props.url}
          class="player-iframe"
          useragent={CHROME_UA}
          allowpopups={false}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{ opacity: loaded() ? 1 : 0, width: '100%', height: '100%' }}
        />
      </Show>

      {/* Browser: use standard <iframe> */}
      <Show when={!isElectron()}>
        <iframe
          src={props.url}
          class="player-iframe"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{ opacity: loaded() ? 1 : 0 }}
        />
      </Show>
    </div>
  );
}

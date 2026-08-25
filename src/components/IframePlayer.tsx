import { createSignal, Show, onMount, onCleanup } from 'solid-js';

interface Props {
  url: string;
  title?: string;
  onBack?: () => void;
}

export default function IframePlayer(props: Props) {
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal(false);
  const [intercepting, setIntercepting] = createSignal(true);

  // ─── Block window.open globally ───
  let originalOpen: typeof window.open | null = null;

  onMount(() => {
    originalOpen = window.open;
    // Block ALL window.open calls
    window.open = function () { return null; } as any;

    // After 3 seconds, stop intercepting clicks
    // (most ad popups fire on first/second click)
    setTimeout(() => setIntercepting(false), 3000);

    onCleanup(() => {
      if (originalOpen) window.open = originalOpen;
    });
  });

  return (
    <div class="fixed inset-0 z-[50] bg-black flex flex-col">
      {/* Loading */}
      <Show when={!loaded()}>
        <div class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
          <div class="w-10 h-10 rounded-full border-2 animate-spin mb-4"
            style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }} />
          <p class="text-sm" style={{ color: 'var(--text)' }}>
            Loading {props.title || 'player'}...
          </p>
        </div>
      </Show>

      {/* Error */}
      <Show when={error()}>
        <div class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
          <p class="text-lg font-bold text-white mb-2">Failed to load stream</p>
          <p class="text-sm text-gray-400 mb-6">The embed source returned an error.</p>
          <Show when={props.onBack}>
            <button class="px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
              style={{ background: 'var(--accent)' }} onClick={props.onBack}>
              Go Back
            </button>
          </Show>
        </div>
      </Show>

      {/* Iframe */}
      <iframe
        src={props.url}
        class="w-full h-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ opacity: loaded() ? 1 : 0 }}
      />

      {/* Click interceptor — absorbs ALL clicks for first 3 seconds */}
      <Show when={loaded() && intercepting()}>
        <div
          class="absolute inset-0 z-[60]"
          style={{ cursor: 'default' }}
          onClick={(e) => {
            // Absorb the click — don't let it reach the iframe
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </Show>

      {/* Status badge */}
      <Show when={loaded()}>
        <div class="absolute top-3 right-3 z-[70] flex items-center gap-2 pointer-events-none">
          <Show when={intercepting()}>
            <div class="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-yellow-500/20 text-yellow-400 backdrop-blur-sm animate-pulse">
              🛡️ Blocking ads — click in 3s...
            </div>
          </Show>
          <Show when={!intercepting()}>
            <div class="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-green-500/15 text-green-400/70 backdrop-blur-sm">
              🛡️ Protected
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

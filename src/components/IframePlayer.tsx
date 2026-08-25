import { createSignal, Show, onMount, onCleanup } from 'solid-js';

interface Props {
  url: string;
  title?: string;
  onBack?: () => void;
}

export default function IframePlayer(props: Props) {
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal(false);
  const [adBlocked, setAdBlocked] = createSignal(true);

  // ─── Block popups by overriding window.open ───
  let originalOpen: typeof window.open | null = null;

  onMount(() => {
    // Save original
    originalOpen = window.open;

    // Override to block all popup attempts from iframes
    (window as any).__tagflix_popup_blocker = true;
    window.open = function () {
      // Silently block — don't open anything
      return null;
    } as any;

    // Also listen for postMessage popups
    const handler = (e: MessageEvent) => {
      if (e.data && typeof e.data === 'string' && e.data.includes('popup')) {
        e.stopPropagation();
      }
    };
    window.addEventListener('message', handler, true);

    onCleanup(() => {
      // Restore original
      if (originalOpen) window.open = originalOpen;
      window.removeEventListener('message', handler, true);
    });
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

      {/* Iframe — no sandbox (VidCore detects it) */}
      <iframe
        src={props.url}
        class="w-full h-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ opacity: loaded() ? 1 : 0 }}
      />

      {/* Click interceptor — absorbs the first click (ad popup) then removes itself */}
      <Show when={loaded() && adBlocked()}>
        <div
          class="absolute inset-0 z-[60] cursor-pointer"
          title="Click again to interact with player"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setAdBlocked(false);
          }}
        />
      </Show>

      {/* Popup blocked indicator */}
      <Show when={loaded()}>
        <div class="absolute top-3 right-3 z-[70] px-3 py-1.5 rounded-lg text-[11px] font-bold bg-black/60 text-white/50 backdrop-blur-sm pointer-events-none">
          🛡️ Popups blocked
        </div>
      </Show>
    </div>
  );
}

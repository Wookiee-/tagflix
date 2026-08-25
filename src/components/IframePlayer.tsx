import { createSignal, Show, onMount, onCleanup } from 'solid-js';

interface Props {
  url: string;
  title?: string;
  onBack?: () => void;
}

export default function IframePlayer(props: Props) {
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal(false);
  const [blocked, setBlocked] = createSignal(true);
  const [popupCount, setPopupCount] = createSignal(0);

  // ─── Block window.open globally ───
  let originalOpen: typeof window.open | null = null;

  onMount(() => {
    originalOpen = window.open;
    // Block ALL window.open calls
    window.open = function () {
      setPopupCount(c => c + 1);
      return null;
    } as any;

    // Close any popups that did open
    const interval = setInterval(() => {
      // Try to close any popup windows opened before our override
      try {
        // @ts-ignore
        if (window.__popupWindows) {
          // @ts-ignore
          window.__popupWindows.forEach((w: Window) => { try { w.close(); } catch(e) {} });
        }
      } catch(e) {}
    }, 500);

    onCleanup(() => {
      if (originalOpen) window.open = originalOpen;
      clearInterval(interval);
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

      {/* Persistent click interceptor — blocks ALL clicks until user double-clicks */}
      <Show when={loaded() && blocked()}>
        <div
          class="absolute inset-0 z-[60] cursor-default"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDblClick={() => {
            // Double-click dismisses the blocker
            setBlocked(false);
          }}
        />
      </Show>

      {/* Status badge + dismiss button */}
      <Show when={loaded()}>
        <div class="absolute top-3 right-3 z-[70] flex items-center gap-2">
          <Show when={blocked()}>
            <button
              class="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-yellow-500/20 text-yellow-400 backdrop-blur-sm hover:bg-yellow-500/30 transition-colors cursor-pointer"
              onClick={() => setBlocked(false)}
            >
              🛡️ Click here to enable player
            </button>
          </Show>
          <Show when={!blocked()}>
            <div class="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-green-500/15 text-green-400/70 backdrop-blur-sm pointer-events-none">
              🛡️ Protected
            </div>
          </Show>
          <Show when={popupCount() > 0}>
            <div class="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/20 text-red-400 backdrop-blur-sm pointer-events-none">
              🚫 {popupCount()} popup{popupCount() > 1 ? 's' : ''} blocked
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

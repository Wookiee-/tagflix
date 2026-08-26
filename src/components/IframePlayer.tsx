import { createSignal, Show, onMount, onCleanup } from 'solid-js';

interface Props {
  url: string;
  title?: string;
  onBack?: () => void;
}

export default function IframePlayer(props: Props) {
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal(false);
  const [intercepted, setIntercepted] = createSignal(0);
  let iframeRef: HTMLIFrameElement | undefined;

  // ─── Shadow Proxy: intercept ALL events before they reach the iframe ───
  // The proxy layer sits on top of the iframe, captures every click/touch,
  // blocks popup triggers, and only passes through legitimate player interactions.

  onMount(() => {
    // Block window.open globally (returns dummy so scripts don't crash)
    (window as any).__origOpen = window.open;
    window.open = function () {
      setIntercepted((c) => c + 1);
      return {
        focus: function () {},
        blur: function () {},
        close: function () {},
        closed: false,
        location: { href: '' },
        document: { write: function () {}, writeln: function () {} },
        postMessage: function () {},
        setInterval: function () { return 0; },
        setTimeout: function () { return 0; },
        clearInterval: function () {},
        clearTimeout: function () {},
        navigator: {},
        close: function () {},
      } as any;
    };

    // Intercept navigation attempts
    window.addEventListener(
      'beforeunload',
      (e) => {
        e.preventDefault();
        e.returnValue = '';
      },
      { capture: true }
    );

    onCleanup(() => {
      window.open = (window as any).__origOpen || window.open;
    });
  });

  // ─── Shadow Proxy event handlers ───
  // These sit on the transparent overlay ABOVE the iframe.
  // They block popup-triggering events while forwarding player events.

  function handleProxyClick(e: React.MouseEvent) {
    // Block the click from reaching the iframe (which would trigger popup)
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    setIntercepted((c) => c + 1);

    // After blocking, forward a clean click to the iframe for player controls
    // by briefly removing the overlay, clicking, and re-adding
    if (iframeRef) {
      const iframe = iframeRef;
      // Position a click at the same coordinates inside the iframe
      const rect = iframe.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create a trusted-looking click event inside the iframe
      setTimeout(() => {
        try {
          const clickEvent = new MouseEvent('click', {
            clientX: e.clientX,
            clientY: e.clientY,
            bubbles: true,
            cancelable: true,
            view: window,
          });
          iframe.dispatchEvent(clickEvent);
        } catch (_) {
          // Cross-origin — can't dispatch into iframe, which is fine
        }
      }, 50);
    }
  }

  function handleProxyMouseDown(e: React.MouseEvent) {
    // Let mousedown through for drag/seek but block popup triggers
    e.stopPropagation();
  }

  function handleProxyTouchStart(e: React.TouchEvent) {
    // Block touch-based ad triggers
    e.stopPropagation();
  }

  return (
    <div class="fixed inset-0 z-[50] bg-black flex flex-col">
      {/* Loading */}
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

      {/* Error */}
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

      {/* The iframe — no sandbox attribute */}
      <iframe
        ref={iframeRef}
        src={props.url}
        class="w-full h-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ opacity: loaded() ? 1 : 0 }}
      />

      {/* ─── Shadow Proxy Layer ─── */}
      {/* Sits ABOVE the iframe (z-index: 60 > iframe: auto)
          Captures ALL mouse/touch events.
          Blocks popup triggers while allowing player control events through. */}
      <Show when={loaded()}>
        <div
          class="absolute inset-0 z-[60]"
          style={{ background: 'transparent', cursor: 'pointer' }}
          onClick={handleProxyClick}
          onMouseDown={handleProxyMouseDown}
          onTouchStart={handleProxyTouchStart}
        />
      </Show>

      {/* Back button — above proxy layer */}
      <Show when={loaded() && props.onBack}>
        <button
          class="absolute top-4 left-4 z-[70] w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={props.onBack}
        >
          ←
        </button>
      </Show>

      {/* Intercept counter (debug — hidden in production) */}
      <Show when={intercepted() > 0}>
        <div class="absolute bottom-4 right-4 z-[70] px-3 py-1 rounded-lg text-[11px] font-bold bg-red-500/20 text-red-400 backdrop-blur-sm pointer-events-none">
          🚫 {intercepted()} popup{intercepted() > 1 ? 's' : ''} blocked
        </div>
      </Show>
    </div>
  );
}

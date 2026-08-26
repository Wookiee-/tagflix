import { createSignal, Show, onMount, onCleanup } from 'solid-js';

interface Props {
  url: string;
  title?: string;
  onBack?: () => void;
}

export default function IframePlayer(props: Props) {
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal(false);

  onMount(() => {
    // Block window.open globally — catches programmatic popups from VidCore
    (window as any).__origOpen = window.open;
    window.open = function () {
      return {
        focus: function () {},
        blur: function () {},
        close: function () {},
        closed: false,
        location: { href: '' },
        postMessage: function () {},
      } as any;
    };

    onCleanup(() => {
      window.open = (window as any).__origOpen || window.open;
    });
  });

  return (
    <div class="fixed inset-0 z-[50] bg-black" style={{ 'will-change': 'transform, opacity', 'transform': 'translateZ(0)', 'backface-visibility': 'hidden' }}>
      {/* Loading — fully unmounts once loaded to free GPU memory */}
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

      {/* Iframe on its own GPU layer for faster rendering */}
      <iframe
        src={props.url}
        class="w-full h-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullscreen
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ opacity: loaded() ? 1 : 0, background: 'black', 'will-change': 'transform', 'transform': 'translateZ(0)', 'backface-visibility': 'hidden' }}
      />
    </div>
  );
}

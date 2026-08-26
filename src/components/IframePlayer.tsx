import { createSignal, Show, onMount, onCleanup } from 'solid-js';
import { Capacitor } from '@capacitor/core';

interface Props {
  url: string;
  title?: string;
  onBack?: () => void;
}

/** Detect native Android platform via Capacitor */
function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch { return false; }
}

export default function IframePlayer(props: Props) {
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal(false);
  const [opening, setOpening] = createSignal(false);
  const android = isNativeAndroid();

  onMount(async () => {
    if (android) {
      // Open stream in system browser — full Chrome/Samsung Internet with
      // hardware-accelerated video decode, much faster than WebView iframe
      setOpening(true);
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({
          url: props.url,
          presentationStyle: 'fullscreen',
          toolbarColor: '#0a0a0f',
          backgroundColor: '#0a0a0f',
        });
      } catch (e) {
        console.error('[IframePlayer] Failed to open external browser:', e);
        // Fallback: navigate directly
        window.location.href = props.url;
      }
      return;
    }

    // Desktop: block window.open globally — catches programmatic popups from VidCore
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

  // Android: show "Opening in browser..." screen while Capacitor opens external browser
  if (android) {
    return (
      <div class="fixed inset-0 z-[50] bg-black flex flex-col items-center justify-center">
        <Show
          when={opening()}
          fallback={
            <div class="flex flex-col items-center">
              <div
                class="w-10 h-10 rounded-full border-2 animate-spin mb-4"
                style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }}
              />
              <p class="text-sm" style={{ color: 'var(--text)' }}>
                Opening in browser...
              </p>
            </div>
          }
        >
          <div class="flex flex-col items-center">
            <div
              class="w-10 h-10 rounded-full border-2 animate-spin mb-4"
              style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }}
            />
            <p class="text-sm" style={{ color: 'var(--text)' }}>
              Opening in your browser for best playback...
            </p>
            <Show when={props.onBack}>
              <button
                class="mt-6 px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
                style={{ background: 'var(--accent)' }}
                onClick={props.onBack}
              >
                Go Back
              </button>
            </Show>
          </div>
        </Show>
      </div>
    );
  }

  // Desktop: iframe player with popup blocking
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

      {/* Iframe — no sandbox, popups blocked by window.open override */}
      <iframe
        src={props.url}
        class="w-full h-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullscreen
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ opacity: loaded() ? 1 : 0, background: 'black' }}
      />
    </div>
  );
}

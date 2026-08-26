import { createSignal, Show, onMount, onCleanup } from 'solid-js';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

interface Props {
  url: string;
  title?: string;
  onBack?: () => void;
}

function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch { return false; }
}

export default function IframePlayer(props: Props) {
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal(false);
  const [browserOpen, setBrowserOpen] = createSignal(false);

  onMount(() => {
    // On Android, open stream in system browser for full hardware acceleration
    if (isNativeAndroid()) {
      openInBrowser();
      return;
    }

    // Desktop: block popups from VidCore
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

  async function openInBrowser() {
    try {
      setBrowserOpen(true);

      // Listen for when browser closes — navigate back
      const listener = await App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          // User returned to app from browser
          setBrowserOpen(false);
          listener.remove();
          props.onBack?.();
        }
      });

      await Browser.open({
        url: props.url,
        presentationStyle: 'popover',
        toolbarColor: '#0c0b11',
      });

      // Browser opened — wait for it to close
      // On Android, pressing Back closes the Custom Chrome Tab
      // and returns to the app, triggering appStateChange
    } catch (e) {
      console.error('[IframePlayer] Browser open failed:', e);
      setError(true);
    }
  }

  // Android: show status while browser is open
  if (isNativeAndroid()) {
    return (
      <div class="fixed inset-0 z-[50] bg-black flex flex-col items-center justify-center">
        <Show when={!browserOpen()}>
          <div class="flex flex-col items-center">
            <div
              class="w-10 h-10 rounded-full border-2 animate-spin mb-4"
              style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }}
            />
            <p class="text-sm mb-2" style={{ color: 'var(--text)' }}>
              Opening in browser...
            </p>
            <p class="text-xs" style={{ color: 'var(--text)', opacity: 0.5 }}>
              Press Back to return to Tagflix
            </p>
          </div>
        </Show>
        <Show when={browserOpen()}>
          <div class="flex flex-col items-center">
            <p class="text-sm mb-4" style={{ color: 'var(--text)' }}>
              Playing in browser
            </p>
            <p class="text-xs mb-6" style={{ color: 'var(--text)', opacity: 0.5 }}>
              Press Back to return to Tagflix
            </p>
            <Show when={props.onBack}>
              <button
                class="px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
                style={{ background: 'var(--accent)' }}
                onClick={props.onBack}
              >
                ← Back to Tagflix
              </button>
            </Show>
          </div>
        </Show>
        <Show when={error()}>
          <div class="flex flex-col items-center">
            <p class="text-lg font-bold text-white mb-2">Failed to open stream</p>
            <p class="text-sm text-gray-400 mb-6">Could not open browser for playback.</p>
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
      </div>
    );
  }

  // Desktop: iframe approach
  return (
    <div class="fixed inset-0 z-[50] bg-black" style={{ 'will-change': 'transform, opacity', 'transform': 'translateZ(0)', 'backface-visibility': 'hidden' }}>
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

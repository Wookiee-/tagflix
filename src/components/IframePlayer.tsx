import { createSignal, Show, onMount, onCleanup } from 'solid-js';
import { Capacitor } from '@capacitor/core';
import { InAppBrowser } from '@capgo/capacitor-inappbrowser';

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
  let closeHandle: any = null;

  onMount(() => {
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
      if (closeHandle) closeHandle.remove();
    });
  });

  async function openInBrowser() {
    try {
      setBrowserOpen(true);

      const { id } = await InAppBrowser.openWebView({
        url: props.url,
        // No toolbar — VidCore has its own controls
        toolbarType: 'blank' as any,
        // Fullscreen — extend behind status bar
        enabledSafeTopMargin: false,
        enabledSafeBottomMargin: false,
        // Close button behavior
        closeAction: 'close' as any,
      });

      // Listen for close event
      closeHandle = await InAppBrowser.addListener('closeEvent', () => {
        setBrowserOpen(false);
        if (closeHandle) closeHandle.remove();
        props.onBack?.();
      });

    } catch (e) {
      console.error('[IframePlayer] InAppBrowser error:', e);
      setError(true);
    }
  }

  async function closeBrowser() {
    try {
      await InAppBrowser.close();
    } catch (e) {}
    setBrowserOpen(false);
    props.onBack?.();
  }

  // Android: show status while browser is open
  if (isNativeAndroid()) {
    return (
      <div class="fixed inset-0 z-[50] bg-black flex flex-col items-center justify-center">
        <Show when={!browserOpen() && !error()}>
          <div class="flex flex-col items-center">
            <div
              class="w-10 h-10 rounded-full border-2 animate-spin mb-4"
              style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }}
            />
            <p class="text-sm mb-2" style={{ color: 'var(--text)' }}>
              Opening player...
            </p>
          </div>
        </Show>
        <Show when={browserOpen()}>
          <div class="flex flex-col items-center">
            <p class="text-sm mb-4" style={{ color: 'var(--text)' }}>
              Playing in browser
            </p>
            <p class="text-xs mb-6" style={{ color: 'var(--text)', opacity: 0.5 }}>
              Tap X to return to Tagflix
            </p>
            <button
              class="px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
              style={{ background: 'var(--accent)' }}
              onClick={closeBrowser}
            >
              ← Back to Tagflix
            </button>
          </div>
        </Show>
        <Show when={error()}>
          <div class="flex flex-col items-center">
            <p class="text-lg font-bold text-white mb-2">Failed to open stream</p>
            <p class="text-sm text-gray-400 mb-6">Could not open browser for playback.</p>
            <button
              class="px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
              style={{ background: 'var(--accent)' }}
              onClick={closeBrowser}
            >
              Go Back
            </button>
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

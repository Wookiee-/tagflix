import { createSignal, Show, onMount, onCleanup } from 'solid-js';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';

interface TagflixBrowserPlugin {
  open(options: { url: string; toolbarColor?: string }): Promise<{ opened: boolean }>;
}

/** Local Android plugin — opens a Chrome Custom Tab in immersive fullscreen */
const TagflixBrowser = registerPlugin<TagflixBrowserPlugin>('TagflixBrowser');

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
  let appStateHandle: any = null;

  // Load source directly
  const iframeSrc = () => props.url;

  onMount(() => {
    if (isNativeAndroid()) {
      openInBrowser();
      return;
    }

    // Hardened shield: permanent window.open block + sandbox + multi-event shield
    // Previous shield only blocked 800ms and restored window.open — ads on 2nd click slipped through.
    const origOpen = window.open;
    const blockedOpen = function () {
      console.warn('[Tagflix] Blocked popup');
      return null as any;
    };
    // Permanent block for lifetime of player
    try { (window as any).open = blockedOpen; } catch {}
    // Guard: ad scripts often do `window.open = orig` — keep re-blocking every 200ms
    const openGuard = setInterval(() => {
      if ((window as any).open !== blockedOpen) {
        try { (window as any).open = blockedOpen; } catch {}
      }
    }, 200);
    // Best-effort freeze so assignments silently fail
    try {
      Object.defineProperty(window, 'open', {
        value: blockedOpen,
        writable: false,
        configurable: false,
      });
    } catch {}

    var shield = document.createElement('div');
    shield.id = 'tagflix-shield';
    shield.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99;cursor:pointer;background:transparent;pointer-events:auto;';
    const shieldHandler = (e: Event) => {
      e.stopPropagation();
      // @ts-ignore
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      try { (window as any).open = blockedOpen; } catch {}
      // First click is almost always the ad — consume it and drop shield so player becomes interactive.
      // window.open stays blocked via openGuard, so subsequent ad clicks also get blocked.
      if (shield.parentNode) shield.remove();
    };
    shield.addEventListener('click', shieldHandler, true);
    shield.addEventListener('mousedown', shieldHandler, true);
    shield.addEventListener('auxclick', shieldHandler, true);
    shield.addEventListener('touchstart', shieldHandler as any, true);
    document.body.appendChild(shield);

    onCleanup(() => {
      clearInterval(openGuard);
      try {
        Object.defineProperty(window, 'open', { value: origOpen, writable: true, configurable: true });
      } catch {
        try { (window as any).open = origOpen; } catch {}
      }
      if (shield.parentNode) shield.parentNode.removeChild(shield);
      if (appStateHandle) appStateHandle.remove();
    });
  });

  async function openInBrowser() {
    try {
      setBrowserOpen(true);

      // Listen for app coming back to foreground (user pressed Back)
      appStateHandle = await App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          setBrowserOpen(false);
          if (appStateHandle) appStateHandle.remove();
          props.onBack?.();
        }
      });

      // Open Chrome Custom Tab in immersive fullscreen (hardware-accelerated)
      await TagflixBrowser.open({
        url: props.url,
        toolbarColor: '#0c0b11',
      });

    } catch (e) {
      console.error('[IframePlayer] Browser open failed:', e);
      setError(true);
    }
  }

  function closeBrowser() {
    // Custom tab covers the app, so this is only hit from the error state
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
              Press Back to return to Tagflix
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
        src={iframeSrc()}
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

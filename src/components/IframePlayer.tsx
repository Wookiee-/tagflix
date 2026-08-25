import { createSignal, Show, onMount, onCleanup, createEffect } from 'solid-js';

interface Props {
  url: string;
  title?: string;
  onBack?: () => void;
}

// Check if we're running inside Electron (window.electron is exposed by preload)
const isElectron = () => !!(window as any).electron?.ipcRenderer;

export default function IframePlayer(props: Props) {
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal(false);
  const [usingNative, setUsingNative] = createSignal(false);

  let containerRef!: HTMLDivElement;

  // ─── Electron: Native WebContentsView ───
  const loadNativeView = async () => {
    if (!isElectron()) return;
    const ipc = (window as any).electron.ipcRenderer;
    const rect = containerRef.getBoundingClientRect();
    const bounds = {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };

    try {
      await ipc.loadStreamView(props.url, bounds);
      setUsingNative(true);
      setLoaded(true);
    } catch (e) {
      console.error('[player] native view failed, falling back to iframe:', e);
      setUsingNative(false);
    }
  };

  // Load the native view when URL changes
  createEffect(() => {
    const url = props.url;
    if (url && isElectron()) {
      loadNativeView();
    }
  });

  // Update bounds on window resize
  onMount(() => {
    if (!isElectron()) return;

    const onResize = () => {
      if (!containerRef || !usingNative()) return;
      const rect = containerRef.getBoundingClientRect();
      (window as any).electron.ipcRenderer.updateStreamBounds({
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    window.addEventListener('resize', onResize);

    // Initial positioning after a short delay to ensure layout is settled
    const t = setTimeout(onResize, 100);

    onCleanup(() => {
      window.removeEventListener('resize', onResize);
      clearTimeout(t);
      if (isElectron()) {
        (window as any).electron.ipcRenderer.closeStreamView();
      }
    });
  });

  // ─── Browser: iframe fallback ───
  const handleIframeLoad = () => setLoaded(true);
  const handleIframeError = () => setError(true);

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

      {/* Container for the player — native view is positioned over this div */}
      <div
        ref={containerRef}
        class="w-full h-full"
        style={{ opacity: loaded() ? 1 : 0 }}
      >
        {/* Iframe fallback for non-Electron (browser) environments */}
        <Show when={!usingNative()}>
          <iframe
            src={props.url}
            class="w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </Show>
      </div>
    </div>
  );
}

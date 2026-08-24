import { Show, createSignal, onMount, onCleanup, type JSX } from 'solid-js';
import { useLocation, A } from '@solidjs/router';
import {
  Home, Compass, Search, Film, Tv, Bookmark, Settings,
} from 'lucide-solid';

/* ══════════════════════════════════════════════════════════════
   Stremio-inspired layout (root component):
     Desktop: left sidebar (64px icons) + main content
     Mobile:  bottom tab bar
     Player:  fullscreen, no nav
   ══════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { name: 'Home', icon: Home, path: '/' },
  { name: 'Discover', icon: Compass, path: '/discover' },
  { name: 'Search', icon: Search, path: '/search' },
  { name: 'Movies', icon: Film, path: '/movies' },
  { name: 'TV Shows', icon: Tv, path: '/tv' },
  { name: 'Favourites', icon: Bookmark, path: '/favourites' },
];

const MOBILE_NAV = [
  { name: 'Home', icon: Home, path: '/' },
  { name: 'Discover', icon: Compass, path: '/discover' },
  { name: 'Search', icon: Search, path: '/search' },
  { name: 'Library', icon: Bookmark, path: '/favourites' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

// Skin definitions
const SKINS: Record<string, { bg: string; surface: string; text: string }> = {
  dark:     { bg: '#0c0b11', surface: '#16141d', text: '#a0aab6' },
  midnight: { bg: '#0f172a', surface: '#1e293b', text: '#94a3b8' },
  oled:     { bg: '#000000', surface: '#0a0a0a', text: '#a0aab6' },
  slate:    { bg: '#1a1d24', surface: '#242931', text: '#a0aab6' },
};

const ACCENTS: Record<string, { a: string; h: string }> = {
  '#3b82f6': { a: '#3b82f6', h: '#2563eb' },
  '#6366f1': { a: '#6366f1', h: '#4f46e5' },
  '#a855f7': { a: '#a855f7', h: '#9333ea' },
  '#ec4899': { a: '#ec4899', h: '#db2777' },
  '#f43f5e': { a: '#f43f5e', h: '#e11d48' },
  '#f97316': { a: '#f97316', h: '#ea580c' },
  '#10b981': { a: '#10b981', h: '#059669' },
  '#06b6d4': { a: '#06b6d4', h: '#0891b2' },
};

export default function App(props: { children?: JSX.Element }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);

  const isPlayer = () => location.pathname === '/player';

  // Detect platform mode
  onMount(() => {
    const detect = () => {
      const root = document.documentElement;
      root.classList.remove('tv-mode', 'mobile-mode', 'desktop-mode');
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const small = window.innerWidth < 768;
      root.classList.add(coarse ? (small ? 'mobile-mode' : 'tv-mode') : 'desktop-mode');
      setIsMobile(small);
    };
    detect();
    window.addEventListener('resize', detect);
    onCleanup(() => window.removeEventListener('resize', detect));

    // Apply saved theme
    try {
      const skin = localStorage.getItem('tagflix_skin') || 'dark';
      const accent = localStorage.getItem('tagflix_accent') || '#6366f1';
      const s = SKINS[skin] || SKINS.dark;
      const a = ACCENTS[accent] || ACCENTS['#6366f1'];
      const r = document.documentElement;
      r.style.setProperty('--bg', s.bg);
      r.style.setProperty('--surface', s.surface);
      r.style.setProperty('--text', s.text);
      r.style.setProperty('--accent', a.a);
      r.style.setProperty('--accent-hover', a.h);
    } catch { /* noop */ }
  });

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div
      class="w-screen h-screen flex font-sans select-none overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* ═══ Desktop Sidebar ═══ */}
      <Show when={!isPlayer() && !isMobile()}>
        <aside
          class="w-16 shrink-0 flex flex-col items-center py-4 gap-1 overflow-y-auto"
          style={{ 'border-right': '1px solid var(--border)' }}
        >
          {/* Logo */}
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 font-black text-sm text-white"
            style={{ background: 'var(--accent)' }}
          >
            T
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <A
                href={item.path}
                class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 relative group"
                classList={{
                  'text-white': isActive(item.path),
                }}
                style={{
                  background: isActive(item.path) ? 'var(--accent)' : 'transparent',
                  color: isActive(item.path) ? 'white' : 'var(--text)',
                }}
                title={item.name}
              >
                <Icon size={20} />
                <span class="absolute left-14 px-2 py-1 rounded-md text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {item.name}
                </span>
              </A>
            );
          })}

          <div class="flex-1" />

          <A
            href="/settings"
            class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150"
            style={{ color: isActive('/settings') ? 'var(--accent)' : 'var(--text)' }}
            title="Settings"
          >
            <Settings size={20} />
          </A>
        </aside>
      </Show>

      {/* ═══ Main Content ═══ */}
      <div class="flex-1 h-full overflow-y-auto relative">
        {props.children}
      </div>

      {/* ═══ Mobile Bottom Tab Bar ═══ */}
      <Show when={!isPlayer() && isMobile()}>
        <nav
          class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
          style={{
            height: '56px',
            background: 'var(--bg)',
            'border-top': '1px solid var(--border)',
            'backdrop-filter': 'blur(12px)',
          }}
        >
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <A
                href={item.path}
                class="flex flex-col items-center gap-0.5 py-1 px-2"
                style={{ color: isActive(item.path) ? 'var(--accent)' : 'var(--text)' }}
              >
                <Icon size={20} />
                <span class="text-[10px] font-semibold">{item.name}</span>
              </A>
            );
          })}
        </nav>
      </Show>
    </div>
  );
}

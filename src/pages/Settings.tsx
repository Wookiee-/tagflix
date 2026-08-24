import { createSignal, For, Show } from 'solid-js';
import { Paintbrush, Monitor, Palette, Globe, Info } from 'lucide-solid';
import {
  getAccentColor, setAccentColor, getSkin, setSkin,
  getActiveSource, setActiveSource,
  getAutoplayNext, setAutoplayNext,
} from '../lib/storage';
import { SOURCES } from '../lib/sources';

const ACCENTS = [
  { id: '#3b82f6', name: 'Blue' },
  { id: '#6366f1', name: 'Indigo' },
  { id: '#a855f7', name: 'Purple' },
  { id: '#ec4899', name: 'Pink' },
  { id: '#f43f5e', name: 'Rose' },
  { id: '#f97316', name: 'Orange' },
  { id: '#10b981', name: 'Green' },
  { id: '#06b6d4', name: 'Cyan' },
];

const SKINS = [
  { id: 'dark', name: 'Dark' },
  { id: 'midnight', name: 'Midnight' },
  { id: 'oled', name: 'OLED Black' },
  { id: 'slate', name: 'Slate' },
];

const SKIN_MAP: Record<string, { bg: string; surface: string; text: string }> = {
  dark:     { bg: '#0c0b11', surface: '#16141d', text: '#a0aab6' },
  midnight: { bg: '#0f172a', surface: '#1e293b', text: '#94a3b8' },
  oled:     { bg: '#000000', surface: '#0a0a0a', text: '#a0aab6' },
  slate:    { bg: '#1a1d24', surface: '#242931', text: '#a0aab6' },
};

const ACCENT_MAP: Record<string, { a: string; h: string }> = {
  '#3b82f6': { a: '#3b82f6', h: '#2563eb' },
  '#6366f1': { a: '#6366f1', h: '#4f46e5' },
  '#a855f7': { a: '#a855f7', h: '#9333ea' },
  '#ec4899': { a: '#ec4899', h: '#db2777' },
  '#f43f5e': { a: '#f43f5e', h: '#e11d48' },
  '#f97316': { a: '#f97316', h: '#ea580c' },
  '#10b981': { a: '#10b981', h: '#059669' },
  '#06b6d4': { a: '#06b6d4', h: '#0891b2' },
};

function applyAccent(color: string) {
  setAccentColor(color);
  const a = ACCENT_MAP[color] || ACCENT_MAP['#6366f1'];
  const r = document.documentElement;
  r.style.setProperty('--accent', a.a);
  r.style.setProperty('--accent-hover', a.h);
}

function applySkin(skinId: string) {
  setSkin(skinId);
  const s = SKIN_MAP[skinId] || SKIN_MAP.dark;
  const r = document.documentElement;
  r.style.setProperty('--bg', s.bg);
  r.style.setProperty('--surface', s.surface);
  r.style.setProperty('--text', s.text);
}

export default function SettingsPage() {
  const [accent, setAccent] = createSignal(getAccentColor());
  const [skin, setSkinState] = createSignal(getSkin());
  const [source, setSourceState] = createSignal(getActiveSource());
  const [autoplay, setAutoplayState] = createSignal(getAutoplayNext());

  return (
    <div class="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 class="text-2xl font-black mb-8" style={{ color: 'var(--text-white)' }}>Settings</h1>

      {/* Accent Color */}
      <section class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <Palette size={18} style={{ color: 'var(--accent)' }} />
          <h2 class="text-sm font-bold uppercase tracking-wider opacity-50">Accent Color</h2>
        </div>
        <div class="flex gap-3 flex-wrap">
          <For each={ACCENTS}>
            {(a) => (
              <button
                class="w-10 h-10 rounded-full transition-transform hover:scale-110"
                style={{
                  background: a.id,
                  'box-shadow': accent() === a.id ? `0 0 0 3px var(--bg), 0 0 0 5px ${a.id}` : 'none',
                }}
                onClick={() => { setAccent(a.id); applyAccent(a.id); }}
                title={a.name}
              />
            )}
          </For>
        </div>
      </section>

      {/* Skin */}
      <section class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <Paintbrush size={18} style={{ color: 'var(--accent)' }} />
          <h2 class="text-sm font-bold uppercase tracking-wider opacity-50">Skin</h2>
        </div>
        <div class="flex gap-3 flex-wrap">
          <For each={SKINS}>
            {(s) => (
              <button
                class="px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: skin() === s.id ? 'var(--accent)' : 'var(--surface)',
                  color: skin() === s.id ? 'white' : 'var(--text)',
                }}
                onClick={() => { setSkinState(s.id); applySkin(s.id); }}
              >
                {s.name}
              </button>
            )}
          </For>
        </div>
      </section>

      {/* Default Source */}
      <section class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <Globe size={18} style={{ color: 'var(--accent)' }} />
          <h2 class="text-sm font-bold uppercase tracking-wider opacity-50">Default Source</h2>
        </div>
        <div class="flex gap-3 flex-wrap">
          <For each={SOURCES}>
            {(s) => (
              <button
                class="px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: source() === s.id ? 'var(--accent)' : 'var(--surface)',
                  color: source() === s.id ? 'white' : 'var(--text)',
                }}
                onClick={() => { setSourceState(s.id); setActiveSource(s.id); }}
              >
                {s.name}
              </button>
            )}
          </For>
        </div>
      </section>

      {/* Player */}
      <section class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <Monitor size={18} style={{ color: 'var(--accent)' }} />
          <h2 class="text-sm font-bold uppercase tracking-wider opacity-50">Player</h2>
        </div>
        <div
          class="flex items-center justify-between p-4 rounded-lg"
          style={{ background: 'var(--surface)' }}
        >
          <span class="text-sm font-semibold" style={{ color: 'var(--text-white)' }}>Autoplay next episode</span>
          <button
            class="w-12 h-6 rounded-full transition-colors relative"
            style={{ background: autoplay() ? 'var(--accent)' : 'var(--border)' }}
            onClick={() => { const v = !autoplay(); setAutoplayState(v); setAutoplayNext(v); }}
          >
            <div
              class="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform"
              style={{ left: autoplay() ? '26px' : '2px' }}
            />
          </button>
        </div>
      </section>

      {/* About */}
      <section class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <Info size={18} style={{ color: 'var(--accent)' }} />
          <h2 class="text-sm font-bold uppercase tracking-wider opacity-50">About</h2>
        </div>
        <div class="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <p class="text-sm font-bold" style={{ color: 'var(--text-white)' }}>Tagflix v2.0</p>
          <p class="text-xs opacity-50 mt-1">SolidJS + Electron + Capacitor</p>
        </div>
      </section>
    </div>
  );
}

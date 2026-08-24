import { createSignal, For } from 'solid-js';
import {
  Palette, Paintbrush, Globe, Info, MonitorPlay, Sparkles,
} from 'lucide-solid';
import {
  getAccentColor, setAccentColor, getSkin, setSkin,
  getActiveSource, setActiveSource,
  getAutoplayNext, setAutoplayNext,
  clearAllContinueWatching,
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
  { id: 'dark', name: 'Dark', bg: '#0c0b11', surface: '#16141d' },
  { id: 'midnight', name: 'Midnight', bg: '#0f172a', surface: '#1e293b' },
  { id: 'oled', name: 'OLED Black', bg: '#000000', surface: '#0a0a0a' },
  { id: 'slate', name: 'Slate', bg: '#1a1d24', surface: '#242931' },
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
  r.style.setProperty('--accent-glow', `${a.a}40`);
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
    <div class="p-8 md:p-12 pb-20 animate-fade-in">
      {/* Header */}
      <div class="mb-12">
        <h1 class="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'white' }}>Settings</h1>
        <p class="text-base mt-2 opacity-50">Customize your experience</p>
      </div>

      {/* Accent Colour */}
      <div class="rounded-2xl p-8 mb-8 glass">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', 'box-shadow': '0 2px 12px var(--accent-glow)' }}>
            <Palette size={20} style={{ color: 'white' }} />
          </div>
          <h2 class="text-lg font-bold" style={{ color: 'white' }}>Accent Colour</h2>
        </div>
        <p class="text-sm mb-6 opacity-40">Choose a colour that reflects your style</p>
        <div class="flex gap-5 flex-wrap">
          <For each={ACCENTS}>
            {(a) => (
              <button
                class="w-14 h-14 rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  background: a.id,
                  'box-shadow': accent() === a.id
                    ? `0 0 0 4px var(--bg), 0 0 0 6px ${a.id}, 0 6px 20px ${a.id}50`
                    : '0 3px 10px rgba(0,0,0,0.4)',
                }}
                onClick={() => { setAccent(a.id); applyAccent(a.id); }}
                title={a.name}
              />
            )}
          </For>
        </div>
      </div>

      {/* Skin */}
      <div class="rounded-2xl p-8 mb-8 glass">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', 'box-shadow': '0 2px 12px var(--accent-glow)' }}>
            <Paintbrush size={20} style={{ color: 'white' }} />
          </div>
          <h2 class="text-lg font-bold" style={{ color: 'white' }}>Skin</h2>
        </div>
        <p class="text-sm mb-6 opacity-40">Pick a theme for the interface</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <For each={SKINS}>
            {(s) => (
              <button
                class="p-5 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: skin() === s.id ? 'var(--accent)' : s.surface,
                  border: skin() === s.id ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  'box-shadow': skin() === s.id ? '0 4px 20px var(--accent-glow)' : '0 2px 8px rgba(0,0,0,0.2)',
                }}
                onClick={() => { setSkinState(s.id); applySkin(s.id); }}
              >
                <div class="flex gap-2 mb-3">
                  <div class="w-6 h-6 rounded-lg" style={{ background: s.bg }} />
                  <div class="w-6 h-6 rounded-lg" style={{ background: s.surface }} />
                  <div class="w-4 h-6 rounded-lg" style={{ background: skin() === s.id ? 'rgba(255,255,255,0.3)' : 'var(--accent)' }} />
                </div>
                <span class="text-sm font-bold" style={{ color: skin() === s.id ? 'white' : 'var(--text)' }}>
                  {s.name}
                </span>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Streaming Source */}
      <div class="rounded-2xl p-8 mb-8 glass">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', 'box-shadow': '0 2px 12px var(--accent-glow)' }}>
            <Globe size={20} style={{ color: 'white' }} />
          </div>
          <h2 class="text-lg font-bold" style={{ color: 'white' }}>Streaming Source</h2>
        </div>
        <p class="text-sm mb-6 opacity-40">Choose which source to use first</p>
        <div class="flex gap-3 flex-wrap">
          <For each={SOURCES}>
            {(s) => (
              <button
                class="px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-[1.03]"
                style={{
                  background: source() === s.id ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                  color: source() === s.id ? 'white' : 'var(--text)',
                  border: source() === s.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  'box-shadow': source() === s.id ? '0 4px 16px var(--accent-glow)' : 'none',
                }}
                onClick={() => { setSourceState(s.id); setActiveSource(s.id); }}
              >
                {s.name}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Player */}
      <div class="rounded-2xl p-8 mb-8 glass">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', 'box-shadow': '0 2px 12px var(--accent-glow)' }}>
            <MonitorPlay size={20} style={{ color: 'white' }} />
          </div>
          <h2 class="text-lg font-bold" style={{ color: 'white' }}>Player</h2>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-base font-semibold" style={{ color: 'white' }}>Autoplay next episode</p>
            <p class="text-sm opacity-40 mt-1">Play the next episode automatically</p>
          </div>
          <button
            class="w-14 h-8 rounded-full transition-all duration-200 relative shrink-0"
            style={{
              background: autoplay() ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
              'box-shadow': autoplay() ? '0 2px 12px var(--accent-glow)' : 'none',
            }}
            onClick={() => { const v = !autoplay(); setAutoplayState(v); setAutoplayNext(v); }}
          >
            <div
              class="w-6 h-6 rounded-full bg-white absolute top-1 transition-transform duration-200 shadow-md"
              style={{ left: autoplay() ? '30px' : '4px' }}
            />
          </button>
        </div>
      </div>

      {/* Data */}
      <div class="rounded-2xl p-8 mb-8 glass">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', 'box-shadow': '0 2px 12px var(--accent-glow)' }}>
            <Info size={20} style={{ color: 'white' }} />
          </div>
          <h2 class="text-lg font-bold" style={{ color: 'white' }}>Data</h2>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-base font-semibold" style={{ color: 'white' }}>Clear Continue Watching</p>
            <p class="text-sm opacity-40 mt-1">Remove all continue watching entries</p>
          </div>
          <button
            class="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 shrink-0"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
            onClick={() => { clearAllContinueWatching(); }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* About */}
      <div class="rounded-2xl p-8 glass">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', 'box-shadow': '0 2px 12px var(--accent-glow)' }}>
            <Sparkles size={20} style={{ color: 'white' }} />
          </div>
          <h2 class="text-lg font-bold" style={{ color: 'white' }}>About</h2>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-base font-bold" style={{ color: 'white' }}>Tagflix v2.0</p>
            <p class="text-sm opacity-40 mt-1">SolidJS + Electron + Capacitor</p>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 rounded-xl glass shrink-0">
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <span class="text-xs font-bold" style={{ color: 'var(--accent)' }}>OPEN SOURCE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

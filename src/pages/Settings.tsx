import { createSignal, For, Show } from 'solid-js';
import {
  Palette, Paintbrush, Globe, MonitorPlay, Sparkles, Trash2,
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
  { id: 'dark', name: 'Dark', bg: '#0c0b11', surface: '#16141d', desc: 'Classic dark mode' },
  { id: 'midnight', name: 'Midnight', bg: '#0f172a', surface: '#1e293b', desc: 'Deep blue tones' },
  { id: 'oled', name: 'OLED Black', bg: '#000000', surface: '#0a0a0a', desc: 'True black for OLED' },
  { id: 'slate', name: 'Slate', bg: '#1a1d24', surface: '#242931', desc: 'Cool gray palette' },
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
  const a = ACCENT_MAP[color] || ACCENT_MAP['#3b82f6'];
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

/* ═══ Toggle Switch ═══ */
function Toggle(props: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      class="w-12 h-7 rounded-full transition-all duration-200 relative shrink-0"
      style={{
        background: props.value ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
        'box-shadow': props.value ? '0 0 14px var(--accent-glow)' : 'none',
      }}
      onClick={() => props.onChange(!props.value)}
    >
      <div
        class="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-200 shadow-md"
        style={{ left: props.value ? '26px' : '4px' }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [accent, setAccentState] = createSignal(getAccentColor());
  const [skin, setSkinState] = createSignal(getSkin());
  const [source, setSourceState] = createSignal(getActiveSource());
  const [autoplay, setAutoplayState] = createSignal(getAutoplayNext());

  return (
    <div class="p-6 md:p-10 pb-24 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div class="mb-12">
        <h1 class="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-white)' }}>Settings</h1>
        <p class="text-sm mt-2 text-white/35">Customize your experience</p>
      </div>

      {/* ═══ Appearance Card ═══ */}
      <div class="glass-card p-6 md:p-8 mb-10">
        <h3 class="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--accent)' }}>Theme Skin</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <For each={SKINS}>
            {(s) => {
              const selected = () => skin() === s.id;
              return (
                <button
                  class="p-5 rounded-xl text-left transition-all duration-200"
                  style={{
                    background: selected() ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: selected() ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.06)',
                    'box-shadow': selected() ? '0 0 20px var(--accent-glow)' : 'none',
                  }}
                  onClick={() => { setSkinState(s.id); applySkin(s.id); }}
                >
                  <div class="flex gap-2 mb-3">
                    <div class="w-5 h-5 rounded-full" style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div class="w-5 h-5 rounded-full" style={{ background: s.surface, border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div class="w-5 h-5 rounded-full" style={{ background: selected() ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
                  </div>
                  <p class="text-sm font-bold mb-0.5" style={{ color: selected() ? 'white' : 'var(--text)' }}>
                    {s.name}
                  </p>
                  <p class="text-[11px] text-white/30">{s.desc}</p>
                  <Show when={selected()}>
                    <div class="absolute top-3 right-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--accent)"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>
                    </div>
                  </Show>
                </button>
              );
            }}
          </For>
        </div>

        <h3 class="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--accent)' }}>Accent Color</h3>
        <div class="flex gap-4 flex-wrap">
          <For each={ACCENTS}>
            {(a) => (
              <button
                class="w-10 h-10 rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  background: a.id,
                  'box-shadow': accent() === a.id
                    ? `0 0 0 3px var(--bg), 0 0 0 5px ${a.id}, 0 4px 20px ${a.id}60`
                    : '0 2px 10px rgba(0,0,0,0.4)',
                }}
                onClick={() => { setAccentState(a.id); applyAccent(a.id); }}
                title={a.name}
              />
            )}
          </For>
        </div>
      </div>

      {/* ═══ Streaming Source Card ═══ */}
      <div class="glass-card p-6 md:p-8 mb-10">
        <h3 class="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--accent)' }}>Streaming Source</h3>
        <div class="flex flex-col gap-3">
          <For each={SOURCES}>
            {(s) => {
              const selected = () => source() === s.id;
              return (
                <button
                  class="flex items-center gap-4 p-5 rounded-xl transition-all duration-200 text-left"
                  style={{
                    background: selected() ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: selected() ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.06)',
                  }}
                  onClick={() => { setSourceState(s.id); setActiveSource(s.id); }}
                >
                  <div
                    class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all duration-200"
                    style={{
                      border: selected() ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.2)',
                      background: selected() ? 'var(--accent)' : 'transparent',
                      'box-shadow': selected() ? '0 0 12px var(--accent-glow)' : 'none',
                    }}
                  >
                    <Show when={selected()}>
                      <div class="w-2 h-2 rounded-full bg-white" />
                    </Show>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-bold" style={{ color: selected() ? 'white' : 'var(--text)' }}>{s.name}</p>
                    <p class="text-xs text-white/30 mt-0.5">{s.id === 'vidcore' ? 'Default — fast and reliable' : 'Alternative source'}</p>
                  </div>
                </button>
              );
            }}
          </For>
        </div>
      </div>

      {/* ═══ Player Card ═══ */}
      <div class="glass-card p-6 md:p-8 mb-10">
        <h3 class="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--accent)' }}>Player</h3>
        <div class="flex items-center justify-between p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p class="text-sm font-bold" style={{ color: 'var(--text-white)' }}>Autoplay next episode</p>
            <p class="text-xs text-white/30 mt-1">Play the next episode automatically</p>
          </div>
          <Toggle value={autoplay()} onChange={(v) => { setAutoplayState(v); setAutoplayNext(v); }} />
        </div>
      </div>

      {/* ═══ Data Card ═══ */}
      <div class="glass-card p-6 md:p-8 mb-10">
        <h3 class="text-xs font-bold uppercase tracking-widest mb-6 text-red-400">Data</h3>
        <div class="flex items-center justify-between p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p class="text-sm font-bold" style={{ color: 'var(--text-white)' }}>Clear Continue Watching</p>
            <p class="text-xs text-white/30 mt-1">Remove all continue watching entries</p>
          </div>
          <button
            class="px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:brightness-110 shrink-0"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
            onClick={() => { clearAllContinueWatching(); }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ═══ About Card ═══ */}
      <div class="glass-card p-6 md:p-8 mb-10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-base font-bold" style={{ color: 'var(--text-white)' }}>Tagflix v2.0</p>
            <p class="text-xs text-white/30 mt-1">SolidJS • Built for streaming</p>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass shrink-0">
            <Sparkles size={12} style={{ color: 'var(--accent)' }} />
            <span class="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>OPEN SOURCE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

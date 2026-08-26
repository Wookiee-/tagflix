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

/* ═══ Radio Group ═══ */
function RadioGroup<T extends string>(props: {
  value: T;
  options: { id: T; label: string; description?: string; preview?: any }[];
  onChange: (v: T) => void;
}) {
  return (
    <div class="flex flex-col gap-4">
      <For each={props.options}>
        {(opt) => {
          const selected = () => props.value === opt.id;
          return (
            <button
              class="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left"
              style={{
                background: selected() ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: selected() ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
              }}
              onClick={() => props.onChange(opt.id)}
            >
              {/* Radio circle */}
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
              {/* Preview + text */}
              <Show when={opt.preview}>
                <div class="shrink-0">{opt.preview}</div>
              </Show>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold" style={{ color: selected() ? 'white' : 'var(--text)' }}>
                  {opt.label}
                </p>
                <Show when={opt.description}>
                  <p class="text-xs text-white/30 mt-0.5">{opt.description}</p>
                </Show>
              </div>
            </button>
          );
        }}
      </For>
    </div>
  );
}

/* ═══ Toggle Switch ═══ */
function Toggle(props: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      class="w-11 h-6 rounded-full transition-all duration-200 relative shrink-0"
      style={{
        background: props.value ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
        'box-shadow': props.value ? '0 0 12px var(--accent-glow)' : 'none',
      }}
      onClick={() => props.onChange(!props.value)}
    >
      <div
        class="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-200 shadow-md"
        style={{ left: props.value ? '24px' : '4px' }}
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
    <div class="p-6 md:p-10 pb-24 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div class="mb-10 text-center">
        <h1 class="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-white)' }}>Settings</h1>
        <p class="text-sm mt-2 text-white/35">Customize your experience</p>
      </div>

      {/* ═══ Accent Colour ═══ */}
      <div class="mb-28">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center glass-card">
            <Palette size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 class="text-base font-bold" style={{ color: 'var(--text-white)' }}>Accent Colour</h2>
            <p class="text-xs text-white/30">Choose a colour that reflects your style</p>
          </div>
        </div>
        {/* Accent circle grid */}
        <div class="flex gap-6 flex-wrap justify-center mb-4">
          <For each={ACCENTS}>
            {(a) => (
              <button
                class="w-9 h-9 rounded-full transition-all duration-200 hover:scale-110"
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
        <p class="text-center text-xs text-white/25">
          {ACCENTS.find(a => a.id === accent())?.name || 'Blue'}
        </p>
      </div>

      {/* ═══ Skin ═══ */}
      <div class="mb-28">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center glass-card">
            <Paintbrush size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 class="text-base font-bold" style={{ color: 'var(--text-white)' }}>Skin</h2>
            <p class="text-xs text-white/30">Pick a theme for the interface</p>
          </div>
        </div>
        <RadioGroup
          value={skin()}
          options={SKINS.map(s => ({
            id: s.id,
            label: s.name,
            description: s.id === 'dark' ? 'Default dark theme' : s.id === 'oled' ? 'True black for OLED screens' : '',
            preview: (
              <div class="flex gap-1.5">
                <div class="w-5 h-5 rounded" style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.1)' }} />
                <div class="w-5 h-5 rounded" style={{ background: s.surface, border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            ),
          }))}
          onChange={(id) => { setSkinState(id); applySkin(id); }}
        />
      </div>

      {/* ═══ Streaming Source ═══ */}
      <div class="mb-28">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center glass-card">
            <Globe size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 class="text-base font-bold" style={{ color: 'var(--text-white)' }}>Streaming Source</h2>
            <p class="text-xs text-white/30">Choose which source to use first</p>
          </div>
        </div>
        <RadioGroup
          value={source()}
          options={SOURCES.map(s => ({
            id: s.id,
            label: s.name,
            description: s.id === 'vidcore' ? 'Default — fast and reliable' : 'Alternative source',
          }))}
          onChange={(id) => { setSourceState(id); setActiveSource(id); }}
        />
      </div>

      {/* ═══ Player ═══ */}
      <div class="mb-28">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center glass-card">
            <MonitorPlay size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 class="text-base font-bold" style={{ color: 'var(--text-white)' }}>Player</h2>
            <p class="text-xs text-white/30">Playback preferences</p>
          </div>
        </div>
        <div class="glass-card p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold" style={{ color: 'var(--text-white)' }}>Autoplay next episode</p>
            <p class="text-xs text-white/35 mt-1">Play the next episode automatically</p>
          </div>
          <Toggle value={autoplay()} onChange={(v) => { setAutoplayState(v); setAutoplayNext(v); }} />
        </div>
      </div>

      {/* ═══ Data ═══ */}
      <div class="mb-28">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center glass-card">
            <Trash2 size={16} class="text-red-400" />
          </div>
          <div>
            <h2 class="text-base font-bold" style={{ color: 'var(--text-white)' }}>Data</h2>
            <p class="text-xs text-white/30">Manage your local data</p>
          </div>
        </div>
        <div class="glass-card p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold" style={{ color: 'var(--text-white)' }}>Clear Continue Watching</p>
            <p class="text-xs text-white/35 mt-1">Remove all continue watching entries</p>
          </div>
          <button
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 shrink-0"
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

      {/* ═══ About ═══ */}
      <div class="mb-28">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center glass-card">
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 class="text-base font-bold" style={{ color: 'var(--text-white)' }}>About</h2>
            <p class="text-xs text-white/30">App information</p>
          </div>
        </div>
        <div class="glass-card p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-bold" style={{ color: 'var(--text-white)' }}>Tagflix v2.0</p>
            <p class="text-xs text-white/35 mt-1">SolidJS • Built for streaming</p>
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

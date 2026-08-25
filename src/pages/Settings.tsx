import { createSignal, For } from 'solid-js';
import {
  Palette, Paintbrush, Globe, Info, MonitorPlay, Sparkles, Trash2, ExternalLink,
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

/* ═══ Settings Section ═══ */
function Section(props: { icon: any; title: string; desc?: string; children: any }) {
  return (
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <props.icon size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 class="text-base font-bold text-white">{props.title}</h2>
          <Show when={props.desc}>
            <p class="text-xs text-white/30 mt-0.5">{props.desc}</p>
          </Show>
        </div>
      </div>
      {props.children}
    </div>
  );
}

export default function SettingsPage() {
  const [accent, setAccent] = createSignal(getAccentColor());
  const [skin, setSkinState] = createSignal(getSkin());
  const [source, setSourceState] = createSignal(getActiveSource());
  const [autoplay, setAutoplayState] = createSignal(getAutoplayNext());

  return (
    <div class="p-6 md:p-10 pb-24 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div class="mb-10">
        <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white">Settings</h1>
        <p class="text-sm mt-2 text-white/35">Customize your experience</p>
      </div>

      {/* Accent Colour */}
      <Section icon={Palette} title="Accent Colour" desc="Choose a colour that reflects your style">
        <div class="flex gap-4 flex-wrap">
          <For each={ACCENTS}>
            {(a) => (
              <button
                class="w-10 h-10 rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  background: a.id,
                  'box-shadow': accent() === a.id
                    ? `0 0 0 3px var(--bg), 0 0 0 5px ${a.id}, 0 4px 16px ${a.id}50`
                    : '0 2px 8px rgba(0,0,0,0.4)',
                }}
                onClick={() => { setAccent(a.id); applyAccent(a.id); }}
                title={a.name}
              />
            )}
          </For>
        </div>
      </Section>

      {/* Skin */}
      <Section icon={Paintbrush} title="Skin" desc="Pick a theme for the interface">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <For each={SKINS}>
            {(s) => (
              <button
                class="p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: skin() === s.id ? 'var(--accent)' : s.surface,
                  border: skin() === s.id ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  'box-shadow': skin() === s.id ? '0 4px 16px var(--accent-glow)' : '0 2px 8px rgba(0,0,0,0.2)',
                }}
                onClick={() => { setSkinState(s.id); applySkin(s.id); }}
              >
                <div class="flex gap-2 mb-3">
                  <div class="w-5 h-5 rounded-md" style={{ background: s.bg }} />
                  <div class="w-5 h-5 rounded-md" style={{ background: s.surface }} />
                  <div class="w-4 h-5 rounded-md" style={{ background: skin() === s.id ? 'rgba(255,255,255,0.3)' : 'var(--accent)' }} />
                </div>
                <span class="text-sm font-bold" style={{ color: skin() === s.id ? 'white' : 'var(--text)' }}>
                  {s.name}
                </span>
              </button>
            )}
          </For>
        </div>
      </Section>

      {/* Streaming Source */}
      <Section icon={Globe} title="Streaming Source" desc="Choose which source to use first">
        <div class="flex gap-2 flex-wrap">
          <For each={SOURCES}>
            {(s) => (
              <button
                class="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: source() === s.id ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                  color: source() === s.id ? 'white' : 'var(--text)',
                  border: source() === s.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  'box-shadow': source() === s.id ? '0 2px 12px var(--accent-glow)' : 'none',
                }}
                onClick={() => { setSourceState(s.id); setActiveSource(s.id); }}
              >
                {s.name}
              </button>
            )}
          </For>
        </div>
      </Section>

      {/* Player */}
      <Section icon={MonitorPlay} title="Player">
        <div class="glass-card p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-white">Autoplay next episode</p>
            <p class="text-xs text-white/35 mt-1">Play the next episode automatically</p>
          </div>
          <button
            class="w-12 h-7 rounded-full transition-all duration-200 relative shrink-0"
            style={{
              background: autoplay() ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
              'box-shadow': autoplay() ? '0 2px 12px var(--accent-glow)' : 'none',
            }}
            onClick={() => { const v = !autoplay(); setAutoplayState(v); setAutoplayNext(v); }}
          >
            <div
              class="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-200 shadow-md"
              style={{ left: autoplay() ? '26px' : '4px' }}
            />
          </button>
        </div>
      </Section>

      {/* Data */}
      <Section icon={Trash2} title="Data">
        <div class="glass-card p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-white">Clear Continue Watching</p>
            <p class="text-xs text-white/35 mt-1">Remove all continue watching entries</p>
          </div>
          <button
            class="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 shrink-0"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}
            onClick={() => { clearAllContinueWatching(); }}
          >
            Clear
          </button>
        </div>
      </Section>

      {/* About */}
      <Section icon={Sparkles} title="About">
        <div class="glass-card p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-bold text-white">Tagflix v2.0</p>
            <p class="text-xs text-white/35 mt-1">SolidJS • Built for streaming</p>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass shrink-0">
            <Sparkles size={12} style={{ color: 'var(--accent)' }} />
            <span class="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>OPEN SOURCE</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

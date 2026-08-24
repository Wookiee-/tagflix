import { createSignal, For } from 'solid-js';
import {
  Palette, Paintbrush, Globe, Play, Info, MonitorPlay,
  Sparkles, ExternalLink,
} from 'lucide-solid';
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
}

function applySkin(skinId: string) {
  setSkin(skinId);
  const s = SKIN_MAP[skinId] || SKIN_MAP.dark;
  const r = document.documentElement;
  r.style.setProperty('--bg', s.bg);
  r.style.setProperty('--surface', s.surface);
  r.style.setProperty('--text', s.text);
}

/* ═══ Section Card ═══ */
function SettingsCard(props: { icon: any; title: string; children: any }) {
  const Icon = props.icon;
  return (
    <div class="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)' }}>
      <div class="flex items-center gap-2.5 mb-4">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', opacity: 0.9 }}>
          <Icon size={16} style={{ color: 'white' }} />
        </div>
        <h2 class="text-sm font-bold" style={{ color: 'white' }}>{props.title}</h2>
      </div>
      {props.children}
    </div>
  );
}

/* ═══ Toggle Switch ═══ */
function Toggle(props: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      class="w-12 h-7 rounded-full transition-colors relative shrink-0"
      style={{ background: props.checked ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}
      onClick={() => props.onChange(!props.checked)}
    >
      <div
        class="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform shadow-sm"
        style={{ left: props.checked ? '26px' : '4px' }}
      />
    </button>
  );
}

/* ═══ Settings Page ═══ */
export default function SettingsPage() {
  const [accent, setAccent] = createSignal(getAccentColor());
  const [skin, setSkinState] = createSignal(getSkin());
  const [source, setSourceState] = createSignal(getActiveSource());
  const [autoplay, setAutoplayState] = createSignal(getAutoplayNext());

  return (
    <div class="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div class="mb-8">
        <h1 class="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'white' }}>Settings</h1>
        <p class="text-sm mt-1" style={{ color: 'var(--text)' }}>Customize your Tagflix experience</p>
      </div>

      {/* ═══ Accent Color ═══ */}
      <SettingsCard icon={Palette} title="Accent Color">
        <p class="text-xs mb-4 opacity-50">Choose a colour that reflects your style</p>
        <div class="flex gap-3 flex-wrap">
          <For each={ACCENTS}>
            {(a) => (
              <button
                class="w-11 h-11 rounded-full transition-all hover:scale-110 relative"
                style={{
                  background: a.id,
                  'box-shadow': accent() === a.id
                    ? `0 0 0 3px var(--bg), 0 0 0 5px ${a.id}`
                    : '0 2px 8px rgba(0,0,0,0.3)',
                }}
                onClick={() => { setAccent(a.id); applyAccent(a.id); }}
                title={a.name}
              />
            )}
          </For>
        </div>
      </SettingsCard>

      {/* ═══ Skin ═══ */}
      <SettingsCard icon={Paintbrush} title="Skin">
        <p class="text-xs mb-4 opacity-50">Pick a theme for the interface</p>
        <div class="grid grid-cols-2 gap-3">
          <For each={SKINS}>
            {(s) => (
              <button
                class="p-4 rounded-xl text-left transition-all relative overflow-hidden group"
                style={{
                  background: skin() === s.id ? 'var(--accent)' : s.surface,
                  border: skin() === s.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={() => { setSkinState(s.id); applySkin(s.id); }}
              >
                {/* Mini preview */}
                <div class="flex gap-1.5 mb-2">
                  <div class="w-5 h-5 rounded" style={{ background: s.bg }} />
                  <div class="w-5 h-5 rounded" style={{ background: s.surface }} />
                  <div class="w-3 h-5 rounded" style={{ background: skin() === s.id ? 'rgba(255,255,255,0.3)' : 'var(--accent)' }} />
                </div>
                <span class="text-xs font-bold" style={{ color: skin() === s.id ? 'white' : 'var(--text)' }}>
                  {s.name}
                </span>
              </button>
            )}
          </For>
        </div>
      </SettingsCard>

      {/* ═══ Default Source ═══ */}
      <SettingsCard icon={Globe} title="Streaming Source">
        <p class="text-xs mb-4 opacity-50">Choose which source to use first</p>
        <div class="flex gap-2 flex-wrap">
          <For each={SOURCES}>
            {(s) => (
              <button
                class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: source() === s.id ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                  color: source() === s.id ? 'white' : 'var(--text)',
                  border: source() === s.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={() => { setSourceState(s.id); setActiveSource(s.id); }}
              >
                {s.name}
              </button>
            )}
          </For>
        </div>
      </SettingsCard>

      {/* ═══ Player ═══ */}
      <SettingsCard icon={MonitorPlay} title="Player">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold" style={{ color: 'white' }}>Autoplay next episode</p>
            <p class="text-xs opacity-40 mt-0.5">Automatically play the next episode when current one ends</p>
          </div>
          <Toggle
            checked={autoplay()}
            onChange={(v) => { setAutoplayState(v); setAutoplayNext(v); }}
          />
        </div>
      </SettingsCard>

      {/* ═══ About ═══ */}
      <SettingsCard icon={Info} title="About">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-bold" style={{ color: 'white' }}>Tagflix v2.0</p>
            <p class="text-xs opacity-40 mt-0.5">SolidJS + Electron + Capacitor</p>
          </div>
          <div class="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Sparkles size={12} style={{ color: 'var(--accent)' }} />
            <span class="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>OPEN SOURCE</span>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

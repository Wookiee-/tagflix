import { createSignal, createResource, Show, For } from 'solid-js';
import { Search as SearchIcon, TrendingUp } from 'lucide-solid';
import { searchMulti, getTrending, type TMDBMedia } from '../lib/tmdb';
import MediaCard from '../components/MediaCard';

export default function SearchPage() {
  const [query, setQuery] = createSignal('');
  const [debouncedQuery, setDebouncedQuery] = createSignal('');

  let timer: ReturnType<typeof setTimeout>;
  const handleInput = (value: string) => {
    setQuery(value);
    clearTimeout(timer);
    timer = setTimeout(() => setDebouncedQuery(value), 400);
  };

  const [results] = createResource(debouncedQuery, async (q) => {
    if (!q.trim()) return [] as TMDBMedia[];
    return searchMulti(q);
  });

  const [trending] = createResource(() => getTrending());

  return (
    <div class="p-4 md:p-8 pb-20">
      {/* Search input */}
      <div class="mb-8">
        <div class="relative max-w-xl">
          <SearchIcon size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search movies and TV shows..."
            class="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all glass-card focus:ring-2"
            style={{
              color: 'var(--text-white)',
              'ring-color': 'var(--accent)',
            }}
            value={query()}
            onInput={(e) => handleInput(e.currentTarget.value)}
          />
        </div>
      </div>

      {/* Results */}
      <Show when={debouncedQuery().trim()}>
        <Show when={!results.loading} fallback={
          <div class="flex items-center justify-center py-20">
            <div class="w-10 h-10 rounded-full border-2 animate-spin" style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }} />
          </div>
        }>
          <Show when={results()!.length > 0} fallback={
            <div class="text-center py-20">
              <p class="text-lg font-bold" style={{ color: 'var(--text-white)' }}>No results found</p>
              <p class="text-sm mt-1 text-white/40">Try a different search term</p>
            </div>
          }>
            <p class="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">
              {results()!.length} result{results()!.length !== 1 ? 's' : ''}
            </p>
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              <For each={results()}>
                {(item) => <MediaCard item={item} size="md" />}
              </For>
            </div>
          </Show>
        </Show>
      </Show>

      {/* Empty state: trending suggestions */}
      <Show when={!debouncedQuery().trim()}>
        <div class="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
          <p class="text-xs font-bold uppercase tracking-widest text-white/30">Trending Now</p>
        </div>
        <Show when={trending()} fallback={
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            <For each={[1, 2, 3, 4, 5, 6]}>
              {() => (
                <div class="shrink-0">
                  <div class="w-full aspect-[2/3] rounded-xl skeleton" />
                  <div class="h-3 rounded-lg mt-2 skeleton w-3/4" />
                </div>
              )}
            </For>
          </div>
        }>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            <For each={trending()!.slice(0, 12)}>
              {(item) => <MediaCard item={item} size="md" />}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}

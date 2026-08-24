import { createSignal, createResource, Show, For } from 'solid-js';
import { searchMulti, type TMDBMedia } from '../lib/tmdb';
import MediaCard from '../components/MediaCard';

export default function SearchPage() {
  const [query, setQuery] = createSignal('');
  const [debouncedQuery, setDebouncedQuery] = createSignal('');

  // Debounce input
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

  return (
    <div class="p-4 md:p-8">
      {/* Search input */}
      <div class="mb-6">
        <input
          type="text"
          placeholder="Search movies and TV shows..."
          class="w-full max-w-lg px-4 py-3 rounded-lg text-sm font-medium outline-none transition-all focus:ring-2"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-white)',
            'ring-color': 'var(--accent)',
          }}
          value={query()}
          onInput={(e) => handleInput(e.currentTarget.value)}
        />
      </div>

      {/* Results */}
      <Show when={debouncedQuery().trim()}>
        <Show when={!results.loading} fallback={
          <div class="flex items-center justify-center py-20">
            <div class="w-10 h-10 rounded-full border-2 animate-spin" style={{ 'border-color': 'var(--border)', 'border-top-color': 'var(--accent)' }} />
          </div>
        }>
          <Show when={results()!.length > 0} fallback={
            <div class="text-center py-20 opacity-50">
              <p class="text-lg font-bold" style={{ color: 'var(--text-white)' }}>No results</p>
              <p class="text-sm mt-1">Try a different search term</p>
            </div>
          }>
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              <For each={results()}>
                {(item) => <MediaCard item={item} size="md" />}
              </For>
            </div>
          </Show>
        </Show>
      </Show>

      {/* Empty state */}
      <Show when={!debouncedQuery().trim()}>
        <div class="text-center py-20 opacity-50">
          <p class="text-lg font-bold" style={{ color: 'var(--text-white)' }}>Search Tagflix</p>
          <p class="text-sm mt-1">Find movies and TV shows to watch</p>
        </div>
      </Show>
    </div>
  );
}

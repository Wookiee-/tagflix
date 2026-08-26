import { For, Show } from 'solid-js';
import { ChevronRight } from 'lucide-solid';
import type { TMDBMedia } from '../lib/tmdb';
import MediaCard from './MediaCard';

interface Props {
  title: string;
  icon?: string;
  items: TMDBMedia[];
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onSeeAll?: () => void;
}

export default function MediaRow(props: Props) {
  return (
    <div class="mb-8 md:mb-10">
      {/* Section header */}
      <div class="flex items-center justify-between px-4 md:px-8 mb-4">
        <h2 class="text-base md:text-lg font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-white)' }}>
          {props.icon && <span>{props.icon}</span>}
          {props.title}
        </h2>
        <Show when={props.onSeeAll}>
          <button
            class="flex items-center gap-1 text-xs md:text-sm font-semibold transition-all hover:gap-2"
            style={{ color: 'var(--accent)' }}
            onClick={props.onSeeAll}
          >
            See All <ChevronRight size={14} />
          </button>
        </Show>
      </div>

      <Show
        when={!props.loading}
        fallback={
          <div class="flex gap-3 md:gap-4 px-4 md:px-8 overflow-hidden">
            <For each={[1, 2, 3, 4, 5, 6, 7]}>
              {() => (
                <div class="shrink-0 w-[150px] md:w-[185px]">
                  <div class="w-full aspect-[2/3] rounded-xl skeleton" />
                  <div class="h-3.5 rounded-lg mt-3 skeleton w-3/4" />
                </div>
              )}
            </For>
          </div>
        }
      >
        <div class="flex gap-3 md:gap-4 px-4 md:px-8 overflow-x-auto pb-3 scroll-smooth" style={{ 'touch-action': 'manipulation' }}>
          <For each={props.items}>
            {(item) => <MediaCard item={item} size={props.size} />}
          </For>
        </div>
      </Show>
    </div>
  );
}

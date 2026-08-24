import { For, Show } from 'solid-js';
import type { TMDBMedia } from '../lib/tmdb';
import MediaCard from './MediaCard';

interface Props {
  title: string;
  items: TMDBMedia[];
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function MediaRow(props: Props) {
  return (
    <div class="mb-6">
      <h2 class="text-lg font-bold px-4 mb-3" style={{ color: 'var(--text-white)' }}>
        {props.title}
      </h2>
      <Show
        when={!props.loading}
        fallback={
          <div class="flex gap-3 px-4 overflow-hidden">
            <For each={[1, 2, 3, 4, 5, 6]}>
              {() => (
                <div class="shrink-0 w-[175px] aspect-[2/3] rounded-lg animate-pulse" style={{ background: 'var(--surface)' }} />
              )}
            </For>
          </div>
        }
      >
        <div class="flex gap-3 px-4 overflow-x-auto pb-2 scroll-smooth">
          <For each={props.items}>
            {(item) => <MediaCard item={item} size={props.size} />}
          </For>
        </div>
      </Show>
    </div>
  );
}

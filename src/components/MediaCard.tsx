import { Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { TMDBMedia } from '../lib/tmdb';
import { imageUrl, mediaTitle, mediaYear, mediaType } from '../lib/tmdb';

interface Props {
  item: TMDBMedia;
  size?: 'sm' | 'md' | 'lg';
}

const WIDTHS = { sm: 'w-[130px]', md: 'w-[175px]', lg: 'w-[220px]' };

export default function MediaCard(props: Props) {
  const navigate = useNavigate();
  const size = () => props.size || 'md';

  const handleClick = () => {
    const type = mediaType(props.item);
    navigate(`/${type}/${props.item.id}`);
  };

  // Use smaller images for cards (faster loading)
  const imgSize = () => size() === 'lg' ? 'w342' : 'w185';

  return (
    <button
      class="relative shrink-0 group cursor-pointer overflow-hidden rounded-lg transition-transform duration-200 hover:scale-105 hover:z-10"
      classList={{ [WIDTHS[size()]]: true }}
      onClick={handleClick}
    >
      <div class="relative w-full aspect-[2/3] bg-[var(--surface)] overflow-hidden rounded-lg">
        <Show when={props.item.poster_path} fallback={
          <div class="w-full h-full flex items-center justify-center text-xs font-semibold px-2 text-center leading-tight" style={{ color: 'var(--text)' }}>
            {mediaTitle(props.item)}
          </div>
        }>
          <img
            src={imageUrl(props.item.poster_path, imgSize())}
            alt={mediaTitle(props.item)}
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </Show>

        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
          <p class="text-white text-xs font-bold line-clamp-2 leading-tight">{mediaTitle(props.item)}</p>
          <p class="text-white/60 text-[10px] mt-1">{mediaYear(props.item)}</p>
          <Show when={props.item.vote_average > 0}>
            <div class="flex items-center gap-1 mt-1">
              <span class="text-yellow-400 text-[10px]">★</span>
              <span class="text-white/80 text-[10px]">{props.item.vote_average.toFixed(1)}</span>
            </div>
          </Show>
        </div>
      </div>
    </button>
  );
}

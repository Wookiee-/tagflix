import { Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Play, Star } from 'lucide-solid';
import type { TMDBMedia } from '../lib/tmdb';
import { imageUrl, mediaTitle, mediaYear, mediaType, matchPercent } from '../lib/tmdb';

interface Props {
  item: TMDBMedia;
  size?: 'sm' | 'md' | 'lg';
}

const WIDTHS = { sm: 'w-[130px] md:w-[150px]', md: 'w-[150px] md:w-[185px]', lg: 'w-[180px] md:w-[220px]' };

export default function MediaCard(props: Props) {
  const navigate = useNavigate();
  const size = () => props.size || 'md';

  const handleClick = () => {
    const type = mediaType(props.item);
    navigate(`/${type}/${props.item.id}`);
  };

  const imgSize = () => size() === 'lg' ? 'w342' : 'w185';

  return (
    <button
      class="shrink-0 group cursor-pointer tv-focusable"
      classList={{ [WIDTHS[size()]]: true }}
      onClick={handleClick}
      tabIndex="0"
    >
      <div class="relative w-full aspect-[2/3] rounded-xl overflow-hidden transition-all duration-300 group-hover:ring-2 group-hover:ring-white/20 group-hover:shadow-2xl group-hover:scale-[1.04]"
        style={{ 'box-shadow': '0 8px 30px rgba(0,0,0,0.4)' }}>
        <Show when={props.item.poster_path} fallback={
          <div class="w-full h-full flex items-center justify-center text-xs font-bold px-3 text-center leading-tight"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            {mediaTitle(props.item)}
          </div>
        }>
          <img
            src={imageUrl(props.item.poster_path, imgSize())}
            alt={mediaTitle(props.item)}
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </Show>

        {/* Hover overlay */}
        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3 md:p-4">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
              <Play size={14} fill="black" class="ml-0.5" style={{ color: 'black' }} />
            </div>
            <span class="text-white text-xs md:text-sm font-bold">Watch</span>
          </div>
        </div>

        {/* Match badge */}
        <Show when={props.item.vote_average > 0}>
          <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded-md glass-strong flex items-center gap-0.5">
            <Star size={9} fill="#22c55e" style={{ color: '#22c55e' }} />
            <span class="text-[10px] md:text-[11px] font-bold text-white">{matchPercent(props.item.vote_average)}%</span>
          </div>
        </Show>
      </div>

      <p class="text-xs md:text-sm font-semibold truncate mt-2 transition-colors group-hover:text-white px-0.5" style={{ color: 'var(--text)' }}>
        {mediaTitle(props.item)}
      </p>
      <p class="text-[10px] md:text-xs text-white/30 mt-0.5 font-medium px-0.5">{mediaYear(props.item)}</p>
    </button>
  );
}

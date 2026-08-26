/**
 * Spatial D-Pad Navigation for Android TV / Firestick remotes.
 *
 * Captures ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter, and RemoteControl
 * key events and moves focus between `.tv-focusable` elements.
 *
 * Usage: call `useSpatialNav()` once at the app root onMount.
 */
import { onMount, onCleanup } from 'solid-js';

/** Distance (px) between two element centres used to pick the "next" target. */
function dist(a: DOMRect, b: DOMRect) {
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  const bx = b.left + b.width / 2;
  const by = b.top + b.height / 2;
  return Math.hypot(ax - bx, ay - by);
}

/** Score how well `candidate` lies in `dir` from `current`. Higher = better. */
function score(
  current: DOMRect,
  candidate: DOMRect,
  dir: 'left' | 'right' | 'up' | 'down',
) {
  const cx = current.left + current.width / 2;
  const cy = current.top + current.height / 2;
  const px = candidate.left + candidate.width / 2;
  const py = candidate.top + candidate.height / 2;

  const dx = px - cx;
  const dy = py - cy;

  switch (dir) {
    case 'left':  return dx < -10 ? -dx : -Infinity;
    case 'right': return dx > 10 ? dx : -Infinity;
    case 'up':    return dy < -10 ? -dy : -Infinity;
    case 'down':  return dy > 10 ? dy : -Infinity;
  }
}

function getFocusables(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.tv-focusable'))
    .filter((el) => {
      if (el.offsetParent === null) return false;          // hidden
      const style = getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

function pickBest(
  current: DOMRect,
  candidates: DOMRect[],
  dir: 'left' | 'right' | 'up' | 'down',
): number {
  let bestIdx = -1;
  let bestScore = -Infinity;
  let bestDist = Infinity;

  candidates.forEach((c, i) => {
    const s = score(current, c, dir);
    if (s > 0) {
      const d = dist(current, c);
      // Always prefer the CLOSEST element in the direction
      // Lower distance wins, regardless of score magnitude
      if (d < bestDist || (d === bestDist && s > bestScore)) {
        bestScore = s;
        bestDist = d;
        bestIdx = i;
      }
    }
  });
  return bestIdx;
}

export function useSpatialNav() {
  let raf = 0;

  function handler(e: KeyboardEvent) {
    const key = e.key;

    // Only intercept D-pad / navigation keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Select', 'Play', 'Pause', 'Backspace', 'Escape'].includes(key)) {
      return;
    }

    const focusables = getFocusables();
    if (focusables.length === 0) return;

    const active = document.activeElement as HTMLElement | null;
    const currentIdx = active ? focusables.indexOf(active) : -1;

    // Enter / Select — click the focused element
    if (key === 'Enter' || key === 'Select' || key === 'Play' || key === 'Pause') {
      e.preventDefault();
      active?.click();
      return;
    }

    // Escape / Back — go back
    if (key === 'Escape' || key === 'Backspace') {
      e.preventDefault();
      window.history.back();
      return;
    }

    // D-pad directions
    let dir: 'left' | 'right' | 'up' | 'down';
    switch (key) {
      case 'ArrowLeft':  dir = 'left'; break;
      case 'ArrowRight': dir = 'right'; break;
      case 'ArrowUp':    dir = 'up'; break;
      case 'ArrowDown':  dir = 'down'; break;
      default: return;
    }

    e.preventDefault();

    // If nothing focused yet, focus the first element
    if (currentIdx === -1) {
      focusables[0]?.focus();
      return;
    }

    const currentRect = focusables[currentIdx].getBoundingClientRect();
    const candidates = focusables.map((el) => el.getBoundingClientRect());
    const bestIdx = pickBest(currentRect, candidates, dir);

    if (bestIdx !== -1) {
      // Use requestAnimationFrame so layout is settled
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        focusables[bestIdx].focus();
        // Scroll into view if needed (for horizontal carousels)
        focusables[bestIdx].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      });
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handler, { capture: true });
  });

  onCleanup(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', handler, { capture: true });
  });
}

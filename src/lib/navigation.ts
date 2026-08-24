// ═══ D-Pad Navigation ═══
// Handles Arrow keys, Enter, Escape, and media keys for TV remotes.
// Works with tabindex-based focus management.

export function setupDPadNavigation() {
  if (typeof window === 'undefined') return;

  document.addEventListener('keydown', (e) => {
    // Only activate in TV mode
    if (!document.documentElement.classList.contains('tv-mode')) return;

    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, a, [tabindex], input, [role="button"], [role="tab"]'
      )
    ).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0; // visible only
    });

    if (focusable.length === 0) return;

    const current = document.activeElement as HTMLElement;
    const currentIdx = focusable.indexOf(current);

    // Get the position of the currently focused element
    const getRect = (el: HTMLElement) => el.getBoundingClientRect();

    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        // Find next element to the right
        const currentRect = current.getBoundingClientRect();
        const candidates = focusable
          .map((el, i) => ({ el, idx: i, rect: getRect(el) }))
          .filter(c => c.rect.left >= currentRect.right - 10 && c.idx !== currentIdx)
          .sort((a, b) => a.rect.left - b.rect.left || Math.abs(a.rect.top - currentRect.top) - Math.abs(b.rect.top - currentRect.top));
        if (candidates.length > 0) candidates[0].el.focus();
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const currentRect = current.getBoundingClientRect();
        const candidates = focusable
          .map((el, i) => ({ el, idx: i, rect: getRect(el) }))
          .filter(c => c.rect.right <= currentRect.left + 10 && c.idx !== currentIdx)
          .sort((a, b) => b.rect.right - a.rect.right || Math.abs(a.rect.top - currentRect.top) - Math.abs(b.rect.top - currentRect.top));
        if (candidates.length > 0) candidates[0].el.focus();
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        const currentRect = current.getBoundingClientRect();
        const candidates = focusable
          .map((el, i) => ({ el, idx: i, rect: getRect(el) }))
          .filter(c => c.rect.top >= currentRect.bottom - 10 && c.idx !== currentIdx)
          .sort((a, b) => a.rect.top - b.rect.top || Math.abs(a.rect.left - currentRect.left) - Math.abs(b.rect.left - currentRect.left));
        if (candidates.length > 0) candidates[0].el.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const currentRect = current.getBoundingClientRect();
        const candidates = focusable
          .map((el, i) => ({ el, idx: i, rect: getRect(el) }))
          .filter(c => c.rect.bottom <= currentRect.top + 10 && c.idx !== currentIdx)
          .sort((a, b) => b.rect.bottom - a.rect.bottom || Math.abs(a.rect.left - currentRect.left) - Math.abs(b.rect.left - currentRect.left));
        if (candidates.length > 0) candidates[0].el.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        // Let the focused element handle it
        break;
      }
      case 'Escape':
      case 'Backspace': {
        // Go back
        window.history.back();
        break;
      }
      // Media keys for Firestick remotes
      case 'MediaPlayPause': {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) video.paused ? video.play() : video.pause();
        break;
      }
      case 'MediaFastForward': {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10);
        break;
      }
      case 'MediaRewind': {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) video.currentTime = Math.max(0, video.currentTime - 10);
        break;
      }
    }
  });
}

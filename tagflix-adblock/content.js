// Content script injected into ALL frames including cross-origin iframes
// Overrides window.open inside the iframe's own context
(function () {
  // Override window.open in THIS frame's context
  window.open = function () {
    return null;
  };

  // Also block any link with target=_blank
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (link && link.target === '_blank') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Block mousedown/mouseup that might trigger popups
  document.addEventListener('mousedown', function (e) {
    // Block right-click context menus (sometimes used for popups)
  }, true);
})();

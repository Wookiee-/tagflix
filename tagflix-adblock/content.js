// Injected into ALL frames at document_start — runs before VidCore's scripts
// This overrides window.open INSIDE the iframe's own JS context
(function () {
  // 1. Override window.open — return null so scripts don't crash
  Object.defineProperty(window, 'open', {
    value: function () { return null; },
    writable: false,
    configurable: false,
  });

  // 2. Block clicks on links that open new tabs
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (link && (link.target === '_blank' || link.getAttribute('rel') === 'noopener')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }, true);

  // 3. Override createElement to catch dynamically created links
  var origCreate = document.createElement.bind(document);
  document.createElement = function (tag) {
    var el = origCreate(tag);
    if (tag.toLowerCase() === 'a') {
      var origClick = el.click;
      el.click = function () {
        if (el.target === '_blank') return;
        origClick.call(el);
      };
    }
    return el;
  };
})();

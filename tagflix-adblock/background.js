const AD_DOMAINS = [
  'airlessbacach',
  'propellerads',
  'exoclick',
  'popcash',
  'popads',
  'clickadu',
  'hilltopads',
  'adskeeper',
  'monu.delivery',
  'ad-maven',
  'pico.cedra',
  'adf.ly',
  'shorte.st',
  'juicyads',
  'trafficjunky',
  'onclickmax',
];

// Block network requests to ad domains
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    var url = details.url.toLowerCase();
    for (var i = 0; i < AD_DOMAINS.length; i++) {
      if (url.indexOf(AD_DOMAINS[i]) !== -1) {
        return { cancel: true };
      }
    }
    return { cancel: false };
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

// Close any new popup tabs/windows immediately
chrome.tabs.onCreated.addListener(function (tab) {
  // Check if the tab URL is an ad domain
  if (tab.url) {
    var url = tab.url.toLowerCase();
    for (var i = 0; i < AD_DOMAINS.length; i++) {
      if (url.indexOf(AD_DOMAINS[i]) !== -1) {
        chrome.tabs.remove(tab.id);
        return;
      }
    }
  }
  // Also close blank/new tabs that opened from an embed (openerTabId set = popup)
  if (tab.openerTabId) {
    // This tab was opened by another tab (popup) — close it
    chrome.tabs.remove(tab.id);
  }
});

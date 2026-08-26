// Block ad domain requests
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    var url = details.url.toLowerCase();
    var adPatterns = [
      'airlessbacach', 'propellerads', 'exoclick', 'popcash', 'popads',
      'clickadu', 'hilltopads', 'adskeeper', 'monu.delivery', 'ad-maven',
      'pico.cedra', 'adf.ly', 'shorte.st', 'juicyads', 'trafficjunky',
      'onclickmax', 'onclickads', 'bidvertiser', 'adsterra', 'mgid',
    ];
    for (var i = 0; i < adPatterns.length; i++) {
      if (url.indexOf(adPatterns[i]) !== -1) {
        return { cancel: true };
      }
    }
    return { cancel: false };
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

// Close any new tab that's NOT our main Tagflix tab
chrome.tabs.onCreated.addListener(function (tab) {
  // Wait a tiny bit for the tab to get a URL
  setTimeout(function () {
    chrome.tabs.get(tab.id, function (updatedTab) {
      if (chrome.runtime.lastError) return;
      // Close blank tabs or tabs with ad URLs
      var url = (updatedTab.url || '').toLowerCase();
      if (!url || url === 'about:blank' || url.startsWith('chrome://')) return;
      
      var adPatterns = [
        'airlessbacach', 'propellerads', 'exoclick', 'popcash', 'popads',
        'clickadu', 'hilltopads', 'adskeeper', 'monu.delivery', 'ad-maven',
        'pico.cedra', 'adf.ly', 'shorte.st', 'juicyads', 'trafficjunky',
        'onclickmax', 'onclickads', 'bidvertiser', 'adsterra', 'mgid',
      ];
      for (var i = 0; i < adPatterns.length; i++) {
        if (url.indexOf(adPatterns[i]) !== -1) {
          chrome.tabs.remove(updatedTab.id);
          return;
        }
      }
      
      // If this tab has an opener (was opened by another tab) and isn't localhost, close it
      if (updatedTab.openerTabId && url.indexOf('localhost') === -1 && url.indexOf('127.0.0.1') === -1) {
        chrome.tabs.remove(updatedTab.id);
      }
    });
  }, 100);
});

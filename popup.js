const DEFAULTS = {
  hideFbFeed: true,
  hideIgComments: true,
  hideYtComments: true,
  hideTwReplies: true
};

chrome.storage.sync.get(DEFAULTS, (settings) => {
  for (const key of Object.keys(DEFAULTS)) {
    const box = document.getElementById(key);
    box.checked = settings[key] !== false;
    box.addEventListener("change", () => {
      chrome.storage.sync.set({ [key]: box.checked });
    });
  }
});

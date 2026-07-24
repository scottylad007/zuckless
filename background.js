/*
 * Keeps the network-level Facebook redirect rules in sync with the
 * "Facebook Social Feed" toggle. Content-script hiding is gated separately
 * (see gate.js); this only flips the declarativeNetRequest ruleset so that
 * disabling the blocker also restores normal facebook.com navigation.
 */
function syncRedirectRules() {
  chrome.storage.sync.get({ hideFbFeed: true }, ({ hideFbFeed }) => {
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: hideFbFeed ? ["redirect_rules"] : [],
      disableRulesetIds: hideFbFeed ? [] : ["redirect_rules"]
    });
  });
}

chrome.runtime.onInstalled.addListener(syncRedirectRules);
chrome.runtime.onStartup.addListener(syncRedirectRules);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.hideFbFeed) syncRedirectRules();
});

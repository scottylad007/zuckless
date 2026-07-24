/*
 * Shared settings gate, loaded before each site script.
 *
 * Hiding CSS is active by default (so blocked content never flashes on
 * screen). When a blocker is toggled OFF in the popup, the corresponding
 * token is added to <html data-fbr-allow="…">, and every CSS rule — all
 * written as `html:not([data-fbr-allow~="token"]) …` — stops applying
 * instantly. Toggling works live, no page reload needed.
 *
 * The only thing this ever touches on the page is a data attribute on
 * <html>, which page frameworks ignore.
 */
window.__fbrGate = function (storageKey, token, onChange) {
  "use strict";

  const root = document.documentElement;

  function apply(enabled) {
    const tokens = (root.getAttribute("data-fbr-allow") || "")
      .split(/\s+/)
      .filter(Boolean);
    const idx = tokens.indexOf(token);
    if (enabled && idx !== -1) tokens.splice(idx, 1);
    if (!enabled && idx === -1) tokens.push(token);
    if (tokens.length) root.setAttribute("data-fbr-allow", tokens.join(" "));
    else root.removeAttribute("data-fbr-allow");
    if (onChange) onChange(enabled);
  }

  chrome.storage.sync.get({ [storageKey]: true }, (v) => apply(v[storageKey]));

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[storageKey]) {
      apply(changes[storageKey].newValue !== false);
    }
  });
};

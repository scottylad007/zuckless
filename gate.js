/*
 * Shared settings gate, loaded before each site script.
 *
 * Two kinds of blockers:
 *
 * Default-ON (opt-out) blockers hide from the first paint: their CSS rules
 * are written as `html:not([data-fbr-allow~="token"]) ...`, so content is
 * hidden until gate.js reads storage; switching the blocker off adds the
 * token to <html data-fbr-allow> and the rules stop applying instantly.
 *
 * Default-OFF (opt-in) blockers work the other way: their CSS rules are
 * written as `html[data-fbr-deny~="token"] ...`, so nothing is hidden until
 * the user enables the blocker and the token lands in <html data-fbr-deny>.
 *
 * Toggling works live in both directions, no page reload needed. The only
 * thing this ever touches on the page is a data attribute on <html>, which
 * page frameworks ignore.
 */
window.__fbrGate = function (storageKey, token, onChange, opts) {
  "use strict";

  opts = opts || {};
  const optIn = !!opts.optIn;
  const attr = optIn ? "data-fbr-deny" : "data-fbr-allow";
  const root = document.documentElement;

  function apply(enabled) {
    const tokens = (root.getAttribute(attr) || "").split(/\s+/).filter(Boolean);
    const idx = tokens.indexOf(token);
    // opt-out: token present while DISABLED; opt-in: token present while ENABLED
    const wantToken = optIn ? enabled : !enabled;
    if (wantToken && idx === -1) tokens.push(token);
    if (!wantToken && idx !== -1) tokens.splice(idx, 1);
    if (tokens.length) root.setAttribute(attr, tokens.join(" "));
    else root.removeAttribute(attr);
    if (onChange) onChange(enabled);
  }

  chrome.storage.sync.get({ [storageKey]: !optIn }, (v) => apply(!!v[storageKey]));

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[storageKey]) {
      apply(!!changes[storageKey].newValue);
    }
  });
};

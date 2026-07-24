/*
 * Facebook is a single-page app: clicking the logo or "Home" navigates
 * client-side with no network request, so the declarativeNetRequest redirect
 * in rules.json never fires for those. This script watches for in-page
 * navigations to feed surfaces and sends the user to Marketplace instead.
 *
 * It is intentionally passive: it never touches Facebook's DOM, network
 * requests, or history internals. It only reads location and, when a blocked
 * path is hit, performs a normal top-level navigation.
 */
(() => {
  "use strict";

  const MARKETPLACE_URL = "https://www.facebook.com/marketplace/";

  // Feed-consumption surfaces. Everything else (marketplace, messages,
  // groups admin, settings, profiles, etc.) is left alone; the CSS handles
  // any feed units embedded in those pages.
  const BLOCKED_PATHS = [
    /^\/$/,
    /^\/watch([/?]|$)/,
    /^\/reel([/?]|$)/,
    /^\/reels([/?]|$)/,
    /^\/stories([/?]|$)/
  ];

  let hideEnabled = true; // synced with the "Facebook Social Feed" toggle
  let redirecting = false;

  function enforce() {
    if (!hideEnabled || redirecting) return;
    if (BLOCKED_PATHS.some((re) => re.test(location.pathname))) {
      redirecting = true;
      location.replace(MARKETPLACE_URL);
    }
  }

  // Gate the CSS hiding and keep the redirect flag in sync with settings.
  window.__fbrGate("hideFbFeed", "fb", (enabled) => {
    hideEnabled = enabled;
    enforce();
  });

  // Separate opt-in toggle (OFF by default): hide comments on posts for
  // people who keep the social feed. Most comment UI is caught by pure CSS
  // (facebook.css), but "View more comments" links and comment counts have
  // no stable attributes, so a scanner text-matches and tags them.
  window.__fbrGate("hideFbComments", "fbc", null, { optIn: true });

  const COMMENT_TEXT_RE =
    /^(view|see) ([\d,]+ )?(more |previous |all )?(comments?|repl(y|ies))$|^[\d,.]+[KM]? comments?$/i;

  function scanComments() {
    for (const el of document.querySelectorAll(
      'div[role="button"], span[role="button"], span[dir="auto"]'
    )) {
      if (
        !el.hasAttribute("data-fbr-fbc") &&
        el.childElementCount <= 2 &&
        el.textContent.length < 40 &&
        COMMENT_TEXT_RE.test(el.textContent.trim())
      ) {
        el.setAttribute("data-fbr-fbc", "");
      }
    }
  }

  let pendingScan = null;
  function scheduleCommentScan() {
    if (pendingScan !== null) return;
    pendingScan = setTimeout(() => {
      pendingScan = null;
      scanComments();
    }, 300);
  }

  function startCommentScanner() {
    scanComments();
    new MutationObserver(scheduleCommentScan).observe(
      document.documentElement,
      { childList: true, subtree: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCommentScanner, {
      once: true
    });
  } else {
    startCommentScanner();
  }

  // Preferred: the Navigation API fires for all SPA route changes.
  if (window.navigation && typeof window.navigation.addEventListener === "function") {
    window.navigation.addEventListener("navigatesuccess", enforce);
  }

  // Fallback: lightweight URL poll for browsers/paths the above misses.
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      enforce();
    }
  }, 400);
})();

/*
 * Instagram comment scanner.
 *
 * Instagram's class names are obfuscated and churn constantly, so instead of
 * guessing classes this identifies comment UI structurally and tags it with a
 * data attribute; instagram.css does the actual hiding (and the popup toggle
 * can un-hide everything instantly via the CSS gate; tags are never removed,
 * only the gate changes).
 *
 * Deliberately gentle on the page:
 *   - Read-only DOM queries plus setting one data attribute on matched nodes.
 *     Foreign data attributes are ignored by React, and nothing else is mutated.
 *   - Scans are debounced behind a MutationObserver, so cost stays negligible.
 *   - Media (photos, carousels, videos, stories) is never matched: comment
 *     lists are recognized by containing a profile link + relative timestamp
 *     (<time>) inside list items, which media elements never have.
 */
(() => {
  "use strict";

  window.__fbrGate("hideIgComments", "ig");

  // "View all 12 comments" / "View 1 comment" / "Hide all comments" links in
  // the feed. English-only match; the comment lists themselves are matched
  // structurally, so other locales still get the main hiding.
  const COMMENT_LINK_RE = /^(view all [\d,.]+ comments?|view [\d,.]+ comments?|view 1 comment|hide all comments)$/i;

  // Comment UI only ever lives in these regions (feed cards, post pages,
  // post/reel modals). Nothing outside them is ever touched.
  const REGIONS = 'article, main, div[role="dialog"]';

  function tag(el) {
    if (el && !el.hasAttribute("data-fbr-hide")) {
      el.setAttribute("data-fbr-hide", "");
    }
  }

  // A ul is a comment/caption list if a list item inside it carries both a
  // relative timestamp and a profile link, true for every comment thread and
  // never true for image carousels (ul/li without time) or nav lists.
  function isCommentList(ul) {
    for (const li of ul.querySelectorAll(":scope li")) {
      if (li.querySelector("time") && li.querySelector('a[href^="/"]')) {
        return true;
      }
    }
    return false;
  }

  function scan() {
    for (const region of document.querySelectorAll(REGIONS)) {
      // 1. Comment threads / caption-and-comment lists
      for (const ul of region.querySelectorAll("ul:not([data-fbr-hide])")) {
        if (isCommentList(ul)) tag(ul);
      }

      // 2. "View all N comments" links
      for (const el of region.querySelectorAll(
        'a, span[role="button"], div[role="button"]'
      )) {
        if (
          !el.hasAttribute("data-fbr-hide") &&
          el.childElementCount <= 1 &&
          COMMENT_LINK_RE.test(el.textContent.trim())
        ) {
          tag(el);
        }
      }

      // 3. Comment (speech-bubble) buttons under posts and on the reels rail;
      // they only open the comment UI we're hiding, so hide them too.
      for (const svg of region.querySelectorAll('svg[aria-label="Comment"]')) {
        const btn = svg.closest('[role="button"], button');
        if (btn) tag(btn);
      }
    }
  }

  // Debounced rescan on DOM changes (Instagram is a SPA; content streams in).
  let pending = null;
  function scheduleScan() {
    if (pending !== null) return;
    pending = setTimeout(() => {
      pending = null;
      scan();
    }, 250);
  }

  function start() {
    scan();
    new MutationObserver(scheduleScan).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

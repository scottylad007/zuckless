/*
 * Twitter/X reply scanner.
 *
 * On tweet detail pages (/<user>/status/<id>) this hides everything below the
 * focal tweet: replies, the reply composer, and "Discover more" filler. The
 * focal tweet itself (including any quote tweet, photos, or video inside
 * it) is never touched, and ancestor tweets, the thread above a reply, stay
 * visible for context. Timelines, search, profiles, etc. are left alone.
 *
 * Like the Instagram scanner, this only reads the DOM and toggles one data
 * attribute on matched nodes; twitter.css does the hiding, so the popup
 * toggle can reveal everything instantly.
 *
 * Structure notes (verified against the live site):
 *  - Logged in, tweets sit in virtualized div[data-testid="cellInnerDiv"]
 *    cells positioned with translateY. Visual order, not DOM order, so
 *    cells are compared by translateY when available.
 *  - Logged out, there are no testids; replies are plain <article>s after
 *    the focal one in natural flow, so document order is used as fallback.
 *  - The focal article is found by its self-referencing /status/<id> link,
 *    with the logged-in tabindex="-1" marker and first-article as fallbacks.
 *  - Quote tweets are divs inside the focal article, never separate
 *    <article> elements, so they survive automatically.
 */
(() => {
  "use strict";

  window.__fbrGate("hideTwReplies", "tw");

  const STATUS_RE = /^\/[^/]+\/status\/(\d+)/;

  function setHidden(el, hide) {
    if (hide) {
      if (!el.hasAttribute("data-fbr-hide")) el.setAttribute("data-fbr-hide", "");
    } else if (el.hasAttribute("data-fbr-hide")) {
      el.removeAttribute("data-fbr-hide");
    }
  }

  function untagAll() {
    for (const el of document.querySelectorAll("[data-fbr-hide]")) {
      el.removeAttribute("data-fbr-hide");
    }
  }

  function translateY(el) {
    const m = /translateY\((-?[\d.]+)px\)/.exec(el.style ? el.style.transform : "");
    return m ? parseFloat(m[1]) : null;
  }

  function isAfter(reference, el) {
    return !!(
      reference.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
    );
  }

  function scan() {
    const m = STATUS_RE.exec(location.pathname);
    if (!m) {
      untagAll(); // left the tweet page (SPA nav), restore recycled nodes
      return;
    }
    const focalId = m[1];

    const articles = [...document.querySelectorAll("article")];
    if (!articles.length) return; // still loading

    const focal =
      articles.find((a) =>
        a.querySelector(`a[href*="/status/${focalId}"]`)
      ) ||
      articles.find((a) => a.getAttribute("tabindex") === "-1") ||
      articles[0];

    const cells = [...document.querySelectorAll('div[data-testid="cellInnerDiv"]')];

    if (cells.length) {
      // Logged-in DOM: decide per cell, relative to the focal tweet's cell.
      const focalCell = focal.closest('div[data-testid="cellInnerDiv"]');
      if (!focalCell) return;
      const focalY = translateY(focalCell);

      for (const cell of cells) {
        if (cell === focalCell || cell.contains(focal)) {
          setHidden(cell, false);
          continue;
        }
        let below;
        const y = translateY(cell);
        below =
          focalY !== null && y !== null ? y > focalY : isAfter(focalCell, cell);
        // The inline reply composer belongs to the reply UI wherever it sits.
        if (cell.querySelector('[data-testid^="tweetTextarea"]')) below = true;
        setHidden(cell, below);
      }
    } else {
      // Logged-out DOM: plain flow, replies follow the focal article.
      for (const a of articles) {
        setHidden(a, a !== focal && !focal.contains(a) && isAfter(focal, a));
      }
    }
  }

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
    // childList catches renders/SPA navs; style changes catch the virtualized
    // list repositioning cells during scroll. Our own tagging only touches
    // data-fbr-hide, so it never re-triggers this observer.
    new MutationObserver(scheduleScan).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

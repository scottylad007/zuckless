# Zuckless 🚫

**Use the internet's good parts. Skip the doomscroll.**

Zuckless is a tiny Chrome extension that removes the addictive bits of your
favorite sites while leaving the useful bits alone. Buy that couch on
Marketplace, message your friends, watch your videos, all without getting
pulled into feeds, comment wars, and reply threads.

🌐 **[zuckless.app](https://zuckless.app)**

## What it blocks

| Toggle | What happens |
|---|---|
| 🙈 **Facebook Social Feed** | The feed is gone everywhere, and facebook.com drops you straight into Marketplace instead of the doomscroll. Marketplace and Messages work exactly like normal. |
| 📸 **Instagram Comments** | Comment threads, "View all N comments" links, and the comment box disappear. Photos, carousels, reels, and stories stay. |
| ▶️ **YouTube Comments** | The comment section under videos (and on Shorts) is gone. Just watch the video. |
| 🐦 **Twitter Replies** | Open a post on X and see the post itself, with its quote tweet, photos, and video, not the reply brawl underneath it. |

Every blocker has its own on/off switch in the popup (click the toolbar
icon). Flips apply **instantly** to open tabs, no reload needed. Everything
defaults to blocked; you opt back in when you want.

## Install

**From source (Developer mode):**

1. Clone this repo:
   ```
   git clone https://github.com/scottylad007/zuckless.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and pick the cloned folder.
5. Pin the icon, click it, and choose your blockers.

*(Chrome Web Store listing coming soon. Watch
[zuckless.app](https://zuckless.app) for the launch.)*

## Privacy

Zuckless collects **nothing**. No analytics, no tracking, no network
requests of its own, and no data ever leaves your browser. Your toggle
settings sync through your own Chrome profile (`chrome.storage.sync`) and
that's it. The only permissions it asks for are the ones the features
require: `declarativeNetRequest` plus facebook.com host access (for the
Marketplace redirect) and `storage` (for the toggles).

## How it works

Zuckless is deliberately gentle. It hides things with CSS instead of
ripping pages apart, so the sites keep working exactly as designed:

- **The Facebook redirect** happens at the network layer with
  `declarativeNetRequest` static rules ([rules.json](rules.json)); the
  browser rewrites the request before it's even sent. Facebook is a
  single-page app, so a small script ([facebook.js](facebook.js)) also
  watches the URL (read-only) and steers client-side navigations to
  Marketplace.
- **All hiding is CSS.** Rules are written as
  `html:not([data-fbr-allow~="token"]) selector { display: none !important }`,
  and [gate.js](gate.js) maps your toggles onto tokens in a single
  `data-fbr-allow` attribute on `<html>`. Blocked content is hidden from the
  first paint (no flash), and un-hiding is instant.
- **Facebook** targets stable accessibility hooks (`role="feed"`, ARIA
  labels). **YouTube** uses its semantic elements (`ytd-comments#comments`
  and friends) with pure CSS, no scripting at all.
- **Instagram** has obfuscated, ever-changing class names, so
  [instagram.js](instagram.js) recognizes comment UI structurally: list
  items containing a profile link plus a timestamp, which is always true
  for comments and never for photo carousels. Matches get tagged for the
  CSS to hide.
- **Twitter/X** ([twitter.js](twitter.js)) finds the focal tweet on a
  /status/ page via its self-referencing status link and hides every cell
  below it (replies, the reply box, "Discover more") while the tweet
  itself, its quote tweet, and the thread above it stay put.

The scanners only read the page and set a `data-` attribute on matches.
No DOM removal, no event interception, no network tampering.

## Project layout

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest |
| `rules.json` | Facebook → Marketplace redirect rules |
| `background.js` | Syncs the redirect ruleset with the Facebook toggle |
| `gate.js` | Shared toggle gate (settings → `<html data-fbr-allow>`) |
| `facebook.css` / `facebook.js` | Feed hiding + SPA redirect |
| `instagram.css` / `instagram.js` | Comment hiding (structural scanner) |
| `youtube.css` / `youtube.js` | Comment hiding (pure CSS) |
| `twitter.css` / `twitter.js` | Reply hiding on tweet pages |
| `popup.html` / `popup.css` / `popup.js` | Settings popup |
| `icons/` | Extension icons |

## Good to know

- A few cosmetic selectors match English UI strings (Facebook's "Stories" /
  "Reels" labels, Instagram's "View all N comments"). The core blocking
  (Facebook's `role="feed"`, Instagram's structural matching, all of
  YouTube and Twitter) is language-independent.
- On Instagram post pages the caption is structurally part of the comment
  list, so it hides along with the comments there; feed captions stay.
- Sites reshuffle their markup now and then. If something sneaks through,
  [open an issue](../../issues) and it's usually a one-line selector fix.

## Contributing

Issues and PRs welcome. Keep the philosophy: hide, don't break; read, don't
mutate; and every new blocker gets a toggle.

## License

[MIT](LICENSE)

---

Made with ❤️ and a healthy distaste for provocative algorithms.
[zuckless.app](https://zuckless.app)

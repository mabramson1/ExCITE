# Docs² Browser Extension

Right-click any selected text on any webpage to:
- **Humanize** AI-generated text
- **Check** for AI patterns

Powered by your existing docsquared.app account. No API keys, no setup.

## How auth works

The extension reads your docsquared.app session cookies via the
`chrome.cookies` API and forwards them with each request. As long as
you're signed in at docsquared.app in any browser tab, the extension
authenticates automatically. When your session expires, just sign in
again.

## Install (developer mode)

1. Open Chrome / Edge / Brave and go to `chrome://extensions`
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked**
4. Select this `extension/` folder

If you've installed an older version, click **Remove** first, then
reinstall — the new version requires a `cookies` permission that won't
auto-update.

## Use

1. Sign in at https://docsquared.app (any browser tab)
2. Click the Docs² icon in your toolbar — should show
   "Connected as your-email@example.com"
3. Highlight text on any webpage
4. Right-click → **Humanize selection (Docs²)** or **Check selection for AI (Docs²)**
5. A floating panel appears in the top-right with results

Each use costs 1 credit from your monthly allotment.

## Files

- `manifest.json` — Manifest V3 config
- `background.js` — Service worker, context menu, API relay, cookie forwarding
- `content.js` + `content.css` — Floating result panel injected into pages
- `popup.html` + `popup.js` — Toolbar popup with connection status
- `generate-icons.js` — Regenerate brand icons (run with `node`)

## Build for Chrome Web Store

1. Icons are already in `icons/` (16, 48, 128 px PNG)
2. Zip the `extension/` folder
3. Upload to https://chrome.google.com/webstore/devconsole
4. Pay the $5 one-time developer fee

## Troubleshooting

**"Not signed in to docsquared.app"** — sign in at the website first.
The popup re-checks every time you open it, or click "Re-check
connection".

**"Failed to humanize" / "Failed to detect" with detail message** — the
server returned an error. Check the detail for specifics. Common causes:
- Cookie expired: sign in again
- Out of credits: visit pricing page
- Rate limited: wait a few seconds

**Nothing happens on right-click** — reload the extension from
`chrome://extensions` and refresh the webpage you're testing on.

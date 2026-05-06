# Docs² Browser Extension

Right-click any selected text on any webpage to:
- **Humanize** AI-generated text
- **Check** for AI patterns

Powered by your existing docsquared.app account.

## Install (developer mode)

1. Open Chrome / Edge / Brave and go to `chrome://extensions`
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked**
4. Select this `extension/` folder

## Setup

The extension uses your existing docsquared.app login. There's nothing to configure if you're already signed in.

1. Sign in at https://docsquared.app
2. Click the Docs² icon in your toolbar — you should see "Connected as your-email@example.com"
3. Done.

If the popup says "Not signed in", click the Sign In button or visit docsquared.app and log in normally. Then re-open the popup.

### Optional: API key fallback

If you can't (or don't want to) keep a browser session active, you can use an API key instead:

1. In the popup, click "Use API key instead"
2. Visit https://docsquared.app/settings → Browser Extension → New API Key
3. Paste the `dsq_...` key into the popup
4. Click Save

Useful for: shared computers, scripted workflows, or sessions that frequently expire.

## Use

1. Highlight any text on any webpage
2. Right-click and choose **Humanize selection (Docs²)** or **Check selection for AI (Docs²)**
3. A floating panel appears in the top-right with results

Each use costs 1 credit from your monthly allotment.

## Build for Chrome Web Store

The extension is ready to package as-is.

1. Icons are already in `icons/` (16×16, 48×48, 128×128 PNG)
2. Zip the entire `extension/` folder
3. Upload to https://chrome.google.com/webstore/devconsole
4. Pay the $5 one-time developer fee

## Files

- `manifest.json` — Manifest V3 config
- `background.js` — Service worker, handles context menu and API relay
- `content.js` + `content.css` — Floating result panel injected into pages
- `popup.html` + `popup.js` — Toolbar popup with auth status + optional API key
- `generate-icons.js` — Regenerate brand icons from SVG (run with Node)

## Auth flow

- Cookie-based by default: extension sends docsquared.app session cookie via `credentials: 'include'`
- API key fallback: Bearer token in Authorization header
- Server tries cookie first, falls back to key (`src/lib/extension-auth.ts`)

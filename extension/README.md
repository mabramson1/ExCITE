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

1. Visit https://docsquared.app/settings
2. Scroll to **Browser Extension** and click **New API Key**
3. Copy the key (you only see it once)
4. Click the Docs² extension icon in your browser toolbar
5. Paste the key, click **Save Key**

## Use

1. Highlight any text on any webpage
2. Right-click and choose **Humanize selection (Docs²)** or **Check selection for AI (Docs²)**
3. A floating panel appears in the top-right with results

## Build for Chrome Web Store

The extension is ready to package as-is. To submit:

1. Add proper icons to `icons/` (16×16, 48×48, 128×128 PNG)
2. Zip the entire `extension/` folder
3. Upload to https://chrome.google.com/webstore/devconsole
4. Pay the $5 one-time developer fee

## Files

- `manifest.json` — Manifest V3 config
- `background.js` — Service worker, handles context menu and API calls
- `content.js` + `content.css` — Floating result panel injected into pages
- `popup.html` + `popup.js` — Toolbar popup for setting the API key

// Docs Squared browser extension background worker.
// Right-click context menu + API relay for the content script.

const API_BASE = "https://docsquared.app";

// ── Context menu setup ────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "docsq-humanize",
    title: "Humanize selection (Docs²)",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "docsq-detect",
    title: "Check selection for AI (Docs²)",
    contexts: ["selection"],
  });
});

// ── Context menu click → forward to the content script ────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.selectionText) return;
  const action = info.menuItemId === "docsq-humanize" ? "humanize" : "detect";
  chrome.tabs.sendMessage(tab.id, {
    type: "docsq-action",
    action,
    text: info.selectionText,
  });
});

// ── API relay: content script sends "docsq-api", we call the server ──
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "docsq-api") return false;

  (async () => {
    try {
      const { apiKey } = await chrome.storage.local.get("apiKey");
      if (!apiKey) {
        sendResponse({
          error: "No API key set. Click the Docs² icon in the toolbar.",
        });
        return;
      }

      const endpoint =
        msg.action === "humanize"
          ? `${API_BASE}/api/extension/de-ai-ify`
          : `${API_BASE}/api/extension/ai-detect`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ text: msg.text }),
      });

      const data = await res.json();
      if (!res.ok) {
        sendResponse({
          error: data.error || `HTTP ${res.status}`,
          status: res.status,
        });
        return;
      }
      sendResponse({ result: data.result });
    } catch (err) {
      sendResponse({ error: err.message || "Request failed" });
    }
  })();

  return true; // keep channel open for async response
});

// Docs Squared browser extension background worker
// Sets up the right-click context menu and routes API requests.

const API_BASE = "https://docsquared.app";

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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id || !info.selectionText) return;

  const action = info.menuItemId === "docsq-humanize" ? "humanize" : "detect";

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (action, text) => {
      window.dispatchEvent(
        new CustomEvent("docsq-action", { detail: { action, text } })
      );
    },
    args: [action, info.selectionText],
  });
});

// Forward API requests from the content script (avoids CORS edge cases)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "docsq-api") return false;

  (async () => {
    try {
      const { apiKey } = await chrome.storage.local.get("apiKey");
      if (!apiKey) {
        sendResponse({ error: "No API key configured. Click the extension icon to set one." });
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
        sendResponse({ error: data.error || `HTTP ${res.status}`, status: res.status });
        return;
      }
      sendResponse({ result: data.result });
    } catch (err) {
      sendResponse({ error: err.message || "Request failed" });
    }
  })();

  return true; // keep message channel open for async response
});

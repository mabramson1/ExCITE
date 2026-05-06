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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.selectionText) return;
  const action = info.menuItemId === "docsq-humanize" ? "humanize" : "detect";
  chrome.tabs.sendMessage(tab.id, {
    type: "docsq-action",
    action,
    text: info.selectionText,
  });
});

// ── API relay ─────────────────────────────────────────────────────
// Tries the user's session cookie first (no setup needed if signed in to
// docsquared.app). Falls back to an API key if the user has saved one.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "docsq-api") return false;

  (async () => {
    try {
      const endpoint =
        msg.action === "humanize"
          ? `${API_BASE}/api/extension/de-ai-ify`
          : `${API_BASE}/api/extension/ai-detect`;

      const headers = { "Content-Type": "application/json" };
      const { apiKey } = await chrome.storage.local.get("apiKey");
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include", // sends docsquared.app session cookie
        headers,
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

  return true;
});

// ── Connection status check (used by popup) ──────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "docsq-check-auth") return false;

  (async () => {
    try {
      const { apiKey } = await chrome.storage.local.get("apiKey");
      const headers = {};
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(`${API_BASE}/api/extension/me`, {
        method: "GET",
        credentials: "include",
        headers,
      });

      if (!res.ok) {
        sendResponse({ signedIn: false });
        return;
      }
      const data = await res.json();
      sendResponse({
        signedIn: true,
        email: data.email,
        name: data.name,
        method: data.method,
      });
    } catch (err) {
      sendResponse({ signedIn: false, error: err.message });
    }
  })();

  return true;
});

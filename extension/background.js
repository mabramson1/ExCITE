// Docs Squared browser extension background worker.
// Uses chrome.cookies to read the user's docsquared.app session cookie
// and forwards it via a custom header — works regardless of SameSite.

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

// ── Read the user's docsquared.app session cookies ───────────────
async function getForwardedCookieHeader() {
  try {
    const cookies = await chrome.cookies.getAll({
      url: API_BASE,
    });
    if (!cookies || cookies.length === 0) return "";
    return cookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
  } catch (err) {
    console.warn("[Docs²] Could not read cookies:", err);
    return "";
  }
}

// ── API call with proper error reporting ─────────────────────────
async function callApi(action, text) {
  const endpoint =
    action === "humanize"
      ? `${API_BASE}/api/extension/de-ai-ify`
      : `${API_BASE}/api/extension/ai-detect`;

  const cookieHeader = await getForwardedCookieHeader();

  const headers = { "Content-Type": "application/json" };
  if (cookieHeader) {
    // Forward cookies via custom header. The server reads x-docsq-cookie
    // and uses it for Better Auth session lookup.
    headers["X-Docsq-Cookie"] = cookieHeader;
  }

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    return { error: `Network error: ${err.message}`, status: 0 };
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    return {
      error: `Server returned ${res.status} ${res.statusText} (non-JSON response)`,
      status: res.status,
    };
  }

  if (!res.ok) {
    return {
      error: data.error || data.detail || `HTTP ${res.status}`,
      status: res.status,
    };
  }

  return { result: data.result };
}

// ── API relay for content script ──────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "docsq-api") {
    callApi(msg.action, msg.text).then(sendResponse);
    return true;
  }

  if (msg.type === "docsq-check-auth") {
    (async () => {
      const cookieHeader = await getForwardedCookieHeader();
      if (!cookieHeader) {
        sendResponse({ signedIn: false, reason: "no-cookies" });
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/extension/me`, {
          method: "GET",
          credentials: "include",
          headers: { "X-Docsq-Cookie": cookieHeader },
        });
        if (!res.ok) {
          sendResponse({ signedIn: false, status: res.status });
          return;
        }
        const data = await res.json();
        sendResponse({
          signedIn: true,
          email: data.email,
          name: data.name,
        });
      } catch (err) {
        sendResponse({ signedIn: false, error: err.message });
      }
    })();
    return true;
  }

  return false;
});

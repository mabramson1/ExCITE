var input = document.getElementById("apikey");
var statusEl = document.getElementById("status");

// Load saved key on open
chrome.storage.local.get("apiKey", function (data) {
  if (data.apiKey) {
    input.value = data.apiKey;
    showStatus("Key configured. Select text on any page and right-click.", "ok");
  }
});

document.getElementById("save").addEventListener("click", function () {
  var value = input.value.trim();
  if (!value) {
    showStatus("Paste your API key first.", "err");
    return;
  }
  if (!value.startsWith("dsq_")) {
    showStatus("Keys start with dsq_. Check your settings page.", "err");
    return;
  }
  chrome.storage.local.set({ apiKey: value }, function () {
    showStatus("Saved. Try selecting text on any page and right-clicking.", "ok");
  });
});

document.getElementById("clear").addEventListener("click", function () {
  chrome.storage.local.remove("apiKey", function () {
    input.value = "";
    showStatus("Key cleared.", "info");
  });
});

function showStatus(message, type) {
  statusEl.className = "status " + type;
  statusEl.textContent = message;
}

const input = document.getElementById("apikey");
const status = document.getElementById("status");

// Load existing key on open
chrome.storage.local.get("apiKey", ({ apiKey }) => {
  if (apiKey) {
    input.value = apiKey;
    showStatus("API key configured", "ok");
  }
});

document.getElementById("save").addEventListener("click", async () => {
  const value = input.value.trim();
  if (!value) {
    showStatus("Enter a key first", "err");
    return;
  }
  if (!value.startsWith("dsq_")) {
    showStatus("Key should start with dsq_", "err");
    return;
  }
  await chrome.storage.local.set({ apiKey: value });
  showStatus("Saved. Try right-clicking selected text.", "ok");
});

document.getElementById("clear").addEventListener("click", async () => {
  await chrome.storage.local.remove("apiKey");
  input.value = "";
  showStatus("Cleared.", "ok");
});

function showStatus(message, type) {
  status.className = "status " + type;
  status.textContent = message;
}

var statusEl = document.getElementById("status");
var signinBtn = document.getElementById("signin");
var toggleBtn = document.getElementById("toggle-advanced");
var advanced = document.getElementById("advanced");
var apiKeyInput = document.getElementById("apikey");

// ── Connection check on open ─────────────────────────────────────
checkAuth();

function checkAuth() {
  setStatus("loading", "Checking connection...");
  chrome.runtime.sendMessage({ type: "docsq-check-auth" }, function (response) {
    if (chrome.runtime.lastError || !response) {
      setStatus("disconnected", "Extension error. Try reloading.");
      signinBtn.style.display = "block";
      return;
    }
    if (response.signedIn) {
      var label = response.email || response.name || "your account";
      var via = response.method === "key" ? " (via API key)" : "";
      setStatus(
        "connected",
        '<span class="dot green"></span>Connected as <strong>' +
          escapeHtml(label) + "</strong>" + via
      );
      signinBtn.style.display = "none";
    } else {
      setStatus(
        "disconnected",
        '<span class="dot red"></span>Not signed in'
      );
      signinBtn.style.display = "block";
    }
  });
}

function setStatus(type, html) {
  statusEl.className = "status-card " + type;
  statusEl.innerHTML = '<div class="status-row">' + html + "</div>";
}

// ── Sign in button opens docsquared.app in a new tab ─────────────
signinBtn.addEventListener("click", function () {
  chrome.tabs.create({ url: "https://docsquared.app/sign-in" });
});

// ── Advanced (API key) toggle ────────────────────────────────────
toggleBtn.addEventListener("click", function () {
  advanced.classList.toggle("visible");
  toggleBtn.textContent = advanced.classList.contains("visible")
    ? "Hide advanced"
    : "Use API key instead";

  // Load existing key when opening
  if (advanced.classList.contains("visible")) {
    chrome.storage.local.get("apiKey", function (data) {
      if (data.apiKey) apiKeyInput.value = data.apiKey;
    });
  }
});

// ── API key save / clear ─────────────────────────────────────────
document.getElementById("save").addEventListener("click", function () {
  var value = apiKeyInput.value.trim();
  if (!value) return;
  if (!value.startsWith("dsq_")) {
    alert("Keys start with dsq_. Check your settings page.");
    return;
  }
  chrome.storage.local.set({ apiKey: value }, function () {
    checkAuth();
  });
});

document.getElementById("clear").addEventListener("click", function () {
  chrome.storage.local.remove("apiKey", function () {
    apiKeyInput.value = "";
    checkAuth();
  });
});

function escapeHtml(s) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(String(s)));
  return div.innerHTML;
}

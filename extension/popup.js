var statusEl = document.getElementById("status");
var signinBtn = document.getElementById("signin");
var recheckBtn = document.getElementById("recheck");

checkAuth();

function checkAuth() {
  setStatus("loading", "Checking connection...");
  signinBtn.style.display = "none";
  recheckBtn.style.display = "none";

  chrome.runtime.sendMessage({ type: "docsq-check-auth" }, function (response) {
    if (chrome.runtime.lastError) {
      setStatus(
        "error",
        '<span class="dot red"></span><span>Extension error: ' +
          escapeHtml(chrome.runtime.lastError.message || "unknown") +
          "</span>"
      );
      recheckBtn.style.display = "block";
      return;
    }
    if (!response) {
      setStatus(
        "error",
        '<span class="dot red"></span><span>No response from background worker. Try reloading the extension.</span>'
      );
      recheckBtn.style.display = "block";
      return;
    }
    if (response.signedIn) {
      var label = response.email || response.name || "your account";
      setStatus(
        "connected",
        '<span class="dot green"></span><span>Connected as <strong>' +
          escapeHtml(label) +
          "</strong></span>"
      );
      return;
    }

    // Not signed in
    if (response.reason === "no-cookies") {
      setStatus(
        "disconnected",
        '<span class="dot amber"></span><span>Not signed in to docsquared.app. Sign in below, then re-check.</span>'
      );
    } else if (response.status === 401) {
      setStatus(
        "disconnected",
        '<span class="dot amber"></span><span>Session expired. Sign in again, then re-check.</span>'
      );
    } else {
      setStatus(
        "disconnected",
        '<span class="dot amber"></span><span>Not signed in. Status: ' +
          (response.status || "unknown") +
          "</span>"
      );
    }
    signinBtn.style.display = "block";
    recheckBtn.style.display = "block";
  });
}

signinBtn.addEventListener("click", function () {
  chrome.tabs.create({ url: "https://docsquared.app/sign-in" });
});

recheckBtn.addEventListener("click", checkAuth);

function setStatus(type, html) {
  statusEl.className = "status-card " + type;
  statusEl.innerHTML = '<div class="status-row">' + html + "</div>";
}

function escapeHtml(s) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(String(s)));
  return div.innerHTML;
}

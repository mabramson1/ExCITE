// Docs Squared content script.
// Receives actions from the background worker, calls the API relay,
// and shows results in a floating panel.

(function () {
  if (window.__docsqLoaded) return;
  window.__docsqLoaded = true;

  let panel = null;

  // ── Receive action from background (via chrome.tabs.sendMessage) ──
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== "docsq-action") return;
    handleAction(msg.action, msg.text);
  });

  async function handleAction(action, text) {
    showLoading(action, text);

    chrome.runtime.sendMessage(
      { type: "docsq-api", action, text },
      (response) => {
        if (chrome.runtime.lastError) {
          showError("Extension error. Try reloading the page.");
          return;
        }
        if (!response) {
          showError("No response from extension. Try reloading.");
          return;
        }
        if (response.error) {
          if (response.status === 401) {
            showError(
              'Not signed in. Open <a href="https://docsquared.app/sign-in" target="_blank" style="color:#4A90D2">docsquared.app</a> and sign in, then try again.'
            );
          } else if (response.status === 402) {
            showError(
              'Out of credits this month. <a href="https://docsquared.app/pricing" target="_blank" style="color:#4A90D2">Upgrade</a> or wait for the monthly reset.'
            );
          } else if (response.status === 429) {
            showError(
              "Rate limit hit. Wait a few seconds and try again."
            );
          } else {
            showError(response.error, /*allowHtml*/ false);
          }
          return;
        }
        showResult(action, response.result);
      }
    );
  }

  // ── Panel UI ────────────────────────────────────────────────────
  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "docsq-panel";
    panel.innerHTML =
      '<div class="docsq-header">' +
      "  <strong>Docs²</strong>" +
      '  <button class="docsq-close" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="docsq-body"></div>';
    document.body.appendChild(panel);
    panel
      .querySelector(".docsq-close")
      .addEventListener("click", () => {
        panel.style.display = "none";
      });
    return panel;
  }

  function showLoading(action, text) {
    var p = ensurePanel();
    p.style.display = "block";
    var verb = action === "humanize" ? "Humanizing" : "Analyzing";
    p.querySelector(".docsq-body").innerHTML =
      '<div class="docsq-loading">' +
      '  <div class="docsq-spinner"></div>' +
      "  <p>" + verb + " " + text.length + " characters...</p>" +
      "</div>";
  }

  function showError(message, allowHtml) {
    var p = ensurePanel();
    p.style.display = "block";
    p.querySelector(".docsq-body").innerHTML =
      '<div class="docsq-error">' +
      (allowHtml === false ? escapeHtml(message) : message) +
      "</div>";
  }

  function showResult(action, result) {
    var p = ensurePanel();
    p.style.display = "block";
    var body = p.querySelector(".docsq-body");

    if (action === "humanize") {
      var rewritten = (result && result.rewritten_text) || "(no rewrite returned)";
      body.innerHTML =
        "<h3>Humanized text</h3>" +
        "<textarea readonly>" + escapeHtml(rewritten) + "</textarea>" +
        '<button class="docsq-copy">Copy to clipboard</button>';
      var ta = body.querySelector("textarea");
      body.querySelector(".docsq-copy").addEventListener("click", function () {
        navigator.clipboard.writeText(ta.value);
        this.textContent = "Copied!";
        var btn = this;
        setTimeout(function () {
          btn.textContent = "Copy to clipboard";
        }, 1500);
      });
    } else {
      var score =
        (result && result.consensus_score) ||
        (result && result.overall_ai_probability) ||
        0;
      var pct = Math.round(score * 100);
      var verdict =
        (result && result.consensus_verdict) ||
        (result && result.verdict) ||
        "unknown";
      var reasoning = (result && result.reasoning) || "";
      var color =
        pct >= 80
          ? "#dc2626"
          : pct >= 55
          ? "#ea580c"
          : pct >= 30
          ? "#ca8a04"
          : "#16a34a";

      body.innerHTML =
        "<h3>AI probability</h3>" +
        '<div class="docsq-score" style="color:' + color + '">' + pct + "%</div>" +
        '<p class="docsq-verdict">' + escapeHtml(verdict.replace(/_/g, " ")) + "</p>" +
        (reasoning
          ? '<p class="docsq-reasoning">' + escapeHtml(reasoning) + "</p>"
          : "");
    }
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(String(s)));
    return div.innerHTML;
  }
})();

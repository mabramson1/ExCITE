// Docs Squared content script
// Listens for context menu actions and shows results in a floating panel.

(function () {
  if (window.__docsqLoaded) return;
  window.__docsqLoaded = true;

  let panel = null;

  window.addEventListener("docsq-action", async (e) => {
    const { action, text } = e.detail;
    showLoading(action, text);

    chrome.runtime.sendMessage(
      { type: "docsq-api", action, text },
      (response) => {
        if (!response) {
          showError("Extension error. Try reloading the page.");
          return;
        }
        if (response.error) {
          if (response.status === 401) {
            showError("Set your API key in the extension popup first.");
          } else if (response.status === 402) {
            showError("Out of credits this month. Visit docsquared.app to upgrade.");
          } else {
            showError(response.error);
          }
          return;
        }
        showResult(action, response.result);
      }
    );
  });

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "docsq-panel";
    panel.innerHTML = `
      <div class="docsq-header">
        <strong>Docs²</strong>
        <button class="docsq-close" aria-label="Close">×</button>
      </div>
      <div class="docsq-body"></div>
    `;
    document.body.appendChild(panel);
    panel.querySelector(".docsq-close").addEventListener("click", () => {
      panel.style.display = "none";
    });
    return panel;
  }

  function showLoading(action, text) {
    const p = ensurePanel();
    p.style.display = "block";
    const verb = action === "humanize" ? "Humanizing" : "Analyzing";
    p.querySelector(".docsq-body").innerHTML = `
      <div class="docsq-loading">
        <div class="docsq-spinner"></div>
        <p>${verb} ${text.length} characters...</p>
      </div>
    `;
  }

  function showError(message) {
    const p = ensurePanel();
    p.style.display = "block";
    p.querySelector(".docsq-body").innerHTML = `
      <div class="docsq-error">${escapeHtml(message)}</div>
    `;
  }

  function showResult(action, result) {
    const p = ensurePanel();
    p.style.display = "block";

    if (action === "humanize") {
      const rewritten = result?.rewritten_text || "(no rewrite returned)";
      p.querySelector(".docsq-body").innerHTML = `
        <h3>Humanized text</h3>
        <textarea readonly>${escapeHtml(rewritten)}</textarea>
        <button class="docsq-copy">Copy</button>
      `;
      const ta = p.querySelector("textarea");
      p.querySelector(".docsq-copy").addEventListener("click", () => {
        navigator.clipboard.writeText(ta.value);
        const btn = p.querySelector(".docsq-copy");
        btn.textContent = "Copied";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      });
    } else {
      const score = result?.consensus_score ?? result?.overall_ai_probability ?? 0;
      const pct = Math.round(score * 100);
      const verdict = result?.consensus_verdict || result?.verdict || "unknown";
      const reasoning = result?.reasoning || "";
      const color =
        pct >= 80 ? "#dc2626" : pct >= 55 ? "#ea580c" : pct >= 30 ? "#ca8a04" : "#16a34a";
      p.querySelector(".docsq-body").innerHTML = `
        <h3>AI probability</h3>
        <div class="docsq-score" style="color:${color}">${pct}%</div>
        <p class="docsq-verdict">${escapeHtml(verdict.replace(/_/g, " "))}</p>
        <p class="docsq-reasoning">${escapeHtml(reasoning)}</p>
      `;
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }
})();

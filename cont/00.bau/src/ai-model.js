// === AI Model & Token helpers ===
export function initAIModelAndToken() {
  try {
    const modelSel = document.getElementById("ai-model");
    const tokenInput = document.getElementById("ai-gh-token");
    const editBtn = document.getElementById("ai-gh-token-edit");
    const USE_CUSTOM_AI_DROPDOWN = false; // feature flag: set true to re-enable custom UI

    // Persist and show selected AI model
    const updateModelStatus = () => {
      if (!modelSel) return;
      const el = document.getElementById("ai-model-status");
      if (!el) return; // element might be added later when AI section is revealed
      const val = modelSel.value;
      let text = val || "(none)";
      const match = Array.from(modelSel.options).find((o) => o.value === val);
      if (match && match.textContent) text = match.textContent.trim();
      el.textContent = `Model: ${text}`;
    };

    const updateTokenVisibility = () => {
      // Tokens are no longer needed in the browser; all AI calls are proxied server-side.
      const hint = document.getElementById("ai-token-hint");
      const section = document.getElementById("ai-token-section");
      if (hint) hint.style.display = "none";
      if (section) section.style.display = "none";
    };

    // Restore saved model selection
    const savedModel = localStorage.getItem("aiModel");
    if (modelSel) {
      if (
        savedModel &&
        Array.from(modelSel.options).some((o) => o.value === savedModel)
      ) {
        modelSel.value = savedModel;
      }
      // Ensure native option.selected flags align with current value
      Array.from(modelSel.options).forEach((o) => {
        o.selected = o.value === modelSel.value;
      });
      // Save on change and update status
      modelSel.addEventListener("change", () => {
        try {
          localStorage.setItem("aiModel", modelSel.value);
        } catch {}
        updateModelStatus();
        updateTokenVisibility();
      });
      // Initial status after potential restore
      updateModelStatus();
      updateTokenVisibility();

      // Enhance the AI model select with a custom-styled dropdown (single-select)
      if (USE_CUSTOM_AI_DROPDOWN && !modelSel.dataset.enhanced) {
        modelSel.dataset.enhanced = "1";

        // Wrapper
        const wrap = document.createElement("div");
        wrap.className = "ai-model-dropdown-wrapper";
        Object.assign(wrap.style, { width: "100%", marginTop: "6px" });

        // Button
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ai-model-dropdown-button";
        Object.assign(btn.style, {
          width: "100%",
          textAlign: "left",
          padding: "10px 12px",
          fontSize: "14px",
          border: "1px solid var(--all-text)",
          borderRadius: "8px",
          background: "transparent",
          color: "var(--all-text)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        });
        btn.setAttribute("role", "combobox");
        btn.setAttribute("aria-haspopup", "listbox");
        btn.setAttribute("aria-expanded", "false");

        // Panel
        const panel = document.createElement("div");
        panel.className = "ai-model-dropdown-panel";
        Object.assign(panel.style, {
          display: "none",
          marginTop: "6px",
          border: "1px solid var(--all-text)",
          borderRadius: "8px",
          background: "transparent",
          color: "var(--all-text)",
          padding: "8px",
          maxHeight: "220px",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        });
        panel.setAttribute("role", "listbox");

        const rows = document.createElement("div");

        function updateButtonText() {
          const labelEl = modelSel
            .closest(".form-subsection, .form-section")
            ?.querySelector(`label[for="${modelSel.id}"]`);
          const base = labelEl
            ? `${labelEl.innerText.trim()} — select...`
            : "Select AI model";
          const currentValue = modelSel.value;
          const matchingOption = Array.from(modelSel.options).find(
            (opt) => opt.value === currentValue
          );
          const text = matchingOption?.text?.trim();
          btn.textContent = text || base;
        }

        function buildPanel() {
          rows.innerHTML = "";
          const currentValue = modelSel.value;
          Array.from(modelSel.options).forEach((opt) => {
            if (!opt.value) return;
            const row = document.createElement("label");
            row.style.display = "flex";
            row.style.alignItems = "center";
            row.style.gap = "8px";
            row.style.padding = "6px 4px";
            row.style.cursor = "pointer";
            row.setAttribute("role", "option");

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = `${modelSel.id}-radio`;
            radio.value = opt.value;
            radio.checked = opt.value === currentValue;
            radio.addEventListener("change", () => {
              modelSel.value = opt.value;
              updateButtonText();
              updateModelStatus();
              modelSel.dispatchEvent(new Event("change", { bubbles: true }));
              panel.style.display = "none";
              btn.setAttribute("aria-expanded", "false");
            });

            const span = document.createElement("span");
            span.textContent = opt.text;
            span.style.color = "var(--all-text)";

            row.appendChild(radio);
            row.appendChild(span);
            rows.appendChild(row);
          });
        }

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          if (panel.style.display === "none") {
            panel.style.display = "block";
            btn.setAttribute("aria-expanded", "true");
          } else {
            panel.style.display = "none";
            btn.setAttribute("aria-expanded", "false");
          }
        });

        // Mount
        modelSel.style.display = "none";
        modelSel.parentNode.insertBefore(wrap, modelSel);
        wrap.appendChild(btn);
        wrap.appendChild(panel);
        panel.appendChild(rows);

        // Build UI
        buildPanel();
        updateButtonText();

        // Keep UI synced when the native select changes
        modelSel.addEventListener("change", () => {
          updateButtonText();
          updateModelStatus();
          // sync radios' checked state
          const radios = rows.querySelectorAll('input[type="radio"]');
          radios.forEach((r) => (r.checked = r.value === modelSel.value));
        });

        // Rebuild if options change dynamically
        const mo = new MutationObserver(() => {
          buildPanel();
          updateButtonText();
        });
        mo.observe(modelSel, {
          subtree: true,
          childList: true,
          attributes: true,
        });
      }
    }

    // Token editing (disabled for security)
    if (tokenInput) tokenInput.style.display = "none";
    if (editBtn) editBtn.style.display = "none";

    // Export updateModelStatus for external use
    window.updateModelStatus = updateModelStatus;
  } catch (e) {
    console.warn("[BAU] AI Model init error:", e);
  }
}

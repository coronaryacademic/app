// === AI Model & Token helpers (runs on page load of BAU) ===
(function initAIModelAndToken() {
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
          const val = modelSel.value;
          const match = Array.from(modelSel.options).find(
            (o) => o.value === val
          );
          const text = (match?.text || val || "Select model").trim();
          btn.textContent = text;
          btn.title = text;
        }

        function buildPanel() {
          rows.innerHTML = "";
          const currentVal = modelSel.value;
          Array.from(modelSel.options).forEach((opt) => {
            const row = document.createElement("div");
            Object.assign(row.style, {
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 6px",
              cursor: "pointer",
            });
            row.setAttribute("role", "option");
            const isSel = opt.value === currentVal;
            row.setAttribute("aria-selected", isSel ? "true" : "false");

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "ai-model-radio";
            radio.value = opt.value;
            radio.checked = isSel;
            Object.assign(radio.style, { width: "18px", height: "18px" });
            const applySelection = () => {
              modelSel.value = opt.value;
              const idx = Array.from(modelSel.options).findIndex(
                (o) => o.value === modelSel.value
              );
              if (idx >= 0) modelSel.selectedIndex = idx;
              Array.from(modelSel.options).forEach((o) => {
                o.selected = o.value === modelSel.value;
              });
              updateButtonText();
              updateModelStatus();
              modelSel.dispatchEvent(new Event("change", { bubbles: true }));
            };

            radio.addEventListener("mousedown", (evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              applySelection();
              hidePanel();
              // microtask re-sync
              Promise.resolve().then(() => applySelection());
            });

            radio.addEventListener("change", (evt) => {
              modelSel.value = opt.value;
              const idx = Array.from(modelSel.options).findIndex(
                (o) => o.value === modelSel.value
              );
              if (idx >= 0) modelSel.selectedIndex = idx;
              // reflect selection flags in native options
              Array.from(modelSel.options).forEach((o) => {
                o.selected = o.value === modelSel.value;
              });
              updateButtonText();
              updateModelStatus();
              modelSel.dispatchEvent(new Event("change", { bubbles: true }));
              // prevent outer handlers from swallowing this click and close panel for feedback
              if (evt) evt.stopPropagation();
              hidePanel();
              Promise.resolve().then(() => {
                // force again in case something reverted it
                const idx2 = Array.from(modelSel.options).findIndex(
                  (o) => o.value === opt.value
                );
                if (idx2 >= 0) modelSel.selectedIndex = idx2;
                Array.from(modelSel.options).forEach((o) => {
                  o.selected = o.value === opt.value;
                });
                updateButtonText();
                updateModelStatus();
              });
            });

            const span = document.createElement("span");
            span.textContent = opt.text;
            span.style.color = "var(--all-text)";

            row.addEventListener("mousedown", (e) => {
              e.preventDefault();
              e.stopPropagation();
              radio.checked = true;
              applySelection();
              hidePanel();
              Promise.resolve().then(() => applySelection());
            });

            row.addEventListener("click", (e) => {
              // already handled on mousedown
              e.preventDefault();
              e.stopPropagation();
            });

            row.appendChild(radio);
            row.appendChild(span);
            rows.appendChild(row);
          });
          panel.innerHTML = "";
          panel.appendChild(rows);
        }

        let outsideHandler = null;
        let keyHandler = null;
        function showPanel() {
          panel.style.display = "block";
          btn.setAttribute("aria-expanded", "true");
          outsideHandler = (e) => {
            const path = e.composedPath ? e.composedPath() : [];
            const inside = path.includes(wrap) || wrap.contains(e.target);
            if (!inside) hidePanel();
          };
          document.addEventListener("click", outsideHandler, false);
          keyHandler = (e) => {
            if (e.key === "Escape") hidePanel();
          };
          document.addEventListener("keydown", keyHandler, true);
        }
        function hidePanel() {
          panel.style.display = "none";
          btn.setAttribute("aria-expanded", "false");
          document.removeEventListener("click", outsideHandler, false);
          document.removeEventListener("keydown", keyHandler, true);
          outsideHandler = null;
          keyHandler = null;
          btn.focus();
        }

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          if (panel.style.display === "none") showPanel();
          else hidePanel();
        });

        // Mount
        modelSel.style.display = "none";
        modelSel.parentNode.insertBefore(wrap, modelSel);
        wrap.appendChild(btn);
        wrap.appendChild(panel);

        // Build UI
        buildPanel();
        updateButtonText();

        // Keep UI synced when the native select changes
        modelSel.addEventListener("change", () => {
          updateButtonText();
          updateModelStatus();
          // sync radios' checked state
          const radios = rows.querySelectorAll('input[type="radio"]');
          radios.forEach((r) => {
            r.checked = r.value === modelSel.value;
          });
        });

        // Rebuild when native options DOM changes
        const mo = new MutationObserver(() => {
          buildPanel();
          updateButtonText();
          updateModelStatus();
        });
        // Avoid observing attribute changes which fire during selection and can interfere
        mo.observe(modelSel, { childList: true, subtree: true });
      }
    }

    // Tokens are not used client-side; clear UI state if present
    if (tokenInput) {
      tokenInput.value = "";
      tokenInput.readOnly = true;
      tokenInput.placeholder = "No token needed";
    }

    // Toggle Edit/Save behavior
    if (editBtn && tokenInput) {
      // Disable edit/save; no tokens required client-side
      editBtn.disabled = true;
      editBtn.textContent = "Token not required";
      tokenInput.readOnly = true;
    }

    // Expose helpers globally for other modules
    window.getSelectedAIModel = function () {
      if (modelSel && modelSel.value) return modelSel.value;
      const saved = localStorage.getItem("aiModel");
      return saved || "gemini-1.5-flash";
    };
    window.getGitHubModelsToken = function () {
      // No token needed in browser; proxy uses server-side env vars
      return "";
    };

    // Simple fetch wrapper for GitHub Models Azure Inference endpoint
    // Usage: await window.githubModelsChat(model, token, messages)
    window.githubModelsChat = async function (model, token, messages) {
      // NOTE: token is ignored; calls are proxied server-side to avoid exposing secrets.
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "github", model, messages }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`GitHub Models proxy error ${res.status}: ${errText}`);
      }
      const data = await res.json();
      return data?.content || "";
    };
  } catch (e) {
    console.warn("[BAU] AI model/token init error:", e);
  }
})();

// === Progress Tracker Functionality Removed ===
// Removed to prevent scroll interference with PE section

// Enhanced form clearing function
function clearFormExceptStudentInfo() {
  const form = document.getElementById("history-form-container");
  if (!form) return;

  console.log("[BAU] Clearing form except student info");

  // Get all form inputs
  const inputs = form.querySelectorAll("input, select, textarea");

  inputs.forEach((input) => {
    // Skip student name and student number fields
    if (input.id === "student-name" || input.id === "student-number") {
      return;
    }

    // Clear different input types appropriately
    if (input.type === "checkbox" || input.type === "radio") {
      input.checked = false;
    } else if (input.tagName === "SELECT") {
      // Reset to first option (usually empty or default)
      input.selectedIndex = 0;
      // Clear any custom dropdown selections
      const customOptions = input.parentElement?.querySelectorAll(
        'input[type="radio"]'
      );
      if (customOptions) {
        customOptions.forEach((radio) => (radio.checked = false));
      }
    } else if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
      input.value = "";
    }

    // Trigger change events to update UI and tracker
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // Re-fill student data after clearing
  setTimeout(() => {
    autoFillStudentData();
    // Progress tracker removed
  }, 100);

  console.log("[BAU] Form cleared successfully");
}

// Removed PDF submit functionality - replaced with HTML report generation via "Get Report" button

// Ensure dropdown inputs use themed placeholder color
(function ensureDropdownTheme() {
  try {
    if (document.getElementById("dropdown-theme-style")) return;
    const s = document.createElement("style");
    s.id = "dropdown-theme-style";
    s.textContent = `
      .dropdown-single-panel input::placeholder,
      .dropdown-checkbox-panel input::placeholder { color: var(--all-text); opacity: 0.7; }
      /* Ensure SOCrates single-select dropdown text is always readable */
      .dropdown-single-panel, .dropdown-single-panel label span, .dropdown-single-panel [data-group="1"] { color: var(--all-text) !important; }
      /* Native select dropdown options: use themed text color */
      select option { color: var(--all-text) !important; }
      select option:hover,
      select option:checked,
      select option:focus { color: var(--all-text) !important; }
      /* In the open dropdown list, show disabled options in black for readability */
      select option[disabled] { color: var(--all-text) !important; opacity: 0.6; }
      /* Closed control placeholder color is handled via JS (var(--all-text)) */
    `;
    document.head.appendChild(s);
  } catch {}
})();

// Ensure native <select> closed text uses correct color
(function initNativeSelectColorControl() {
  try {
    const apply = (sel) => {
      const opt = sel.options[sel.selectedIndex];
      const isPlaceholder = !!(opt && opt.disabled);
      sel.style.color = isPlaceholder ? "var(--all-text)" : "black";
    };
    const visibleSelects = Array.from(
      document.querySelectorAll("select")
    ).filter((s) => s.offsetParent !== null); // skip hidden selects used by custom UI
    visibleSelects.forEach((sel) => {
      apply(sel);
      sel.addEventListener("change", () => apply(sel));
    });
  } catch {}
})();

/**
 * Enhance SOCRATES single-selects into in-flow dropdowns (radio-like)
 * Fields: site, onset, character, radiation, associated, timing, exacerbating, relieving, severity
 */
function enhanceSocratesSelectsInFlow() {
  const ids = [
    "chief-complaint",
    "site",
    "onset",
    "character",
    "radiation",
    "associated",
    "timing",
    "exacerbating",
    "relieving",
    "severity",
    // Also enhance Patient Info + Social History with same custom UI
    "sh-smoking",
    "sh-alcohol",
    "sh-drugs",
    "sh-occupation",
    "sh-living",
    "sh-travel",
  ];

  ids.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;
    // Respect native opt-out: remove previous wrapper if any, then skip
    if (select.dataset && select.dataset.native === "1") {
      try {
        const prev = select.previousElementSibling;
        if (
          prev &&
          prev.classList &&
          prev.classList.contains("dropdown-single-wrapper")
        ) {
          prev.remove();
        }
        select.style.display = "";
        if (select.dataset.enhanced === "1") delete select.dataset.enhanced;
      } catch (e) {}
      return;
    }
    if (select.dataset.enhanced === "1") return;
    // Single-select (radio dropdown) for Social History
    if (
      id === "smoking" ||
      id === "alcohol" ||
      id === "occupation" ||
      id === "living" ||
      id === "travel"
    ) {
      select.multiple = false;
      select.removeAttribute("data-dropdown-checkbox");
      enhanceOneSingleInFlow(select);
    } else {
      select.multiple = true;
      select.setAttribute("data-dropdown-checkbox", "");
      enhanceOneInFlow(select);
    }
  });
}

function enhanceOneSingleInFlow(select) {
  select.dataset.enhanced = "1";

  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-single-wrapper";
  wrapper.style.width = "100%";
  wrapper.style.marginTop = "6px";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dropdown-single-button";
  Object.assign(btn.style, {
    width: "100%",
    textAlign: "left",
    padding: "10px",
    fontSize: "14px",
    border: "1px solid var(--all-text)",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
    color: "black",
  });

  const panel = document.createElement("div");
  panel.className = "dropdown-single-panel";
  Object.assign(panel.style, {
    display: "none",
    marginTop: "6px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#fafafa",
    padding: "8px",
    maxHeight: "450px",
    overflowY: "auto",
    color: "black",
  });

  // --- Typeahead search UI ---
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Type to filter...";
  Object.assign(search.style, {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 12px",
    marginBottom: "8px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    background: "#fff",
    color: "var(--all-text)",
    fontSize: "16px",
  });

  // Set placeholder color
  search.style.setProperty("--placeholder-color", "var(--all-text)");
  const placeholderStyle = document.createElement("style");
  placeholderStyle.textContent = `
        #${select.id}-search::placeholder {
          color: var(--all-text);
          opacity: 0.7;
        }
      `;
  search.id = `${select.id}-search`;
  if (!document.head.querySelector(`style[data-for="${select.id}"]`)) {
    placeholderStyle.setAttribute("data-for", select.id);
    document.head.appendChild(placeholderStyle);
  }

  const rowsContainer = document.createElement("div");

  function createOptionRow(text, value, selected) {
    const row = document.createElement("label");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "12px";
    row.style.padding = "12px 8px";
    row.setAttribute("data-row", "1");
    row.setAttribute("data-text", text.toLowerCase());
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", selected ? "true" : "false");

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `${select.id}-radio`;
    radio.value = value;
    radio.checked = !!selected;
    radio.addEventListener("change", () => {
      select.value = value;
      updateButtonText();
    });

    const span = document.createElement("span");
    span.textContent = text;
    span.style.color = "black";

    // Also make row clickable
    row.addEventListener("click", (e) => {
      if (e.target !== radio) {
        radio.checked = true;
        select.value = value;
        updateButtonText();
      }
    });

    row.appendChild(radio);
    row.appendChild(span);
    return row;
  }

  function buildPanel() {
    panel.innerHTML = "";
    panel.appendChild(search);
    rowsContainer.innerHTML = "";

    // Check if this is a SOCRATES field that should use row layout
    const socratesFields = [
      "onset",
      "character",
      "radiation",
      "timing",
      "exacerbating",
      "relieving",
      "severity",
    ];
    const isSOCRATESField = socratesFields.includes(select.id);

    const children = Array.from(select.children);
    children.forEach((child) => {
      if (child.tagName === "OPTGROUP") {
        const groupLabel = document.createElement("div");
        groupLabel.textContent = child.label;
        groupLabel.setAttribute("data-group", "1");
        groupLabel.setAttribute("data-text", child.label.toLowerCase());
        Object.assign(groupLabel.style, {
          fontWeight: "600",
          marginTop: "12px",
          marginBottom: "8px",
          color: "var(--all-text)",
        });
        rowsContainer.appendChild(groupLabel);

        if (isSOCRATESField) {
          // Create flex container for row layout
          const optionsContainer = document.createElement("div");
          Object.assign(optionsContainer.style, {
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "16px",
          });

          Array.from(child.children).forEach((opt) => {
            const optionRow = createOptionRow(
              opt.text,
              opt.value,
              opt.selected
            );
            // Modify styling for inline display
            Object.assign(optionRow.style, {
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              border: "none",
              borderRadius: "20px",
              background: opt.selected ? "#e3f2fd" : "transparent",
              cursor: "pointer",
              fontSize: "14px",
              whiteSpace: "nowrap",
              flexShrink: "0",
            });
            optionsContainer.appendChild(optionRow);
          });

          rowsContainer.appendChild(optionsContainer);
        } else {
          Array.from(child.children).forEach((opt) => {
            rowsContainer.appendChild(
              createOptionRow(opt.text, opt.value, opt.selected)
            );
          });
        }
      } else if (child.tagName === "OPTION") {
        rowsContainer.appendChild(
          createOptionRow(child.text, child.value, child.selected)
        );
      }
    });

    panel.appendChild(rowsContainer);
  }

  function updateButtonText() {
    const labelEl = select
      .closest(".form-subsection, .form-section")
      ?.querySelector(`label[for="${select.id}"]`);
    const base = labelEl
      ? `${labelEl.innerText.trim()} — select...`
      : "Select option";
    const text = select.options[select.selectedIndex]?.text?.trim();
    const finalText = text || base;
    btn.textContent = finalText;
    btn.title = finalText;
  }

  let outsideHandler = null;
  let keyHandler = null;
  function showPanel() {
    panel.style.display = "block";
    btn.setAttribute("aria-expanded", "true");
    // Allow page scroll while dropdown is open
    // focus search on open (iPad keyboard)
    setTimeout(() => search.focus(), 0);
    // outside click
    outsideHandler = (e) => {
      if (!wrapper.contains(e.target)) hidePanel();
    };
    document.addEventListener("click", outsideHandler, true);
    // Esc close
    keyHandler = (e) => {
      if (e.key === "Escape") hidePanel();
    };
    document.addEventListener("keydown", keyHandler, true);
  }
  function hidePanel() {
    panel.style.display = "none";
    btn.setAttribute("aria-expanded", "false");
    // No body scroll lock to revert
    document.removeEventListener("click", outsideHandler, true);
    document.removeEventListener("keydown", keyHandler, true);
    outsideHandler = null;
    keyHandler = null;
    btn.focus();
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (panel.style.display === "none") showPanel();
    else hidePanel();
  });

  // Mount
  select.style.display = "none";
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(btn);
  wrapper.appendChild(panel);

  // If no option is explicitly marked selected in markup, start with no selection
  try {
    const hasDefaultSelected = Array.from(select.options).some(
      (o) => o.defaultSelected
    );
    if (!hasDefaultSelected) {
      // Avoid implicit browser selection of the first option
      select.selectedIndex = -1;
    }
  } catch {}

  buildPanel();
  updateButtonText();

  // Debounced search filter behavior
  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };
  search.addEventListener(
    "input",
    debounce(() => {
      const q = search.value.trim().toLowerCase();
      const rows = rowsContainer.querySelectorAll("[data-row], [data-group]");
      rows.forEach((el) => {
        const txt = (
          el.getAttribute("data-text") ||
          el.textContent ||
          ""
        ).toLowerCase();
        el.style.display = !q || txt.includes(q) ? "" : "none";
      });
    }, 150)
  );

  // Watch for dynamic option changes
  const mo = new MutationObserver(() => {
    buildPanel();
    updateButtonText();
  });
  mo.observe(select, { subtree: true, childList: true, attributes: true });
}

// ===== Global enhancer: CC/SOCRATES as multi-select, Social History as single-select =====
function enhanceSocratesSelectsInFlow() {
  // Multi-select (checkbox dropdown)
  const multiIds = [
    "chief-complaint",
    "site",
    "onset",
    "character",
    "radiation",
    "associated",
    "timing",
    "exacerbating",
    "relieving",
    "severity",
  ];
  multiIds.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;
    if (select.dataset.enhanced === "1") return;
    select.multiple = true;
    select.setAttribute("data-dropdown-checkbox", "");
    enhanceOneInFlow(select);
  });

  // Single-select (radio dropdown) for Social History
  const singleIds = ["smoking", "alcohol", "occupation", "living", "travel"];
  singleIds.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;
    // Respect native opt-out: remove previous wrapper if any, then skip
    if (select.dataset && select.dataset.native === "1") {
      try {
        const prev = select.previousElementSibling;
        if (
          prev &&
          prev.classList &&
          prev.classList.contains("dropdown-single-wrapper")
        ) {
          prev.remove();
        }
        select.style.display = "";
        if (select.dataset.enhanced === "1") delete select.dataset.enhanced;
      } catch (e) {}
      return;
    }
    if (select.dataset.enhanced === "1") return;
    select.multiple = false;
    select.removeAttribute("data-dropdown-checkbox");
    enhanceOneSingleInFlow(select);
  });
}

function enhanceOneSingleInFlow(select) {
  select.dataset.enhanced = "1";

  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-single-wrapper";
  wrapper.style.width = "100%";
  wrapper.style.marginTop = "6px";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dropdown-single-button";
  Object.assign(btn.style, {
    width: "100%",
    textAlign: "left",
    padding: "10px",
    fontSize: "14px",
    border: "1px solid var(--all-text)",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
    color: "black",
  });

  const panel = document.createElement("div");
  panel.className = "dropdown-single-panel";
  Object.assign(panel.style, {
    display: "none",
    marginTop: "6px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#fafafa",
    padding: "8px",
    maxHeight: "450px",
    overflowY: "auto",
    color: "black",
  });

  // --- Typeahead search UI ---
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Type to filter...";
  Object.assign(search.style, {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 12px",
    marginBottom: "8px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    background: "#fff",
    color: "var(--all-text)",
    fontSize: "16px",
  });

  // Set placeholder color
  search.style.setProperty("--placeholder-color", "var(--all-text)");
  const placeholderStyle = document.createElement("style");
  placeholderStyle.textContent = `
    #${select.id}-search::placeholder {
      color: var(--all-text);
      opacity: 0.7;
    }
  `;
  search.id = `${select.id}-search`;
  if (!document.head.querySelector(`style[data-for="${select.id}"]`)) {
    placeholderStyle.setAttribute("data-for", select.id);
    document.head.appendChild(placeholderStyle);
  }

  const rowsContainer = document.createElement("div");

  function createOptionRow(text, value, selected) {
    const row = document.createElement("label");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "12px";
    row.style.padding = "12px 8px";
    row.setAttribute("data-row", "1");
    row.setAttribute("data-text", text.toLowerCase());
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", selected ? "true" : "false");

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `${select.id}-radio`;
    radio.value = value;
    radio.checked = !!selected;
    radio.addEventListener("change", () => {
      select.value = value;
      updateButtonText();
    });

    const span = document.createElement("span");
    span.textContent = text;
    span.style.color = "black";

    // Also make row clickable
    row.addEventListener("click", (e) => {
      if (e.target !== radio) {
        radio.checked = true;
        select.value = value;
        updateButtonText();
      }
    });

    row.appendChild(radio);
    row.appendChild(span);
    return row;
  }

  function buildPanel() {
    panel.innerHTML = "";
    panel.appendChild(search);
    rowsContainer.innerHTML = "";

    // Check if this is a SOCRATES field that should use row layout
    const socratesFields = [
      "onset",
      "character",
      "radiation",
      "timing",
      "exacerbating",
      "relieving",
      "severity",
    ];
    const isSOCRATESField = socratesFields.includes(select.id);

    const children = Array.from(select.children);
    children.forEach((child) => {
      if (child.tagName === "OPTGROUP") {
        const groupLabel = document.createElement("div");
        groupLabel.textContent = child.label;
        groupLabel.setAttribute("data-group", "1");
        groupLabel.setAttribute("data-text", child.label.toLowerCase());
        Object.assign(groupLabel.style, {
          fontWeight: "600",
          marginTop: "12px",
          marginBottom: "8px",
          color: "var(--all-text)",
        });
        rowsContainer.appendChild(groupLabel);

        if (isSOCRATESField) {
          // Create flex container for row layout
          const optionsContainer = document.createElement("div");
          Object.assign(optionsContainer.style, {
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "16px",
          });

          Array.from(child.children).forEach((opt) => {
            const optionRow = createOptionRow(
              opt.text,
              opt.value,
              opt.selected
            );
            // Modify styling for inline display
            Object.assign(optionRow.style, {
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              border: "none",
              borderRadius: "20px",
              background: opt.selected ? "#e3f2fd" : "transparent",
              cursor: "pointer",
              fontSize: "14px",
              whiteSpace: "nowrap",
              flexShrink: "0",
            });
            optionsContainer.appendChild(optionRow);
          });

          rowsContainer.appendChild(optionsContainer);
        } else {
          // Use original vertical layout for non-SOCRATES fields
          Array.from(child.children).forEach((opt) => {
            rowsContainer.appendChild(
              createOptionRow(opt.text, opt.value, opt.selected)
            );
          });
        }
      } else if (child.tagName === "OPTION") {
        const optionRow = createOptionRow(
          child.text,
          child.value,
          child.selected
        );
        if (isSOCRATESField) {
          // Style for inline display
          Object.assign(optionRow.style, {
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            border: "none",
            borderRadius: "20px",
            background: child.selected ? "#e3f2fd" : "transparent",
            cursor: "pointer",
            fontSize: "14px",
            whiteSpace: "nowrap",
            flexShrink: "0",
            marginRight: "8px",
            marginBottom: "8px",
          });
        }
        rowsContainer.appendChild(optionRow);
      }
    });

    panel.appendChild(rowsContainer);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.marginTop = "8px";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.textContent = "Clear";
    Object.assign(clearBtn.style, {
      padding: "12px 14px",
      border: "1px solid var(--all-text)",
      borderRadius: "4px",
      background: "#f7f7f7",
      cursor: "pointer",
      color: "black",
      fontSize: "16px",
    });
    clearBtn.addEventListener("click", () => {
      // For Social History fields, reset to placeholder option (index 0)
      const socialHistoryFields = [
        "smoking",
        "alcohol",
        "occupation",
        "living",
        "travel",
      ];
      if (socialHistoryFields.includes(select.id)) {
        select.selectedIndex = 0; // Reset to placeholder
      } else {
        select.selectedIndex = -1; // Truly clear for other fields
      }
      panel
        .querySelectorAll('input[type="radio"]')
        .forEach((r) => (r.checked = false));
      updateButtonText();

      // Trigger change event to update progress tracker
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const doneBtn = document.createElement("button");
    doneBtn.type = "button";
    doneBtn.textContent = "Done";
    Object.assign(doneBtn.style, {
      padding: "6px 10px",
      border: "1px solid #2cc9c7",
      borderRadius: "4px",
      color: "black",
      background: "#e8fbfb",
      cursor: "pointer",
      marginLeft: "auto",
    });
    doneBtn.addEventListener("click", () => hidePanel());

    actions.appendChild(clearBtn);
    actions.appendChild(doneBtn);
    panel.appendChild(actions);
  }

  function updateButtonText() {
    const labelEl = select
      .closest(".form-subsection, .form-section")
      ?.querySelector(`label[for="${select.id}"]`);
    const base = labelEl
      ? `${labelEl.innerText.trim()} — select...`
      : "Select option";
    const text = select.options[select.selectedIndex]?.text?.trim();
    btn.textContent = text || base;
  }

  let outsideHandler = null;
  let keyHandler = null;
  function showPanel() {
    panel.style.display = "block";
    btn.setAttribute("aria-expanded", "true");
    // Allow page scroll while dropdown is open
    setTimeout(() => search.focus(), 0);
    outsideHandler = (e) => {
      if (!wrapper.contains(e.target)) hidePanel();
    };
    document.addEventListener("click", outsideHandler, true);
    keyHandler = (e) => {
      if (e.key === "Escape") hidePanel();
    };
    document.addEventListener("keydown", keyHandler, true);
  }
  function hidePanel() {
    panel.style.display = "none";
    btn.setAttribute("aria-expanded", "false");
    // No body scroll lock to revert
    document.removeEventListener("click", outsideHandler, true);
    document.removeEventListener("keydown", keyHandler, true);
    outsideHandler = null;
    keyHandler = null;
    btn.focus();
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (panel.style.display === "none") showPanel();
    else hidePanel();
  });

  // Mount
  select.style.display = "none";
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(btn);
  wrapper.appendChild(panel);

  // Handle initial selection state for Social History fields
  try {
    const socialHistoryFields = [
      "smoking",
      "alcohol",
      "occupation",
      "living",
      "travel",
    ];
    const hasDefaultSelected = Array.from(select.options).some(
      (o) => o.defaultSelected
    );

    if (socialHistoryFields.includes(select.id)) {
      // For Social History fields, always start with placeholder (index 0)
      select.selectedIndex = 0;
    } else if (!hasDefaultSelected) {
      // For other fields, avoid implicit browser selection of the first option
      select.selectedIndex = -1;
    }
  } catch {}

  buildPanel();
  updateButtonText();

  // Search filter behavior
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    const rows = rowsContainer.querySelectorAll("[data-row], [data-group]");
    rows.forEach((el) => {
      const txt = (
        el.getAttribute("data-text") ||
        el.textContent ||
        ""
      ).toLowerCase();
      el.style.display = !q || txt.includes(q) ? "" : "none";
    });
  });

  // Watch for dynamic option changes
  const mo = new MutationObserver(() => {
    buildPanel();
    updateButtonText();
  });
  mo.observe(select, { subtree: true, childList: true, attributes: true });
}

/**---------------- */

// Call this function every time you inject the history form HTML
function animateHistoryForm() {
  const container = document.getElementById("history-form-container");
  if (!container) return;

  const elementsToAnimate = [
    container.querySelector("h2"),
    ...container.querySelectorAll(".form-section"),
  ].filter(Boolean);

  // Reset animation state
  elementsToAnimate.forEach((el) => {
    el.classList.remove("animate-on-load");
    el.style.opacity = "0";
    el.style.animationDelay = "";
  });

  // Trigger animation with staggered delays
  elementsToAnimate.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add("animate-on-load");
      el.style.animationDelay = `${i * 0.1}s`;
    }, 50);
  });
}

// Call this to bind event listeners after injecting HTML
function setupHistoryFormEvents() {
  const btn = document.getElementById("submit-and-download");
  if (!btn) return;

  btn.onclick = () => {
    // Your PDF generation code here, or call your existing function
    console.log("Submit & Download clicked");
  };
}

// Example: call this after you inject the history form HTML into the DOM
function onHistoryFormInjected() {
  animateHistoryForm();
  setupHistoryFormEvents();
  // Apply dropdown-style UI to multi-select sections (PMH/PSH/Drugs/Allergies)
  enhanceDropdownCheckboxesInFlow();
  // Apply same dropdown style to SOCRATES single-selects
  enhanceSocratesSelectsInFlow();
  // Render recent history sidebar
  try {
    renderHistorySidebar();
  } catch (e) {
    console.warn("[BAU] history sidebar init failed:", e);
  }
}

// Example usage:
// After injecting your HTML dynamically, call:
onHistoryFormInjected();

// Build and mount a slide-in recent-history sidebar with overlay and toggle button
async function renderHistorySidebar() {
  const root = document.getElementById("history-form-container");

  // Get existing toggle button from header
  const externalToggleBtn = document.getElementById(
    "bau-history-external-toggle"
  );

  // Only make button visible if sidebar is not currently open
  if (externalToggleBtn) {
    // Check if sidebar is currently open by looking for the drawer's transform state
    const existingDrawer = document.getElementById("bau-history-drawer");
    const isDrawerOpen =
      existingDrawer && existingDrawer.style.transform === "translateX(0px)";

    if (!isDrawerOpen) {
      Object.assign(externalToggleBtn.style, {
        display: "block",
        opacity: "1",
        visibility: "visible",
        pointerEvents: "auto",
      });
    }
    console.log("[BAU] Button made visible:", externalToggleBtn);
  } else {
    console.error("[BAU] External toggle button not found!");
    return;
  }

  // Check if drawer already exists and if event listeners are already attached
  const existingDrawer = document.getElementById("bau-history-drawer");
  if (
    existingDrawer &&
    externalToggleBtn.dataset.listenersAttached === "true"
  ) {
    console.log("[BAU] Drawer and listeners already exist, skipping");
    return;
  }

  if (existingDrawer) {
    console.log("[BAU] Drawer exists but listeners need to be attached");
  }

  // Button is now in header, no need to append to body

  // Add debug logging to verify button creation and positioning
  console.log("[BAU] External toggle button created:", externalToggleBtn);
  console.log("[BAU] Button styles:", {
    position: externalToggleBtn.style.position,
    top: externalToggleBtn.style.top,
    left: externalToggleBtn.style.left,
    opacity: externalToggleBtn.style.opacity,
    zIndex: externalToggleBtn.style.zIndex,
    display: externalToggleBtn.style.display,
  });

  // Ensure button is visible after a short delay
  setTimeout(() => {
    console.log(
      "[BAU] Button position after delay:",
      externalToggleBtn.getBoundingClientRect()
    );
  }, 100);

  // No overlay needed - remove it entirely

  // Drawer - full vertical sidebar
  const drawer = document.createElement("aside");
  drawer.id = "bau-history-drawer";
  Object.assign(drawer.style, {
    position: "fixed",
    top: "0",
    left: "0",
    height: "100dvh",
    width: "300px",
    transform: "translateX(-100%)",
    transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    background: "var(--header-bg)",
    border: "none",
    color: "var(--all-text)",
    zIndex: "1000000",
    display: "flex",
    flexDirection: "column",
  });
  // Account for iOS safe-area so bottom content isn't hidden by toolbars/home indicator
  drawer.style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
  // Disable text selection inside the sidebar for smoother touch scrolling on iPad
  drawer.style.userSelect = "none";
  drawer.style.webkitUserSelect = "none";
  // Prevent any accidental horizontal scrolling
  drawer.style.overflowX = "hidden";
  // Ensure touch scrolling is vertical and smooth on iPad (including edges)
  drawer.style.touchAction = "pan-y";

  // Force sidebar z-index
  drawer.style.setProperty("z-index", "1000000", "important");

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.padding = "10.5px";
  header.style.paddingRight = "14px";
  // Make header sticky like the bottom user section
  header.style.position = "sticky";
  header.style.top = "0";
  header.style.zIndex = "2";
  header.style.background = "transparent";
  header.style.backdropFilter = "none";
  header.style.webkitBackdropFilter = "none";
  header.style.borderBottom = "1px solid var(--borderbottomdark)";

  // Create left section with close button and title
  const leftSection = document.createElement("div");
  leftSection.style.display = "flex";
  leftSection.style.alignItems = "center";
  leftSection.style.gap = "12px";

  // Internal close button (part of sidebar header)
  const internalCloseBtn = document.createElement("button");
  internalCloseBtn.type = "button";
  internalCloseBtn.textContent = "✕";
  Object.assign(internalCloseBtn.style, {
    padding: "8px",
    border: "none",
    borderRadius: "6px",
    background: "transparent",
    color: "var(--all-text)",
    cursor: "pointer",
    fontSize: "18px",
    marginTop: "5px",
    lineHeight: "1",
    position: "relative",
    zIndex: "1000001",
    pointerEvents: "auto",
  });

  // Force high z-index with important
  internalCloseBtn.style.setProperty("z-index", "1000001", "important");
  internalCloseBtn.style.setProperty("pointer-events", "auto", "important");

  const hTitle = document.createElement("div");
  hTitle.textContent = "Recent Histories";
  Object.assign(hTitle.style, {
    marginTop: "6px",
    paddingLeft: "25px",
  });
  hTitle.style.fontWeight = "600";

  leftSection.appendChild(internalCloseBtn);
  leftSection.appendChild(hTitle);

  const actionsWrap = document.createElement("div");
  actionsWrap.style.display = "flex";
  actionsWrap.style.gap = "8px";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
  </svg>`;
  Object.assign(clearBtn.style, {
    padding: "6px 10px",
    paddingTop: "10px",
    border: "none",
    borderRadius: "6px",
    background: "transparent",
    color: "var(--all-text)",
    cursor: "pointer",
    position: "relative",
    zIndex: "1000001",
    pointerEvents: "auto",
    marginTop: "8px",
  });

  // Force high z-index with important
  clearBtn.style.setProperty("z-index", "1000001", "important");
  clearBtn.style.setProperty("pointer-events", "auto", "important");

  actionsWrap.appendChild(clearBtn);
  header.appendChild(leftSection);
  header.appendChild(actionsWrap);

  // Sidebar message bar (to show status inside the sidebar)
  const sidebarMsg = document.createElement("div");
  Object.assign(sidebarMsg.style, {
    display: "none",
    margin: "0 16px",
    marginTop: "-6px",
    marginBottom: "8px",
    padding: "8px 12px",
    borderRadius: "10px",
    fontSize: "13px",
    lineHeight: "1.3",
    color: "var(--all-text)",
    background: "rgba(150,150,150,0.18)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
  });

  const sidebarMessage = (_text, _kind = "info") => {
    // Disabled per user request: do not show any sidebar messages
    sidebarMsg.style.display = "none";
    return;
  };

  const list = document.createElement("div");
  list.id = "bau-history-list";
  Object.assign(list.style, {
    padding: "16px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: "1", // Take remaining space between header and user section
  });
  // Smooth iOS momentum scroll and disable accidental text selection
  list.style.WebkitOverflowScrolling = "touch";
  list.style.userSelect = "none";
  list.style.webkitUserSelect = "none";
  list.style.overflowX = "hidden";
  list.style.touchAction = "pan-y";
  // Programmatic smooth scrolling (no effect on touch but harmless)
  list.style.scrollBehavior = "smooth";

  // Allow scrolling even when starting drag on margins/header inside the drawer
  // Route wheel/touch drags on the drawer to the scrollable list
  const forwardWheelToList = (ev) => {
    // Only when the drawer itself is the target or non-scrollable areas
    // If the event originates from the list, let native behavior handle it
    if (list.contains(ev.target)) return;
    if (typeof ev.deltaY === "number" && ev.deltaY !== 0) {
      list.scrollTop += ev.deltaY;
      ev.preventDefault();
    }
  };
  const touchState = { y: 0, active: false };
  const onTouchStart = (ev) => {
    if (list.contains(ev.target)) return; // native scroll
    const t = ev.touches && ev.touches[0];
    if (!t) return;
    touchState.y = t.clientY;
    touchState.active = true;
  };
  const onTouchMove = (ev) => {
    if (!touchState.active) return;
    const t = ev.touches && ev.touches[0];
    if (!t) return;
    const dy = touchState.y - t.clientY;
    if (Math.abs(dy) > 0) {
      list.scrollTop += dy;
      touchState.y = t.clientY;
      ev.preventDefault();
    }
  };
  const onTouchEnd = () => {
    touchState.active = false;
  };
  // Attach with passive:false so we can preventDefault
  drawer.addEventListener("wheel", forwardWheelToList, { passive: false });
  drawer.addEventListener("touchstart", onTouchStart, { passive: false });
  drawer.addEventListener("touchmove", onTouchMove, { passive: false });
  drawer.addEventListener("touchend", onTouchEnd, { passive: true });

  // Create user dropdown section at bottom
  const userSection = document.createElement("div");
  userSection.id = "sidebar-user-section";
  Object.assign(userSection.style, {
    padding: "16px",
    paddingBottom: "0px",
    borderTop: "1px solid var(--borderbottomdark)",
    background: "transparent",
    marginTop: "auto", // Push to bottom
    position: "sticky",
    bottom: "0",
    zIndex: "1",
  });

  const userDropdown = document.createElement("div");
  userDropdown.id = "sidebar-user-dropdown";
  userDropdown.innerHTML = `
    <button id="sidebarUserToggle" style="
      width: 100%;
      padding: 10px 16px;
      margin-bottom: -20px;
      border: none;
      border-radius: 16px;
      background: var(--userdiv);
      color: var(--all-text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    ">
      <div style="display: flex; align-items: center; gap: 10px;">
          <div id="sidebarUserAvatar" style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">U</div>
        <span>User Menu</span>
      </div>
      <i class="fa fa-chevron-down" id="userMenuChevron" style="transition: transform 0.2s ease;"></i>
    </button>
        <div id="sidebarUserMenu" style="
          position: relative;
          width: 100%;
          background: var(--userdiv);
          border-radius: 16px;
          padding: 0;
          margin: 25px 0 0 0;
          margin-bottom: 9px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          opacity: 0;
          visibility: hidden;
          max-height: 0;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        ">
        <button id="sidebarDashboardBtn" style="
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: var(--all-text);
          cursor: pointer;
          text-align: left;
          border-radius: 8px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.2s ease;
        " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
          <i class="fa fa-tachometer" style="width: 16px;"></i>
          Dashboard
        </button>
        <button id="sidebarLogoutBtn" style="
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: #ff6b6b;
          cursor: pointer;
          text-align: left;
          border-radius: 8px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.2s ease;
        " onmouseover="this.style.background='rgba(255,107,107,0.1)'" onmouseout="this.style.background='transparent'">
          <i class="fa fa-sign-out" style="width: 16px;"></i>
          Logout
        </button>
    </div>
  `;

  userSection.appendChild(userDropdown);

  // Create note section
  const note = document.createElement("div");
  note.style.padding = "16px";
  note.style.fontSize = "9px";
  note.style.color = "var(--all-text)";
  note.style.opacity = "0.7";
  note.textContent =
    "Note: Items here are automatically deleted after 7 days. Use the recycle bin icon to delete all. Or use the three-dots on a single history to delete it.";

  drawer.appendChild(header);
  drawer.appendChild(sidebarMsg);
  drawer.appendChild(list);
  drawer.appendChild(note);
  drawer.appendChild(userSection);
  document.body.appendChild(drawer);

  // Ensure the list never hides behind the sticky user section
  const adjustForUserSection = () => {
    try {
      const userH = userSection.getBoundingClientRect().height || 0;
      // 16px base padding + safe area + user section height
      list.style.paddingBottom = `calc(16px + env(safe-area-inset-bottom, 0px) + ${Math.ceil(
        userH
      )}px)`;
    } catch {}
  };
  // Recompute when fonts load/resize/orientation changes
  window.addEventListener("resize", adjustForUserSection, { passive: true });
  window.addEventListener("orientationchange", adjustForUserSection);
  setTimeout(adjustForUserSection, 0);

  // Open/Close helpers with responsive main content
  let isOpen = false;

  const close = () => {
    drawer.style.transform = "translateX(-100%)";
    externalToggleBtn.style.display = "block";

    // Reset user menu state when sidebar closes
    const sidebarUserMenu = document.getElementById("sidebarUserMenu");
    const chevron = document.getElementById("userMenuChevron");
    if (sidebarUserMenu) {
      sidebarUserMenu.style.opacity = "0";
      sidebarUserMenu.style.visibility = "hidden";
      sidebarUserMenu.style.maxHeight = "0";
      sidebarUserMenu.style.pointerEvents = "none";
    }
    if (chevron) {
      chevron.style.transform = "rotate(0deg)";
    }

    // Restore main content
    const mainContainer = document.querySelector(".main");
    if (mainContainer) {
      mainContainer.style.marginLeft = "0";
      mainContainer.style.transition =
        "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)";
    }

    // Restore header content
    const headerContainer = document.querySelector(".header-container");
    if (headerContainer) {
      headerContainer.style.marginLeft = "0";
      headerContainer.style.transition =
        "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)";
    }

    // Remove extra margin from title when sidebar closes
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) {
      pageTitle.style.marginLeft = "0";
      pageTitle.style.transition =
        "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)";
    }

    // Hide the form SVG message when sidebar closes
    const loadHistoryMessage = document.getElementById("load-history-message");
    if (loadHistoryMessage) {
      loadHistoryMessage.style.display = "none";
    }

    // Show the header SVG when sidebar closes with fade animation
    const headerSvg = document.getElementById("header-home-svg");
    if (headerSvg) {
      headerSvg.style.display = "block";
      setTimeout(() => {
        headerSvg.style.opacity = "1";
      }, 10);
    }

    // Show the entire sidebar toggle button when sidebar closes
    if (externalToggleBtn) {
      externalToggleBtn.style.display = "block";
    }
    // Remove the click-anywhere-to-close listener
    document.removeEventListener("click", handleOutsideClick);

    // Clean up any stuck trash icons
    const trashIcon = document.querySelector(".drag-trash-icon");
    if (trashIcon) {
      trashIcon.remove();
    }

    // Run all cleanup functions
    if (window.sidebarCleanupFunctions) {
      window.sidebarCleanupFunctions.forEach((cleanup) => cleanup());
      window.sidebarCleanupFunctions = [];
    }

    // Also close any open history kebab menu (appended to body)
    try {
      const openRef = window.__bauOpenHistoryMenu;
      if (openRef && openRef.menu) {
        if (typeof openRef.off === "function") {
          try {
            openRef.off();
          } catch {}
        }
        openRef.menu.style.display = "none";
        if (openRef.btn) {
          openRef.btn.classList.remove("kebab-open");
          openRef.btn.style.background = "transparent";
          openRef.btn.style.boxShadow = "none";
          openRef.btn.style.transform = "none";
          openRef.btn.setAttribute &&
            openRef.btn.setAttribute("aria-expanded", "false");
        }
        window.__bauOpenHistoryMenu = { btn: null, menu: null, off: null };
      }
    } catch {}

    isOpen = false;
  };

  const open = () => {
    drawer.style.transform = "translateX(0)";
    externalToggleBtn.style.display = "none";

    // Push main content to the right
    const mainContainer = document.querySelector(".main");
    if (mainContainer) {
      mainContainer.style.marginLeft = "300px";
      mainContainer.style.transition =
        "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)";
    }

    // Push header content to the right to make it responsive
    const headerContainer = document.querySelector(".header-container");
    if (headerContainer) {
      headerContainer.style.marginLeft = "300px";
      headerContainer.style.transition =
        "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)";
    }

    // Add extra margin to title when sidebar opens
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) {
      pageTitle.style.marginLeft = "5px";
      pageTitle.style.transition =
        "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)";
    }

    // Hide the form SVG message when sidebar opens
    const loadHistoryMessage = document.getElementById("load-history-message");
    if (loadHistoryMessage) {
      loadHistoryMessage.style.display = "none";
    }

    // Hide the header SVG when sidebar opens
    const headerSvg = document.getElementById("header-home-svg");
    if (headerSvg) {
      headerSvg.style.display = "none";
    }

    // Hide the entire sidebar toggle button when sidebar opens
    if (externalToggleBtn) {
      externalToggleBtn.style.display = "none";
    }
    isOpen = true;
    // Load or refresh histories each time drawer opens
    loadHistories();

    // Make sure user section is accounted for and list starts at top
    setTimeout(() => {
      adjustForUserSection();
      list.scrollTop = 0;
    }, 50);

    // Add click-anywhere-to-close functionality
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 100);
  };

  // Handle clicks outside the sidebar to close it
  const handleOutsideClick = (e) => {
    if (!isOpen) return;

    // Don't close if clicking on the drawer itself or its children
    if (drawer.contains(e.target)) return;

    // Don't close if clicking on the external toggle button
    if (externalToggleBtn.contains(e.target)) return;

    // Close the sidebar
    close();
  };

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  // Add event listeners directly to original button to preserve positioning
  externalToggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[BAU] External toggle button clicked");
    toggle();
  });

  // Add mousedown as backup
  externalToggleBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[BAU] External toggle button mousedown");
  });

  // Add touchstart for mobile
  externalToggleBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[BAU] External toggle button touched");
    toggle();
  });

  // Mark that listeners are attached
  externalToggleBtn.dataset.listenersAttached = "true";
  console.log("[BAU] Event listeners attached to button");
  internalCloseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[BAU] Internal close button clicked");
    close();
  });

  // Add additional event listeners for better compatibility
  internalCloseBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  internalCloseBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[BAU] Internal close button touched");
    close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Update user info from Firebase auth
  const updateUserInfo = () => {
    const auth = window.auth;
    const user = auth?.currentUser;

    if (user) {
      const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
      const sidebarUserName = document.getElementById("sidebarUserName");
      const userMenuAvatar = document.querySelector(
        "#sidebarUserMenu .user-avatar"
      );
      const userMenuName = document.querySelector(
        "#sidebarUserMenu .user-name"
      );

      const displayName = user.displayName || user.email || "User";
      const userInitial = displayName.charAt(0).toUpperCase();

      // Update sidebar toggle avatar
      if (sidebarUserAvatar) {
        if (user.photoURL) {
          sidebarUserAvatar.innerHTML = `<img src="${user.photoURL}" alt="User" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
          sidebarUserAvatar.textContent = userInitial;
          sidebarUserAvatar.style.background =
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        }
      }

      // Update sidebar user name
      if (sidebarUserName) {
        sidebarUserName.textContent = displayName;
      }

      // Update user menu avatar and name
      if (userMenuAvatar) {
        if (user.photoURL) {
          userMenuAvatar.innerHTML = `<img src="${user.photoURL}" alt="User" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
          userMenuAvatar.textContent = userInitial;
          userMenuAvatar.style.background =
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        }
      }

      if (userMenuName) {
        userMenuName.textContent = displayName;
      }

      console.log("[BAU] User info updated:", {
        displayName,
        photoURL: user.photoURL,
      });
    }
  };

  // Call updateUserInfo after a delay to ensure Firebase auth is ready
  setTimeout(updateUserInfo, 500);

  // Also listen for auth state changes to update user info dynamically
  if (window.auth) {
    window.auth.onAuthStateChanged((user) => {
      if (user) {
        setTimeout(updateUserInfo, 100);
      }
    });
  }

  // User dropdown functionality - wait for elements to be available and sidebar to be created
  const waitForUserMenuElements = () => {
    const sidebarUserToggle = document.getElementById("sidebarUserToggle");
    const sidebarUserMenu = document.getElementById("sidebarUserMenu");

    if (!sidebarUserToggle || !sidebarUserMenu) {
      console.log("[BAU] User menu elements not ready, retrying...");
      setTimeout(waitForUserMenuElements, 500);
      return;
    }

    console.log("[BAU] User menu elements found, setting up...");
    const sidebarDashboardBtn = document.getElementById("sidebarDashboardBtn");
    const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");

    // Initialize menu as hidden
    sidebarUserMenu.style.opacity = "0";
    sidebarUserMenu.style.visibility = "hidden";
    sidebarUserMenu.style.maxHeight = "0";
    sidebarUserMenu.style.pointerEvents = "none";

    console.log("[BAU] User menu elements found:", {
      toggle: !!sidebarUserToggle,
      menu: !!sidebarUserMenu,
      dashboard: !!sidebarDashboardBtn,
      logout: !!sidebarLogoutBtn,
    });

    // Debug: Log the actual elements
    if (sidebarUserToggle) {
      console.log("[BAU] Toggle element:", sidebarUserToggle);
    }
    if (sidebarUserMenu) {
      console.log("[BAU] Menu element:", sidebarUserMenu);
      console.log("[BAU] Menu current styles:", {
        opacity: sidebarUserMenu.style.opacity,
        visibility: sidebarUserMenu.style.visibility,
        transform: sidebarUserMenu.style.transform,
        pointerEvents: sidebarUserMenu.style.pointerEvents,
      });
    }

    let userMenuOpen = false;

    const toggleUserMenu = () => {
      userMenuOpen = !userMenuOpen;
      const chevron = document.getElementById("userMenuChevron");

      console.log(
        "[BAU] Toggling user menu to:",
        userMenuOpen,
        "Menu element:",
        !!sidebarUserMenu
      );

      if (userMenuOpen) {
        sidebarUserMenu.style.opacity = "1";
        sidebarUserMenu.style.transform = "translateX(0) scale(1)";
        sidebarUserMenu.style.pointerEvents = "auto";
        sidebarUserMenu.style.visibility = "visible";
        if (chevron) {
          chevron.style.transform = "rotate(180deg)";
        }
        console.log("[BAU] User menu opened");
      } else {
        sidebarUserMenu.style.opacity = "0";
        sidebarUserMenu.style.transform = "translateX(0) scale(0.95)";
        sidebarUserMenu.style.pointerEvents = "none";
        sidebarUserMenu.style.visibility = "hidden";
        if (chevron) {
          chevron.style.transform = "rotate(0deg)";
        }
        console.log("[BAU] User menu closed");
      }
    };

    const closeUserMenu = () => {
      userMenuOpen = false;
      const chevron = document.getElementById("userMenuChevron");
      sidebarUserMenu.style.opacity = "0";
      sidebarUserMenu.style.transform = "translateX(0) scale(0.95)";
      sidebarUserMenu.style.pointerEvents = "none";
      sidebarUserMenu.style.visibility = "hidden";
      if (chevron) {
        chevron.style.transform = "rotate(0deg)";
      }
    };

    if (sidebarUserToggle && sidebarUserMenu) {
      sidebarUserToggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[BAU] User toggle clicked, current state:", userMenuOpen);

        // Force toggle the menu visibility
        if (userMenuOpen) {
          sidebarUserMenu.style.opacity = "0";
          sidebarUserMenu.style.visibility = "hidden";
          sidebarUserMenu.style.maxHeight = "0";
          sidebarUserMenu.style.pointerEvents = "none";
          sidebarUserMenu.style.transform = "translateX(0) scale(0.95)";
          userMenuOpen = false;
          console.log("[BAU] Menu closed");
        } else {
          sidebarUserMenu.style.opacity = "1";
          sidebarUserMenu.style.visibility = "visible";
          sidebarUserMenu.style.maxHeight = "300px";
          sidebarUserMenu.style.pointerEvents = "auto";
          sidebarUserMenu.style.transform = "translateX(0) scale(1)";
          userMenuOpen = true;
          console.log("[BAU] Menu opened");
        }

        // Update chevron
        const chevron = document.getElementById("userMenuChevron");
        if (chevron) {
          chevron.style.transform = userMenuOpen
            ? "rotate(180deg)"
            : "rotate(0deg)";
        }
      });

      console.log(
        "[BAU] User menu toggle event listeners attached successfully"
      );
    } else {
      console.warn("[BAU] sidebarUserToggle or sidebarUserMenu not found", {
        toggle: !!sidebarUserToggle,
        menu: !!sidebarUserMenu,
      });
    }

    // Dashboard button
    if (sidebarDashboardBtn) {
      sidebarDashboardBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("[BAU] Dashboard clicked from sidebar");
        if (window.loadDashboard) {
          window.loadDashboard();
          if (window.updateNavActiveState) {
            window.updateNavActiveState("dashboard");
          }
        }
        closeUserMenu();
        close(); // Close the sidebar
      });
    }

    // Theme button functionality removed - now in dashboard settings

    // Logout button
    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("[BAU] Logout clicked from sidebar");
        const auth = window.auth;
        if (auth && window.signOut) {
          window
            .signOut(auth)
            .then(() => {
              console.log("[BAU] Signed out successfully from sidebar");
              if (window.restoreAccountButton) {
                window.restoreAccountButton();
              }
              if (window.loadDefaultPage && window.updateNavActiveState) {
                window.loadDefaultPage().then(() => {
                  window.updateNavActiveState("bau");
                });
              }
            })
            .catch((err) => {
              console.error("[BAU] Sign out error from sidebar:", err);
            });
        }
        closeUserMenu();
        close(); // Close the sidebar
      });
    }

    // Theme button text functionality removed - theme selection now in dashboard settings
  };

  // Start waiting for user menu elements
  setTimeout(waitForUserMenuElements, 1000);

  // Clear histories for current user (INSIDE sidebar scope)
  clearBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[BAU] Clear button clicked");
    try {
      const auth = window.auth;
      const user = auth?.currentUser || null;
      if (!user) {
        sidebarMessage("Please sign in to manage histories.");
        return;
      }
      // Show confirmation dialog for clear all
      showClearAllConfirmation(async (confirmed) => {
        if (!confirmed) return;

        const db = window.db;
        const { collection, getDocs, query } = window;
        const { deleteDoc } = window;
        if (!deleteDoc) {
          console.warn("[BAU] deleteDoc not available on window");
          sidebarMessage("Clear failed: delete API unavailable.", "error");
          return;
        }

        const col = collection(db, "users", user.uid, "histories");
        const q = query(col);
        const snap = await getDocs(q);
        if (snap.empty) {
          sidebarMessage("No histories to clear.");
          return;
        }

        // Animate collapse of all visible items while deleting in background
        const items = Array.from(list.querySelectorAll(".bau-history-item"));
        items.forEach((el, idx) => {
          const h = el.offsetHeight;
          el.style.height = h + "px";
          el.style.overflow = "hidden";
          el.style.transition =
            "height 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease, transform 300ms ease, margin 300ms ease";
          // stagger a bit for nicer effect
          const delay = idx * 30;
          el.style.transitionDelay = `${delay}ms, ${delay}ms, ${delay}ms, ${delay}ms`;
          // force reflow
          void el.offsetHeight;
          el.style.opacity = "0";
          el.style.transform = "translateY(-6px)";
          el.style.marginTop = "0";
          el.style.marginBottom = "0";
          el.style.height = "0px";
        });

        // Begin deletions in background
        const deletions = [];
        snap.forEach((docSnap) => {
          if (docSnap.ref) deletions.push(deleteDoc(docSnap.ref));
        });

        // After animation completes, clear the list visually
        const totalAnim = (items.length ? (items.length - 1) * 30 : 0) + 400;
        await new Promise((r) => setTimeout(r, totalAnim));
        // Remove children after animation
        items.forEach((el) => el.remove());

        // Wait for deletions to settle then show message and refresh state
        await Promise.allSettled(deletions);
        sidebarMessage("All histories cleared.", "success");
        // Don't refresh sidebar - it breaks functionality
        // The sidebar will show "No saved histories" message naturally
      });
    } catch (error) {
      console.error("[BAU] Failed to clear histories:", error);
    }
    sidebarMessage("Failed to clear histories.", "error");
  });

  // Add additional event listeners for Clear button
  clearBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  clearBtn.addEventListener("touchstart", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[BAU] Clear button touched");
    // Trigger the same clear functionality
    clearBtn.click();
  });

  // Helper: prune old histories (>5 days) and cap total per user
  async function pruneOldHistories() {
    try {
      const auth = window.auth;
      const user = auth?.currentUser || null;
      if (!user) return;
      const db = window.db;
      const { collection, query, getDocs } = window;
      const { deleteDoc } = window;
      if (!db || !collection || !query || !getDocs || !deleteDoc) return;

      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const MAX_KEEP = 50; // cap per user
      const MAX_DELETE_PER_RUN = 100; // safety cap
      const now = Date.now();

      const col = collection(db, "users", user.uid, "histories");
      const snap = await getDocs(query(col)); // reads all docs in the subcollection
      if (snap.empty) return;

      const docs = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data() || {};
        // derive timestamps
        const toMillis = (ts) =>
          ts && typeof ts.toMillis === "function" ? ts.toMillis() : null;
        // Prefer client numeric timestamp when present, then server Timestamp, then parse string
        let createdMs =
          typeof d.createdMs === "number"
            ? d.createdMs
            : toMillis(d.createdAtTs);
        if (!createdMs && d.createdAt) {
          const dt = new Date(d.createdAt);
          createdMs = isNaN(dt.getTime()) ? null : dt.getTime();
        }
        const expMs =
          toMillis(d.expiresAt) ??
          (createdMs ? createdMs + SEVEN_DAYS_MS : null);
        docs.push({
          ref: docSnap.ref,
          createdMs: createdMs ?? 0,
          expMs: expMs ?? 0,
        });
      });

      // Determine deletions
      const toDelete = [];
      // 1) Expired
      docs.forEach((it) => {
        if (it.expMs && it.expMs < now) toDelete.push(it.ref);
      });
      // 2) Cap oldest beyond MAX_KEEP
      const sorted = docs
        .slice()
        .sort((a, b) => (b.createdMs || 0) - (a.createdMs || 0));
      if (sorted.length > MAX_KEEP) {
        for (let i = MAX_KEEP; i < sorted.length; i++) {
          toDelete.push(sorted[i].ref);
        }
      }

      if (!toDelete.length) return;
      const limited = toDelete.slice(0, MAX_DELETE_PER_RUN);
      await Promise.allSettled(limited.map((ref) => deleteDoc(ref)));
      console.log(`[BAU] Pruned histories: ${limited.length} doc(s)`);
    } catch (e) {
      console.warn("[BAU] pruneOldHistories failed:", e);
    }
  }

  // Load histories function, called on open and on auth changes
  async function loadHistories() {
    try {
      const auth = window.auth;
      const user = auth?.currentUser || null;
      if (!user) {
        const p = document.createElement("p");
        p.textContent = "Sign in to view your recent histories.";
        p.style.margin = "4px 0 0 0";
        list.replaceChildren(p);
        return;
      }

      const db = window.db;
      const { collection, query, orderBy, limit, getDocs } = window;

      // Prune expired/old docs before loading
      await pruneOldHistories();

      // Prefer client numeric timestamp for immediate local visibility; fall back as needed
      let q;
      try {
        q = query(
          collection(db, "users", user.uid, "histories"),
          orderBy("createdMs", "desc"),
          limit(20)
        );
      } catch {
        try {
          q = query(
            collection(db, "users", user.uid, "histories"),
            orderBy("createdAtTs", "desc"),
            limit(20)
          );
        } catch {
          q = query(
            collection(db, "users", user.uid, "histories"),
            orderBy("createdAt", "desc"),
            limit(20)
          );
        }
      }
      let snap = await getDocs(q);

      // Fallback: if empty, try without order (some docs may be missing the ordered field)
      if (snap.empty) {
        try {
          const colRef = collection(db, "users", user.uid, "histories");
          snap = await getDocs(query(colRef));
        } catch (e) {
          console.warn("[BAU] Fallback loadHistories query failed:", e);
        }
      }

      list.innerHTML = "";

      // Add "New Form" choice above histories
      const newFormItem = document.createElement("div");
      Object.assign(newFormItem.style, {
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: "12px",
        border: "none",
        borderRadius: "2px",
        padding: "10px",
        paddingBottom: "20px",
        marginBottom: "12px",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
        borderBottom: "1px solid var(--borderbottom)",
      });

      // Add header SVG icon
      const headerIcon = document.createElement("div");
      headerIcon.innerHTML = `
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          style="color: var(--all-text);"
        >
          <path
            d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64315 16.8867 6.53515L16.7197 6.71973C15.829 7.61031 14.4203 7.666 13.4648 6.88672L13.2978 6.70215C12.5702 5.81015 12.57 4.52385 13.2976 3.63185L13.4646 3.11328Z"
          ></path>
        </svg>
      `;

      const newFormLabel = document.createElement("div");
      newFormLabel.textContent = "New Form";
      newFormLabel.style.fontWeight = "600";
      newFormLabel.style.color = "var(--all-text)";

      const newFormButton = document.createElement("button");
      newFormButton.type = "button";
      newFormButton.textContent = "Start";
      Object.assign(newFormButton.style, {
        padding: "6px 10px",
        border: "none",
        borderRadius: "6px",
        background: "transparent",
        color: "var(--all-text)",
        cursor: "pointer",
      });

      newFormButton.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("[BAU] New Form button clicked");

        // Navigate to BAU page if we're not already there
        if (typeof window.loadContent === "function") {
          console.log("[BAU] Navigating to BAU page");
          window.loadContent("bau").then(() => {
            if (typeof window.updateNavActiveState === "function") {
              window.updateNavActiveState("bau");
            }
            // Refresh the page to ensure clean state
            setTimeout(() => {
              window.location.href = window.location.href;
            }, 100);
          });
        } else {
          console.log(
            "[BAU] loadContent function not available, refreshing page"
          );
          // Fallback: refresh the page
          window.location.href = window.location.href;
        }
        close();
      });

      // Make the whole item clickable
      newFormItem.addEventListener("click", () => {
        newFormButton.click();
      });

      // Hover effect
      newFormItem.addEventListener("mouseenter", () => {
        newFormItem.style.backgroundColor =
          "rgba(var(--all-text-rgb, 0, 0, 0), 0.05)";
      });
      newFormItem.addEventListener("mouseleave", () => {
        newFormItem.style.backgroundColor = "transparent";
      });

      newFormItem.appendChild(headerIcon);
      newFormItem.appendChild(newFormLabel);
      newFormItem.appendChild(newFormButton);
      list.appendChild(newFormItem);

      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const toMillis = (ts) =>
        ts && typeof ts.toMillis === "function" ? ts.toMillis() : null;
      const fmtRemaining = (ms) => {
        if (ms <= 0) return "expired";
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hrs = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        if (days > 0) return `${days}d ${hrs}h left`;
        const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        if (hrs > 0) return `${hrs}h ${mins}m left`;
        const secs = Math.floor((ms % (60 * 1000)) / 1000);
        if (mins > 0) return `${mins}m ${secs}s left`;
        return `${secs}s left`;
      };

      if (snap.empty) {
        const p = document.createElement("p");
        p.textContent = "No saved histories yet.";
        p.style.paddingLeft = "14.5px";
        p.style.paddingTop = "14.5px";
        list.appendChild(p);
        return;
      }

      // If we ran the fallback, snap may be unordered. Sort client-side for consistency
      const docsArr = [];
      snap.forEach((doc) => {
        const d = doc.data() || {};
        const toMillis = (ts) =>
          ts && typeof ts.toMillis === "function" ? ts.toMillis() : null;
        const created =
          typeof d.createdMs === "number"
            ? d.createdMs
            : toMillis(d.createdAtTs) ||
              (d.createdAt ? new Date(d.createdAt).getTime() || 0 : 0);
        docsArr.push({ id: doc.id, data: d, created, ref: doc.ref });
      });
      docsArr.sort((a, b) => (b.created || 0) - (a.created || 0));

      docsArr.forEach(({ data, ref }) => {
        const item = document.createElement("div");
        item.classList.add("bau-history-item");
        Object.assign(item.style, {
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: "8px",
          border: "none",
          borderRadius: "8px",
          padding: "8px",
          position: "relative",
          transition: "transform 0.3s ease",
          cursor: "default",
        });

        // Helper to load this history into the form
        const loadHistory = () => {
          try {
            // Navigate to BAU page first if we're not already there
            if (typeof window.loadContent === "function") {
              window.loadContent("bau").then(() => {
                if (typeof window.updateNavActiveState === "function") {
                  window.updateNavActiveState("bau");
                }
                // Wait until the BAU form is present before applying (iPad/Safari fix)
                const waitFor = (pred, timeout = 4000, interval = 50) =>
                  new Promise((resolve, reject) => {
                    const start = Date.now();
                    (function tick() {
                      try {
                        if (pred()) return resolve();
                      } catch {}
                      if (Date.now() - start >= timeout)
                        return reject(new Error("timeout"));
                      setTimeout(tick, interval);
                    })();
                  });
                waitFor(
                  () =>
                    document.getElementById("history-form-container") &&
                    document.getElementById("ai-generate"),
                  4000,
                  50
                )
                  .then(() => {
                    // Apply form snapshot
                    const snap = data.data || {};
                    applySnapshotToForm(snap);
                    try {
                      const cnt =
                        document.querySelectorAll("input.ros:checked").length;
                      console.debug(
                        "[HISTORY:LOAD] ROS checked after applySnapshotToForm:",
                        cnt
                      );
                    } catch {}

                    // Initialize AI demo handlers to ensure Generate works
                    try {
                      if (typeof window.initAIDemo === "function") {
                        window.initAIDemo();
                      }
                    } catch {}

                    // Set baseline to avoid duplicate saves if user immediately regenerates
                    try {
                      window.__bauBaselineSnapshot = snap;
                      window.__bauBaselineHash = JSON.stringify(snap);
                      const rosSnap =
                        snap && snap._rosData ? snap._rosData : null;
                      console.debug("[HISTORY:LOAD] Baseline snapshot set", {
                        hasROS: !!rosSnap,
                        rosSystems: rosSnap ? Object.keys(rosSnap) : [],
                      });
                    } catch {}
                    const patientName = data.patientName || "Unknown";
                    const loadHistoryMessage = document.getElementById(
                      "load-history-message"
                    );
                    if (loadHistoryMessage) {
                      try {
                        loadHistoryMessage.textContent = `History loaded for ${patientName}`;
                      } catch {}
                      // Show with smooth animation (matches script.js behavior)
                      loadHistoryMessage.style.display = "block";
                      loadHistoryMessage.style.marginBottom = "10px";
                      setTimeout(() => {
                        loadHistoryMessage.style.opacity = "1";
                        loadHistoryMessage.style.transform =
                          "translateY(0) scale(1)";
                      }, 10);
                      // Hide after a short delay
                      setTimeout(() => {
                        loadHistoryMessage.style.opacity = "0";
                        loadHistoryMessage.style.transform =
                          "translateY(-20px) scale(0.95)";
                        loadHistoryMessage.style.marginBottom = "0";
                        setTimeout(() => {
                          loadHistoryMessage.style.display = "none";
                        }, 500);
                      }, 3000);
                    }
                  })
                  .catch(() => {
                    // Fallback: attempt apply anyway
                    try {
                      const snap = data.data || {};
                      applySnapshotToForm(snap);
                      try {
                        const cnt =
                          document.querySelectorAll("input.ros:checked").length;
                        console.debug(
                          "[HISTORY:LOAD:FALLBACK] ROS checked after applySnapshotToForm:",
                          cnt
                        );
                      } catch {}
                      try {
                        if (typeof window.initAIDemo === "function") {
                          window.initAIDemo();
                        }
                      } catch {}
                      try {
                        window.__bauBaselineSnapshot = snap;
                        window.__bauBaselineHash = JSON.stringify(snap);
                        const rosSnap =
                          snap && snap._rosData ? snap._rosData : null;
                        console.debug(
                          "[HISTORY:LOAD:FALLBACK] Baseline snapshot set",
                          {
                            hasROS: !!rosSnap,
                            rosSystems: rosSnap ? Object.keys(rosSnap) : [],
                          }
                        );
                      } catch {}
                    } catch {}
                  });
              });
            } else {
              const snap = data.data || {};
              applySnapshotToForm(snap);
              try {
                const cnt =
                  document.querySelectorAll("input.ros:checked").length;
                console.debug(
                  "[HISTORY:LOAD:NO-SIDEBAR] ROS checked after applySnapshotToForm:",
                  cnt
                );
              } catch {}
              try {
                if (typeof window.initAIDemo === "function") {
                  window.initAIDemo();
                }
              } catch {}
              try {
                window.__bauBaselineSnapshot = snap;
                window.__bauBaselineHash = JSON.stringify(snap);
                const rosSnap = snap && snap._rosData ? snap._rosData : null;
                console.debug(
                  "[HISTORY:LOAD:NO-SIDEBAR] Baseline snapshot set",
                  {
                    hasROS: !!rosSnap,
                    rosSystems: rosSnap ? Object.keys(rosSnap) : [],
                  }
                );
              } catch {}
            }
            close();
          } catch (e) {
            console.warn("[BAU] Failed to apply snapshot:", e);
            inlineMessage("Failed to load history.");
          }
        };
        // Build human-readable date/time label for this history item
        const dt =
          parseDateSafe(data.createdAt) ||
          (data.createdAtTs && toMillis(data.createdAtTs)
            ? new Date(toMillis(data.createdAtTs))
            : typeof data.createdMs === "number"
            ? new Date(data.createdMs)
            : null);
        const when = dt
          ? dt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            }) +
            "\n" +
            dt.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })
          : data.createdAt || "";
        // Remaining time
        const createdMs =
          toMillis(data.createdAtTs) || (dt ? dt.getTime() : null) || 0;
        const expMs =
          toMillis(data.expiresAt) ||
          (createdMs ? createdMs + SEVEN_DAYS_MS : 0);
        const rem = Math.max(0, expMs - Date.now());
        const remainingText = fmtRemaining(rem);
        // Meta container for name and date
        const meta = document.createElement("div");
        meta.style.minWidth = "0"; // allow text truncation
        // Two-line meta: Name, then date/time below
        const nameLine = document.createElement("div");
        nameLine.textContent = `${data.patientName || "Unknown"}`;
        nameLine.style.fontWeight = "600";
        const dateLine = document.createElement("div");
        dateLine.textContent = when;
        dateLine.style.fontSize = "12px";
        dateLine.style.opacity = "0.85";
        dateLine.style.whiteSpace = "pre-line";
        dateLine.style.lineHeight = "1.4";
        meta.replaceChildren(nameLine, dateLine);
        meta.title = `${
          data.patientName || "Unknown"
        } — ${when} • ${remainingText}`;
        meta.style.overflow = "hidden";
        meta.style.textOverflow = "ellipsis";
        meta.style.whiteSpace = "normal";
        meta.style.display = "flex";
        meta.style.flexDirection = "column";
        meta.style.gap = "2px";

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "8px";

        // Right badge: remaining time
        const remainBadge = document.createElement("span");
        remainBadge.textContent = remainingText;
        Object.assign(remainBadge.style, {
          fontSize: "12px",
          opacity: "0.85",
          border: "none",
          borderRadius: "999px",
          padding: "2px 8px",
          whiteSpace: "nowrap",
          alignSelf: "center",
        });

        // Kebab menu button (three horizontal dots)
        const menuBtn = document.createElement("button");
        menuBtn.type = "button";
        menuBtn.setAttribute("aria-label", "History actions");
        menuBtn.setAttribute("aria-expanded", "false");
        Object.assign(menuBtn.style, {
          padding: "4px 6px",
          border: "none",
          background: "transparent",
          color: "var(--all-text)",
          cursor: "pointer",
          borderRadius: "6px",
          transition: "background-color 120ms ease, transform 120ms ease",
        });
        menuBtn.classList.add("bau-kebab-btn");
        menuBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="12" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="19" cy="12" r="2"/>
          </svg>
        `;

        // Dropdown menu panel (opens to the right, above sidebar)
        const menu = document.createElement("div");
        menu.className = "bau-history-menu";
        Object.assign(menu.style, {
          position: "absolute", // Position relative to sidebar
          background: "var(--header-bg)",
          borderRadius: "0 0 25px 25px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
          border: "none",
          borderTop: "none",
          padding: "10px 12px 8px",
          display: "none",
          zIndex: "1000002", // above sidebar
          width: "100%", // Full width of parent
          boxSizing: "border-box",
          pointerEvents: "auto",
        });

        const makeMenuItem = (label, opts = {}) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = label;
          Object.assign(btn.style, {
            width: "100%",
            textAlign: "left",
            padding: "10px 14px",
            border: "none",
            background: "transparent",
            color: opts.color || "var(--all-text)",
            cursor: "pointer",
            borderRadius: "6px",
            margin: "1px 0",
          });
          btn.addEventListener("mouseenter", () => {
            btn.style.background = "rgba(var(--all-text-rgb,0,0,0),0.08)";
          });
          btn.addEventListener("mouseleave", () => {
            btn.style.background = "transparent";
          });
          return btn;
        };

        const loadOption = makeMenuItem("Load");
        loadOption.addEventListener("click", (e) => {
          e.stopPropagation();
          // use central hide to clear global state
          hideMenu();
          loadHistory();
        });

        const deleteOption = makeMenuItem("Delete", { color: "#ff4444" });
        deleteOption.addEventListener("click", async (e) => {
          e.stopPropagation();
          // use central hide to clear global state
          hideMenu();
          showDeleteConfirmation(data.patientName || "Unknown", async (ok) => {
            if (!ok) return;
            try {
              const { deleteDoc } = window;
              if (deleteDoc && ref) {
                await deleteDoc(ref);
                // Smooth collapse animation
                const h = item.offsetHeight;
                item.style.height = h + "px";
                item.style.overflow = "hidden";
                item.style.transition =
                  "height 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease, transform 260ms ease, margin 260ms ease";
                // force reflow
                void item.offsetHeight;
                item.style.opacity = "0";
                item.style.transform = "translateY(-6px)";
                item.style.marginTop = "0";
                item.style.marginBottom = "0";
                item.style.height = "0px";
                setTimeout(async () => {
                  item.remove();
                  // Refresh the entire sidebar to maintain functionality
                  if (typeof window.renderHistorySidebar === "function") {
                    await window.renderHistorySidebar();
                  }
                }, 360);
              }
            } catch (err) {
              console.error("[BAU] Failed to delete history:", err);
            }
          });
        });

        menu.appendChild(loadOption);
        menu.appendChild(deleteOption);

        // Global tracker for a single open menu at a time
        window.__bauOpenHistoryMenu = window.__bauOpenHistoryMenu || {
          btn: null,
          menu: null,
          off: null,
        };
        let outsideHandler;
        let cleanupHandlers = [];
        const hideMenu = () => {
          menu.style.display = "none";
          document.removeEventListener("click", outsideHandler, true);
          // remove window listeners
          cleanupHandlers.forEach((off) => {
            try {
              off && off();
            } catch {}
          });
          cleanupHandlers = [];
          // deactivate kebab button visual state
          menuBtn.classList.remove("kebab-open");
          menuBtn.style.background = "transparent";
          menuBtn.style.boxShadow = "none";
          menuBtn.style.transform = "none";
          menuBtn.setAttribute("aria-expanded", "false");
          // clear global tracker if it's us
          if (window.__bauOpenHistoryMenu.btn === menuBtn) {
            window.__bauOpenHistoryMenu = { btn: null, menu: null, off: null };
          }
        };
        const showMenu = () => {
          // Close previously open menu if different
          const openRef = window.__bauOpenHistoryMenu;
          if (openRef.btn && openRef.btn !== menuBtn) {
            openRef.menu && (openRef.menu.style.display = "none");
            openRef.btn.classList.remove("kebab-open");
            openRef.btn.style.background = "transparent";
            openRef.btn.style.boxShadow = "none";
            openRef.btn.style.transform = "none";
            openRef.btn.setAttribute &&
              openRef.btn.setAttribute("aria-expanded", "false");
            if (typeof openRef.off === "function") {
              try {
                openRef.off();
              } catch {}
            }
            window.__bauOpenHistoryMenu = { btn: null, menu: null, off: null };
          }
          // Append to the same container as the button
          const buttonContainer = menuBtn.parentElement;
          if (menu.parentElement !== buttonContainer) {
            buttonContainer.appendChild(menu);
            buttonContainer.style.position = "relative"; // Make it a positioning context
          }
          // Compute and apply screen position
          const positionMenu = () => {
            if (menu.style.display !== "block") return;

            // Get button and sidebar positions
            const btnRect = menuBtn.getBoundingClientRect();
            const sidebar = menuBtn.closest(".bau-history-sidebar");

            // Position menu directly below the button with right margin
            menu.style.position = "absolute";
            menu.style.left = "auto";
            menu.style.right = "-12px"; // Add 16px from the right edge
            menu.style.top = "100%";
            menu.style.width = "120px"; // Fixed width for better appearance
            menu.style.borderRadius = "25px";
            menu.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.15)";
            menu.style.border = "1px solid rgba(0,0,0,0.1)";
            menu.style.borderTop = "none";
            menu.style.marginTop = "-1px"; // Overlap the border with button
          };
          // Make visible before first position (position function is guarded)
          menu.style.display = "block";
          positionMenu();

          // keep neutral state for kebab button when menu is open
          menuBtn.classList.remove("kebab-open");
          menuBtn.style.background = "transparent";
          menuBtn.style.boxShadow = "none";
          menuBtn.style.transform = "none";
          menuBtn.setAttribute("aria-expanded", "true");
          // update global tracker and store cleanup function
          const onResize = () => positionMenu();
          const onScroll = () => positionMenu();
          window.addEventListener("resize", onResize, { passive: true });
          window.addEventListener("scroll", onScroll, { passive: true });
          cleanupHandlers.push(() =>
            window.removeEventListener("resize", onResize)
          );
          cleanupHandlers.push(() =>
            window.removeEventListener("scroll", onScroll)
          );
          window.__bauOpenHistoryMenu = {
            btn: menuBtn,
            menu,
            off: () => cleanupHandlers.forEach((off) => off()),
          };

          // close on outside click
          outsideHandler = (ev) => {
            const target = ev.target;
            const clickedBtn = menuBtn.contains(target);
            const clickedMenu = menu.contains(target);
            if (!clickedBtn && !clickedMenu) hideMenu();
          };
          setTimeout(
            () => document.addEventListener("click", outsideHandler, true),
            0
          );
        };
        menuBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          // Toggle: if this button already owns the open menu, close it
          const openRef = window.__bauOpenHistoryMenu;
          if (openRef.btn === menuBtn) hideMenu();
          else showMenu();
        });

        actions.appendChild(remainBadge);
        actions.appendChild(menuBtn);
        // Note: menu is appended to document.body on open to escape sidebar bounds
        // actions.appendChild(menu);
        item.appendChild(meta);
        item.appendChild(actions);
        list.appendChild(item);
      });
    } catch (e) {
      console.warn("[BAU] Failed to load histories:", e);
      const p = document.createElement("p");
      p.textContent = "Unable to load history.";
      list.replaceChildren(p);
    }
  }

  // Refresh list if auth state changes while the drawer is open
  try {
    const { onAuthStateChanged } = window;
    if (typeof onAuthStateChanged === "function" && window.auth) {
      onAuthStateChanged(window.auth, () => {
        // Only refresh if visible
        if (drawer.style.transform === "translateX(0)") {
          loadHistories();
        }
      });
    }
  } catch {}

  function parseDateSafe(v) {
    try {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  // Check if history list is empty and show appropriate message
  function checkForEmptyHistoryList() {
    const list = document.querySelector(".bau-history-list");
    if (!list) return;

    // Count actual history items (exclude "New form" item and any existing "No saved histories" message)
    const historyItems = list.querySelectorAll(".bau-history-item");
    const existingMessage = list.querySelector("p");

    if (historyItems.length === 0 && !existingMessage) {
      // No history items left, show the "No saved histories" message
      const p = document.createElement("p");
      p.textContent = "No saved histories yet.";
      p.style.paddingLeft = "14.5px";
      p.style.paddingTop = "14.5px";
      list.appendChild(p);
    }
  }

  // Show styled confirmation dialog
  function showDeleteConfirmation(patientName, callback) {
    // Remove any existing confirmation dialog
    const existingDialog = list.querySelector(".delete-confirmation");
    if (existingDialog) {
      existingDialog.remove();
    }

    // Create confirmation dialog
    const confirmDialog = document.createElement("div");
    confirmDialog.className = "delete-confirmation";
    Object.assign(confirmDialog.style, {
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      alignItems: "center",
      gap: "12px",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "12px",
      backgroundColor: "rgba(255, 0, 0, 0.1)",
      transition: "all 0.3s ease",
      animation: "slideIn 0.3s ease",
    });

    // Add CSS animation
    if (!document.getElementById("delete-confirmation-styles")) {
      const style = document.createElement("style");
      style.id = "delete-confirmation-styles";
      style.textContent = `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    // Warning icon
    const warningIcon = document.createElement("div");
    warningIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style="color: #ff4444;">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </svg>
    `;

    // Message text
    const messageText = document.createElement("div");
    messageText.textContent = `Delete ${patientName} history?`;
    messageText.style.fontWeight = "500";
    messageText.style.color = "var(--all-text)";
    messageText.style.whiteSpace = "nowrap";
    messageText.style.overflow = "hidden";
    messageText.style.textOverflow = "ellipsis";

    // Buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.gap = "8px";

    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    Object.assign(cancelBtn.style, {
      padding: "6px 12px",
      border: "none",
      borderRadius: "6px",
      background: "transparent",
      color: "var(--all-text)",
      cursor: "pointer",
      fontSize: "14px",
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    Object.assign(deleteBtn.style, {
      padding: "6px 12px",
      border: "none",
      borderRadius: "6px",
      background: "#ff4444",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
    });

    // Event handlers
    cancelBtn.addEventListener("click", () => {
      confirmDialog.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        confirmDialog.remove();
        callback(false);
      }, 300);
    });

    deleteBtn.addEventListener("click", () => {
      confirmDialog.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        confirmDialog.remove();
        callback(true);
      }, 300);
    });

    // Add slide out animation
    const existingStyle = document.getElementById("delete-confirmation-styles");
    if (existingStyle && !existingStyle.textContent.includes("slideOut")) {
      existingStyle.textContent += `
        @keyframes slideOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `;
    }

    // Assemble dialog
    buttonsContainer.appendChild(cancelBtn);
    buttonsContainer.appendChild(deleteBtn);
    confirmDialog.appendChild(warningIcon);
    confirmDialog.appendChild(messageText);
    confirmDialog.appendChild(buttonsContainer);

    // Insert after the New Form item
    const newFormItem = list.querySelector("div:first-child");
    if (newFormItem && newFormItem.nextSibling) {
      list.insertBefore(confirmDialog, newFormItem.nextSibling);
    } else {
      list.insertBefore(confirmDialog, list.firstChild);
    }
  }

  // Show styled confirmation dialog for Clear All
  function showClearAllConfirmation(callback) {
    // Remove any existing confirmation dialog
    const existingDialog = list.querySelector(".delete-confirmation");
    if (existingDialog) {
      existingDialog.remove();
    }

    // Create confirmation dialog
    const confirmDialog = document.createElement("div");
    confirmDialog.className = "delete-confirmation";
    Object.assign(confirmDialog.style, {
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      alignItems: "center",
      gap: "12px",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "12px",
      backgroundColor: "rgba(255, 0, 0, 0.1)",
      transition: "all 0.3s ease",
      animation: "slideIn 0.3s ease",
    });

    // Warning icon
    const warningIcon = document.createElement("div");
    warningIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style="color: #ff4444;">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </svg>
    `;

    // Message text
    const messageText = document.createElement("div");
    messageText.textContent =
      "Clear all saved histories? This cannot be undone.";
    messageText.style.fontWeight = "500";
    messageText.style.color = "var(--all-text)";
    messageText.style.whiteSpace = "nowrap";
    messageText.style.overflow = "hidden";
    messageText.style.textOverflow = "ellipsis";

    // Buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.gap = "8px";

    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    Object.assign(cancelBtn.style, {
      padding: "6px 12px",
      border: "none",
      borderRadius: "6px",
      background: "transparent",
      color: "var(--all-text)",
      cursor: "pointer",
      fontSize: "14px",
    });

    // Clear button
    const clearAllBtn = document.createElement("button");
    clearAllBtn.type = "button";
    clearAllBtn.textContent = "Clear All";
    Object.assign(clearAllBtn.style, {
      padding: "6px 12px",
      border: "none",
      borderRadius: "6px",
      background: "#ff4444",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
    });

    // Event handlers
    cancelBtn.addEventListener("click", () => {
      confirmDialog.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        confirmDialog.remove();
        callback(false);
      }, 300);
    });

    clearAllBtn.addEventListener("click", () => {
      confirmDialog.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        confirmDialog.remove();
        callback(true);
      }, 300);
    });

    // Assemble dialog
    buttonsContainer.appendChild(cancelBtn);
    buttonsContainer.appendChild(clearAllBtn);
    confirmDialog.appendChild(warningIcon);
    confirmDialog.appendChild(messageText);
    confirmDialog.appendChild(buttonsContainer);

    // Insert after the New Form item
    const newFormItem = list.querySelector("div:first-child");
    if (newFormItem && newFormItem.nextSibling) {
      list.insertBefore(confirmDialog, newFormItem.nextSibling);
    } else {
      list.insertBefore(confirmDialog, list.firstChild);
    }
  }
}

// Expose renderHistorySidebar globally so it can be called from other scripts
window.renderHistorySidebar = renderHistorySidebar;
// Expose loadHistories globally for refreshing just the history list
window.loadHistories = loadHistories;

// Set form fields from a saved snapshot { id/text -> value(s) }
function applySnapshotToForm(snapshot) {
  const root =
    document.getElementById("history-form-container") || document.body;
  if (!snapshot || typeof snapshot !== "object") return;

  const setSelectByText = (sel, text) => {
    if (!sel) return;
    const opts = Array.from(sel.options || []);
    const match = opts.find(
      (o) => (o.text || "").trim() === String(text).trim()
    );
    if (match) sel.value = match.value;
    else if (opts.length) sel.selectedIndex = 0; // fallback to first

    // Update custom dropdown button text if it exists
    const wrapper = sel.parentElement?.querySelector(
      ".dropdown-single-wrapper"
    );
    if (wrapper) {
      const button = wrapper.querySelector(".dropdown-single-button");
      if (button && match) {
        button.textContent = match.text.trim();
      }
    }

    sel.dispatchEvent(new Event("change", { bubbles: true }));
    sel.dispatchEvent(new Event("input", { bubbles: true }));
  };

  // Handle ROS checkboxes specially (with bounded retry for late DOM readiness)
  if (snapshot._rosData) {
    const norm = (s) =>
      String(s ?? "")
        .trim()
        .toLowerCase();
    const rosData = snapshot._rosData || {};

    const applyROS = () => {
      const rosCheckboxes = root.querySelectorAll("input.ros");
      // Build a lowercase lookup for system keys to be robust to case differences
      const rosBySysLower = {};
      Object.keys(rosData).forEach((k) => {
        rosBySysLower[norm(k)] = rosData[k];
      });

      rosCheckboxes.forEach((checkbox) => {
        const systemRaw = checkbox.getAttribute("data-system") || "";
        const sysKey = String(systemRaw).trim();
        const valueRaw =
          checkbox.value ||
          checkbox.getAttribute("data-value") ||
          checkbox.getAttribute("aria-label") ||
          checkbox.id ||
          checkbox.name ||
          "";

        const arr =
          (rosData && rosData[sysKey]) || rosBySysLower[norm(sysKey)] || [];

        let isChecked =
          Array.isArray(arr) && arr.some((v) => norm(v) === norm(valueRaw));
        // Fallback for older snapshots that may have stored individual checkbox flags
        if (!isChecked) {
          if (checkbox.id && snapshot[checkbox.id] === true) isChecked = true;
          else if (checkbox.name && snapshot[checkbox.name] === true)
            isChecked = true;
        }
        checkbox.checked = !!isChecked;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      });
    };

    // Apply immediately
    applyROS();

    // If snapshot has ROS selections but none applied, retry a few times
    try {
      const totalSelections = Object.values(rosData).reduce((sum, v) => {
        return sum + (Array.isArray(v) ? v.length : 0);
      }, 0);
      const checkedNow = root.querySelectorAll("input.ros:checked").length;
      if (totalSelections > 0 && checkedNow === 0) {
        window.__rosApplyRetries = window.__rosApplyRetries || 0;
        if (window.__rosApplyRetries < 5) {
          window.__rosApplyRetries++;
          setTimeout(() => {
            applyROS();
          }, 100);
        }
      } else {
        // Reset counter on success
        try {
          window.__rosApplyRetries = 0;
        } catch {}
      }
    } catch {}
  }

  Object.entries(snapshot).forEach(([key, val]) => {
    // Skip special ROS data key
    if (key === "_rosData") return;

    const el =
      root.querySelector(`#${CSS.escape(key)}`) ||
      root.querySelector(`[name="${key}"]`);
    if (!el) return;
    const tag = (el.tagName || "").toLowerCase();
    if (tag === "select") {
      if (el.hasAttribute("multiple")) {
        const texts = Array.isArray(val)
          ? val.map(String)
          : [String(val)].filter(Boolean);
        const set = new Set(texts.map((s) => s.trim()));
        Array.from(el.options).forEach(
          (o) => (o.selected = set.has((o.text || "").trim()))
        );
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        setSelectByText(el, val);
        // Also update any custom dropdown UI for single selects
        setTimeout(() => {
          const wrapper = el.parentElement?.querySelector(
            ".dropdown-single-wrapper"
          );
          if (wrapper) {
            const button = wrapper.querySelector(".dropdown-single-button");
            if (button) {
              const currentValue = el.value;
              const matchingOption = Array.from(el.options).find(
                (opt) => opt.value === currentValue
              );
              if (matchingOption) {
                button.textContent = matchingOption.text.trim();
              }
            }
          }
        }, 100);
      }
    } else if (el.type === "checkbox") {
      el.checked = !!val;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (el.type === "radio") {
      const radios = root.querySelectorAll(
        `input[type="radio"][name="${el.name}"]`
      );
      radios.forEach((r) => (r.checked = r.value === String(val)));
      radios.forEach((r) => {
        r.dispatchEvent(new Event("change", { bubbles: true }));
        r.dispatchEvent(new Event("input", { bubbles: true }));
      });
    } else {
      el.value = Array.isArray(val) ? val.join(", ") : String(val ?? "").trim();
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

function inlineMessage(text) {
  try {
    const host =
      document.getElementById("history-form-container") || document.body;
    let msg = document.getElementById("bau-inline-msg");
    if (!msg) {
      msg = document.createElement("p");
      msg.id = "bau-inline-msg";
      msg.style.margin = "12px 0";
      msg.style.color = "var(--all-text)";
      const submitBtn = document.getElementById("submit-and-download");
      if (submitBtn && submitBtn.parentElement)
        submitBtn.parentElement.insertBefore(msg, submitBtn);
      else host.prepend(msg);
    }
    msg.textContent = text;
  } catch {}
}

function toggleFAQ() {
  const faq = document.getElementById("faqSection");
  if (faq.style.maxHeight && faq.style.maxHeight !== "0px") {
    faq.style.maxHeight = "0";
  } else {
    faq.style.maxHeight = faq.scrollHeight + "px";
  }
}

function initTooltipAnimation() {
  const helpLabel = document.getElementById("helpLabel");
  if (helpLabel) {
    // Add a CSS class for the initial animation instead of direct styles
    helpLabel.classList.add("tooltip-initial-show");

    // Remove the class after the animation completes to restore hover behavior
    setTimeout(() => {
      helpLabel.classList.remove("tooltip-initial-show");
    }, 3500); // match CSS animation duration exactly

    return true; // Found and animated
  }
  return false; // Not found
}

// Try immediately with reduced delay
if (!initTooltipAnimation()) {
  // If not found, wait a bit and try again (reduced from 100ms to 50ms)
  setTimeout(initTooltipAnimation, 0);
}

/**
 * In-flow dropdown-with-checkbox enhancer for
 * <select multiple data-dropdown-checkbox>
 * - Panel is in normal document flow (display:block) to avoid overlay/overlap
 * - Original select stays hidden and synchronized for existing logic/PDF
 */
function enhanceDropdownCheckboxesInFlow() {
  const selects = document.querySelectorAll(
    "select[data-dropdown-checkbox][multiple]"
  );
  selects.forEach((select) => enhanceOneInFlow(select));
}

function enhanceOneInFlow(select) {
  if (select.dataset.enhanced === "1") return;
  select.dataset.enhanced = "1";

  // Wrapper and header (button)
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-checkbox-wrapper";
  wrapper.style.width = "100%";
  wrapper.style.marginTop = "6px";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dropdown-checkbox-button";
  Object.assign(btn.style, {
    width: "100%",
    textAlign: "left",
    padding: "12px",
    fontSize: "16px",
    border: "1px solid var(--all-text)",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
    color: "black",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });
  // ARIA
  btn.setAttribute("role", "combobox");
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");

  // Panel (in-flow)
  const panel = document.createElement("div");
  panel.className = "dropdown-checkbox-panel";
  Object.assign(panel.style, {
    display: "none",
    marginTop: "6px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#fafafa",
    padding: "8px",
    maxHeight: "450px",
    overflowY: "auto",
    boxShadow: "inset 0 0 0 rgba(0,0,0,0)",
    color: "black",
    WebkitOverflowScrolling: "touch",
  });
  const msPanelId = `${select.id}-multilist`;
  panel.id = msPanelId;
  panel.setAttribute("role", "listbox");
  panel.setAttribute("aria-multiselectable", "true");
  btn.setAttribute("aria-controls", msPanelId);

  // --- Typeahead search UI ---
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Type to filter...";
  Object.assign(search.style, {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    marginBottom: "8px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    background: "#fff",
    color: "var(--all-text)",
  });

  // Set placeholder color for multi-select search
  const multiSearchStyle = document.createElement("style");
  multiSearchStyle.textContent = `
    #${select.id}-multisearch::placeholder {
      color: var(--all-text);
      opacity: 0.7;
    }
  `;
  search.id = `${select.id}-multisearch`;
  if (!document.head.querySelector(`style[data-multi-for="${select.id}"]`)) {
    multiSearchStyle.setAttribute("data-multi-for", select.id);
    document.head.appendChild(multiSearchStyle);
  }
  const rowsContainer = document.createElement("div");

  // Track references for Other (specify)
  let otherCb = null;
  let otherInput = null;

  // Helpers
  const isNoneText = (t) =>
    /^(none|no history|no past medical history|no allergies)$/i.test(t.trim());
  const isNKDAText = (t) => /^(nkda|no known drug allergies)/i.test(t.trim());

  function enforceExclusivity(changedText, changedChecked) {
    // If "None" or NKDA selected, deselect all others. If any other selected, deselect None/NKDA.
    const allRows = rowsContainer.querySelectorAll("label[data-row]");
    const changedIsNone =
      isNoneText(changedText) ||
      (select.id === "drug-allergies" && isNKDAText(changedText));
    if (changedIsNone && changedChecked) {
      allRows.forEach((row) => {
        const txt = row.getAttribute("data-text") || "";
        if (
          !(
            isNoneText(txt) ||
            (select.id === "drug-allergies" && isNKDAText(txt))
          )
        ) {
          const cb = row.querySelector('input[type="checkbox"]');
          if (cb) cb.checked = false;
          Array.from(select.options).forEach((opt) => {
            if (
              opt.text.trim() === row.querySelector("span")?.textContent?.trim()
            )
              opt.selected = false;
          });
        }
      });
    } else if (!changedIsNone && changedChecked) {
      // Deselect None/NKDA if any other chosen
      allRows.forEach((row) => {
        const txt = row.getAttribute("data-text") || "";
        if (
          isNoneText(txt) ||
          (select.id === "drug-allergies" && isNKDAText(txt))
        ) {
          const cb = row.querySelector('input[type="checkbox"]');
          if (cb) cb.checked = false;
          Array.from(select.options).forEach((opt) => {
            if (
              opt.text.trim() === row.querySelector("span")?.textContent?.trim()
            )
              opt.selected = false;
          });
        }
      });
    }
  }

  function ensureOtherOptionSelected(text) {
    // Remove old __other__ options for this select
    Array.from(select.options)
      .filter((o) => /^__other__:/i.test(o.value))
      .forEach((o) => o.remove());
    if (!text || !text.trim()) return;
    const opt = document.createElement("option");
    opt.value = `__other__:${text.trim()}`;
    opt.text = text.trim();
    opt.selected = true;
    select.appendChild(opt);
  }

  function clearOther() {
    if (otherCb) otherCb.checked = false;
    if (otherInput) otherInput.value = "";
    Array.from(select.options)
      .filter((o) => /^__other__:/i.test(o.value))
      .forEach((o) => (o.selected = false));
  }

  function createOptionRow(text, value, selected) {
    const row = document.createElement("label");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    row.style.padding = "6px 4px";
    row.setAttribute("data-row", "1");
    row.setAttribute("data-text", text.toLowerCase());

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = value;
    cb.checked = !!selected;
    Object.assign(cb.style, { width: "20px", height: "20px" });
    cb.addEventListener("change", () => {
      Array.from(select.options).forEach((opt) => {
        if (opt.value === value) opt.selected = cb.checked;
      });
      enforceExclusivity(text, cb.checked);
      updateButtonText();
      row.setAttribute("aria-selected", cb.checked ? "true" : "false");
    });

    const span = document.createElement("span");
    span.textContent = text;
    span.style.color = "black";
    row.appendChild(cb);
    row.appendChild(span);
    return row;
  }

  function buildPanel() {
    panel.innerHTML = "";
    panel.appendChild(search);
    rowsContainer.innerHTML = "";

    // Check if this is a SOCRATES field that should use row layout
    const socratesFields = [
      "onset",
      "character",
      "radiation",
      "timing",
      "exacerbating",
      "relieving",
      "severity",
    ];
    const isSOCRATESField = socratesFields.includes(select.id);

    const children = Array.from(select.children);

    if (isSOCRATESField) {
      // Use row layout for SOCRATES fields
      children.forEach((child) => {
        if (child.tagName === "OPTGROUP") {
          const groupLabel = document.createElement("div");
          groupLabel.textContent = child.label;
          groupLabel.setAttribute("data-group", "1");
          groupLabel.setAttribute("data-text", child.label.toLowerCase());
          Object.assign(groupLabel.style, {
            fontWeight: "600",
            marginTop: "12px",
            marginBottom: "8px",
            color: "var(--all-text)",
          });
          rowsContainer.appendChild(groupLabel);

          // Create flex container for row layout
          const optionsContainer = document.createElement("div");
          Object.assign(optionsContainer.style, {
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "16px",
            alignItems: "flex-start",
            justifyContent: "flex-start",
          });

          Array.from(child.children).forEach((opt) => {
            const optionRow = createOptionRow(
              opt.text,
              opt.value,
              opt.selected
            );
            // Modify styling for inline display
            Object.assign(optionRow.style, {
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              border: "1px solid #e0e0e0",
              borderRadius: "16px",
              background: opt.selected ? "#e3f2fd" : "#f8f9fa",
              cursor: "pointer",
              fontSize: "13px",
              whiteSpace: "nowrap",
              flexShrink: "0",
              minHeight: "32px",
              transition: "all 0.2s ease",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              boxSizing: "border-box",
            });
            optionsContainer.appendChild(optionRow);
          });

          rowsContainer.appendChild(optionsContainer);
        } else if (child.tagName === "OPTION") {
          const optionRow = createOptionRow(
            child.text,
            child.value,
            child.selected
          );
          // Style for inline display
          Object.assign(optionRow.style, {
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            border: "1px solid #e0e0e0",
            borderRadius: "16px",
            background: child.selected ? "#e3f2fd" : "#f8f9fa",
            cursor: "pointer",
            fontSize: "13px",
            whiteSpace: "nowrap",
            flexShrink: "0",
            minHeight: "32px",
            transition: "all 0.2s ease",
            marginRight: "8px",
            marginBottom: "8px",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            boxSizing: "border-box",
          });
          rowsContainer.appendChild(optionRow);
        }
      });
    } else {
      // Use 3-column grid layout for non-SOCRATES fields
      const gridContainer = document.createElement("div");
      Object.assign(gridContainer.style, {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
        marginTop: "8px",
        width: "100%",
        boxSizing: "border-box",
      });

      const columns = [[], [], []]; // Three columns for categories
      let currentColumn = 0;

      children.forEach((child) => {
        if (child.tagName === "OPTGROUP") {
          // Create column container for this optgroup
          const columnDiv = document.createElement("div");
          Object.assign(columnDiv.style, {
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            padding: "8px",
            background: "#f9f9f9",
            height: "200px",
            display: "flex",
            flexDirection: "column",
          });

          const groupLabel = document.createElement("div");
          groupLabel.textContent = child.label;
          groupLabel.setAttribute("data-group", "1");
          groupLabel.setAttribute("data-text", child.label.toLowerCase());
          Object.assign(groupLabel.style, {
            fontWeight: "600",
            marginBottom: "8px",
            color: "var(--all-text)",
            fontSize: "14px",
            borderBottom: "1px solid #ddd",
            paddingBottom: "4px",
            flexShrink: "0",
          });
          columnDiv.appendChild(groupLabel);

          // Create scrollable container for options
          const optionsContainer = document.createElement("div");
          Object.assign(optionsContainer.style, {
            flex: "1",
            overflowY: "auto",
            paddingRight: "4px",
          });

          // Add options to the scrollable container
          Array.from(child.children).forEach((opt) => {
            const optionRow = createOptionRow(
              opt.text,
              opt.value,
              opt.selected
            );
            optionRow.style.marginBottom = "4px";
            optionsContainer.appendChild(optionRow);
          });

          columnDiv.appendChild(optionsContainer);

          // Add to current column and move to next
          columns[currentColumn].push(columnDiv);
          currentColumn = (currentColumn + 1) % 3;
        } else if (child.tagName === "OPTION") {
          // Handle standalone options (add to current column)
          const optionRow = createOptionRow(
            child.text,
            child.value,
            child.selected
          );
          if (columns[currentColumn].length === 0) {
            const columnDiv = document.createElement("div");
            Object.assign(columnDiv.style, {
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              padding: "8px",
              background: "#f9f9f9",
              height: "200px",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            });
            columnDiv.appendChild(optionRow);
            columns[currentColumn].push(columnDiv);
          } else {
            // Add to last column container
            const lastContainer =
              columns[currentColumn][columns[currentColumn].length - 1];
            lastContainer.appendChild(optionRow);
          }
        }
      });

      // Create the three column divs and populate them
      for (let i = 0; i < 3; i++) {
        const columnWrapper = document.createElement("div");
        Object.assign(columnWrapper.style, {
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: "0",
          overflow: "hidden",
        });

        columns[i].forEach((item) => {
          columnWrapper.appendChild(item);
        });

        gridContainer.appendChild(columnWrapper);
      }

      rowsContainer.appendChild(gridContainer);
    }

    // Append the rows container before actions
    panel.appendChild(rowsContainer);

    // --- Other (specify) row ---
    const otherRow = document.createElement("div");
    otherRow.style.display = "flex";
    otherRow.style.gap = "8px";
    otherRow.style.alignItems = "center";
    otherRow.style.marginTop = "8px";
    otherCb = document.createElement("input");
    otherCb.type = "checkbox";
    Object.assign(otherCb.style, { width: "20px", height: "20px" });
    otherInput = document.createElement("input");
    otherInput.type = "text";
    otherInput.placeholder = "Other (specify)";
    Object.assign(otherInput.style, {
      flex: "1",
      padding: "12px 12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      background: "#fff",
      color: "black",
      fontSize: "16px",
    });

    // Set placeholder color for "Other (specify)" field
    const otherPlaceholderStyle = document.createElement("style");
    otherPlaceholderStyle.textContent = `
      input[placeholder="Other (specify)"]::placeholder {
        color: var(--all-text);
        opacity: 0.7;
      }
    `;
    if (!document.head.querySelector('style[data-other-placeholder="true"]')) {
      otherPlaceholderStyle.setAttribute("data-other-placeholder", "true");
      document.head.appendChild(otherPlaceholderStyle);
    }
    const applyOther = () => {
      if (otherCb.checked && otherInput.value.trim()) {
        ensureOtherOptionSelected(otherInput.value);
      } else {
        // unselect/remove synthetic option
        Array.from(select.options)
          .filter((o) => /^__other__:/i.test(o.value))
          .forEach((o) => (o.selected = false));
      }
      updateButtonText();
    };
    otherCb.addEventListener("change", applyOther);
    otherInput.addEventListener("input", applyOther);
    otherRow.appendChild(otherCb);
    otherRow.appendChild(otherInput);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.marginTop = "8px";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.textContent = "Clear";
    Object.assign(clearBtn.style, {
      padding: "6px 10px",
      border: "1px solid var(--all-text)",
      borderRadius: "4px",
      background: "#f7f7f7",
      cursor: "pointer",
      marginTop: "8px",
    });
    clearBtn.addEventListener("click", () => {
      Array.from(select.options).forEach((opt) => (opt.selected = false));
      panel.querySelectorAll('input[type="checkbox"]').forEach((c) => {
        c.checked = false;
      });
      clearOther();
      updateButtonText();
    });

    const doneBtn = document.createElement("button");
    doneBtn.type = "button";
    doneBtn.textContent = "Done";
    Object.assign(doneBtn.style, {
      padding: "12px 14px",
      border: "1px solid #2cc9c7",
      borderRadius: "4px",
      color: "#2cc9c7",
      background: "#e8fbfb",
      cursor: "pointer",
      marginLeft: "auto",
      fontSize: "16px",
    });
    doneBtn.addEventListener("click", () => {
      otherInput.blur();
      hidePanel();
    });

    // Add Other row and actions
    panel.appendChild(otherRow);
    actions.appendChild(clearBtn);
    actions.appendChild(doneBtn);
    panel.appendChild(actions);

    // Apply dependent prioritization if needed
    if (select.id === "regular-meds") {
      applyDependentPriorities();
    }
  }

  function updateButtonText() {
    const selected = Array.from(select.selectedOptions).map((o) =>
      o.text.trim()
    );
    const labelEl = select
      .closest(".form-subsection, .form-section")
      ?.querySelector(`label[for="${select.id}"]`);
    const base = labelEl
      ? `${labelEl.innerText.trim()} — select...`
      : "Select options";
    if (selected.length === 0) btn.textContent = `${base}`;
    else if (selected.length <= 3) btn.textContent = selected.join(", ");
    else btn.textContent = `${selected.length} selected`;
  }

  function showPanel() {
    panel.style.display = "block";
  }
  function hidePanel() {
    panel.style.display = "none";
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (panel.style.display === "none") showPanel();
    else hidePanel();
  });

  // Insert into DOM and hide original select
  select.style.display = "none";
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(btn);
  wrapper.appendChild(panel);

  // If the HTML did not explicitly mark any option as selected, start with none selected
  try {
    const hasDefaultSelected = Array.from(select.options).some(
      (o) => o.defaultSelected
    );
    if (!hasDefaultSelected) {
      Array.from(select.options).forEach((o) => (o.selected = false));
    }
  } catch {}

  buildPanel();
  updateButtonText();

  // --- Enhanced search filter behavior ---
  const msDebounce = (fn, ms) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  function performSearch() {
    const q = search.value.trim().toLowerCase();

    // Remove existing "not found" message
    const existingNotFound = rowsContainer.querySelector(".search-not-found");
    if (existingNotFound) {
      existingNotFound.remove();
    }

    if (!q) {
      // Completely restore original layout when search is empty
      buildPanel();
      return;
    }

    let hasVisibleResults = false;

    // Handle SOCRATES fields (row layout)
    const socratesFields = [
      "onset",
      "character",
      "radiation",
      "timing",
      "exacerbating",
      "relieving",
      "severity",
    ];
    const isSOCRATESField = socratesFields.includes(select.id);

    if (isSOCRATESField) {
      // For SOCRATES fields, filter within flex containers
      const groupLabels = rowsContainer.querySelectorAll("[data-group]");
      groupLabels.forEach((groupLabel) => {
        const optionsContainer = groupLabel.nextElementSibling;
        if (
          optionsContainer &&
          (optionsContainer.style.display === "flex" ||
            optionsContainer.style.flexWrap === "wrap")
        ) {
          const options = optionsContainer.querySelectorAll("[data-row]");
          let groupHasVisible = false;

          options.forEach((option) => {
            const txt = (
              option.getAttribute("data-text") ||
              option.textContent ||
              ""
            ).toLowerCase();
            const matches = txt.includes(q);

            if (matches) {
              option.style.display = "inline-flex";
              groupHasVisible = true;
              hasVisibleResults = true;
            } else {
              option.style.display = "none";
            }
          });

          // Always show group label, maintain container properties
          groupLabel.style.display = "";
          if (groupHasVisible) {
            optionsContainer.style.display = "flex";
            optionsContainer.style.flexWrap = "wrap";
            optionsContainer.style.gap = "8px";
            optionsContainer.style.marginBottom = "16px";
            optionsContainer.style.alignItems = "flex-start";
            optionsContainer.style.justifyContent = "flex-start";
          } else {
            optionsContainer.style.display = "none";
          }
        }
      });
    } else {
      // For grid layout (non-SOCRATES fields)
      const gridContainer = rowsContainer.querySelector('div[style*="grid"]');
      if (gridContainer) {
        const columnWrappers = gridContainer.children;
        Array.from(columnWrappers).forEach((columnWrapper) => {
          const categoryDivs = columnWrapper.children;
          let columnHasVisible = false;

          Array.from(categoryDivs).forEach((categoryDiv) => {
            const groupLabel = categoryDiv.querySelector("[data-group]");
            const optionsContainer =
              categoryDiv.querySelector('div[style*="flex: 1"]') || categoryDiv;
            const options = categoryDiv.querySelectorAll("[data-row]");
            let categoryHasVisible = false;

            options.forEach((option) => {
              const txt = (
                option.getAttribute("data-text") ||
                option.textContent ||
                ""
              ).toLowerCase();
              const matches = txt.includes(q);

              if (matches) {
                option.style.display = "flex";
                categoryHasVisible = true;
                hasVisibleResults = true;
              } else {
                option.style.display = "none";
              }
            });

            // Always show group label, maintain category structure
            if (groupLabel) {
              groupLabel.style.display = "";
            }

            // Show category if it has visible options, maintain grid structure and constraints
            if (categoryHasVisible) {
              categoryDiv.style.display = "";
              categoryDiv.style.height = "200px";
              categoryDiv.style.overflowY = "auto";
              categoryDiv.style.border = "1px solid #e0e0e0";
              categoryDiv.style.borderRadius = "6px";
              categoryDiv.style.padding = "8px";
              categoryDiv.style.background = "#f9f9f9";
              categoryDiv.style.flexDirection = "column";

              // Ensure scrollable content container maintains properties
              const scrollableContent = categoryDiv.querySelector(
                'div[style*="flex: 1"]'
              );
              if (scrollableContent) {
                scrollableContent.style.flex = "1";
                scrollableContent.style.overflowY = "auto";
                scrollableContent.style.paddingRight = "4px";
              }

              columnHasVisible = true;
            } else {
              categoryDiv.style.display = "none";
            }
          });

          // Keep column wrapper visible if it has any visible categories
          columnWrapper.style.display = columnHasVisible ? "flex" : "none";
        });
      }
    }

    // Hide the "Other (specify)" field during search
    const otherRow = panel.querySelector(
      'div[style*="display: flex"][style*="gap: 8px"]'
    );
    if (
      otherRow &&
      otherRow.querySelector('input[placeholder="Other (specify)"]')
    ) {
      otherRow.style.display = "none";
    }

    // Show "Not found" message if no results
    if (!hasVisibleResults) {
      const notFoundDiv = document.createElement("div");
      notFoundDiv.className = "search-not-found";
      notFoundDiv.textContent = "Not found";
      Object.assign(notFoundDiv.style, {
        textAlign: "center",
        padding: "40px 20px",
        color: "var(--all-text)",
        fontSize: "16px",
        fontWeight: "500",
        opacity: "0.7",
      });

      // Hide all other content
      const allContent = rowsContainer.children;
      Array.from(allContent).forEach((child) => {
        if (!child.classList.contains("search-not-found")) {
          child.style.display = "none";
        }
      });

      rowsContainer.appendChild(notFoundDiv);
    }
  }

  search.addEventListener("input", msDebounce(performSearch, 150));

  // --- Dependent prioritization logic for regular meds ---
  function applyDependentPriorities() {
    try {
      const pmh = document.getElementById("past-medical");
      if (!pmh) return;
      const pmhTexts = Array.from(pmh.selectedOptions).map((o) =>
        o.text.toLowerCase()
      );
      if (pmhTexts.length === 0) return;

      // Simple keyword mapping
      const map = [
        {
          keys: ["diabetes", "dm"],
          meds: ["metformin", "insulin", "gliptin", "sulfonylurea"],
        },
        {
          keys: ["hypertension", "htn", "high blood pressure"],
          meds: ["ace", "arb", "amlodipine", "thiazide"],
        },
        {
          keys: ["asthma", "copd"],
          meds: ["salbutamol", "formoterol", "budesonide", "tiotropium"],
        },
        {
          keys: ["coronary", "mi", "angina", "ischemic"],
          meds: ["aspirin", "clopidogrel", "statin", "beta blocker"],
        },
      ];

      let priorityTerms = new Set();
      map.forEach((m) => {
        if (pmhTexts.some((t) => m.keys.some((k) => t.includes(k)))) {
          m.meds.forEach((x) => priorityTerms.add(x));
        }
      });
      if (priorityTerms.size === 0) return;

      const rows = Array.from(
        rowsContainer.querySelectorAll("label[data-row]")
      );
      rows.forEach((row) => {
        const text = row.getAttribute("data-text") || "";
        const score = Array.from(priorityTerms).some((term) =>
          text.includes(term)
        )
          ? 1
          : 0;
        row.setAttribute("data-priority", String(score));
      });
      // Stable sort: priority rows first, keep relative order within groups
      const groups = Array.from(rowsContainer.children);
      const sorted = groups.slice().sort((a, b) => {
        const ap = a.getAttribute("data-priority") || "0";
        const bp = b.getAttribute("data-priority") || "0";
        return Number(bp) - Number(ap);
      });
      sorted.forEach((el) => rowsContainer.appendChild(el));
    } catch {}
  }
}

// ---- Auto-fill student data from localStorage on page load ----
// Modified to work with new form clearing functionality
function autoFillStudentData() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoFillStudentData);
    return;
  }
  try {
    // Get stored student data from localStorage
    const storedStudentName = localStorage.getItem("studentName");
    const storedStudentNumber = localStorage.getItem("studentNumber");

    // Auto-fill the student name field
    const studentNameField = document.getElementById("student-name");
    if (studentNameField && storedStudentName && !studentNameField.value) {
      studentNameField.value = storedStudentName;
    }

    // Auto-fill the student number field
    const studentNumberField = document.getElementById("student-number");
    if (
      studentNumberField &&
      storedStudentNumber &&
      !studentNumberField.value
    ) {
      studentNumberField.value = storedStudentNumber;
    }

    console.log("[BAU] Auto-filled student data:", {
      name: storedStudentName,
      number: storedStudentNumber,
    });
  } catch (error) {
    console.warn("[BAU] Error auto-filling student data:", error);
  }
}

// Call it initially
autoFillStudentData();

// ---- Ensure Social History uses custom single-select UI on page load ----
(function enhanceSHOnLoad() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceSHOnLoad);
    return;
  }
  try {
    const ids = ["smoking", "alcohol", "occupation", "living", "travel"];
    ids.forEach((id) => {
      const select = document.getElementById(id);
      if (!select || select.multiple || select.dataset.enhanced === "1") return;

      select.dataset.enhanced = "1";

      const wrapper = document.createElement("div");
      wrapper.className = "dropdown-single-wrapper";
      wrapper.style.width = "100%";
      wrapper.style.marginTop = "6px";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dropdown-single-button";
      Object.assign(btn.style, {
        width: "100%",
        textAlign: "left",
        padding: "10px",
        fontSize: "14px",
        border: "1px solid var(--all-text)",
        borderRadius: "6px",
        background: "#fff",
        cursor: "pointer",
        color: "black",
      });

      const panel = document.createElement("div");
      panel.className = "dropdown-single-panel";
      Object.assign(panel.style, {
        display: "none",
        marginTop: "6px",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        background: "#fafafa",
        padding: "8px",
        maxHeight: "260px",
        overflowY: "auto",
        color: "black",
      });

      const search = document.createElement("input");
      search.type = "search";
      search.placeholder = "Type to filter...";
      Object.assign(search.style, {
        width: "100%",
        boxSizing: "border-box",
        padding: "8px 10px",
        marginBottom: "8px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        background: "#fff",
        color: "black",
      });

      const rowsContainer = document.createElement("div");

      function updateButtonText() {
        const labelEl = select
          .closest(".form-subsection, .form-section")
          ?.querySelector(`label[for="${select.id}"]`);
        const base = labelEl
          ? `${labelEl.innerText.trim()} — select...`
          : "Select option";

        // Find the option that matches the current value instead of relying on selectedIndex
        const currentValue = select.value;
        const matchingOption = Array.from(select.options).find(
          (opt) => opt.value === currentValue
        );
        const text = matchingOption?.text?.trim();

        btn.textContent = text || base;
      }

      function createOptionRow(text, value, selected) {
        const row = document.createElement("label");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.padding = "6px 4px";
        row.setAttribute("data-row", "1");
        row.setAttribute("data-text", text.toLowerCase());

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `${select.id}-radio`;
        radio.value = value;
        radio.checked = !!selected;
        radio.addEventListener("change", () => {
          select.value = value;
          select.selectedIndex = Array.from(select.options).findIndex(
            (opt) => opt.value === value
          );
          updateButtonText();
          // Trigger form validation update
          select.dispatchEvent(new Event("change", { bubbles: true }));
          select.dispatchEvent(new Event("input", { bubbles: true }));
          // Update progress tracker
          if (window.updateProgressTracker) {
            setTimeout(window.updateProgressTracker, 50);
          }
        });

        const span = document.createElement("span");
        span.textContent = text;
        if (span.style && span.style.setProperty)
          span.style.setProperty("color", "black", "important");
        else span.style.color = "black";

        row.addEventListener("click", (e) => {
          if (e.target !== radio) {
            radio.checked = true;
            select.value = value;
            select.selectedIndex = Array.from(select.options).findIndex(
              (opt) => opt.value === value
            );
            updateButtonText();
            // Trigger form validation update
            select.dispatchEvent(new Event("change", { bubbles: true }));
            select.dispatchEvent(new Event("input", { bubbles: true }));
            // Update progress tracker
            if (window.updateProgressTracker) {
              setTimeout(window.updateProgressTracker, 50);
            }
          }
        });

        row.appendChild(radio);
        row.appendChild(span);
        return row;
      }

      function buildPanel() {
        panel.innerHTML = "";
        panel.appendChild(search);
        rowsContainer.innerHTML = "";
        const currentValue = select.value;
        const children = Array.from(select.children);
        children.forEach((child) => {
          if (child.tagName === "OPTGROUP") {
            const groupLabel = document.createElement("div");
            groupLabel.textContent = child.label;
            groupLabel.setAttribute("data-group", "1");
            groupLabel.setAttribute("data-text", child.label.toLowerCase());
            Object.assign(groupLabel.style, {
              fontWeight: "600",
              marginTop: "6px",
              marginBottom: "4px",
              color: "black",
            });
            if (groupLabel.style && groupLabel.style.setProperty)
              groupLabel.style.setProperty("color", "black", "important");
            rowsContainer.appendChild(groupLabel);
            Array.from(child.children).forEach((opt) => {
              const isSelected = opt.value === currentValue;
              rowsContainer.appendChild(
                createOptionRow(opt.text, opt.value, isSelected)
              );
            });
          } else if (child.tagName === "OPTION") {
            const isSelected = child.value === currentValue;
            rowsContainer.appendChild(
              createOptionRow(child.text, child.value, isSelected)
            );
          }
        });
        panel.appendChild(rowsContainer);

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "8px";
        actions.style.marginTop = "8px";

        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.textContent = "Clear";
        Object.assign(clearBtn.style, {
          padding: "6px 10px",
          border: "1px solid var(--all-text)",
          borderRadius: "4px",
          background: "#f7f7f7",
          cursor: "pointer",
        });
        clearBtn.addEventListener("click", () => {
          select.value = "";
          select.selectedIndex = -1;
          panel
            .querySelectorAll('input[type="radio"]')
            .forEach((r) => (r.checked = false));
          updateButtonText();
          // Trigger form validation update
          select.dispatchEvent(new Event("change", { bubbles: true }));
          select.dispatchEvent(new Event("input", { bubbles: true }));
          // Update progress tracker
          if (window.updateProgressTracker) {
            setTimeout(window.updateProgressTracker, 50);
          }
        });

        const doneBtn = document.createElement("button");
        doneBtn.type = "button";
        doneBtn.textContent = "Done";
        Object.assign(doneBtn.style, {
          padding: "6px 10px",
          border: "1px solid #2cc9c7",
          borderRadius: "4px",
          color: "black",
          background: "#e8fbfb",
          cursor: "pointer",
          marginLeft: "auto",
        });
        doneBtn.addEventListener("click", () => {
          panel.style.display = "none";
        });

        actions.appendChild(clearBtn);
        actions.appendChild(doneBtn);
        panel.appendChild(actions);
      }

      function showPanel() {
        panel.style.display = "block";
      }
      function hidePanel() {
        panel.style.display = "none";
      }

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (panel.style.display === "none") showPanel();
        else hidePanel();
      });

      // Mount
      select.style.display = "none";
      select.parentNode.insertBefore(wrapper, select);
      wrapper.appendChild(btn);
      wrapper.appendChild(panel);

      buildPanel();
      updateButtonText();

      // Live filter
      search.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        const rows = rowsContainer.querySelectorAll("[data-row], [data-group]");
        rows.forEach((el) => {
          const txt = (
            el.getAttribute("data-text") ||
            el.textContent ||
            ""
          ).toLowerCase();
          el.style.display = !q || txt.includes(q) ? "" : "none";
        });
      });

      // Rebuild if options change dynamically
      const mo = new MutationObserver(() => {
        buildPanel();
        updateButtonText();
      });
      mo.observe(select, { subtree: true, childList: true, attributes: true });

      // Listen for native select changes to sync custom dropdown
      select.addEventListener("change", () => {
        updateButtonText();
        // Update progress tracker
        if (window.updateProgressTracker) {
          setTimeout(window.updateProgressTracker, 50);
        }
      });
    });
  } catch {}
})();

// Auto-fill functionality removed to prevent random data generation
/*
(function attachAutofillRandom() {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(() => {
    const btn = document.getElementById("autofill-random");
    if (!btn) return;

    const rand = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = (arr) => arr[rand(0, arr.length - 1)];

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === "SELECT") {
        // Prefer matching by value; fallback to text
        let opt = Array.from(el.options).find((o) => o.value === val);
        if (!opt) opt = Array.from(el.options).find((o) => o.text === val);
        if (!opt && el.options.length)
          opt = el.options[rand(0, el.options.length - 1)];
        if (opt) el.value = opt.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        el.value = val;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };

    const randomName = () =>
      pick([
        "Alex Smith",
        "Jordan Lee",
        "Taylor Khan",
        "Sam Patel",
        "Chris Johnson",
        "Morgan Brown",
        "Jamie Clarke",
        "Riley Evans",
        "Cameron Lewis",
        "Dana Hughes",
      ]);

    const randomRotation = () =>
      pick([
        "Cardiology",
        "Respiratory",
        "Gastroenterology",
        "Neurology",
        "Renal",
        "Acute Medicine",
        "Surgery",
        "Primary Care",
      ]);

    const randomChiefComplaint = (select) => {
      if (!select) return "chest-pain";
      const opts = Array.from(select.querySelectorAll("option")).filter(
        (o) => o.value && o.value !== "other"
      );
      return (pick(opts) || {}).value || "chest-pain";
    };

    // Scenario presets to ensure coherent combinations
    const scenarios = [
      {
        name: "ACS-like Chest Pain",
        cc: "chest-pain",
        site: "precordial",
        onset: "acute",
        character: "crushing",
        radiation: "left-arm",
        associated: ["shortness-breath", "palpitations"],
        timing: "intermittent",
        exacerbating: "exercise",
        relieving: "rest",
        social: { smoking: "current-moderate", alcohol: "occasional" },
      },
      {
        name: "Biliary Colic",
        cc: "abdominal-pain",
        site: "ruq",
        onset: "acute",
        character: "cramping",
        radiation: "shoulder-right",
        associated: ["nausea", "vomiting"],
        timing: "postprandial",
        exacerbating: "fatty-foods",
        relieving: "none",
        social: { smoking: "never", alcohol: "occasional" },
      },
      {
        name: "Asthma Exacerbation",
        cc: "shortness-of-breath",
        site: "chest-central",
        onset: "acute",
        character: "tight",
        radiation: "none",
        associated: ["wheeze", "cough"],
        timing: "night",
        exacerbating: "exercise",
        relieving: "inhaler",
        social: { smoking: "never", alcohol: "none" },
      },
      {
        name: "Appendicitis",
        cc: "abdominal-pain",
        site: "rlq",
        onset: "subacute",
        character: "sharp",
        radiation: "none",
        associated: ["fever", "nausea"],
        timing: "constant",
        exacerbating: "movement",
        relieving: "none",
        social: { smoking: "never", alcohol: "none" },
      },
      {
        name: "UTI",
        cc: "dysuria",
        site: "suprapubic",
        onset: "acute",
        character: "burning",
        radiation: "none",
        associated: ["urgency", "frequency"],
        timing: "constant",
        exacerbating: "none",
        relieving: "hydration",
        social: { smoking: "never", alcohol: "none" },
      },
    ];

    const setMulti = (id, values) => {
      const sel = document.getElementById(id);
      if (!sel || sel.tagName !== "SELECT" || !sel.multiple) return;
      const setVals = new Set(values);
      Array.from(sel.options).forEach(
        (o) => (o.selected = setVals.has(o.value) || setVals.has(o.text))
      );
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      sel.dispatchEvent(new Event("input", { bubbles: true }));
    };

    btn.addEventListener("click", () => {
      const root =
        document.getElementById("history-form-container") || document.body;

      // Choose a coherent scenario first
      const scenario = pick(scenarios);

      // Helper to randomize select (single or multiple)
      const fillSelect = (sel) => {
        const options = Array.from(sel.options).filter(
          (o) => (o.value ?? "").trim() !== ""
        );
        if (options.length === 0) return;
        if (sel.multiple) {
          // Default random multi-select size
          let k = Math.min(
            options.length,
            rand(1, Math.min(4, options.length))
          );
          // If this looks like an associated symptoms / ROS field, bias to scenario.associated
          const id = (sel.id || sel.name || "").toLowerCase();
          const looksAssociated =
            id.includes("associated") ||
            id.includes("symptom") ||
            id.includes("ros");
          if (
            looksAssociated &&
            Array.isArray(scenario.associated) &&
            scenario.associated.length
          ) {
            const chosen = new Set();
            // Seed with scenario-associated values if present in options
            const byVal = new Map(options.map((o) => [o.value, o]));
            scenario.associated.forEach((v) => {
              if (byVal.has(v)) chosen.add(byVal.get(v));
            });
            // Top up randomly if needed
            while (chosen.size < Math.min(k, options.length))
              chosen.add(pick(options));
            Array.from(sel.options).forEach(
              (o) => (o.selected = chosen.has(o))
            );
            sel.dispatchEvent(new Event("change", { bubbles: true }));
            sel.dispatchEvent(new Event("input", { bubbles: true }));
            return;
          }
          const chosen = new Set();
          while (chosen.size < k) chosen.add(pick(options));
          Array.from(sel.options).forEach((o) => (o.selected = chosen.has(o)));
        } else {
          const opt = pick(options);
          sel.value = opt.value;
        }
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        sel.dispatchEvent(new Event("input", { bubbles: true }));
      };

      // Helper to randomize input
      const fillInput = (inp) => {
        const t = (
          inp.getAttribute("type") ||
          inp.type ||
          "text"
        ).toLowerCase();
        if (t === "number") {
          const min = inp.min !== "" ? Number(inp.min) : 0;
          const max = inp.max !== "" ? Number(inp.max) : 99;
          inp.value = String(
            rand(isFinite(min) ? min : 0, isFinite(max) ? max : 99)
          );
        } else if (t === "date") {
          const now = new Date();
          const past = new Date(now.getFullYear() - 5, 0, 1).getTime();
          const ts = rand(past, now.getTime());
          const d = new Date(ts);
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          inp.value = `${d.getFullYear()}-${m}-${day}`;
        } else if (t === "checkbox") {
          inp.checked = Math.random() < 0.5;
        } else if (t === "radio") {
          // handled separately by group
        } else {
          // text-like
          const id = (inp.id || "").toLowerCase();
          // Only autofill the patient name to avoid confusion with student-name etc.
          if (id === "patient-name") inp.value = randomName();
          else if (id === "age") inp.value = String(rand(18, 89));
          else
            inp.value = pick([
              "N/A",
              "None reported",
              "Unremarkable",
              "Intermittent",
              "Stable",
              "Worsening",
              "Improving",
            ]);
        }
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.dispatchEvent(new Event("change", { bubbles: true }));
      };

      // Fill selects
      root.querySelectorAll("select").forEach(fillSelect);

      // Fill inputs (except radios handled after)
      root.querySelectorAll("input:not([type=radio])").forEach(fillInput);

      // Fill textareas
      root.querySelectorAll("textarea").forEach((ta) => {
        // Do not auto-fill the AI prompt box
        if (ta.id === "aiPrompt") return;
        ta.value = pick([
          "Patient reports symptoms over several days.",
          "No prior similar episodes. Denies red-flag symptoms.",
          "Tolerating PO, normal urine output.",
          "Compliant with medications. No recent travel or sick contacts.",
        ]);
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        ta.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Fill radios by name groups
      const radios = Array.from(root.querySelectorAll('input[type="radio"]'));
      const byName = radios.reduce((acc, r) => {
        const n = r.name || "__default";
        (acc[n] = acc[n] || []).push(r);
        return acc;
      }, {});
      Object.values(byName).forEach((group) => {
        const r = pick(group);
        if (r) {
          r.checked = true;
          r.dispatchEvent(new Event("change", { bubbles: true }));
          r.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      // Apply scenario-specific coherent overrides where present
      const ccSel = document.getElementById("chief-complaint");
      if (ccSel && scenario.cc) setVal("chief-complaint", scenario.cc);
      if (scenario.site) setVal("site", scenario.site);
      if (scenario.onset) setVal("onset", scenario.onset);
      if (scenario.character) setVal("character", scenario.character);
      if (scenario.radiation) setVal("radiation", scenario.radiation);
      if (scenario.timing) setVal("timing", scenario.timing);
      if (scenario.exacerbating) setVal("exacerbating", scenario.exacerbating);
      if (scenario.relieving) setVal("relieving", scenario.relieving);
      if (scenario.social && scenario.social.smoking)
        setVal("smoking", scenario.social.smoking);
      if (scenario.social && scenario.social.alcohol)
        setVal("alcohol", scenario.social.alcohol);
      if (Array.isArray(scenario.associated) && scenario.associated.length) {
        // Try multi-select first if available; otherwise single-select fallback
        const assocSel = document.getElementById("associated");
        if (assocSel && assocSel.multiple) {
          setMulti("associated", scenario.associated);
        } else if (assocSel) {
          setVal("associated", scenario.associated[0]);
        }
      }

    });
  });
})();
*/

// Expose initBau for script.js loader
window.initBau = function initBau() {
  // Keep existing BAU features working; AI model chooser functionality preserved
  try {
    // AI model/token UI hardening against autofill + persistence
    (function setupAIModeAndTokenFields() {
      try {
        const modelSel = document.getElementById("ai-model");
        if (modelSel) {
          // Restore last choice and persist future changes
          const saved = localStorage.getItem("ai_model_choice");
          if (saved) modelSel.value = saved;
          modelSel.setAttribute("autocomplete", "off");
          modelSel.setAttribute("data-no-autofill", "true");
          modelSel.addEventListener("change", () => {
            try {
              localStorage.setItem("ai_model_choice", modelSel.value || "");
            } catch {}
          });

          // Guard against programmatic autofill by intercepting value/selectedIndex
          const selProto = Object.getPrototypeOf(modelSel);
          const selValueDesc = Object.getOwnPropertyDescriptor(
            selProto,
            "value"
          );
          const selIndexDesc = Object.getOwnPropertyDescriptor(
            selProto,
            "selectedIndex"
          );
          try {
            Object.defineProperty(modelSel, "value", {
              configurable: true,
              get() {
                return selValueDesc.get.call(this);
              },
              set(v) {
                if (this.__allowSet === true)
                  return selValueDesc.set.call(this, v);
                // ignore random programmatic sets
              },
            });
            Object.defineProperty(modelSel, "selectedIndex", {
              configurable: true,
              get() {
                return selIndexDesc.get.call(this);
              },
              set(v) {
                if (this.__allowSet === true)
                  return selIndexDesc.set.call(this, v);
                // ignore programmatic sets
              },
            });
          } catch {}
        }

        const tokenInput = document.getElementById("ai-gh-token");
        if (tokenInput) {
          // Fully disable client-side token usage; proxy handles secrets server-side
          try {
            localStorage.removeItem("gh_models_token");
          } catch {}
          tokenInput.value = "";
          tokenInput.setAttribute("readonly", "");
          tokenInput.placeholder = "No token needed";
          const editBtn = document.getElementById("ai-gh-token-edit");
          if (editBtn) {
            editBtn.disabled = true;
            editBtn.textContent = "Token not required";
          }
        }
      } catch {}
    })();

    // iOS select scroll fix: prevent jump-to-top and viewport cut-off when closing native select
    (function installIOSSelectScrollFix() {
      try {
        const isIOS = () =>
          /iP(ad|hone|od)/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        if (!isIOS()) return;
        const container =
          document.getElementById("history-form-container") || document.body;
        if (!container || container.__iosSelFixInstalled) return;
        container.__iosSelFixInstalled = true;
        let lastY = 0;
        container.addEventListener(
          "focusin",
          (e) => {
            const t = e.target;
            if (t && t.tagName === "SELECT") {
              lastY = window.scrollY || window.pageYOffset || 0;
            }
          },
          true
        );
        container.addEventListener(
          "change",
          (e) => {
            const t = e.target;
            if (!t || t.tagName !== "SELECT") return;
            // Ignore synthetic (programmatic) events to avoid unintended jumps
            if (e.isTrusted === false) return;
            // Ignore hidden selects (e.g., PE originals hidden behind checkboxes)
            if (
              t.offsetParent === null ||
              getComputedStyle(t).display === "none"
            )
              return;
            // Give iOS time to close the picker UI, then restore position and blur
            setTimeout(() => {
              const y =
                typeof lastY === "number" && lastY >= 0
                  ? lastY
                  : window.scrollY || window.pageYOffset || 0;
              window.scrollTo(0, y);
              if (typeof t.blur === "function") t.blur();
            }, 0);
          },
          true
        );
      } catch {}
    })();
  } catch (e) {
    console.warn("[BAU] initBau error:", e);
  }
};

// Add loadHistories function for compatibility
async function loadHistories() {
  try {
    const auth = window.auth;
    const user = auth?.currentUser || null;

    if (!user) {
      console.log("[BAU] No authenticated user for loadHistories");
      return;
    }

    const db = getFirestore(window.firebaseApp);
    const colRef = collection(db, "users", user.uid, "histories");
    const q = query(colRef, orderBy("timestamp", "desc"), limit(50));
    const snap = await getDocs(q);

    console.log(`[BAU] Loaded ${snap.size} histories`);

    if (window.renderHistorySidebar) {
      window.renderHistorySidebar();
    }
  } catch (error) {
    console.error("[BAU] Error loading histories:", error);
  }
}

// Export loadHistories globally
window.loadHistories = loadHistories;

// Add navigation initialization for the buttons we added
function initFormNavigation() {
  console.log("[BAU] Initializing form navigation...");

  const formNavBtns = document.querySelectorAll(".form-nav-btn");
  const staticContainer = document.getElementById("history-form-container");
  const dynamicContainer = document.getElementById("dynamic-chat-container");

  if (!formNavBtns.length || !staticContainer || !dynamicContainer) {
    console.warn("[BAU] Navigation elements not found, retrying in 500ms...");
    setTimeout(initFormNavigation, 500);
    return;
  }

  console.log("[BAU] Navigation elements found, setting up event listeners...");

  // Set default state: Static Form active, Dynamic Chat hidden
  staticContainer.style.display = "block";
  dynamicContainer.style.display = "none";

  // Set Static Form button as active by default
  const staticBtn = document.querySelector('.form-nav-btn[data-mode="static"]');
  const dynamicBtn = document.querySelector(
    '.form-nav-btn[data-mode="dynamic"]'
  );

  if (staticBtn) {
    staticBtn.classList.add("active");
    staticBtn.style.background = "var(--header-bg)";
    staticBtn.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
    staticBtn.style.fontWeight = "bold";
  }

  if (dynamicBtn) {
    dynamicBtn.classList.remove("active");
    dynamicBtn.style.background = "rgba(255, 255, 255, 0)";
    dynamicBtn.style.boxShadow = "none";
    dynamicBtn.style.fontWeight = "normal";
  }

  // Navigation button event listeners
  formNavBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;

      // Update button states
      formNavBtns.forEach((b) => {
        b.classList.remove("active");
        b.style.background = "rgba(255, 255, 255, 0)";
        b.style.boxShadow = "none";
        b.style.fontWeight = "normal";
      });

      btn.classList.add("active");
      btn.style.background = "var(--header-bg)";
      btn.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
      btn.style.fontWeight = "bold";

      // Show/hide containers
      if (mode === "static") {
        staticContainer.style.display = "block";
        dynamicContainer.style.display = "none";
      } else if (mode === "dynamic") {
        staticContainer.style.display = "none";
        dynamicContainer.style.display = "block";
      }
    });
  });

  console.log(
    "[BAU] Form navigation initialized successfully with Static Form as default"
  );
}

// Initialize navigation when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFormNavigation);
} else {
  setTimeout(initFormNavigation, 100);
}

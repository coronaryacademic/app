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

document.getElementById("submit-and-download").addEventListener("click", () => {
  if (!window.jspdf) {
    console.error("jsPDF library not found.");
    return;
  }

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
      "gender",
      "smoking",
      "alcohol",
      "occupation",
      "living",
      "travel",
    ];
    ids.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;
      if (select.multiple) return; // Only single-selects here
      if (select.dataset.enhanced === "1") return;
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
    // ARIA for accessibility
    btn.setAttribute("role", "combobox");
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");

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
      WebkitOverflowScrolling: "touch",
      color: "black",
    });
    const panelId = `${select.id}-listbox`;
    panel.id = panelId;
    panel.setAttribute("role", "listbox");
    btn.setAttribute("aria-controls", panelId);

    // --- Typeahead search for single-select ---
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
      color: "black",
      fontSize: "16px",
    });

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
      Object.assign(radio.style, { width: "20px", height: "20px" });
      radio.addEventListener("change", () => {
        select.value = value;
        row.setAttribute("aria-selected", "true");
        updateButtonText();
      });

      const span = document.createElement("span");
      span.textContent = text;
      if (span.style && span.style.setProperty) {
        span.style.setProperty("color", "black", "important");
      } else {
        span.style.color = "black";
      }

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
          if (groupLabel.style && groupLabel.style.setProperty) {
            groupLabel.style.setProperty("color", "black", "important");
          }
          rowsContainer.appendChild(groupLabel);
          Array.from(child.children).forEach((opt) => {
            rowsContainer.appendChild(
              createOptionRow(opt.text, opt.value, opt.selected)
            );
          });
        } else if (child.tagName === "OPTION") {
          rowsContainer.appendChild(
            createOptionRow(child.text, child.value, child.selected)
          );
        }
      });

      panel.appendChild(rowsContainer);

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "8px";
      actions.style.marginTop = "8px";
      actions.style.position = "sticky";
      actions.style.bottom = "0";
      actions.style.background = "#fafafa";
      actions.style.padding = "8px";
      actions.style.paddingBottom = "calc(8px + env(safe-area-inset-bottom))";
      actions.style.position = "sticky";
      actions.style.bottom = "0";
      actions.style.background = "#fafafa";
      actions.style.padding = "8px";
      actions.style.paddingBottom = "calc(8px + env(safe-area-inset-bottom))";

      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.textContent = "Clear";
      Object.assign(clearBtn.style, {
        padding: "12px 14px",
        border: "1px solid var(--all-text)",
        borderRadius: "4px",
        background: "#f7f7f7",
        cursor: "pointer",
        fontSize: "16px",
      });
      clearBtn.addEventListener("click", () => {
        select.value = "";
        panel
          .querySelectorAll('input[type="radio"]')
          .forEach((r) => (r.checked = false));
        updateButtonText();
      });

      const doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.textContent = "Done";
      Object.assign(doneBtn.style, {
        padding: "12px 14px",
        border: "1px solid #2cc9c7",
        borderRadius: "4px",
        color: "black",
        background: "#e8fbfb",
        cursor: "pointer",
        marginLeft: "auto",
        fontSize: "16px",
      });
      doneBtn.addEventListener("click", () => {
        search.blur();
        hidePanel();
      });

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
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    console.error("jsPDF not loaded correctly.");
    return;
  }

  const form = document.getElementById("history-form-container");
  if (!form) {
    console.error("Form container not found!");
    return;
  }

  function getLabelText(input) {
    let label = form.querySelector(`label[for="${input.id}"]`);
    if (!label && input.parentNode.tagName.toLowerCase() === "label") {
      label = input.parentNode;
    }
    return label
      ? label.innerText.replace(/\n/g, " ").trim()
      : input.id || "Field";
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const baseLineHeight = 10;
  let y = margin + 10; // Increase 10 to add top padding before title

  const blueColor = [44, 201, 199]; // rgb(44, 201, 199)

  // Current date/time for header
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  // Title centered top
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...blueColor);
  doc.text("Clinical History Report", pageWidth / 2, y, { align: "center" });
  y += 15;

  // Only show student name centered below title
  const studentName =
    document.getElementById("student-name")?.value || "Unknown Student";

  const groupNumber =
    document.getElementById("group-number")?.value || "Unknown Group";

  const rotation =
    document.getElementById("rotation")?.value || "Unknown Rotation";

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);

  doc.text(`Student Name: ${studentName}`, pageWidth / 2, y + 5, {
    // reduce from 10 to 5
    align: "center",
  });

  y += 15; // reduce from 30 to 15

  // Horizontal blue line after header info
  doc.setDrawColor(...blueColor);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Top-right corner: current date/time and BAU text (gray color)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100); // gray color

  const rightX = pageWidth - margin;
  const lineSpacing = 5;

  doc.text(`${dateStr} ${timeStr}`, rightX, 10, { align: "right" });
  doc.text("BAU - Faculty of Medicine", rightX, 10 + lineSpacing, {
    align: "right",
  });

  // Top-left corner: Student Number & Group Number
  const studentNumber =
    document.getElementById("student-number")?.value.trim() || "Unknown Number";

  const leftX = margin;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`${studentNumber}`, leftX, 10);
  doc.text(`${groupNumber}`, leftX, 10 + lineSpacing); // reuse existing groupNumber

  // Sections array
  const sections = [
    {
      title: "Patient Information",
      fields: ["patient-name", "date", "age", "gender"],
    },
    { title: "Chief Complaint", fields: ["chief-complaint"] },
    {
      title: "Socrates",
      fields: [
        "site",
        "onset",
        "character",
        "radiation",
        "associated",
        "timing",
        "exacerbating",
        "relieving",
        "severity",
      ],
    },
    {
      title: "Past Medical & Surgical History",
      fields: ["past-medical", "past-surgical"],
    },
    {
      title: "Drug History",
      fields: ["regular-meds", "otc", "drug-allergies"],
    },
    { title: "Family History", fields: ["family-history"] },
    {
      title: "Social History",
      fields: ["smoking", "alcohol", "occupation", "living", "travel"],
    },
    { title: "ICE (Ideas, Concerns, Expectations)", fields: ["ice"] },
    { title: "Review of Systems", fields: [] }, // ROS handled specially
  ];

  function getElementValue(id) {
    const el = form.querySelector(`#${id}`);
    if (!el) return "";

    // Single checkbox
    if (el.type === "checkbox") return el.checked ? "Yes" : "No";

    // Radio (if the id is on the input itself)
    if (el.type === "radio") return el.checked ? el.value : "";

    // Selects (handle multi-select)
    if (el.tagName === "SELECT") {
      const isMultiple = el.hasAttribute("multiple");
      if (isMultiple) {
        const selected = Array.from(el.selectedOptions).map((o) =>
          o.text.trim()
        );
        return selected.join(", ");
      }
      return el.options[el.selectedIndex]?.text || "";
    }

    // Containers with checkbox groups (e.g., PMH/PSH)
    // If id matches known groups or container has checkboxes, aggregate checked values
    if (
      el.tagName === "DIV" ||
      el.tagName === "FIELDSET" ||
      el.classList.contains("boxed-section")
    ) {
      const checked = Array.from(
        el.querySelectorAll('input[type="checkbox"]:checked')
      ).map((c) => c.value.trim());
      if (checked.length > 0) return checked.join(", ");
    }

    return el.value || "";
  }

  function drawSectionHeader(text) {
    const headerHeight = 15;
    if (y + headerHeight + 10 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(...blueColor);
    doc.setDrawColor(...blueColor);
    doc.rect(margin, y, pageWidth - margin * 2, headerHeight, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const rectMiddleY = y + headerHeight / 2 + 2; // no extra padding

    doc.text(text, pageWidth / 2, rectMiddleY, { align: "center" });

    y += headerHeight + 10;
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
  }

  function writeField(label, value) {
    const labelX = margin;
    const valueX = margin + 80;
    const valueFontSize = 12;

    const splitValue = doc.splitTextToSize(value, pageWidth - valueX - margin);

    if (y + baseLineHeight * splitValue.length > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label + ":", labelX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(valueFontSize);
    doc.text(splitValue, valueX, y);

    y += baseLineHeight * splitValue.length + 5;
    doc.setFontSize(12);
  }

  // Gather all ROS symptoms grouped by system
  function getROSGrouped() {
    const rosCheckboxes = form.querySelectorAll("input.ros");
    const rosBySystem = {};
    rosCheckboxes.forEach((checkbox) => {
      if (!checkbox.checked) return;
      const system = checkbox.getAttribute("data-system") || "Other";
      if (!rosBySystem[system]) rosBySystem[system] = [];
      rosBySystem[system].push(checkbox.value);
    });
    return rosBySystem;
  }

  // Custom smart wrapper to avoid breaking words mid-line
  function smartSplitTextToSize(text, maxWidth) {
    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? currentLine + " " + word : word;
      const testWidth = doc.getTextWidth(testLine);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Draw table for ROS symptoms with wrapped text and dynamic row height
  function drawROSTable(rosBySystem) {
    const systems = Object.keys(rosBySystem);
    if (systems.length === 0) return;

    const colWidth = (pageWidth - 2 * margin) / systems.length;
    const paddingX = 8; // padding inside cells
    const paddingY = 4;
    const lineHeight = 7;

    let maxRows = 0;
    systems.forEach((sys) => {
      if (rosBySystem[sys].length > maxRows) maxRows = rosBySystem[sys].length;
    });

    // Wrap text for each cell using smartSplitTextToSize
    const wrappedSymptoms = [];
    for (let row = 0; row < maxRows; row++) {
      wrappedSymptoms[row] = [];
      for (let i = 0; i < systems.length; i++) {
        const sys = systems[i];
        const symptom = rosBySystem[sys][row] || "";
        wrappedSymptoms[row][i] = symptom
          ? smartSplitTextToSize(`• ${symptom}`, colWidth - paddingX * 2)
          : [];
      }
    }

    // Calculate row heights based on max wrapped lines per row
    const rowHeights = wrappedSymptoms.map((row) => {
      let maxLines = 1;
      row.forEach((cell) => {
        if (cell.length > maxLines) maxLines = cell.length;
      });
      return maxLines * lineHeight + paddingY * 2;
    });

    const headerHeight = lineHeight + paddingY * 2;
    const totalTableHeight =
      rowHeights.reduce((a, b) => a + b, 0) + headerHeight + 10;

    // Page break if not enough space
    if (y + totalTableHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // Draw header
    doc.setFillColor(...blueColor);
    doc.setDrawColor(...blueColor);
    doc.setLineWidth(1);
    doc.rect(margin, y, pageWidth - margin * 2, headerHeight, "F");

    const tableTop = y;
    const tableLeft = margin;
    const tableWidth = pageWidth - margin * 2;

    // Header text with smaller font size (10 instead of 12)
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    systems.forEach((sys, i) => {
      const x = margin + i * colWidth + paddingX;
      const textY = y + headerHeight / 2 + 3;
      doc.text(sys, x, textY);
    });
    y += headerHeight;

    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    for (let row = 0; row < maxRows; row++) {
      if (y + rowHeights[row] > pageHeight - margin) {
        // Draw outer border before page break
        doc.setDrawColor(...blueColor);
        doc.setLineWidth(1);
        doc.rect(tableLeft, tableTop, tableWidth, y - tableTop);

        doc.addPage();
        y = margin;

        // Redraw header with smaller font size (10)
        doc.setFillColor(...blueColor);
        doc.setDrawColor(...blueColor);
        doc.setLineWidth(1);
        doc.rect(margin, y, pageWidth - margin * 2, headerHeight, "F");

        doc.setTextColor(255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        systems.forEach((sys, i) => {
          const x = margin + i * colWidth + paddingX;
          const textY = y + headerHeight / 2 + 3;
          doc.text(sys, x, textY);
        });

        y += headerHeight;

        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }

      // Zebra stripe background
      if (row % 2 === 1) {
        doc.setFillColor(230, 245, 245);
        doc.rect(margin, y, pageWidth - margin * 2, rowHeights[row], "F");
      }

      // Draw horizontal line above row
      doc.setDrawColor(...blueColor);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);

      // Draw each cell text with smaller font size
      for (let i = 0; i < systems.length; i++) {
        const x = margin + i * colWidth + paddingX;
        const cellLines = wrappedSymptoms[row][i];
        if (cellLines.length > 0) {
          const textY = y + paddingY + lineHeight - 2;

          doc.setFontSize(8); // smaller font inside cells
          doc.text(cellLines, x, textY);
          doc.setFontSize(10); // reset font size
        }
      }

      y += rowHeights[row];

      // Draw horizontal line below row
      doc.line(margin, y, pageWidth - margin, y);
    }

    // Draw vertical lines and outer border
    doc.setDrawColor(...blueColor);
    doc.setLineWidth(1);
    for (let i = 0; i <= systems.length; i++) {
      const x = margin + i * colWidth;
      doc.line(x, tableTop, x, y);
    }
  }

  sections.forEach((section, index) => {
    // Skip ICE and ROS here — we will add them together at the end on same page
    if (
      section.title === "Review of Systems" ||
      section.title === "ICE (Ideas, Concerns, Expectations)"
    )
      return;

    // Add page breaks before specific sections
    if (index === 1) {
      // Before HPC – SOCRATES
      doc.addPage();
      y = margin;
    } else if (index === 3) {
      // Before Past Medical & Surgical History
      doc.addPage();
      y = margin;
    } else if (index === 6) {
      // Before Social History
      doc.addPage();
      y = margin;
    }

    drawSectionHeader(section.title);
    section.fields.forEach((fieldId) => {
      const val = getElementValue(fieldId);
      if (val.trim() === "") return;
      writeField(getLabelText(form.querySelector(`#${fieldId}`)), val);
    });
  });

  // Add a page before ICE + ROS to ensure they are on the last page
  doc.addPage();
  y = margin;

  // Draw ICE section
  const iceVal = getElementValue("ice");
  if (iceVal.trim() !== "") {
    drawSectionHeader("ICE (Ideas, Concerns, Expectations)");
    writeField("ICE", iceVal);
  }

  // Draw Review of Systems section immediately after ICE
  const rosBySystem = getROSGrouped();
  if (Object.keys(rosBySystem).length > 0) {
    drawSectionHeader("Review of Systems");
    drawROSTable(rosBySystem);
  }

  // === ADD NEW PAGE BEFORE SUMMARY AND DDx ===
  doc.addPage();
  y = margin;

  // Your generateSummaryParagraph(), draw summary header, write summary text, suggestDDx(), draw ddx header and list code here (see full snippet from previous message)

  // Save file
  let patientName =
    document.getElementById("patient-name")?.value.trim() || "Unknown";
  patientName = patientName.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");

  // ----------- Generate Summary Paragraph -----------
  function generateSummaryParagraph() {
    // Helpers
    const getSelectedTexts = (id) => {
      const el = document.getElementById(id);
      if (!el) return [];
      const opts = Array.from(el.selectedOptions || []);
      if (opts.length) return opts.map((o) => (o.text || "").trim());
      // Fallback for inputs/textareas: split by comma/semicolon
      if (typeof el.value === "string" && el.value.trim()) {
        return el.value
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    };
    const joinNatural = (arr) => {
      const list = arr.filter(Boolean);
      if (list.length === 0) return "";
      if (list.length === 1) return list[0];
      if (list.length === 2) return `${list[0]} and ${list[1]}`;
      return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
    };

    const patientName = getElementValue("patient-name") || "The patient";
    const age = getElementValue("age");
    const gender = getElementValue("gender");

    const cc = getSelectedTexts("chief-complaint");

    const site = getSelectedTexts("site");
    const onset = getSelectedTexts("onset");
    const character = getSelectedTexts("character");
    const radiation = getSelectedTexts("radiation");
    const associated = getSelectedTexts("associated");
    const timing = getSelectedTexts("timing");
    const exacerbating = getSelectedTexts("exacerbating");
    const relieving = getSelectedTexts("relieving");
    const severity = getSelectedTexts("severity");

    const pmh = getSelectedTexts("past-medical");
    const psh = getSelectedTexts("past-surgical");
    const meds = getSelectedTexts("regular-meds");
    const allergies = getElementValue("drug-allergies");
    const family = getElementValue("family-history");

    // SH are single-selects
    const smoking = getElementValue("smoking");
    const alcohol = getElementValue("alcohol");
    const occupation = getElementValue("occupation");
    const living = getElementValue("living");
    const travel = getElementValue("travel");

    const ice = getElementValue("ice");

    const rosBySystem = getROSGrouped();
    const rosSymptoms = [];
    Object.values(rosBySystem).forEach((symptoms) =>
      rosSymptoms.push(...symptoms)
    );
    const rosSummary = joinNatural(rosSymptoms);

    // Build paragraph
    let paragraph = patientName;
    if (age && gender) paragraph += ` is a ${age}-year-old ${gender}`;
    else if (age) paragraph += ` is a ${age}-year-old`;
    else if (gender) paragraph += ` is a ${gender}`;

    if (cc.length) paragraph += ` presenting with ${joinNatural(cc)}`;

    const socratesParts = [];
    if (site.length) socratesParts.push(`located at the ${joinNatural(site)}`);
    if (onset.length)
      socratesParts.push(`with an onset of ${joinNatural(onset)}`);
    if (character.length)
      socratesParts.push(`characterized as ${joinNatural(character)}`);
    if (radiation.length)
      socratesParts.push(`radiating to ${joinNatural(radiation)}`);
    if (associated.length)
      socratesParts.push(`associated with ${joinNatural(associated)}`);
    if (timing.length) socratesParts.push(`occurring ${joinNatural(timing)}`);
    if (exacerbating.length) {
      // Special phrase for "On its own"
      const others = exacerbating.filter(
        (t) => t.toLowerCase() !== "on its own"
      );
      const phrases = [];
      if (others.length) phrases.push(`exacerbated by ${joinNatural(others)}`);
      if (exacerbating.some((t) => t.toLowerCase() === "on its own"))
        phrases.push("occurring on its own");
      if (phrases.length) socratesParts.push(phrases.join(" and "));
    }
    if (relieving.length)
      socratesParts.push(`relieved by ${joinNatural(relieving)}`);
    if (severity.length)
      socratesParts.push(`with a severity rated as ${joinNatural(severity)}`);

    if (socratesParts.length) paragraph += `, ${socratesParts.join(", ")}`;
    paragraph += ".";

    if (pmh.length)
      paragraph += ` Past medical history is significant for ${joinNatural(
        pmh
      )}.`;
    if (psh.length)
      paragraph += ` Surgical history includes ${joinNatural(psh)}.`;
    if (meds.length)
      paragraph += ` Current medications include ${joinNatural(meds)}.`;
    if (allergies) paragraph += ` Known drug allergies are ${allergies}.`;
    if (family) paragraph += ` Family history reveals ${family}.`;

    const socialParts = [];
    if (smoking) socialParts.push(`smokes ${smoking}`);
    if (alcohol) socialParts.push(`consumes alcohol ${alcohol}`);
    if (occupation) socialParts.push(`works as a(n) ${occupation}`);
    if (living) socialParts.push(`lives in ${living}`);
    if (travel) socialParts.push(`recent travel history includes ${travel}`);
    if (socialParts.length)
      paragraph += ` Social history shows that the patient ${socialParts.join(
        ", "
      )}.`;

    if (rosSummary) paragraph += ` Review of systems reveals ${rosSummary}.`;
    if (ice) paragraph += ` ICE summary: ${ice.trim()}.`;

    return paragraph;
  }

  // ----------- Append Summary to PDF -----------
  drawSectionHeader("History Summary");
  const summaryParagraph = generateSummaryParagraph();
  const summaryLines = smartSplitTextToSize(
    summaryParagraph,
    pageWidth - 2 * margin
  );
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * baseLineHeight; // remove +10 or make it smaller like +3

  function suggestDDx(chiefComplaint, summaryParagraph) {
    // Helpers to pull selected features
    const getSelectedTexts = (id) => {
      const sel = document.getElementById(id);
      if (!sel) return [];
      return Array.from(sel.selectedOptions || []).map((o) =>
        (o.text || "").trim().toLowerCase()
      );
    };
    const hasAny = (arr, needles) => arr.some((t) => needles.includes(t));
    const hasWord = (str, word) => new RegExp(`\\b${word}\\b`, "i").test(str);

    const cc = getSelectedTexts("chief-complaint");
    const site = getSelectedTexts("site");
    const onset = getSelectedTexts("onset");
    const character = getSelectedTexts("character");
    const radiation = getSelectedTexts("radiation");
    const associated = getSelectedTexts("associated");
    const timing = getSelectedTexts("timing");
    const exacerbating = getSelectedTexts("exacerbating");
    const relieving = getSelectedTexts("relieving");
    const severity = getSelectedTexts("severity");

    // Social history and risk
    const smoking = getSelectedTexts("smoking");
    const travel = getSelectedTexts("travel");

    // Build rule-based DDx list
    const rulesDDx = [];

    const ccHas = (val) => cc.includes(val.toLowerCase());
    const charHas = (val) => character.includes(val.toLowerCase());
    const assocHas = (val) => associated.includes(val.toLowerCase());
    const radHas = (val) => radiation.includes(val.toLowerCase());
    const exHas = (val) => exacerbating.includes(val.toLowerCase());
    const relHas = (val) => relieving.includes(val.toLowerCase());
    const siteHas = (val) => site.some((s) => s.includes(val.toLowerCase()));

    // Chest pain combinations
    if (
      (ccHas("chest pain") || assocHas("chest tightness")) &&
      (radHas("left arm") || radHas("both arms") || assocHas("diaphoresis"))
    ) {
      rulesDDx.push("Acute coronary syndrome (unstable angina/NSTEMI/STEMI)");
    }
    if (
      (ccHas("chest pain") || assocHas("pleuritic chest pain")) &&
      (exHas("deep breathing") || exHas("coughing")) &&
      (travel.includes("international travel") ||
        travel.includes("domestic travel"))
    ) {
      rulesDDx.push("Pulmonary embolism");
    }
    if (
      (ccHas("chest pain") && charHas("tearing")) ||
      (ccHas("chest pain") && radHas("back") && onset.includes("sudden"))
    ) {
      rulesDDx.push("Aortic dissection");
    }
    if (assocHas("wheeze") || ccHas("wheeze")) {
      rulesDDx.push("Asthma exacerbation");
    }

    // Respiratory infection combo
    if (
      (assocHas("fever") || ccHas("fever")) &&
      assocHas("cough") &&
      assocHas("sputum")
    ) {
      rulesDDx.push("Community-acquired pneumonia");
    }

    // Abdominal pain combos
    if (siteHas("right upper quadrant") && exHas("meals")) {
      rulesDDx.push("Acute cholecystitis/biliary colic");
    }
    if (siteHas("right lower quadrant") && assocHas("fever")) {
      rulesDDx.push("Acute appendicitis");
    }
    if (siteHas("epigastric") && (exHas("meals") || assocHas("heartburn"))) {
      rulesDDx.push("Peptic ulcer disease / GERD");
    }

    // GU combos
    if (assocHas("painful urination") && assocHas("frequency")) {
      rulesDDx.push("Urinary tract infection");
    }
    if (siteHas("flank") && assocHas("blood in urine")) {
      rulesDDx.push("Urolithiasis (kidney stones)");
    }

    // Constitutional symptoms
    if (assocHas("night sweats") && assocHas("weight loss")) {
      rulesDDx.push("Lymphoma / Chronic infection (e.g., TB)");
    }

    // Deduplicate rule-based suggestions while preserving order
    const ruleOrdered = [...new Set(rulesDDx)];

    // Fallback: keyword-based clusters (existing logic)
    const text = (chiefComplaint + " " + summaryParagraph).toLowerCase();
    const containsAny = (words) =>
      words.some((word) => new RegExp(`\\b${word}\\b`, "i").test(text));
    const ddxMap = [
      {
        keys: [
          "chest pain",
          "pain in chest",
          "angina",
          "tightness in chest",
          "shortness of breath",
          "dyspnea",
          "palpitations",
        ],
        ddx: [
          "Acute coronary syndrome, including unstable angina and myocardial infarction",
          "Pericarditis and pericardial effusion",
          "Pulmonary embolism presenting with pleuritic chest pain",
          "Aortic dissection with sudden severe chest pain",
          "Gastroesophageal reflux disease causing heartburn",
          "Costochondritis and musculoskeletal chest wall pain",
          "Pneumothorax causing sudden chest pain and respiratory distress",
        ],
      },
      {
        keys: [
          "fever",
          "pyrexia",
          "chills",
          "cough",
          "productive cough",
          "sputum",
          "shortness of breath",
          "dyspnea",
          "difficulty breathing",
        ],
        ddx: [
          "Community-acquired bacterial pneumonia",
          "Viral pneumonitis including COVID-19 and influenza",
          "Acute bronchitis",
          "Pulmonary tuberculosis",
          "Exacerbation of chronic obstructive pulmonary disease",
          "Asthma exacerbation",
          "Interstitial lung disease",
        ],
      },
      {
        keys: [
          "abdominal pain",
          "pain in abdomen",
          "right upper quadrant pain",
          "right lower quadrant pain",
          "epigastric pain",
          "periumbilical pain",
          "colicky pain",
        ],
        ddx: [
          "Acute appendicitis",
          "Acute cholecystitis or biliary colic",
          "Acute pancreatitis",
          "Peptic ulcer disease with possible perforation",
          "Small or large bowel obstruction",
          "Inflammatory bowel disease such as Crohn's disease or ulcerative colitis",
          "Diverticulitis",
          "Ectopic pregnancy in women of childbearing age",
        ],
      },
      {
        keys: [
          "weight loss",
          "unintentional weight loss",
          "night sweats",
          "profuse sweating at night",
          "fatigue",
          "tiredness",
        ],
        ddx: [
          "Lymphoma including Hodgkin and non-Hodgkin types",
          "Pulmonary tuberculosis",
          "Chronic infections such as HIV/AIDS",
          "Malignancies including lung, gastrointestinal, or hematologic cancers",
          "Hyperthyroidism",
          "Systemic autoimmune diseases such as systemic lupus erythematosus",
        ],
      },
      {
        keys: [
          "headache",
          "head pain",
          "migraine",
          "cluster headache",
          "head pressure",
        ],
        ddx: [
          "Migraine headache with or without aura",
          "Tension-type headache",
          "Cluster headache",
          "Sinusitis",
          "Intracranial mass lesions including tumors or abscess",
          "Temporal arteritis in patients over 50 years with scalp tenderness",
          "Subarachnoid hemorrhage presenting with sudden 'thunderclap' headache",
        ],
      },
      {
        keys: [
          "joint pain",
          "arthritis",
          "swollen joints",
          "morning stiffness",
          "joint redness",
          "joint deformity",
        ],
        ddx: [
          "Osteoarthritis, degenerative joint disease",
          "Rheumatoid arthritis, autoimmune inflammatory arthritis",
          "Gout, crystal-induced arthritis",
          "Systemic lupus erythematosus",
          "Septic (infectious) arthritis",
          "Psoriatic arthritis",
        ],
      },
      {
        keys: [
          "dizziness",
          "vertigo",
          "lightheadedness",
          "syncope",
          "fainting",
          "weakness",
          "numbness",
          "paresthesia",
        ],
        ddx: [
          "Orthostatic hypotension causing syncope",
          "Vasovagal syncope triggered by stress or pain",
          "Cardiac arrhythmias including atrial fibrillation",
          "Transient ischemic attack or ischemic stroke",
          "Peripheral neuropathy",
          "Multiple sclerosis",
          "Benign paroxysmal positional vertigo",
        ],
      },
      {
        keys: ["rash", "skin lesions", "itching", "pruritus", "erythema"],
        ddx: [
          "Contact dermatitis due to allergens or irritants",
          "Psoriasis presenting with plaques and scaling",
          "Atopic dermatitis (eczema)",
          "Drug-induced skin eruptions",
          "Infectious etiologies such as herpes zoster, measles, or fungal infections",
          "Systemic lupus erythematosus with malar rash",
        ],
      },
      {
        keys: [
          "diarrhea",
          "loose stools",
          "frequent bowel movements",
          "constipation",
          "difficulty passing stool",
          "nausea",
          "vomiting",
        ],
        ddx: [
          "Infectious gastroenteritis",
          "Irritable bowel syndrome",
          "Inflammatory bowel disease including Crohn's disease and ulcerative colitis",
          "Colorectal cancer",
          "Medication side effects such as opioids causing constipation",
          "Bowel obstruction",
        ],
      },
      {
        keys: [
          "dysuria",
          "painful urination",
          "frequency",
          "urgency",
          "hematuria",
        ],
        ddx: [
          "Urinary tract infection",
          "Pyelonephritis",
          "Urolithiasis (kidney stones)",
          "Bladder cancer in patients with hematuria",
          "Prostatitis in males",
          "Interstitial cystitis",
        ],
      },
    ];

    let keywordDDx = [];
    for (const cluster of ddxMap) {
      if (containsAny(cluster.keys))
        keywordDDx = keywordDDx.concat(cluster.ddx);
    }
    keywordDDx = [...new Set(keywordDDx)];

    // Merge rule-based first, then keyword-based, cap at 10
    const merged = [...ruleOrdered];
    for (const d of keywordDDx) if (!merged.includes(d)) merged.push(d);
    if (merged.length === 0) {
      merged.push(
        "Symptoms are non-specific; further clinical evaluation is required."
      );
    }
    return merged.slice(0, 10);
  }

  drawSectionHeader("Suggested Differential Diagnoses");
  const ddx = suggestDDx(getElementValue("chief-complaint"), summaryParagraph);
  doc.text(
    ddx.map((d, i) => `${i + 1}. ${d}`),
    margin,
    y
  );
  y += ddx.length * baseLineHeight + 10;

  doc.save(
    `${patientName}_History_${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}.pdf`
  );
});

// ===== Global enhancer: CC/SOCRATES as multi-select, Gender/Social as single-select =====
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

  // Single-select (radio dropdown) for Gender & Social
  const singleIds = [
    "gender",
    "smoking",
    "alcohol",
    "occupation",
    "living",
    "travel",
  ];
  singleIds.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;
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
    maxHeight: "260px",
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
    color: "black",
    fontSize: "16px",
  });

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
        rowsContainer.appendChild(groupLabel);
        Array.from(child.children).forEach((opt) => {
          rowsContainer.appendChild(
            createOptionRow(opt.text, opt.value, opt.selected)
          );
        });
      } else if (child.tagName === "OPTION") {
        rowsContainer.appendChild(
          createOptionRow(child.text, child.value, child.selected)
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
      padding: "12px 14px",
      border: "1px solid var(--all-text)",
      borderRadius: "4px",
      background: "#f7f7f7",
      cursor: "pointer",
      color: "black",
      fontSize: "16px",
    });
    clearBtn.addEventListener("click", () => {
      // Truly clear selection so no option is chosen
      select.selectedIndex = -1;
      panel
        .querySelectorAll('input[type="radio"]')
        .forEach((r) => (r.checked = false));
      updateButtonText();
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
}

// Example usage:
// After injecting your HTML dynamically, call:
onHistoryFormInjected();

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
    maxHeight: "260px",
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
    color: "black",
  });
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
        rowsContainer.appendChild(groupLabel);
        Array.from(child.children).forEach((opt) => {
          rowsContainer.appendChild(
            createOptionRow(opt.text, opt.value, opt.selected)
          );
        });
      } else if (child.tagName === "OPTION") {
        rowsContainer.appendChild(
          createOptionRow(child.text, child.value, child.selected)
        );
      }
    });

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

  // --- Debounced search filter behavior ---
  const msDebounce = (fn, ms) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };
  search.addEventListener(
    "input",
    msDebounce(() => {
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

// ---- Ensure SH and Gender use custom single-select UI on page load ----
(function enhanceSHGenderOnLoad() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceSHGenderOnLoad);
    return;
  }
  try {
    const ids = [
      "gender",
      "smoking",
      "alcohol",
      "occupation",
      "living",
      "travel",
    ];
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
        const text = select.options[select.selectedIndex]?.text?.trim();
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
          updateButtonText();
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
              rowsContainer.appendChild(
                createOptionRow(opt.text, opt.value, opt.selected)
              );
            });
          } else if (child.tagName === "OPTION") {
            rowsContainer.appendChild(
              createOptionRow(child.text, child.value, child.selected)
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
          panel
            .querySelectorAll('input[type="radio"]')
            .forEach((r) => (r.checked = false));
          updateButtonText();
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
    });
  } catch {}
})();

// ============================
// Auto-fill Demo (Random)
// ============================
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

      // Scroll to AI section; do NOT auto-run. Let the user press Ask AI -> review -> Send AI.
      const ai = document.getElementById("ai-demo");
      if (ai) ai.scrollIntoView({ behavior: "smooth", block: "center" });
      const resultEl = document.getElementById("aiResult");
      if (resultEl)
        resultEl.textContent =
          "Auto-fill complete. Click 'Ask AI' to compose a preview.";
    });
  });
})();

// ============================
// Auth-gated Firebase AI demo
// ============================
// This initializer is called by script.js after the BAU page loads
// It shows the AI demo only for authenticated users and wires the prompt handling.
(function attachAIDemoInitializer() {
  if (window.initBau) return; // avoid redefining

  function waitForFirebase(maxAttempts = 50, intervalMs = 200) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        const ready = !!(window.firebaseApp && window.auth);
        if (ready) {
          clearInterval(timer);
          resolve({ app: window.firebaseApp, auth: window.auth });
        } else if (attempts >= maxAttempts) {
          clearInterval(timer);
          reject(new Error("Firebase globals not available on BAU page"));
        }
      }, intervalMs);
    });
  }

  function loadFirebaseAI() {
    if (window.__fbai) return Promise.resolve(window.__fbai);
    return new Promise((resolve, reject) => {
      try {
        const code = `import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-ai.js"; window.__fbai = { getAI, getGenerativeModel, GoogleAIBackend };`;
        const s = document.createElement("script");
        s.type = "module";
        s.textContent = code;
        s.onload = () => resolve(window.__fbai);
        s.onerror = () => reject(new Error("Failed to load Firebase AI SDK"));
        document.body.appendChild(s);
      } catch (e) {
        reject(e);
      }
    });
  }

  async function initAIDemo() {
    const aiSection = document.getElementById("ai-demo");
    const promptEl = document.getElementById("aiPrompt");
    const sendBtn = document.getElementById("aiSendBtn");
    const resultEl = document.getElementById("aiResult");
    const previewEl = document.getElementById("aiPromptPreview");

    if (!aiSection || !promptEl || !sendBtn || !resultEl) {
      // AI UI not on this page; nothing to do
      return;
    }

    try {
      const { auth } = await waitForFirebase();

      // Gate UI by auth state (support global function or instance method)
      const subscribe = (cb) => {
        if (typeof window.onAuthStateChanged === "function")
          return window.onAuthStateChanged(auth, cb);
        if (auth && typeof auth.onAuthStateChanged === "function")
          return auth.onAuthStateChanged(cb);
        // Fallback: poll currentUser briefly
        const t = setInterval(() => cb(auth.currentUser || null), 500);
        return () => clearInterval(t);
      };

      subscribe(async (user) => {
        if (!user) {
          aiSection.style.display = "none";
          resultEl.textContent = "Sign in to use AI.";
          sendBtn.disabled = true;
          return;
        }

        aiSection.style.display = "block";
        sendBtn.disabled = false;
        resultEl.textContent = "";

        // Basic safe Markdown renderer (bold + line breaks)
        function escapeHtml(str) {
          return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
        }
        function renderMarkdownBasic(str) {
          let s = escapeHtml(str || "");
          // bold
          s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
          // line breaks
          s = s.replace(/\n/g, "<br>");
          return s;
        }

        try {
          await loadFirebaseAI();
        } catch (e) {
          console.warn("[BAU] Firebase AI SDK failed to load:", e);
          resultEl.textContent = "AI unavailable. Please try again later.";
          sendBtn.disabled = true;
          return;
        }

        // If the user edits the form after composing, revert to compose mode
        const formRoot =
          document.getElementById("history-form-container") || document.body;
        if (formRoot && !formRoot.__aiChangeWired) {
          formRoot.__aiChangeWired = true;
          const revertToCompose = () => {
            if (sendBtn) {
              sendBtn.textContent = "Ask AI";
              sendBtn.dataset.mode = "compose";
            }
            if (resultEl && resultEl.textContent !== "") {
              resultEl.textContent =
                "Form changed. Click 'Ask AI' to re-compose a fresh preview.";
            }
          };
          formRoot.addEventListener("input", revertToCompose, true);
          formRoot.addEventListener("change", revertToCompose, true);
        }

        // Single-click handler guard
        if (!sendBtn.__wired) {
          sendBtn.__wired = true;
          sendBtn.addEventListener("click", async () => {
            const raw = (promptEl.value || "").trim();

            // Build structured prompt from current form data
            let summary = "";
            try {
              if (typeof generateSummaryParagraph === "function") {
                summary = String(generateSummaryParagraph() || "");
              }
            } catch {}

            // Fallback summary if primary function failed or returned too little
            const summarizeFallback = () => {
              const getVal = (id) => {
                const el = document.getElementById(id);
                if (!el) return "";
                if (el.tagName === "SELECT") {
                  const selTexts = Array.from(el.selectedOptions || [])
                    .map((o) => o.text || o.value)
                    .filter(Boolean);
                  return selTexts.join(", ");
                }
                return (el.value || "").trim();
              };
              const joinNat = (arr) => arr.filter(Boolean).join(", ");
              const name = getVal("patient-name") || "The patient";
              const age = getVal("age");
              const gender = getVal("gender");
              const cc = (() => {
                const ccEl = document.getElementById("chief-complaint");
                if (!ccEl) return "";
                const arr = Array.from(ccEl.selectedOptions || [])
                  .map((o) => o.text || o.value)
                  .filter(Boolean);
                return joinNat(arr);
              })();
              const parts = [];
              let first = name;
              if (age && gender) first += ` is a ${age}-year-old ${gender}`;
              else if (age) first += ` is a ${age}-year-old`;
              else if (gender) first += ` is a ${gender}`;
              if (cc) first += ` presenting with ${cc}`;
              parts.push(first + ".");
              const socrates = [
                ["site", "at"],
                ["onset", "onset"],
                ["character", "character"],
                ["radiation", "radiating to"],
                ["associated", "with"],
                ["timing", "timing"],
                ["exacerbating", "worse with"],
                ["relieving", "relieved by"],
              ];
              const socTxt = socrates
                .map(([id, label]) => {
                  const v = getVal(id);
                  return v ? `${label} ${v}` : "";
                })
                .filter(Boolean)
                .join(", ");
              if (socTxt) parts.push(`SOCRATES features: ${socTxt}.`);
              return parts.join(" ");
            };

            if (!summary || summary.trim().length < 20) {
              try {
                summary = summarizeFallback();
              } catch {}
            }

            let ddxList = [];
            try {
              const ccEl = document.getElementById("chief-complaint");
              const ccTexts = ccEl
                ? Array.from(ccEl.selectedOptions || [])
                    .map((o) => o.text)
                    .filter(Boolean)
                : [];
              if (typeof suggestDDx === "function") {
                ddxList = suggestDDx(ccTexts, summary) || [];
              }
            } catch {}

            const ddxLine =
              ddxList && ddxList.length ? ddxList.join(", ") : "None";
            const basePrompt = `You are a clinical decision support assistant. Using the clinical history below, provide only:
1) A concise diagnostic summary (2–3 sentences)
2) A prioritised top 5 differential diagnosis with one-line justification each
Use UK spelling. Keep total output under 120 words.

Clinical history:\n${
              summary || "No summary available."
            }\n\nContext DDx: ${ddxLine}`;

            // Compose base prompt ONLY for preview step (do not append textarea yet)
            const composed = basePrompt;

            // Step 1: Compose + preview (default mode)
            const mode = sendBtn.dataset.mode || "compose";
            if (mode === "compose") {
              if (previewEl) previewEl.textContent = composed;
              if (promptEl) promptEl.value = composed;
              // Keep a reference to the last composed to compare later
              sendBtn.dataset.lastComposed = composed.slice(0, 4000);
              if (resultEl)
                resultEl.textContent =
                  "Preview ready. Edit if needed, then click Send AI.";
              sendBtn.textContent = "Send AI";
              sendBtn.dataset.mode = "send";
              return;
            }

            // Step 2: Send current textarea content
            let finalPrompt = (
              promptEl && promptEl.value ? promptEl.value : composed
            ).slice(0, 4000);
            if (!finalPrompt || !finalPrompt.trim()) {
              finalPrompt = (
                promptEl && promptEl.value ? promptEl.value : composed
              ).slice(0, 4000);
            }
            if (previewEl) previewEl.textContent = finalPrompt;
            sendBtn.disabled = true;
            resultEl.textContent = "Thinking…";

            try {
              // Determine selected model from UI (default to Gemini)
              const selectedModel = (
                document.getElementById("ai-model")?.value || "gemini-1.5-flash"
              ).trim();

              let text = "";

              if (selectedModel === "mistral-large-2411") {
                // Secure path: route via serverless proxy; no tokens in frontend.
                const resp = await fetch("/api/ai/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    provider: "github",
                    model: "mistral-large-2411",
                    messages: [
                      { role: "system", content: "" },
                      { role: "user", content: finalPrompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 512,
                    top_p: 0.9,
                  }),
                });
                if (!resp.ok) {
                  const errTxt = await resp.text().catch(() => "");
                  throw new Error(`Proxy error (${resp.status}): ${errTxt}`);
                }
                const data = await resp.json();
                text = data?.content || "";
              } else if (selectedModel === "openai/gpt-5-nano") {
                // Route GPT-5 Nano via GitHub Models Azure Inference
                try {
                  // As of now GPT-5 Nano may not be enabled in your account; fallback to gpt-4o-mini
                  const fallbackModel = "gpt-4o-mini";
                  const reply = await window.githubModelsChat(
                    fallbackModel,
                    null,
                    [
                      { role: "system", content: "" },
                      { role: "user", content: finalPrompt },
                    ]
                  );
                  const note =
                    "Note: 'gpt-5-nano' unavailable; used 'gpt-4o-mini' via GitHub Models.";
                  text = reply ? `${note}\n\n${reply}` : note;
                } catch (e) {
                  throw new Error(
                    `GitHub Models (GPT-5 Nano) failed: ${e?.message || e}`
                  );
                }
              } else {
                // Default: Gemini via Firebase AI SDK (existing flow)
                const { getAI, getGenerativeModel, GoogleAIBackend } =
                  window.__fbai || {};
                if (!getAI || !getGenerativeModel || !GoogleAIBackend) {
                  throw new Error("AI SDK not ready");
                }
                const ai = getAI(window.firebaseApp, {
                  backend: new GoogleAIBackend(),
                });
                const model = getGenerativeModel(ai, { model: selectedModel });
                const generationConfig = {
                  temperature: 0.3,
                  maxOutputTokens: 512,
                };
                const resp = await model.generateContent(
                  finalPrompt,
                  generationConfig
                );
                try {
                  if (typeof resp.text === "function") text = await resp.text();
                } catch {}
                if (
                  !text &&
                  resp &&
                  resp.response &&
                  typeof resp.response.text === "function"
                ) {
                  try {
                    text = await resp.response.text();
                  } catch {}
                }
                if (!text && resp && resp.candidates?.length) {
                  text =
                    resp.candidates[0]?.content?.parts
                      ?.map((p) => p.text)
                      .filter(Boolean)
                      .join("\n") || "";
                }
              }

              resultEl.innerHTML = renderMarkdownBasic(text || "No response.");
            } catch (e2) {
              console.error("[BAU] AI generation error:", e2);
              const msg = e2?.message || String(e2) || "failed to generate";
              resultEl.textContent = `Error: ${msg}`;
            } finally {
              sendBtn.disabled = false;
              // Reset to compose mode for next run
              sendBtn.textContent = "Ask AI";
              sendBtn.dataset.mode = "compose";
            }
          });
        }

        // Press Enter to send (Shift+Enter inserts newline)
        if (!promptEl.__enterWired) {
          promptEl.__enterWired = true;
          promptEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!sendBtn.disabled) {
                sendBtn.click();
              }
            }
          });
        }
      });
    } catch (e) {
      console.warn("[BAU] Firebase not ready; skipping AI init:", e);
    }
  }

  // Expose initBau for script.js loader
  window.initBau = function initBau() {
    // Keep existing BAU features working; only initialize AI demo here
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
            try { localStorage.removeItem("gh_models_token"); } catch {}
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
              if (t && t.tagName === "SELECT") {
                // Give iOS time to close the picker UI, then restore position and blur
                setTimeout(() => {
                  window.scrollTo(0, lastY);
                  if (typeof t.blur === "function") t.blur();
                }, 0);
              }
            },
            true
          );
        } catch {}
      })();

      initAIDemo();
    } catch (e) {
      console.warn("[BAU] initBau AI init error:", e);
    }
  };
})();

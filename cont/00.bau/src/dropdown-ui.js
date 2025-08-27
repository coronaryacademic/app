// === Enhanced Custom Dropdown UI ===
export function enhanceSocratesSelectsInFlow() {
  // Add modern styling first
  addModernDropdownStyles();
  // Multi-select (checkbox dropdown)
  const multiIds = [
    "associated-symptoms",
    "timing",
    "exacerbating",
    "relieving",
    "past-medical-history",
    "medications",
    "allergies",
    "family-history",
    "differential-diagnosis",
    "management-plan",
  ];
  multiIds.forEach((id) => {
    const select = document.getElementById(id);
    if (!select || !select.multiple || select.dataset.enhanced === "1") return;

    select.dataset.enhanced = "1";

    const wrapper = document.createElement("div");
    wrapper.className = "dropdown-multi-wrapper";
    wrapper.style.width = "100%";
    wrapper.style.marginTop = "6px";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dropdown-multi-button";
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
    panel.className = "dropdown-multi-panel";
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
        : "Select options";
      const selected = Array.from(select.selectedOptions).filter(
        (opt) => opt.value && opt.value.trim() !== ""
      );
      if (selected.length === 0) {
        btn.textContent = base;
      } else if (selected.length === 1) {
        btn.textContent = selected[0].text.trim();
      } else {
        btn.textContent = `${selected.length} selected`;
      }
    }

    function createOptionRow(text, value, selected) {
      const row = document.createElement("label");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";
      row.style.padding = "6px 4px";
      row.setAttribute("data-row", "1");
      row.setAttribute("data-text", text.toLowerCase());

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = value;
      checkbox.checked = !!selected;
      checkbox.addEventListener("change", () => {
        const option = Array.from(select.options).find(
          (opt) => opt.value === value
        );
        if (option) option.selected = checkbox.checked;
        updateButtonText();
        select.dispatchEvent(new Event("change", { bubbles: true }));
        select.dispatchEvent(new Event("input", { bubbles: true }));
        if (window.updateProgressTracker) {
          setTimeout(window.updateProgressTracker, 50);
        }
      });

      const span = document.createElement("span");
      span.textContent = text;
      span.style.color = "black";

      row.appendChild(checkbox);
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
      clearBtn.textContent = "Clear All";
      Object.assign(clearBtn.style, {
        padding: "6px 10px",
        border: "1px solid var(--all-text)",
        borderRadius: "4px",
        background: "#f7f7f7",
        cursor: "pointer",
      });
      clearBtn.addEventListener("click", () => {
        Array.from(select.options).forEach((opt) => (opt.selected = false));
        panel
          .querySelectorAll('input[type="checkbox"]')
          .forEach((cb) => (cb.checked = false));
        updateButtonText();
        select.dispatchEvent(new Event("change", { bubbles: true }));
        select.dispatchEvent(new Event("input", { bubbles: true }));
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
  });

  // Single-select (radio dropdown) for Social History
  const singleIds = [
    "smoking",
    "alcohol",
    "occupation",
    "living",
    "travel",
  ];
  singleIds.forEach((id) => {
    const select = document.getElementById(id);
    // If explicitly marked native, remove any previous enhancement and skip
    if (select && select.dataset.native === "1") {
      try {
        const prev = select.previousElementSibling;
        if (prev && prev.classList && prev.classList.contains("dropdown-single-wrapper")) {
          prev.remove();
        }
        // Restore native select visibility/state
        select.style.display = "";
        if (select.dataset.enhanced === "1") delete select.dataset.enhanced;
      } catch (e) {
        // no-op
      }
    }
    // Opt-out: skip enhancement if explicitly marked native or invalid
    if (
      !select ||
      select.multiple ||
      select.dataset.enhanced === "1" ||
      select.dataset.native === "1"
    ) {
      return;
    }

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

      // Get current value and find matching option
      const currentValue = select.value;

      // Skip if no value or empty value
      if (!currentValue || currentValue.trim() === "") {
        btn.textContent = base;
        return;
      }

      // Find the exact matching option by value
      const matchingOption = Array.from(select.options).find(
        (opt) => opt.value === currentValue
      );

      // Validate the option exists and is not disabled/placeholder
      if (
        matchingOption &&
        !matchingOption.disabled &&
        matchingOption.value !== ""
      ) {
        const text = matchingOption.text?.trim();
        if (text && !text.toLowerCase().includes("select")) {
          btn.textContent = text;
          return;
        }
      }

      // Fallback to base text if no valid option found
      btn.textContent = base;
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
        // Set the select value and update selectedIndex properly
        select.value = value;
        const targetIndex = Array.from(select.options).findIndex(
          (opt) => opt.value === value
        );
        if (targetIndex !== -1) {
          select.selectedIndex = targetIndex;
        }

        // Update button text immediately
        updateButtonText();

        // Dispatch events for form validation and tracking
        select.dispatchEvent(new Event("change", { bubbles: true }));
        select.dispatchEvent(new Event("input", { bubbles: true }));

        // Update progress tracker with delay to ensure DOM is updated
        if (window.updateProgressTracker) {
          setTimeout(() => {
            window.updateProgressTracker();
          }, 100);
        }
      });

      const span = document.createElement("span");
      span.textContent = text;
      span.style.color = "black";

      row.addEventListener("click", (e) => {
        if (e.target !== radio) {
          radio.checked = true;

          // Set the select value and update selectedIndex properly
          select.value = value;
          const targetIndex = Array.from(select.options).findIndex(
            (opt) => opt.value === value
          );
          if (targetIndex !== -1) {
            select.selectedIndex = targetIndex;
          }

          // Update button text immediately
          updateButtonText();

          // Dispatch events for form validation and tracking
          select.dispatchEvent(new Event("change", { bubbles: true }));
          select.dispatchEvent(new Event("input", { bubbles: true }));

          // Update progress tracker with delay to ensure DOM is updated
          if (window.updateProgressTracker) {
            setTimeout(() => {
              window.updateProgressTracker();
            }, 100);
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
          rowsContainer.appendChild(groupLabel);
          Array.from(child.children).forEach((opt) => {
            // Skip disabled placeholder options
            if (
              opt.disabled ||
              opt.value === "" ||
              opt.text.toLowerCase().includes("select")
            ) {
              return;
            }
            const isSelected = opt.value === currentValue;
            rowsContainer.appendChild(
              createOptionRow(opt.text, opt.value, isSelected)
            );
          });
        } else if (child.tagName === "OPTION") {
          // Skip disabled placeholder options
          if (
            child.disabled ||
            child.value === "" ||
            child.text.toLowerCase().includes("select")
          ) {
            return;
          }
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
        select.dispatchEvent(new Event("change", { bubbles: true }));
        select.dispatchEvent(new Event("input", { bubbles: true }));
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
      if (window.updateProgressTracker) {
        setTimeout(window.updateProgressTracker, 50);
      }
    });
  });

  function addModernDropdownStyles() {
    const style = document.createElement("style");
    style.textContent = `
      /* Enhanced Dropdown Styling */
      .dropdown-multi-wrapper, .dropdown-single-wrapper {
        position: relative;
        z-index: 100;
      }
      
      .dropdown-multi-button, .dropdown-single-button {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
        border: 2px solid #e9ecef !important;
        border-radius: 8px !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
      }
      
      .dropdown-multi-button:hover, .dropdown-single-button:hover {
        border-color: #2cc9c7 !important;
        box-shadow: 0 4px 8px rgba(44, 201, 199, 0.15) !important;
        transform: translateY(-1px) !important;
      }
      
      .dropdown-multi-panel, .dropdown-single-panel {
        background: #ffffff !important;
        border: 2px solid #2cc9c7 !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        backdrop-filter: blur(10px) !important;
        z-index: 1000 !important;
      }
      
      .dropdown-multi-panel input[type="search"], .dropdown-single-panel input[type="search"] {
        border: 1px solid #dee2e6 !important;
        border-radius: 6px !important;
        transition: all 0.3s ease !important;
      }
      
      .dropdown-multi-panel input[type="search"]:focus, .dropdown-single-panel input[type="search"]:focus {
        border-color: #2cc9c7 !important;
        box-shadow: 0 0 0 3px rgba(44, 201, 199, 0.1) !important;
        outline: none !important;
      }
      
      .dropdown-multi-panel label, .dropdown-single-panel label {
        border-radius: 4px !important;
        transition: all 0.2s ease !important;
      }
      
      .dropdown-multi-panel label:hover, .dropdown-single-panel label:hover {
        background: rgba(44, 201, 199, 0.1) !important;
        transform: translateX(2px) !important;
      }
      
      .dropdown-multi-panel button, .dropdown-single-panel button {
        border-radius: 6px !important;
        font-weight: 500 !important;
        transition: all 0.3s ease !important;
      }
      
      .dropdown-multi-panel button:hover, .dropdown-single-panel button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
      }
      
      /* Animation for panel opening */
      .dropdown-multi-panel, .dropdown-single-panel {
        animation: dropdownFadeIn 0.3s ease-out;
      }
      
      @keyframes dropdownFadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Enhanced checkbox and radio styling */
      .dropdown-multi-panel input[type="checkbox"], .dropdown-single-panel input[type="radio"] {
        width: 16px !important;
        height: 16px !important;
        accent-color: #2cc9c7 !important;
      }
      
      /* Better text styling */
      .dropdown-multi-panel span, .dropdown-single-panel span {
        font-size: 14px !important;
        line-height: 1.4 !important;
        color: #495057 !important;
      }
    `;
    document.head.appendChild(style);
  }
}

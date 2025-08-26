// === Enhanced Form Data Management ===
export function initFormDataManagement() {
  try {
    // Add modern form enhancements
    addFormValidationStyling();

    // Auto-save functionality
    function saveFormData() {
      const form = document.getElementById("history-form");
      if (!form) return;

      const data = {};
      const inputs = form.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        if (input.type === "checkbox" || input.type === "radio") {
          if (input.checked) {
            if (!data[input.name]) data[input.name] = [];
            data[input.name].push(input.value);
          }
        } else if (input.tagName === "SELECT" && input.multiple) {
          data[input.id] = Array.from(input.selectedOptions).map(
            (opt) => opt.text
          );
        } else if (input.tagName === "SELECT") {
          const selectedOption = input.options[input.selectedIndex];
          data[input.id] = selectedOption ? selectedOption.text : "";
        } else {
          data[input.id] = input.value;
        }
      });

      try {
        localStorage.setItem("bauFormData", JSON.stringify(data));
      } catch (e) {
        console.warn("Could not save form data:", e);
      }
    }

    // Load saved form data
    function loadFormData() {
      try {
        const saved = localStorage.getItem("bauFormData");
        if (!saved) return;

        const data = JSON.parse(saved);
        applySnapshotToForm(data);
      } catch (e) {
        console.warn("Could not load form data:", e);
      }
    }

    // Apply data snapshot to form
    function applySnapshotToForm(snapshot) {
      const setSelectByText = (sel, text) => {
        if (!sel) return;
        const opts = Array.from(sel.options || []);

        // Find matching option by text, excluding disabled/placeholder options
        const match = opts.find((o) => {
          const optText = (o.text || "").trim();
          const searchText = String(text).trim();
          return (
            optText === searchText &&
            !o.disabled &&
            o.value !== "" &&
            !optText.toLowerCase().includes("select")
          );
        });

        if (match) {
          sel.value = match.value;
          sel.selectedIndex = opts.indexOf(match);

          // Update custom dropdown button text if it exists
          setTimeout(() => {
            const wrapper = sel.parentElement?.querySelector(
              ".dropdown-single-wrapper"
            );
            if (wrapper) {
              const button = wrapper.querySelector(".dropdown-single-button");
              if (button && match) {
                button.textContent = match.text.trim();
              }
            }
          }, 150);
        }

        // Dispatch events for validation and tracking
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        sel.dispatchEvent(new Event("input", { bubbles: true }));
      };

      const setMultiSelectByTexts = (sel, texts) => {
        if (!sel || !Array.isArray(texts)) return;
        const opts = Array.from(sel.options || []);
        opts.forEach((opt) => {
          opt.selected = texts.includes(opt.text.trim());
        });
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        sel.dispatchEvent(new Event("input", { bubbles: true }));
      };

      Object.entries(snapshot).forEach(([key, value]) => {
        const el = document.getElementById(key);
        if (!el) return;

        if (el.tagName === "SELECT") {
          if (el.multiple && Array.isArray(value)) {
            setMultiSelectByTexts(el, value);
          } else {
            setSelectByText(el, value);
          }
        } else if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
          el.value = value || "";
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      // Update progress tracker after loading
      if (window.updateProgressTracker) {
        setTimeout(window.updateProgressTracker, 200);
      }
    }

    // Clear form data
    function clearFormData() {
      const form = document.getElementById("history-form");
      if (!form) return;

      // Clear all inputs
      const inputs = form.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        if (input.type === "checkbox" || input.type === "radio") {
          input.checked = false;
        } else if (input.tagName === "SELECT") {
          if (input.multiple) {
            Array.from(input.options).forEach((opt) => (opt.selected = false));
          } else {
            input.selectedIndex = 0;
          }
          // Update custom dropdown UI
          const wrapper = input.parentElement?.querySelector(
            ".dropdown-single-wrapper, .dropdown-multi-wrapper"
          );
          if (wrapper) {
            const button = wrapper.querySelector(
              ".dropdown-single-button, .dropdown-multi-button"
            );
            if (button) {
              const labelEl = input
                .closest(".form-subsection, .form-section")
                ?.querySelector(`label[for="${input.id}"]`);
              const base = labelEl
                ? `${labelEl.innerText.trim()} — select...`
                : "Select option";
              button.textContent = base;
            }
          }
        } else {
          input.value = "";
        }
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });

      // Clear localStorage
      try {
        localStorage.removeItem("bauFormData");
      } catch (e) {
        console.warn("Could not clear saved form data:", e);
      }

      // Update progress tracker
      if (window.updateProgressTracker) {
        setTimeout(window.updateProgressTracker, 100);
      }
    }

    // Auto-save on form changes (debounced)
    let saveTimeout;
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveFormData, 1000);
    };

    document.addEventListener("input", debouncedSave);
    document.addEventListener("change", debouncedSave);

    // Load saved data on page load
    setTimeout(loadFormData, 500);

    // Export functions for external use
    window.saveFormData = saveFormData;
    window.loadFormData = loadFormData;
    window.clearFormData = clearFormData;
    window.applySnapshotToForm = applySnapshotToForm;

    // Attach clear button functionality
    const clearBtn = document.getElementById("clear-form");
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to clear all form data?")) {
          clearFormData();
        }
      });
    }

    function addFormValidationStyling() {
      const style = document.createElement("style");
      style.textContent = `
        /* Enhanced Form Field Styling */
        input, textarea, select {
          transition: all 0.3s ease !important;
          border-radius: 6px !important;
        }
        
        input:focus, textarea:focus, select:focus {
          border-color: #2cc9c7 !important;
          box-shadow: 0 0 0 3px rgba(44, 201, 199, 0.1) !important;
          outline: none !important;
          transform: translateY(-1px) !important;
        }
        
        input.field-error, textarea.field-error, select.field-error {
          border-color: #dc3545 !important;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
        }
        
        input.field-success, textarea.field-success, select.field-success {
          border-color: #28a745 !important;
          box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1) !important;
        }
        
        /* Form Section Headers */
        .form-section h3, .form-subsection h4 {
          color: #2cc9c7 !important;
          font-weight: 600 !important;
          margin-bottom: 15px !important;
        }
        
        /* Enhanced Button Styling */
        button {
          transition: all 0.3s ease !important;
          border-radius: 6px !important;
          font-weight: 500 !important;
        }
        
        button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        #generate-pdf {
          background: linear-gradient(135deg, #2cc9c7 0%, #1a9b99 100%) !important;
          border: none !important;
          color: white !important;
          padding: 12px 24px !important;
          font-size: 16px !important;
        }
        
        #clear-form {
          background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%) !important;
          border: none !important;
          color: white !important;
        }
      `;
      document.head.appendChild(style);
    }
  } catch (e) {
    console.warn("[BAU] Form data management init error:", e);
  }
}

// === BAU Form - Modular Architecture ===
// Main initialization file that imports and coordinates all modules

// Import all modules
import { initAIModelAndToken } from "./src/ai-model.js";
import { initProgressTracker } from "./src/progress-tracker.js";
import { enhanceSocratesSelectsInFlow } from "./src/dropdown-ui.js";
import { initFormDataManagement } from "./src/form-data.js";
import { initPDFGenerator } from "./src/pdf-generator.js";
import { initAIDemo } from "./src/ai-demo.js";
import { initStudentAutofill } from "./src/student-autofill.js";

// Main initialization function
(function initBAU() {
  try {
    console.log("[BAU] Initializing modular BAU system...");

    // Initialize all modules in the correct order
    initAIModelAndToken();
    initProgressTracker();
    initFormDataManagement();
    initStudentAutofill();
    initPDFGenerator();

    // Initialize dropdown UI enhancements after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(enhanceSocratesSelectsInFlow, 100);
      });
    } else {
      setTimeout(enhanceSocratesSelectsInFlow, 100);
    }

    // Initialize AI demo (will be called by external script after auth)
    window.initAIDemo = initAIDemo;

    console.log("[BAU] Modular BAU system initialized successfully");
  } catch (e) {
    console.error("[BAU] Initialization error:", e);
  }
})();

// Export main initialization function for external use
window.initBAU = initBAU;

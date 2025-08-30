// === BAU Form - Modular Architecture ===
// Main initialization file that imports and coordinates all modules

// Import all modules
import { initAIDemo } from "./src/ai-demo.js";
import { enhanceSocratesSelectsInFlow } from "./src/dropdown-ui.js";
import { initFormDataManagement } from "./src/form-data.js";
import { initPDFGenerator } from "./src/pdf-generator.js";

// Main initialization function
function initBAU() {
  try {
    console.log("[BAU] Initializing modular BAU system...");

    // Initialize all modules in the correct order
    initFormDataManagement();
    initPDFGenerator();

    // Ensure classic HTML report generator is loaded (globals)
    const ensureHTMLReportGenerator = () =>
      new Promise((resolve) => {
        if (window.generateHTMLReport && window.initHTMLReportGenerator) {
          return resolve();
        }
        const existing = document.querySelector(
          'script[src="cont/00.bau/src/html-report-generator.js"]'
        );
        if (existing) return existing.addEventListener("load", () => resolve());
        const s = document.createElement("script");
        s.src = "cont/00.bau/src/html-report-generator.js";
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.body.appendChild(s);
      });

    ensureHTMLReportGenerator().then(() => {
      try {
        if (typeof window.initHTMLReportGenerator === "function") {
          window.initHTMLReportGenerator();
        }
      } catch (e) {
        console.warn("[BAU] initHTMLReportGenerator failed:", e);
      }
    });

    // Initialize AI Demo after a short delay to ensure DOM is ready
    setTimeout(() => {
      initAIDemo();
    }, 200);

    // Initialize dropdown UI enhancements after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(enhanceSocratesSelectsInFlow, 100);
      });
    } else {
      setTimeout(enhanceSocratesSelectsInFlow, 100);
    }

    console.log("[BAU] Modular BAU system initialized successfully");
  } catch (e) {
    console.error("[BAU] Initialization error:", e);
  }
}

// Auto-initialize and export for external use
initBAU();
window.initBAU = initBAU;

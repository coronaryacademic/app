// === AI Demo Functionality ===
import { firebaseAI } from "./firebase-ai.js";
import {
  generateHTMLReport,
  openHTMLReportInNewTab,
  downloadHTMLReport,
} from "./html-report-generator.js";

export function initAIDemo() {
  try {
    console.log("[AI-DEMO] Starting initialization...");
    const aiButton = document.getElementById("ai-generate");
    const aiOutput = document.getElementById("ai-output");
    const aiModel = document.getElementById("ai-model");

    console.log("[AI-DEMO] Elements found:", {
      aiButton: !!aiButton,
      aiOutput: !!aiOutput,
      aiModel: !!aiModel
    });

    if (!aiButton || !aiOutput || !aiModel) {
      console.warn("[BAU] AI demo elements not found - missing elements:", {
        aiButton: !aiButton,
        aiOutput: !aiOutput,
        aiModel: !aiModel
      });
      return;
    }

    // Initialize Firebase AI and update model options
    initializeFirebaseAI();

    async function initializeFirebaseAI() {
      try {
        await firebaseAI.initialize();
        updateModelOptions();
        console.log("[BAU] Firebase AI initialized successfully");
      } catch (error) {
        console.error("[BAU] Firebase AI initialization failed:", error);
        aiOutput.innerHTML = `<p style="color: red;">Firebase AI initialization failed: ${error.message}</p>`;
      }
    }

    function updateModelOptions() {
      const models = firebaseAI.getAvailableModels();
      aiModel.innerHTML =
        '<option value="" disabled selected>Select AI model</option>';

      models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model.value;
        option.textContent = model.text;
        aiModel.appendChild(option);
      });

      // Restore saved model selection
      const savedModel = localStorage.getItem("aiModel");
      if (savedModel && models.some((m) => m.value === savedModel)) {
        aiModel.value = savedModel;
      }
    }

    // AI generation handler
    aiButton.addEventListener("click", async (e) => {
      console.log("[AI-DEMO] Button clicked!");
      e.preventDefault();

      const selectedModel = aiModel.value;
      console.log("[AI-DEMO] Selected model:", selectedModel);
      
      // Collect form data for processing
      const formData = collectFormData();

      // Show loading state
      aiButton.disabled = true;
      aiButton.textContent = "Generating...";
      aiOutput.innerHTML = "<p>Processing your request...</p>";

      try {
        let aiContent = null;
        
        // Only generate AI content if model is selected
        if (selectedModel) {
          // AI generation would go here when re-enabled
          // For now, skip AI processing
          console.log("[AI-DEMO] AI model selected but AI processing disabled for testing");
        }
        
        // Generate HTML report (with or without AI content)
        const htmlReport = generateHTMLReport(formData, aiContent);
        openHTMLReportInNewTab(htmlReport);

        // Show success message
        const aiStatus = selectedModel ? "(AI assessment disabled for testing)" : "(No AI model selected)";
        aiOutput.innerHTML = `
          <div class="ai-suggestions">
            <h3>Report Generated Successfully</h3>
            <p style="color: #198754; font-weight: 600;">Clinical report has been opened in a new tab ${aiStatus}.</p>
          </div>
        `;
        aiOutput.style.display = "block";
      } catch (error) {
        console.error("Report generation error:", error);
        aiOutput.innerHTML = `<p style="color: red;">Error generating report: ${error.message}</p>`;
      } finally {
        aiButton.disabled = false;
        aiButton.textContent = "Get Report";
      }
    });

    function collectFormData() {
      const getElementValue = (id) => {
        const el = document.getElementById(id);
        if (!el) return "";
        if (el.tagName === "SELECT") {
          if (el.multiple) {
            return Array.from(el.selectedOptions)
              .filter((opt) => opt.value && opt.value.trim())
              .map((opt) => opt.text.trim())
              .join(", ");
          } else {
            const selected = el.options[el.selectedIndex];
            return selected && !selected.disabled ? selected.text.trim() : "";
          }
        }
        return el.value || "";
      };

      return {
        patientName: getElementValue("patient-name"),
        patientAge: getElementValue("age"),
        gender: getElementValue("gender"),
        chiefComplaint: getElementValue("chief-complaint"),
        site: getElementValue("site"),
        onset: getElementValue("onset"),
        character: getElementValue("character"),
        radiation: getElementValue("radiation"),
        associatedSymptoms: getElementValue("associated"),
        timing: getElementValue("timing"),
        exacerbating: getElementValue("exacerbating"),
        relieving: getElementValue("relieving"),
        severity: getElementValue("severity"),
        pastMedicalHistory: getElementValue("past-medical-history"),
        medications: getElementValue("medications"),
        allergies: getElementValue("allergies"),
        familyHistory: getElementValue("family-history"),
        smoking: getElementValue("sh-smoking"),
        alcohol: getElementValue("sh-alcohol"),
        occupation: getElementValue("sh-occupation"),
        living: getElementValue("sh-living"),
        travel: getElementValue("sh-travel"),
        ice: getElementValue("ice"),
        examination: getElementValue("examination"),
        investigations: getElementValue("investigations"),
      };
    }

    function buildAIPrompt(data) {
      let prompt = `Please analyze this patient case and provide clinical insights:\n\n`;

      if (data.patientAge) {
        prompt += `Patient: ${data.patientAge} year old\n`;
      }

      if (data.chiefComplaint) {
        prompt += `Chief Complaint: ${data.chiefComplaint}\n`;
      }

      if (data.site || data.onset || data.character) {
        prompt += `\nPresenting Complaint Details:\n`;
        if (data.site) prompt += `- Site: ${data.site}\n`;
        if (data.onset) prompt += `- Onset: ${data.onset}\n`;
        if (data.character) prompt += `- Character: ${data.character}\n`;
        if (data.radiation) prompt += `- Radiation: ${data.radiation}\n`;
        if (data.associatedSymptoms)
          prompt += `- Associated symptoms: ${data.associatedSymptoms}\n`;
        if (data.timing) prompt += `- Timing: ${data.timing}\n`;
        if (data.exacerbating)
          prompt += `- Exacerbating factors: ${data.exacerbating}\n`;
        if (data.relieving)
          prompt += `- Relieving factors: ${data.relieving}\n`;
        if (data.severity) prompt += `- Severity: ${data.severity}\n`;
      }

      if (data.pastMedicalHistory)
        prompt += `\nPast Medical History: ${data.pastMedicalHistory}\n`;
      if (data.medications) prompt += `Medications: ${data.medications}\n`;
      if (data.allergies) prompt += `Allergies: ${data.allergies}\n`;
      if (data.familyHistory)
        prompt += `Family History: ${data.familyHistory}\n`;

      if (data.smoking || data.alcohol || data.occupation) {
        prompt += `\nSocial History:\n`;
        if (data.smoking) prompt += `- Smoking: ${data.smoking}\n`;
        if (data.alcohol) prompt += `- Alcohol: ${data.alcohol}\n`;
        if (data.occupation) prompt += `- Occupation: ${data.occupation}\n`;
        if (data.living) prompt += `- Living situation: ${data.living}\n`;
        if (data.travel) prompt += `- Travel: ${data.travel}\n`;
      }

      if (data.examination)
        prompt += `\nExamination findings: ${data.examination}\n`;
      if (data.investigations)
        prompt += `Investigations: ${data.investigations}\n`;

      prompt += `\nPlease provide:\n1. Most likely differential diagnoses (top 3-5)\n2. Recommended investigations\n3. Initial management approach\n4. Red flags to watch for\n\nPlease format your response clearly with headings.`;

      return prompt;
    }

    function displayAIResult(result) {
      if (!result.success || result.error) {
        aiOutput.innerHTML = `<p style="color: red;">Error: ${
          result.error || "Unknown error occurred"
        }</p>`;
        aiOutput.style.display = "block";
        return;
      }

      let html = '<div class="ai-suggestions">';
      html += "<h3>Report Generated Successfully</h3>";
      html +=
        '<p style="color: #198754; font-weight: 600;">Clinical report has been opened in a new tab with AI assessment included.</p>';

      // Show usage info if available
      if (result.usage) {
        html += `<div class="ai-usage" style="margin-top: 15px; padding: 10px; background: var(--userdiv); border-radius: 8px; font-size: 12px; color: var(--all-text); opacity: 0.8;">
          <strong>Usage:</strong> ${result.usage.totalTokens || 0} tokens (${
          result.model
        })
        </div>`;
      }

      html +=
        '<p class="ai-disclaimer" style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404;"><strong>Educational Use Only:</strong> The AI-generated assessment is for educational purposes only. Always consult qualified medical professionals for actual patient care and clinical decisions.</p>';
      html += "</div>";

      aiOutput.innerHTML = html;
      aiOutput.style.display = "block";
    }
  } catch (e) {
    console.warn("[BAU] AI demo init error:", e);
  }
}

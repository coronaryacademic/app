// === AI Demo Functionality ===
export function initAIDemo() {
  try {
    const aiSection = document.getElementById("ai-section");
    const aiButton = document.getElementById("ai-generate");
    const aiOutput = document.getElementById("ai-output");
    const aiModel = document.getElementById("ai-model");

    if (!aiSection || !aiButton || !aiOutput || !aiModel) {
      console.warn("[BAU] AI demo elements not found");
      return;
    }

    // Show AI section for authenticated users
    if (window.isUserAuthenticated && window.isUserAuthenticated()) {
      aiSection.style.display = "block";
    }

    // AI generation handler
    aiButton.addEventListener("click", async (e) => {
      e.preventDefault();
      
      const selectedModel = aiModel.value;
      if (!selectedModel) {
        alert("Please select an AI model first.");
        return;
      }

      // Collect form data for AI processing
      const formData = collectFormData();
      if (!formData.chiefComplaint) {
        alert("Please enter a chief complaint before generating AI suggestions.");
        return;
      }

      // Show loading state
      aiButton.disabled = true;
      aiButton.textContent = "Generating...";
      aiOutput.innerHTML = "<p>Processing your request...</p>";

      try {
        // Make API call to generate AI suggestions
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            formData: formData,
            prompt: buildAIPrompt(formData)
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        displayAIResult(result);

      } catch (error) {
        console.error("AI generation error:", error);
        aiOutput.innerHTML = `<p style="color: red;">Error generating AI suggestions: ${error.message}</p>`;
      } finally {
        aiButton.disabled = false;
        aiButton.textContent = "Generate AI Suggestions";
      }
    });

    function collectFormData() {
      const getElementValue = (id) => {
        const el = document.getElementById(id);
        if (!el) return "";
        if (el.tagName === "SELECT") {
          if (el.multiple) {
            return Array.from(el.selectedOptions)
              .filter(opt => opt.value && opt.value.trim())
              .map(opt => opt.text.trim())
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
        patientAge: getElementValue("patient-age"),
        gender: getElementValue("gender"),
        chiefComplaint: getElementValue("chief-complaint"),
        site: getElementValue("site"),
        onset: getElementValue("onset"),
        character: getElementValue("character"),
        radiation: getElementValue("radiation"),
        associatedSymptoms: getElementValue("associated-symptoms"),
        timing: getElementValue("timing"),
        exacerbating: getElementValue("exacerbating"),
        relieving: getElementValue("relieving"),
        severity: getElementValue("severity"),
        pastMedicalHistory: getElementValue("past-medical-history"),
        medications: getElementValue("medications"),
        allergies: getElementValue("allergies"),
        familyHistory: getElementValue("family-history"),
        smoking: getElementValue("smoking"),
        alcohol: getElementValue("alcohol"),
        occupation: getElementValue("occupation"),
        living: getElementValue("living"),
        travel: getElementValue("travel"),
        ice: getElementValue("ice"),
        examination: getElementValue("examination"),
        investigations: getElementValue("investigations")
      };
    }

    function buildAIPrompt(data) {
      let prompt = `Please analyze this patient case and provide clinical insights:\n\n`;
      
      if (data.patientAge || data.gender) {
        prompt += `Patient: ${data.patientAge ? data.patientAge + " year old" : ""} ${data.gender || "patient"}\n`;
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
        if (data.associatedSymptoms) prompt += `- Associated symptoms: ${data.associatedSymptoms}\n`;
        if (data.timing) prompt += `- Timing: ${data.timing}\n`;
        if (data.exacerbating) prompt += `- Exacerbating factors: ${data.exacerbating}\n`;
        if (data.relieving) prompt += `- Relieving factors: ${data.relieving}\n`;
        if (data.severity) prompt += `- Severity: ${data.severity}\n`;
      }

      if (data.pastMedicalHistory) prompt += `\nPast Medical History: ${data.pastMedicalHistory}\n`;
      if (data.medications) prompt += `Medications: ${data.medications}\n`;
      if (data.allergies) prompt += `Allergies: ${data.allergies}\n`;
      if (data.familyHistory) prompt += `Family History: ${data.familyHistory}\n`;

      if (data.smoking || data.alcohol || data.occupation) {
        prompt += `\nSocial History:\n`;
        if (data.smoking) prompt += `- Smoking: ${data.smoking}\n`;
        if (data.alcohol) prompt += `- Alcohol: ${data.alcohol}\n`;
        if (data.occupation) prompt += `- Occupation: ${data.occupation}\n`;
        if (data.living) prompt += `- Living situation: ${data.living}\n`;
        if (data.travel) prompt += `- Travel: ${data.travel}\n`;
      }

      if (data.examination) prompt += `\nExamination findings: ${data.examination}\n`;
      if (data.investigations) prompt += `Investigations: ${data.investigations}\n`;

      prompt += `\nPlease provide:\n1. Most likely differential diagnoses (top 3-5)\n2. Recommended investigations\n3. Initial management approach\n4. Red flags to watch for\n\nPlease format your response clearly with headings.`;

      return prompt;
    }

    function displayAIResult(result) {
      if (result.error) {
        aiOutput.innerHTML = `<p style="color: red;">Error: ${result.error}</p>`;
        return;
      }

      let html = '<div class="ai-suggestions">';
      html += '<h3>AI Clinical Suggestions</h3>';
      
      if (result.content) {
        // Format the AI response with proper HTML
        const formattedContent = result.content
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>')
          .replace(/^\d+\.\s*/gm, '<strong>$&</strong>')
          .replace(/^([A-Z][^:]*:)/gm, '<strong>$1</strong>');
        
        html += `<div class="ai-content"><p>${formattedContent}</p></div>`;
      }

      html += '<p class="ai-disclaimer"><small><em>Note: These are AI-generated suggestions for educational purposes only. Always consult with qualified medical professionals for actual patient care.</em></small></p>';
      html += '</div>';

      aiOutput.innerHTML = html;
    }

  } catch (e) {
    console.warn("[BAU] AI demo init error:", e);
  }
}

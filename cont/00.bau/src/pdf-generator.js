// === PDF Generation Functionality ===
export function initPDFGenerator() {
  try {
    // PDF generation function
    function generatePDF() {
      const { jsPDF } = window.jspdf;
      if (!jsPDF) {
        alert("PDF library not loaded. Please refresh the page.");
        return;
      }

      const doc = new jsPDF();
      const margin = 20;
      let y = margin;
      const lineHeight = 6;
      const pageHeight = doc.internal.pageSize.height;

      // Helper functions
      const addText = (text, fontSize = 10, isBold = false) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(text, margin, y);
        y += lineHeight;
      };

      const addSection = (title, content) => {
        if (!content || content.trim() === "") return;
        addText(title, 12, true);
        y += 2;
        const lines = doc.splitTextToSize(content, 170);
        lines.forEach(line => addText(line));
        y += 4;
      };

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

      // Document title
      addText("MEDICAL HISTORY REPORT", 16, true);
      y += 10;

      // Patient Details
      const patientName = getElementValue("patient-name");
      const patientAge = getElementValue("age");

      addText("PATIENT INFORMATION", 12, true);
      y += 2;
      if (patientName) addText(`Patient Name: ${patientName}`);
      if (patientAge) addText(`Age: ${patientAge}`);
      y += 4;

      // Chief Complaint
      const chiefComplaint = getElementValue("chief-complaint");
      addSection("CHIEF COMPLAINT", chiefComplaint);

      // History of Presenting Complaint (SOCRATES)
      const site = getElementValue("site");
      const onset = getElementValue("onset");
      const character = getElementValue("character");
      const radiation = getElementValue("radiation");
      const associatedSymptoms = getElementValue("associated-symptoms");
      const timing = getElementValue("timing");
      const exacerbating = getElementValue("exacerbating");
      const relieving = getElementValue("relieving");
      const severity = getElementValue("severity");

      let socratesContent = "";
      if (site) socratesContent += `Site: ${site}\n`;
      if (onset) socratesContent += `Onset: ${onset}\n`;
      if (character) socratesContent += `Character: ${character}\n`;
      if (radiation) socratesContent += `Radiation: ${radiation}\n`;
      if (associatedSymptoms) socratesContent += `Associated Symptoms: ${associatedSymptoms}\n`;
      if (timing) socratesContent += `Timing: ${timing}\n`;
      if (exacerbating) socratesContent += `Exacerbating Factors: ${exacerbating}\n`;
      if (relieving) socratesContent += `Relieving Factors: ${relieving}\n`;
      if (severity) socratesContent += `Severity: ${severity}\n`;

      addSection("HISTORY OF PRESENTING COMPLAINT", socratesContent.trim());

      // Past Medical History
      const pastMedicalHistory = getElementValue("past-medical-history");
      addSection("PAST MEDICAL HISTORY", pastMedicalHistory);

      // Medications
      const medications = getElementValue("medications");
      addSection("MEDICATIONS", medications);

      // Allergies
      const allergies = getElementValue("allergies");
      addSection("ALLERGIES", allergies);

      // Family History
      const familyHistory = getElementValue("family-history");
      addSection("FAMILY HISTORY", familyHistory);

      // Social History
      const smoking = getElementValue("sh-smoking");
      const alcohol = getElementValue("sh-alcohol");
      const occupation = getElementValue("sh-occupation");
      const living = getElementValue("sh-living");
      const travel = getElementValue("sh-travel");

      let socialContent = "";
      if (smoking) socialContent += `Smoking: ${smoking}\n`;
      if (alcohol) socialContent += `Alcohol: ${alcohol}\n`;
      if (occupation) socialContent += `Occupation: ${occupation}\n`;
      if (living) socialContent += `Living Situation: ${living}\n`;
      if (travel) socialContent += `Travel History: ${travel}\n`;

      addSection("SOCIAL HISTORY", socialContent.trim());

      // ICE
      const ice = getElementValue("ice");
      addSection("ICE (Ideas, Concerns, Expectations)", ice);

      // Review of Systems
      const rosTable = document.getElementById("ros-table");
      if (rosTable) {
        let rosContent = "";
        const rosSelects = rosTable.querySelectorAll('select[id^="ros-"]');
        rosSelects.forEach(select => {
          if (select.value && select.value.trim()) {
            const system = select.id.replace("ros-", "").replace(/-/g, " ");
            const systemName = system.charAt(0).toUpperCase() + system.slice(1);
            const selectedOption = select.options[select.selectedIndex];
            if (selectedOption && !selectedOption.disabled) {
              rosContent += `${systemName}: ${selectedOption.text.trim()}\n`;
            }
          }
        });
        addSection("REVIEW OF SYSTEMS", rosContent.trim());
      }

      // Examination
      const examination = getElementValue("examination");
      addSection("EXAMINATION", examination);

      // Investigations
      const investigations = getElementValue("investigations");
      addSection("INVESTIGATIONS", investigations);

      // Differential Diagnosis
      const differentialDiagnosis = getElementValue("differential-diagnosis");
      addSection("DIFFERENTIAL DIAGNOSIS", differentialDiagnosis);

      // Management Plan
      const managementPlan = getElementValue("management-plan");
      addSection("MANAGEMENT PLAN", managementPlan);

      // Save the PDF
      const filename = patientName 
        ? `${patientName.replace(/[^a-zA-Z0-9]/g, "_")}_medical_history.pdf`
        : "medical_history.pdf";
      
      doc.save(filename);
    }

    // Attach to generate button
    const generateBtn = document.getElementById("generate-pdf");
    if (generateBtn) {
      generateBtn.addEventListener("click", (e) => {
        e.preventDefault();
        generatePDF();
      });
    }

    // Export for external use
    window.generatePDF = generatePDF;

  } catch (e) {
    console.warn("[BAU] PDF generator init error:", e);
  }
}

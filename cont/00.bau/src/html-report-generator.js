// === HTML Report Generator ===
export function initHTMLReportGenerator() {
  try {
    console.log("[HTML Report] Initializing HTML report generator");

    // No initialization needed - functions are ready to use
    return true;
  } catch (error) {
    console.error("[HTML Report] Initialization failed:", error);
    return false;
  }
}

export function generateHTMLReport(formData, aiContent) {
  const reportDate = new Date().toLocaleString();
  const patientName = formData.patientName || "Unknown Patient";

  // Generate report metadata
  const reportId = generateReportId();
  const buildVersion = "1.0";
  const reportCount = incrementReportCount();

  // Build the HTML report using ECG report styling
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Clinical History Report for ${patientName}</title>
    
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            line-height: 1.6; 
            color: #212529; 
            background-color: #f8f9fa; 
            margin: 0; 
            padding: 0; 
        }
        .container { 
            max-width: 800px; 
            margin: 20px auto; 
            background-color: #ffffff; 
            border: 1px solid #dee2e6; 
            border-radius: 8px; 
            padding: 40px; 
            padding-bottom: 25px;
        }
        .page-break { page-break-after: always; }
        .report-header { 
            text-align: center; 
            border-bottom: 1px solid #e9ecef; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .report-header h1 { 
            font-size: 28px; 
            font-weight: bold; 
            margin: 0; 
        }
        .section { 
            margin-bottom: 40px; 
            padding: 20px 0; 
            border-bottom: 1px solid #f1f3f4;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section h2 { 
            font-size: 22px; 
            font-weight: bold; 
            border-bottom: 2px solid #e9ecef; 
            padding-bottom: 12px; 
            margin-bottom: 20px; 
            margin-top: 0;
        }
        .grid { 
            display: grid; 
            grid-template-columns: 180px 1fr; 
            gap: 15px 25px; 
            margin-top: 15px;
        }
        .grid .label { font-weight: bold; }
        .recommendation { font-weight: bold; }
        .recommendation.critical { color: #dc3545; }
        .recommendation.normal { color: #198754; }
        .archive-title { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 2px solid #ccc; 
            padding-bottom: 20px; 
        }
        .notes { 
            background-color: #e9ecef; 
            padding: 15px; 
            border-radius: 4px; 
            border-left: 4px solid #0d6efd; 
        }
        .findings-list { 
            list-style: none; 
            padding-left: 0; 
        }
        .finding-item { 
            background-color: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 4px; 
            padding: 10px; 
            margin-bottom: 10px; 
        }
        .finding-item .label { 
            font-weight: bold; 
            color: #0d6efd; 
        }
        .ai-content {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-top: 15px;
        }
        .ai-content h4 {
            color: #0d6efd;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .ai-content h4:first-child {
            margin-top: 0;
        }
        .disclaimer {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="report-header">
            <h1>Medical Assessment Report</h1>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">Report Date: ${reportDate}</p>
            <p style="font-size: 12px; color: #adb5bd; margin-top: 5px;">Report #${reportCount} • Build ${buildVersion} • ID: ${reportId}</p>
        </div>
        
        ${generatePatientDetailsSection(formData)}
        
        ${generateChiefComplaintSection(formData)}

        ${
          formData.site || formData.onset || formData.character
            ? `
        <section class="section">
            <h2>Presenting Complaint Details (SOCRATES)</h2>
            <div class="grid">
                ${
                  formData.site
                    ? `<span class="label">Site:</span><span>${formData.site}</span>`
                    : ""
                }
                ${
                  formData.onset
                    ? `<span class="label">Onset:</span><span>${formData.onset}</span>`
                    : ""
                }
                ${
                  formData.character
                    ? `<span class="label">Character:</span><span>${formData.character}</span>`
                    : ""
                }
                ${
                  formData.radiation
                    ? `<span class="label">Radiation:</span><span>${formData.radiation}</span>`
                    : ""
                }
                ${
                  formData.associatedSymptoms
                    ? `<span class="label">Associated Symptoms:</span><span>${formData.associatedSymptoms}</span>`
                    : ""
                }
                ${
                  formData.timing
                    ? `<span class="label">Timing:</span><span>${formData.timing}</span>`
                    : ""
                }
                ${
                  formData.exacerbating
                    ? `<span class="label">Exacerbating Factors:</span><span>${formData.exacerbating}</span>`
                    : ""
                }
                ${
                  formData.relieving
                    ? `<span class="label">Relieving Factors:</span><span>${formData.relieving}</span>`
                    : ""
                }
                ${
                  formData.severity
                    ? `<span class="label">Severity:</span><span>${formData.severity}</span>`
                    : ""
                }
            </div>
        </section>
        `
            : ""
        }

        ${generateSocialHistorySection(formData)}
        
        ${generatePastMedicalHistorySection(formData)}
        
        ${generatePastSurgicalHistorySection(formData)}
        
        ${generateDrugHistorySection(formData)}
        
        ${generateFamilyHistorySection(formData)}
        
        ${generateICESection(formData)}

        ${generateROSSection(formData)}
        
        ${generatePESection(formData)}
        
        ${
          aiContent
            ? `
        <section class="section">
            <h2>AI Clinical Assessment</h2>
            <div class="ai-content">
                ${formatAIContent(aiContent)}
            </div>
            <div class="disclaimer">
                <strong>Educational Use Only:</strong> This AI-generated assessment is for educational purposes only. Always consult qualified medical professionals for actual patient care and clinical decisions.
            </div>
        </section>
        `
            : ""
        }
        
        ${checkIfReportEmpty(formData)}
        
        <footer style="margin-top: 50px; padding: 30px 0; padding-bottom: 0px; border-top: 2px solid #e9ecef; text-align: center; color: #6c757d; font-size: 12px; line-height: 1.5;">
            <div style="margin-bottom: 15px;">
                <strong style="color: #495057;">Generated for educational purposes</strong> • This report is generated for medical education and training purposes only. Always consult with qualified healthcare professionals for actual patient care.
            </div>
            <div style="color: #868e96; margin-bottom: 10px;">
                Developed and coded by <strong>Momen</strong>
            </div>
            <div style="color: #adb5bd; font-size: 20px; margin-top: 20px;">
                Socrates<sup style="font-size: 9px; margin-left: 5px">Beta</sup>
            </div>
        </footer>
    </div>
</body>
</html>`;

  return htmlContent;
}

function generateROSSection(formData) {
  // Collect ROS data from actual ROS checkboxes (independent of PE toggle)
  const rosData = [];
  const rosCheckboxes = document.querySelectorAll("input.ros:checked");

  // Group by system
  const systemGroups = {};
  rosCheckboxes.forEach((checkbox) => {
    const system = checkbox.getAttribute("data-system");
    const value = checkbox.value;

    if (!systemGroups[system]) {
      systemGroups[system] = [];
    }
    systemGroups[system].push(value);
  });

  // Convert to array format
  Object.keys(systemGroups).forEach((system) => {
    const findings = systemGroups[system].join(", ");
    rosData.push({ system, findings });
  });

  if (rosData.length === 0) return "";

  return `
    <section class="section">
      <h2>Review of Systems (ROS)</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left; font-weight: bold;">System</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left; font-weight: bold;">Findings</th>
          </tr>
        </thead>
        <tbody>
          ${rosData
            .map(
              (item) => `
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 8px; vertical-align: top; font-weight: 500;">${item.system}</td>
              <td style="border: 1px solid #dee2e6; padding: 8px;">${item.findings}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </section>
  `;
}

function generatePESection(formData) {
  // Check if PE toggle is enabled
  const peToggle = document.getElementById("pe-toggle");
  const isPEEnabled = peToggle && peToggle.checked;

  if (!isPEEnabled) return "";

  // Collect PE examination findings
  const peFindings = [];
  const peSections = [
    { id: "pe-general", name: "General Appearance" },
    { id: "pe-hands", name: "Hands" },
    { id: "pe-vitals", name: "Vital Signs" },
    { id: "pe-cardiovascular", name: "Cardiovascular" },
    { id: "pe-respiratory", name: "Respiratory" },
    { id: "pe-abdominal", name: "Abdominal" },
    { id: "pe-neurological", name: "Neurological" },
    { id: "pe-musculoskeletal", name: "Musculoskeletal" },
    { id: "pe-dermatological", name: "Dermatological" },
    { id: "pe-ent", name: "ENT" },
    { id: "pe-ophthalmological", name: "Ophthalmological" },
    { id: "pe-genitourinary", name: "Genitourinary" },
    { id: "pe-additional", name: "Additional Findings" },
  ];

  peSections.forEach((section) => {
    const element = document.getElementById(section.id);
    if (element) {
      let findings = "";
      if (element.multiple) {
        const selectedOptions = Array.from(element.selectedOptions);
        if (selectedOptions.length > 0) {
          findings = selectedOptions.map((opt) => opt.text).join(", ");
        }
      } else if (element.value && element.value.trim()) {
        findings = element.value.trim();
      }

      if (findings) {
        peFindings.push({ system: section.name, findings });
      }
    }
  });

  if (peFindings.length === 0) return "";

  return `
    <section class="section">
      <h2>Physical Examination</h2>
      <div class="grid">
        ${peFindings
          .map(
            (item) => `
          <span class="label">${item.system}:</span><span>${item.findings}</span>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function generateSocialHistorySection(formData) {
  const socialFields = [
    { id: "sh-smoking", label: "Smoking Status", key: "smoking" },
    { id: "sh-alcohol", label: "Alcohol", key: "alcohol" },
    { id: "sh-drugs", label: "Recreational Drugs", key: "drugs" },
    { id: "sh-occupation", label: "Occupation", key: "occupation" },
    { id: "sh-living", label: "Living Situation", key: "living" },
    { id: "sh-travel", label: "Recent Travel", key: "travel" },
  ];

  const socialData = [];
  socialFields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element && element.value && element.value.trim()) {
      socialData.push({ label: field.label, value: element.value });
    }
  });

  if (socialData.length === 0) return "";

  return `
    <section class="section">
      <h2>Social History</h2>
      <div class="grid">
        ${socialData
          .map(
            (item) => `
          <span class="label">${item.label}:</span><span>${item.value}</span>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function generatePastMedicalHistorySection(formData) {
  const pmhElement = document.getElementById("past-medical");
  if (!pmhElement) return "";

  const selectedOptions = Array.from(pmhElement.selectedOptions);
  if (selectedOptions.length === 0) return "";

  const conditions = selectedOptions.map((opt) => opt.text).join(", ");

  return `
    <section class="section">
      <h2>Past Medical History (PMH)</h2>
      <p>${conditions}</p>
    </section>
  `;
}

function generatePastSurgicalHistorySection(formData) {
  const pshElement = document.getElementById("past-surgical");
  if (!pshElement) return "";

  const selectedOptions = Array.from(pshElement.selectedOptions);
  if (selectedOptions.length === 0) return "";

  const surgeries = selectedOptions.map((opt) => opt.text).join(", ");

  return `
    <section class="section">
      <h2>Past Surgical History (PSH)</h2>
      <p>${surgeries}</p>
    </section>
  `;
}

function generateDrugHistorySection(formData) {
  const drugData = [];

  // Regular medications
  const regularMedsElement = document.getElementById("regular-meds");
  if (regularMedsElement) {
    const selectedMeds = Array.from(regularMedsElement.selectedOptions);
    if (selectedMeds.length > 0) {
      const meds = selectedMeds.map((opt) => opt.text).join(", ");
      drugData.push({ label: "Regular Medications", value: meds });
    }
  }

  // OTC/Herbal/Supplements
  const otcElement = document.getElementById("otc");
  if (otcElement) {
    const selectedOTC = Array.from(otcElement.selectedOptions);
    if (selectedOTC.length > 0) {
      const otc = selectedOTC.map((opt) => opt.text).join(", ");
      drugData.push({ label: "OTC/Herbal/Supplements", value: otc });
    }
  }

  // Drug Allergies
  const allergiesElement = document.getElementById("drug-allergies");
  if (allergiesElement) {
    const selectedAllergies = Array.from(allergiesElement.selectedOptions);
    if (selectedAllergies.length > 0) {
      const allergies = selectedAllergies.map((opt) => opt.text).join(", ");
      drugData.push({ label: "Drug Allergies", value: allergies });
    }
  }

  if (drugData.length === 0) return "";

  return `
    <section class="section">
      <h2>Drug History (DH)</h2>
      <div class="grid">
        ${drugData
          .map(
            (item) => `
          <span class="label">${item.label}:</span><span>${item.value}</span>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function generateFamilyHistorySection(formData) {
  const fhElement = document.getElementById("family-history");
  if (!fhElement || !fhElement.value || !fhElement.value.trim()) return "";

  return `
    <section class="section">
      <h2>Family History (FH)</h2>
      <p>${fhElement.value.trim()}</p>
    </section>
  `;
}

function generateICESection(formData) {
  const iceElement = document.getElementById("ice");
  if (!iceElement || !iceElement.value || !iceElement.value.trim()) return "";

  return `
    <section class="section">
      <h2>ICE (Ideas, Concerns, Expectations)</h2>
      <p>${iceElement.value.trim()}</p>
    </section>
  `;
}

function generatePatientDetailsSection(formData) {
  const patientName = document.getElementById("patient-name")?.value?.trim();
  const age = document.getElementById("age")?.value?.trim();
  const gender = document.getElementById("gender")?.value?.trim();

  if (!patientName && !age && !gender) return "";

  return `
    <section class="section">
      <h2>Patient Details</h2>
      <div class="grid">
        ${
          patientName
            ? `<span class="label">Patient Name:</span><span>${patientName}</span>`
            : ""
        }
        ${age ? `<span class="label">Age:</span><span>${age}</span>` : ""}
        ${
          gender
            ? `<span class="label">Gender:</span><span>${gender}</span>`
            : ""
        }
      </div>
    </section>
  `;
}

function generateChiefComplaintSection(formData) {
  const ccElement = document.getElementById("chief-complaint");
  if (!ccElement) return "";

  let ccText = "";
  // Support multi-select chief complaint (custom UI keeps original select synced)
  if (ccElement.tagName === "SELECT" && ccElement.multiple) {
    const selected = Array.from(ccElement.selectedOptions || [])
      .map((opt) => (opt.text || "").trim())
      .filter(Boolean);
    ccText = selected.join(", ");
  } else {
    // Fallback for input/select single
    const selected = ccElement.options ? ccElement.options[ccElement.selectedIndex] : null;
    ccText = selected && !selected.disabled ? (selected.text || "").trim() : (ccElement.value || "").trim();
  }

  if (!ccText) return "";

  return `
    <section class="section">
      <h2>Chief Complaint</h2>
      <p><strong>Primary Concern:</strong> ${ccText}</p>
    </section>
  `;
}

function checkIfReportEmpty(formData) {
  // Check if any sections would be generated
  const hasPatientDetails =
    document.getElementById("patient-name")?.value?.trim() ||
    document.getElementById("age")?.value?.trim() ||
    document.getElementById("gender")?.value?.trim();

  const hasChiefComplaint = document
    .getElementById("chief-complaint")
    ?.value?.trim();

  const hasSocrates =
    document.getElementById("site")?.value ||
    document.getElementById("onset")?.value ||
    document.getElementById("character")?.value;

  const hasSocialHistory =
    document.getElementById("sh-smoking")?.value ||
    document.getElementById("sh-alcohol")?.value ||
    document.getElementById("sh-drugs")?.value;

  const hasPMH =
    document.getElementById("past-medical")?.selectedOptions?.length > 0;
  const hasPSH =
    document.getElementById("past-surgical")?.selectedOptions?.length > 0;

  const hasDrugHistory =
    document.getElementById("regular-meds")?.selectedOptions?.length > 0 ||
    document.getElementById("otc")?.selectedOptions?.length > 0 ||
    document.getElementById("drug-allergies")?.selectedOptions?.length > 0;

  const hasFamilyHistory = document
    .getElementById("family-history")
    ?.value?.trim();
  const hasICE = document.getElementById("ice")?.value?.trim();

  const hasROS = document.querySelectorAll("input.ros:checked").length > 0;

  // Use the same logic as generatePESection to check for actual PE data
  const peToggle = document.getElementById("pe-toggle");
  let hasPE = false;
  if (peToggle?.checked) {
    const peSections = [
      "pe-general",
      "pe-hands",
      "pe-vitals",
      "pe-cardiovascular",
      "pe-respiratory",
      "pe-abdominal",
      "pe-neurological",
      "pe-musculoskeletal",
      "pe-dermatological",
      "pe-ent",
      "pe-ophthalmological",
      "pe-genitourinary",
      "pe-additional",
    ];

    hasPE = peSections.some((sectionId) => {
      const element = document.getElementById(sectionId);
      if (!element) return false;

      if (element.multiple) {
        return element.selectedOptions && element.selectedOptions.length > 0;
      } else {
        return element.value && element.value.trim();
      }
    });
  }

  // If no sections have data, show empty report message
  if (
    !hasPatientDetails &&
    !hasChiefComplaint &&
    !hasSocrates &&
    !hasSocialHistory &&
    !hasPMH &&
    !hasPSH &&
    !hasDrugHistory &&
    !hasFamilyHistory &&
    !hasICE &&
    !hasROS &&
    !hasPE
  ) {
    return `
      <section class="section" style="text-align: center; padding: 60px 20px;">
        <div style="background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 12px; padding: 40px;">
          <h2 style="color: #6c757d; margin-bottom: 20px;">Empty Report</h2>
          <p style="color: #6c757d; font-size: 16px; margin-bottom: 15px;">
            No clinical data has been entered in the form yet.
          </p>
          <p style="color: #868e96; font-size: 14px;">
            Fill out the sections of the form and generate the report again to see your history report. Choose AI for further assessment and summarization.
          </p>
        </div>
      </section>
    `;
  }

  return "";
}

function formatAIContent(content) {
  if (!content) return "";

  // Enhanced formatting for medical content
  let formattedContent = content
    // Convert markdown-style headers to HTML
    .replace(/^## (.*$)/gm, "<h4>$1</h4>")
    .replace(/^\*\*(.*?)\*\*/gm, "<strong>$1</strong>")
    // Format numbered lists
    .replace(/^\d+\.\s+\*\*(.*?)\*\*/gm, "<strong>$1</strong>")
    // Format bullet points
    .replace(/^- (.*$)/gm, "• $1")
    // Convert double line breaks to paragraphs
    .replace(/\n\n/g, "</p><p>")
    // Convert single line breaks to <br>
    .replace(/\n/g, "<br>");

  return `<p>${formattedContent}</p>`;
}

function generateReportId() {
  // Generate a unique report ID using timestamp and random string
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`.toUpperCase();
}

function incrementReportCount() {
  // Get current report count from localStorage
  let reportCount = parseInt(localStorage.getItem("reportCount") || "0");
  reportCount++;

  // Save updated count
  localStorage.setItem("reportCount", reportCount.toString());

  return reportCount;
}

export function downloadHTMLReport(htmlContent, patientName) {
  try {
    const fileName = `Clinical_Report_${patientName.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}_${new Date().toISOString().split("T")[0]}.html`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log("[HTML Report] Report downloaded successfully:", fileName);
    return true;
  } catch (error) {
    console.error("[HTML Report] Download failed:", error);
    return false;
  }
}

export function openHTMLReportInNewTab(htmlContent) {
  try {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      console.log("[HTML Report] Report opened in new tab");
      return true;
    } else {
      console.error("[HTML Report] Failed to open new window - popup blocked?");
      return false;
    }
  } catch (error) {
    console.error("[HTML Report] Failed to open in new tab:", error);
    return false;
  }
}

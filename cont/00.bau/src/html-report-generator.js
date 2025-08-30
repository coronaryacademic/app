// === HTML Report Generator ===
function initHTMLReportGenerator() {
  try {
    console.log("[HTML Report] Initializing HTML report generator");

    // No initialization needed - functions are ready to use
    return true;
  } catch (error) {
    console.error("[HTML Report] Initialization failed:", error);
    return false;
  }
}

function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function computePackYears() {
  try {
    const smokeSel = document.getElementById("sh-smoking");
    const statusVal = smokeSel ? smokeSel.value : "";
    const cigs = parseFloat(document.getElementById("sh-cigs-per-day")?.value);
    const years = parseFloat(document.getElementById("sh-years-smoked")?.value);

    // Only compute for current/ex-smokers with valid numbers
    if (
      statusVal &&
      statusVal !== "never-smoker" &&
      Number.isFinite(cigs) &&
      cigs > 0 &&
      Number.isFinite(years) &&
      years > 0
    ) {
      const packYears = (cigs / 20) * years;
      return `${packYears.toFixed(1)} pack-years`;
    }
  } catch {}
  return "";
}

function generateAIClinicalAnalysisSection(formData, aiContent) {
  // Check if AI model is selected and content is available
  const aiModelSelect = document.getElementById("ai-model");
  const selectedModel = aiModelSelect ? aiModelSelect.value : "";

  // Only show AI section if model is selected and content exists
  if (!selectedModel || !aiContent) {
    return "";
  }

  // Get student notes if available
  const studentNotesElement = document.getElementById("student-notes");
  const studentNotes = studentNotesElement
    ? studentNotesElement.value.trim()
    : "";

  return `
    <section class="section">
      <h2>Clinical Assessment</h2>
      <div class="ai-content">
        ${formatAIContent(aiContent)}
      </div>
      ${
        studentNotes
          ? `
      `
          : ""
      }
    </section>
  `;
}

function getModelDisplayName(modelValue) {
  const modelNames = {
    // Firebase models
    "gemini-1.5-flash": "Gemini 1.5 Flash (Fast)",
    "gemini-1.5-pro": "Gemini 1.5 Pro (Advanced)",
    "gemini-1.0-pro": "Gemini 1.0 Pro (Legacy)",

    // Vercel models
    "vercel/gemini-pro": "Vercel: Gemini Pro",
    "vercel/gpt-4": "Vercel: GPT-4",
    "vercel/claude-3-opus": "Vercel: Claude 3 Opus",
  };

  // Default to the model value if not found in the mapping
  return modelNames[modelValue] || modelValue;
}

function generateClinicalTutorPrompt(formData) {
  // Get student notes
  const studentNotesElement = document.getElementById("student-notes");
  const studentNotes = studentNotesElement
    ? studentNotesElement.value.trim()
    : "";

  // Get Past Surgical History (PSH)
  const pshElement = document.getElementById("past-surgical");
  const psh =
    pshElement && pshElement.selectedOptions.length > 0
      ? Array.from(pshElement.selectedOptions)
          .map((opt) => opt.text)
          .join(", ")
      : "No significant past surgical history";

  // Add smoking quantitative data
  const cigsPerDayElement = document.getElementById("sh-cigs-per-day");
  const yearsSmoked = document.getElementById("sh-years-smoked");
  let smokingDetails = "";
  if (cigsPerDayElement && cigsPerDayElement.value) {
    smokingDetails += ` (${cigsPerDayElement.value} cigarettes/day`;
    if (yearsSmoked && yearsSmoked.value) {
      smokingDetails += `, ${yearsSmoked.value} years)`;
    } else {
      smokingDetails += ")";
    }
  }

  // Build comprehensive form data summary
  const patientName = formData.patientName || "Patient";
  const age = formData.patientAge || "Unknown age";
  const gender = formData.gender || "Unknown gender";

  // Get chief complaint
  const ccElement = document.getElementById("chief-complaint");
  const chiefComplaint =
    ccElement && ccElement.selectedOptions.length > 0
      ? Array.from(ccElement.selectedOptions)
          .map((opt) => opt.text)
          .join(", ")
      : "No chief complaint specified";

  // Build SOCRATES data
  const socrates = {
    site: formData.site || "Not specified",
    onset: formData.onset || "Not specified",
    character: formData.character || "Not specified",
    radiation: formData.radiation || "Not specified",
    associatedSymptoms: formData.associatedSymptoms || "Not specified",
    timing: formData.timing || "Not specified",
    exacerbating: formData.exacerbating || "Not specified",
    relieving: formData.relieving || "Not specified",
    severity: formData.severity || "Not specified",
  };

  // Get ROS data
  const rosData = [];
  const rosCheckboxes = document.querySelectorAll("input.ros:checked");
  rosCheckboxes.forEach((checkbox) => {
    const system = checkbox.getAttribute("data-system");
    const value = checkbox.value;
    rosData.push(`${system}: ${value}`);
  });

  // Get social history
  const socialHistory = [];
  const shFields = [
    { id: "sh-smoking", label: "Smoking" },
    { id: "sh-alcohol", label: "Alcohol" },
    { id: "sh-drugs", label: "Drugs" },
    { id: "sh-occupation", label: "Occupation" },
    { id: "sh-living", label: "Living situation" },
    { id: "sh-travel", label: "Travel history" },
  ];

  shFields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element && element.value) {
      let value = element.value;
      // Add smoking quantitative details if smoking field
      if (field.id === "sh-smoking" && smokingDetails) {
        value += smokingDetails;
      }
      socialHistory.push(`${field.label}: ${value}`);
    }
  });

  // Get past medical history
  const pmhElement = document.getElementById("past-medical");
  const pmh =
    pmhElement && pmhElement.selectedOptions.length > 0
      ? Array.from(pmhElement.selectedOptions)
          .map((opt) => opt.text)
          .join(", ")
      : "No significant past medical history";

  // Get drug history
  const drugHistory = [];

  // Regular medications
  const regularMedsElement = document.getElementById("regular-meds");
  if (regularMedsElement && regularMedsElement.selectedOptions.length > 0) {
    const meds = Array.from(regularMedsElement.selectedOptions)
      .map((opt) => opt.text)
      .join(", ");
    drugHistory.push(`Regular Medications: ${meds}`);
  }

  // OTC medications
  const otcElement = document.getElementById("otc");
  if (otcElement && otcElement.selectedOptions.length > 0) {
    const otc = Array.from(otcElement.selectedOptions)
      .map((opt) => opt.text)
      .join(", ");
    drugHistory.push(`OTC Medications: ${otc}`);
  }

  // Drug allergies
  const drugAllergiesElement = document.getElementById("drug-allergies");
  if (drugAllergiesElement && drugAllergiesElement.selectedOptions.length > 0) {
    const allergies = Array.from(drugAllergiesElement.selectedOptions)
      .map((opt) => opt.text)
      .join(", ");
    drugHistory.push(`Drug Allergies: ${allergies}`);
  }

  // Get family history
  const familyHistoryElement = document.getElementById("family-history");
  const familyHistory = familyHistoryElement
    ? familyHistoryElement.value.trim()
    : "No family history provided";

  // Get ICE
  const iceElement = document.getElementById("ice");
  const ice = iceElement ? iceElement.value.trim() : "No ICE documented";

  // Get Physical Examination findings - COMPREHENSIVE PE DATA COLLECTION
  const peToggle = document.getElementById("pe-toggle");
  const isPEEnabled = peToggle && peToggle.checked;
  let peFindings = [];
  let gcsData = "";

  if (isPEEnabled) {
    // Complete PE sections list - ensure ALL subsections are captured
    const peSections = [
      { id: "pe-general", name: "General Appearance" },
      { id: "pe-hands", name: "Hands" },
      { id: "pe-vitals", name: "Vital Signs" },
      { id: "pe-cardiovascular", name: "Cardiovascular" },
      { id: "pe-respiratory", name: "Respiratory" },
      { id: "pe-abdominal", name: "Abdominal" },
      { id: "pe-neurological", name: "Neurological" },
      { id: "pe-musculoskeletal", name: "Musculoskeletal" },
      { id: "pe-legs", name: "Legs" },
      { id: "pe-dermatological", name: "Dermatological" },
      { id: "pe-ent", name: "ENT" },
      { id: "pe-ophthalmological", name: "Ophthalmological" },
      { id: "pe-genitourinary", name: "Genitourinary" },
      { id: "pe-additional", name: "Additional Findings" },
    ];

    // Collect findings from each PE subsection
    peSections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        let findings = "";

        // Handle multi-select dropdowns
        if (element.multiple) {
          const selectedOptions = Array.from(element.selectedOptions);
          if (selectedOptions.length > 0) {
            findings = selectedOptions.map((opt) => opt.text).join(", ");
          }
        }
        // Handle single select or text inputs
        else if (element.value && element.value.trim()) {
          findings = element.value.trim();
        }

        // Check for "Others (Specify)" custom input for this section
        const othersCheckbox = document.getElementById(section.id + "-others");
        const othersText = document.getElementById(section.id + "-others-text");
        if (
          othersCheckbox &&
          othersCheckbox.checked &&
          othersText &&
          othersText.value.trim()
        ) {
          const customFindings = "Others: " + othersText.value.trim();
          findings = findings
            ? findings + ", " + customFindings
            : customFindings;
        }

        // Add findings if any exist
        if (findings) {
          peFindings.push(`${section.name}: ${findings}`);
        }
      }
    });

    // Collect GCS data if available
    const eyeEl = document.getElementById("gcs-eye");
    const verbalEl = document.getElementById("gcs-verbal");
    const motorEl = document.getElementById("gcs-motor");

    if (eyeEl || verbalEl || motorEl) {
      const getSelectedText = (sel) => {
        if (!sel) return "";
        const opt = sel.options[sel.selectedIndex];
        return opt ? (opt.text || "").trim() : "";
      };
      const getSelectedValue = (sel) => {
        if (!sel) return 0;
        const v = parseInt(sel.value, 10);
        return Number.isFinite(v) ? v : 0;
      };

      const eyeText = getSelectedText(eyeEl);
      const verbalText = getSelectedText(verbalEl);
      const motorText = getSelectedText(motorEl);

      const eye = getSelectedValue(eyeEl);
      const verbal = getSelectedValue(verbalEl);
      const motor = getSelectedValue(motorEl);
      const total = eye + verbal + motor;

      if (eyeText || verbalText || motorText) {
        gcsData = `Glasgow Coma Scale: Eye ${
          eyeText ? eyeText + " (" + eye + "/4)" : "not assessed"
        }, Verbal ${
          verbalText ? verbalText + " (" + verbal + "/5)" : "not assessed"
        }, Motor ${
          motorText ? motorText + " (" + motor + "/6)" : "not assessed"
        }, Total: ${total}/15`;
        peFindings.push(gcsData);
      }
    }
  }

  const prompt = `Create a professional clinical narrative from this patient data:

**Patient:** ${patientName}, ${age}, ${gender}

**Chief Complaint:** ${chiefComplaint}

**History of Present Illness:**
- Site: ${socrates.site}
- Onset: ${socrates.onset}
- Character: ${socrates.character}
- Radiation: ${socrates.radiation}
- Associated Symptoms: ${socrates.associatedSymptoms}
- Timing: ${socrates.timing}
- Exacerbating: ${socrates.exacerbating}
- Relieving: ${socrates.relieving}
- Severity: ${socrates.severity}

**Review of Systems:** ${rosData.length > 0 ? rosData.join(", ") : "Negative"}

**Physical Examination:** ${
    peFindings.length > 0
      ? "\n- " + peFindings.join("\n- ")
      : "Not performed or PE toggle disabled"
  }

**Past Medical History:** ${pmh}
**Past Surgical History:** ${psh}
**Drug History:** ${
    drugHistory.length > 0
      ? drugHistory.join(", ")
      : "No medications or allergies documented"
  }
**Family History:** ${familyHistory}
**Social History:** ${
    socialHistory.length > 0 ? socialHistory.join(", ") : "Not documented"
  }
**ICE:** ${ice}

${
  studentNotes
    ? `**Student Clinical Reasoning & Questions:** ${studentNotes}

Please specifically address the student's clinical reasoning and any questions they have raised in your analysis.`
    : ""
}

Provide:
## History of Present Illness
[Professional chronological narrative]

## Differential Diagnoses
[List top 3-5 differentials${
    studentNotes
      ? " and specifically address the student's clinical reasoning/questions"
      : ""
  }]

## Next Steps for Investigation
[Format as organized table with Investigation | Rationale columns]${
    studentNotes
      ? `

## Note
[Provide clinical insights and address any questions raised, formatted as professional clinical notes without reference to students]`
      : ""
  }`;

  return prompt;
}

function generateGCSSection(formData) {
  // Only include GCS if PE is enabled (PE toggle checked)
  const peToggle = document.getElementById("pe-toggle");
  if (!peToggle || !peToggle.checked) {
    try {
      console.debug("[REPORT:GCS] Skipped: PE toggle is off");
    } catch {}
    return "";
  }

  // Read GCS selects if present
  const eyeEl = document.getElementById("gcs-eye");
  const verbalEl = document.getElementById("gcs-verbal");
  const motorEl = document.getElementById("gcs-motor");

  if (!eyeEl && !verbalEl && !motorEl) return "";

  const getSelectedText = (sel) => {
    if (!sel) return "";
    const opt = sel.options[sel.selectedIndex];
    return opt ? (opt.text || "").trim() : "";
  };
  const getSelectedValue = (sel) => {
    if (!sel) return 0;
    const v = parseInt(sel.value, 10);
    return Number.isFinite(v) ? v : 0;
  };

  const eyeText = getSelectedText(eyeEl);
  const verbalText = getSelectedText(verbalEl);
  const motorText = getSelectedText(motorEl);

  const eye = getSelectedValue(eyeEl);
  const verbal = getSelectedValue(verbalEl);
  const motor = getSelectedValue(motorEl);
  const total = eye + verbal + motor;

  // If nothing selected text-wise, skip
  if (!eyeText && !verbalText && !motorText) {
    try {
      console.debug("[REPORT:GCS] Skipped: No selections");
    } catch {}
    return "";
  }

  try {
    console.debug("[REPORT:GCS] Render", {
      eyeText,
      verbalText,
      motorText,
      total,
    });
  } catch {}

  return `
    <section class="section">
      <h2>Glasgow Coma Scale (GCS)</h2>
      <div class="grid">
        ${
          eyeText
            ? `<span class="label">Eye (/4):</span><span>${eyeText}</span>`
            : ""
        }
        ${
          verbalText
            ? `<span class="label">Verbal (/5):</span><span>${verbalText}</span>`
            : ""
        }
        ${
          motorText
            ? `<span class="label">Motor (/6):</span><span>${motorText}</span>`
            : ""
        }
        <span class="label">Total:</span><span><strong>${total}</strong> / 15</span>
      </div>
    </section>
  `;
}

function generateHTMLReport(formData, aiContent, options = {}) {
  const reportDate = new Date().toLocaleString();
  const patientName = formData.patientName || "Unknown Patient";

  // Generate report metadata
  const reportId = generateReportId();
  const buildVersion = "2.0";
  const reportCount = incrementReportCount();

  // Get model information
  const modelInfo = options.modelInfo || {};
  const modelDisplayName = modelInfo.modelUsed
    ? getModelDisplayName(modelInfo.modelUsed)
    : "Unknown model";
  const isFallback = modelInfo.fallbackUsed || false;
  const modelInfoText = isFallback
    ? ` (Fallback: ${modelDisplayName})`
    : ` (${modelDisplayName})`;

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
            page-break-inside: avoid; /* Legacy */
            break-inside: avoid;      /* Modern */
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
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: avoid;
        }
        .grid { 
            display: grid; 
            grid-template-columns: 180px 1fr; 
            gap: 15px 25px; 
            margin-top: 15px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        /* iPad and mobile responsive fixes */
        @media screen and (max-width: 1024px) {
            .container {
                max-width: 100%;
                margin: 10px;
                padding: 20px;
            }
            .grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            .grid .label {
                font-weight: bold;
                margin-bottom: 5px;
            }
            table {
                font-size: 14px;
                overflow-x: auto;
                display: block;
                white-space: nowrap;
            }
            table thead, table tbody, table tr {
                display: table;
                width: 100%;
                table-layout: fixed;
            }
        }
        /* Prevent table rows/cells from splitting across pages */
        table, thead, tbody, tr, td, th {
            page-break-inside: avoid;
            break-inside: avoid;
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
            padding: 0px;
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
    <!-- Attempt to preload html2pdf; if not available, we'll load dynamically on click -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script>
      function __ensureHtml2PdfLoaded() {
        return new Promise((resolve, reject) => {
          if (window.html2pdf) return resolve();
          try {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            s.crossOrigin = 'anonymous';
            s.referrerPolicy = 'no-referrer';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load html2pdf.js'));
            document.head.appendChild(s);
          } catch (e) { reject(e); }
        });
      }
      // Provide in-report download helpers
      function __downloadCurrentHTML(patientName) {
        try {
          const name = (patientName || document.title || 'Clinical_Report')
            .replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = name + '_' + new Date().toISOString().split('T')[0] + '.html';
          const html = document.documentElement.outerHTML;
          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        } catch (e) {
          console.error('Download failed:', e);
        }
      }
      async function __downloadPDF() {
        try {
          await __ensureHtml2PdfLoaded();
          const element = document.querySelector('.container');
          const titleEl = document.querySelector('.report-header h1');
          const title = (titleEl ? titleEl.textContent : 'Clinical_Report').replace(/[^a-zA-Z0-9]/g, '_');
          const date = (new Date().toISOString().split('T')[0]);
          const opt = {
            margin:       [10, 10, 10, 10],
            filename:     title + '_' + date + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'avoid-all'] }
          };
          if (!element) throw new Error('Report content not found');
          const clone = element.cloneNode(true);
          window.html2pdf().set(opt).from(clone).save();
        } catch (e) {
          console.error('PDF generation failed:', e);
          alert('PDF generation failed. Please try again or use Download HTML.');
        }
      }
    </script>
</head>
<body>
    <div style="position: sticky; top: 0; z-index: 999; background: #fff; border-bottom: 1px solid #e9ecef; padding: 10px 12px; display: flex; gap: 10px; align-items: center;">
        <button onclick="__downloadPDF()" style="padding: 6px 10px; border: 1px solid #dee2e6; background: #0d6efd; color: white; border-radius: 6px; cursor: pointer;">Download PDF</button>
        <button onclick="__downloadCurrentHTML()" style="padding: 6px 10px; border: 1px solid #dee2e6; background: #198754; color: white; border-radius: 6px; cursor: pointer;">Download HTML</button>
        <div style="margin-left: auto; color: #6c757d; font-size: 12px;">Download a PDF or the standalone HTML file</div>
    </div>
    <div class="container">
        <div class="report-header">
            <h1>Medical Assessment Report</h1>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">Report Date: ${reportDate}</p>
            <div style="text-align: center; margin: 10px 0 20px 0;">
                <p style="font-size: 13px; color: #6c757d; margin: 0; padding: 5px 0; display: inline-block;  border-radius: 4px; padding: 6px 12px; ">
                  <span>Report #${reportCount} • Build ${buildVersion} • ID: ${reportId}</span>
                  <span style="margin: 0 5px;">•</span>
                  <span title="AI model used for generation" >${modelInfoText}</span>
                </p>
            </div>
        </div>
        
        ${generateAIClinicalAnalysisSection(formData, aiContent)}
        
        ${isReportEmpty(formData) ? "" : "<h1>Summary:</h1>"}
        
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

        ${generateGCSSection(formData)}
        
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
  try {
    console.debug("[REPORT:ROS] Checked ROS count:", rosCheckboxes.length);
  } catch {}

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

  // Fallback: if no checkboxes are checked (e.g., immediately after loading a history),
  // try to render from baseline snapshot's _rosData
  if (rosCheckboxes.length === 0) {
    try {
      const snap =
        typeof window !== "undefined" ? window.__bauBaselineSnapshot : null;
      const rosSnap = snap && snap._rosData ? snap._rosData : null;
      if (rosSnap && typeof rosSnap === "object") {
        console.debug(
          "[REPORT:ROS] Using fallback _rosData from baseline snapshot",
          {
            systems: Object.keys(rosSnap),
          }
        );
        Object.keys(rosSnap).forEach((system) => {
          const arr = Array.isArray(rosSnap[system]) ? rosSnap[system] : [];
          if (arr.length) {
            systemGroups[system] = (systemGroups[system] || []).concat(arr);
          }
        });
      }
    } catch (_) {}
  }

  // Convert to array format
  Object.keys(systemGroups).forEach((system) => {
    const findings = systemGroups[system].join(", ");
    rosData.push({ system, findings });
  });

  try {
    console.debug(
      "[REPORT:ROS] Systems rendered:",
      rosData.map((r) => ({
        system: r.system,
        count: r.findings ? r.findings.split(",").length : 0,
      }))
    );
  } catch {}

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
    { id: "pe-legs", name: "Legs" },
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

      // Check for "Others (Specify)" input for this section
      const othersCheckbox = document.getElementById(section.id + "-others");
      const othersText = document.getElementById(section.id + "-others-text");
      if (
        othersCheckbox &&
        othersCheckbox.checked &&
        othersText &&
        othersText.value.trim()
      ) {
        const customFindings = "Others: " + othersText.value.trim();
        findings = findings ? findings + ", " + customFindings : customFindings;
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
    if (!element) return;
    let display = "";
    // Prefer the visible option text when it's a <select>
    if (element.tagName === "SELECT") {
      const opt = element.options && element.options[element.selectedIndex];
      display = (opt && opt.text ? opt.text : element.value) || "";
    } else {
      display = element.value || "";
    }
    display = display.trim();
    // Filter out placeholders like "Select ..." and empty values
    if (display && !display.toLowerCase().startsWith("select"))
      socialData.push({ label: field.label, value: capitalizeFirst(display) });
  });

  // Append Pack-Years if applicable
  const packYearsText = computePackYears();
  if (packYearsText) {
    socialData.push({ label: "Pack-Years (Smoking)", value: packYearsText });
  }

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
    const selected = ccElement.options
      ? ccElement.options[ccElement.selectedIndex]
      : null;
    ccText =
      selected && !selected.disabled
        ? (selected.text || "").trim()
        : (ccElement.value || "").trim();
  }

  if (!ccText) return "";

  return `
    <section class="section">
      <h2>Chief Complaint</h2>
      <p><strong>Primary Concern:</strong> ${ccText}</p>
    </section>
  `;
}

function isReportEmpty(formData) {
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
    document.getElementById("sh-drugs")?.value ||
    document.getElementById("sh-occupation")?.value ||
    document.getElementById("sh-living")?.value ||
    document.getElementById("sh-travel")?.value;

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

  const peToggle = document.getElementById("pe-toggle");
  const hasPEEnabled = !!(peToggle && peToggle.checked);
  const hasROSSelections =
    (document.querySelectorAll("input.ros:checked").length || 0) > 0;
  const hasGCSSelections = [
    document.getElementById("gcs-eye")?.value,
    document.getElementById("gcs-verbal")?.value,
    document.getElementById("gcs-motor")?.value,
  ].some((v) => v && String(v).trim() !== "");

  // Also consider baseline snapshot ROS
  let hasBaselineROS = false;
  try {
    const snap =
      typeof window !== "undefined" ? window.__bauBaselineSnapshot : null;
    const ros = snap && snap._rosData ? snap._rosData : null;
    if (ros && typeof ros === "object") {
      hasBaselineROS = Object.values(ros).some(
        (arr) => Array.isArray(arr) && arr.length > 0
      );
    }
  } catch {}

  return (
    !hasPatientDetails &&
    !hasChiefComplaint &&
    !hasSocrates &&
    !hasSocialHistory &&
    !hasPMH &&
    !hasPSH &&
    !hasDrugHistory &&
    !hasFamilyHistory &&
    !hasICE &&
    !(hasROSSelections || hasBaselineROS || (hasPEEnabled && hasGCSSelections))
  );
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
    document.getElementById("sh-drugs")?.value ||
    document.getElementById("sh-occupation")?.value ||
    document.getElementById("sh-living")?.value ||
    document.getElementById("sh-travel")?.value;

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

  const peToggle = document.getElementById("pe-toggle");
  const hasPEEnabled = !!(peToggle && peToggle.checked);
  const hasROSSelections =
    (document.querySelectorAll("input.ros:checked").length || 0) > 0;
  const hasGCSSelections = [
    document.getElementById("gcs-eye")?.value,
    document.getElementById("gcs-verbal")?.value,
    document.getElementById("gcs-motor")?.value,
  ].some((v) => v && String(v).trim() !== "");

  // Also consider baseline snapshot ROS (in case DOM checkboxes aren't restored yet)
  let hasBaselineROS = false;
  try {
    const snap =
      typeof window !== "undefined" ? window.__bauBaselineSnapshot : null;
    const ros = snap && snap._rosData ? snap._rosData : null;
    if (ros && typeof ros === "object") {
      hasBaselineROS = Object.values(ros).some(
        (arr) => Array.isArray(arr) && arr.length > 0
      );
    }
  } catch {}

  // If no sections have data, show empty report message
  try {
    console.debug("[REPORT:EMPTY-CHECK]", {
      hasPatientDetails: !!hasPatientDetails,
      hasChiefComplaint: !!hasChiefComplaint,
      hasSocrates: !!hasSocrates,
      hasSocialHistory: !!hasSocialHistory,
      hasPMH: !!hasPMH,
      hasPSH: !!hasPSH,
      hasDrugHistory: !!hasDrugHistory,
      hasFamilyHistory: !!hasFamilyHistory,
      hasICE: !!hasICE,
      hasPEEnabled,
      hasROSSelections,
      hasBaselineROS,
      hasGCSSelections,
    });
  } catch {}
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
    // Consider ROS regardless of PE; GCS only when PE is enabled
    !(hasROSSelections || hasBaselineROS || (hasPEEnabled && hasGCSSelections))
  ) {
    return `
      <section class="section" style="text-align: center; padding: 30px;">
        <div style="background: #f8f9fa; border: 1px dashed #dee2e6; padding: 20px; border-radius: 10px;">
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

  // Enhanced markdown processing for medical content
  let formattedContent = content
    // Convert markdown-style headers to HTML
    .replace(/^### (.*$)/gm, "<h4>$1</h4>")
    .replace(/^## (.*$)/gm, "<h3>$1</h3>")
    // Convert bold text (both ** and __)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    // Convert italic text (both * and _)
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    // Format numbered lists with bold headers
    .replace(/^(\d+\.)\s*\*\*(.*?)\*\*(.*)$/gm, "$1 <strong>$2</strong>$3")
    // Format bullet points
    .replace(/^[-*+]\s+(.*$)/gm, "• $1")
    // Format investigation tables - convert markdown table format to HTML
    .replace(
      /\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)*)/g,
      (match, header, rows) => {
        const headerCells = header
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell);
        const headerRow =
          "<tr>" +
          headerCells
            .map(
              (cell) =>
                `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">${cell}</th>`
            )
            .join("") +
          "</tr>";

        const bodyRows = rows
          .trim()
          .split("\n")
          .map((row) => {
            const cells = row
              .replace(/^\||\|$/g, "")
              .split("|")
              .map((cell) => cell.trim());
            return (
              "<tr>" +
              cells
                .map(
                  (cell) =>
                    `<td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>`
                )
                .join("") +
              "</tr>"
            );
          })
          .join("");

        return `<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">${headerRow}${bodyRows}</table>`;
      }
    )
    // Handle simple pipe-separated lines as table rows
    .replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split("|").map((cell) => cell.trim());
      return (
        "<tr>" +
        cells
          .map(
            (cell) =>
              `<td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>`
          )
          .join("") +
        "</tr>"
      );
    })
    // Convert double line breaks to paragraph breaks
    .replace(/\n\s*\n/g, "</p><p>")
    // Convert single line breaks to <br>
    .replace(/\n/g, "<br>");

  // Wrap in paragraph tags
  let result = `<p>${formattedContent}</p>`;

  // Clean up any empty paragraphs
  result = result.replace(/<p>\s*<\/p>/g, "");

  return result;
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

function downloadHTMLReport(htmlContent, patientName) {
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

function openHTMLReportInNewTab(htmlContent) {
  try {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      console.error("[HTML Report] Failed to open new window - popup blocked?");
      return false;
    }
    // Do not revoke the Blob URL so that refresh keeps the content
    console.log("[HTML Report] Report opened in new tab via Blob URL");
    return true;
  } catch (error) {
    console.error("[HTML Report] Failed to open in new tab:", error);
    return false;
  }
}

// Expose globals for classic scripts
try {
  if (typeof window !== "undefined") {
    window.initHTMLReportGenerator =
      window.initHTMLReportGenerator || initHTMLReportGenerator;
    window.generateHTMLReport = window.generateHTMLReport || generateHTMLReport;
    window.generateClinicalTutorPrompt =
      window.generateClinicalTutorPrompt || generateClinicalTutorPrompt;
    window.openHTMLReportInNewTab =
      window.openHTMLReportInNewTab || openHTMLReportInNewTab;
    window.downloadHTMLReport = window.downloadHTMLReport || downloadHTMLReport;
  }
} catch (_) {}

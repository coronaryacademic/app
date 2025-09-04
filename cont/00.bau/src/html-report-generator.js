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

function generateClinicalReasoningSection(formData) {
  const chiefComplaint = formData.chiefComplaint || "presenting concern";
  const site = formData.site ? ` in the ${formData.site.toLowerCase()}` : "";
  const onset = formData.onset || "recently";
  const character = formData.character || "";
  const severity = formData.severity || "";
  const timing = formData.timing || "";
  const exacerbating = formData.exacerbating || "";
  const relieving = formData.relieving || "";
  const associatedSymptoms = formData.associatedSymptoms || "";

  // Analyze physical exam findings
  const peFindings = [];
  const peSections = [
    "cardiovascular",
    "respiratory",
    "abdominal",
    "neurological",
  ];
  peSections.forEach((section) => {
    const element = document.getElementById(`pe-${section}`);
    if (element && element.value) {
      peFindings.push({
        system: section,
        findings: element.multiple
          ? Array.from(element.selectedOptions)
              .map((opt) => opt.text)
              .join(", ")
          : element.value,
      });
    }
  });

  // Build reasoning for history taking
  let historyReasoning = [];
  const systemAffected = formData.systemAffected || "the affected system";

  if (site) {
    historyReasoning.push(
      `<strong>Site (${site}):</strong> The ${site} is involved because it contains structures related to ${systemAffected}. For example, ${site}-related symptoms in ${systemAffected} could indicate involvement of specific anatomical structures or referred pain patterns.`
    );
  }
  if (onset) {
    historyReasoning.push(
      `<strong>Onset (${onset}):</strong> A ${onset} onset suggests specific pathophysiological processes in ${systemAffected}. This timing helps differentiate between acute conditions (like infections or trauma) and chronic conditions (like degenerative diseases) affecting ${systemAffected}.`
    );
  }
  if (character) {
    historyReasoning.push(
      `<strong>Character (${character}):</strong> The ${character} quality is characteristic of how ${systemAffected} manifests symptoms. This specific quality helps distinguish between different types of pathology within ${systemAffected} (e.g., ischemic vs. inflammatory pain).`
    );
  }
  if (severity) {
    historyReasoning.push(
      `<strong>Severity (${severity}):</strong> The ${severity} intensity indicates the degree of ${systemAffected} involvement. This helps assess disease progression and guides treatment urgency for ${systemAffected} conditions.`
    );
  }
  if (timing) {
    historyReasoning.push(
      `<strong>Timing (${timing}):</strong> The ${timing} pattern is significant because it reflects how ${systemAffected} responds to various stimuli or follows diurnal/physiological patterns specific to ${systemAffected}.`
    );
  }
  if (exacerbating || relieving) {
    historyReasoning.push(
      `<strong>Modifying Factors:</strong> In ${systemAffected}, factors that worsen (${
        exacerbating || "none noted"
      }) or improve (${
        relieving || "none noted"
      }) symptoms provide critical diagnostic clues about the underlying pathology and help differentiate between conditions affecting ${systemAffected}.`
    );
  }
  if (associatedSymptoms) {
    historyReasoning.push(
      `<strong>Associated Symptoms (${associatedSymptoms}):</strong> These symptoms suggest additional system involvement or complications related to ${systemAffected}, helping to build a more complete clinical picture of the ${systemAffected} pathology.`
    );
  }

  // Build reasoning for physical examination
  let peReasoning = [];
  if (peFindings.length > 0) {
    peFindings.forEach((finding) => {
      peReasoning.push(
        `<strong>${capitalizeFirst(finding.system)} Exam:</strong> ${
          finding.findings
        }`
      );
    });
  } else {
    peReasoning.push(
      "No specific physical examination findings were documented."
    );
  }

  // Only return the section if we have actual content beyond placeholders
  const hasRealContent = historyReasoning.some(
    (item) =>
      !item.includes("the affected system") &&
      !item.includes("No specific") &&
      !item.includes("recently") &&
      !item.includes("presenting concern")
  );

  if (hasRealContent) {
    // Add the clinical reasoning right after the AI content
    return `
      <section class="section" style="margin-top: 20px;">
        <h2 style="color: #212529; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">Clinical Reasoning</h2>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px;">
          <h3 style="color: #212529; font-size: 16px; margin-top: 0;">Pathophysiological Basis of Symptoms</h3>
          <p>For a patient presenting with ${chiefComplaint}${site}, the following analysis explains how these symptoms relate to the underlying pathology in ${systemAffected}:</p>
          <ul style="margin: 10px 0 20px 20px; padding: 0; list-style-type: disc;">
            ${historyReasoning
              .map((item) => `<li style="margin-bottom: 8px;">${item}</li>`)
              .join("")}
          </ul>
          
          ${
            peReasoning.length > 0
              ? `
          <h3 style="color: #212529; font-size: 16px; margin-top: 20px;">Physical Examination Correlates</h3>
          <p>The physical examination findings relate to ${systemAffected} as follows:</p>
          <ul style="margin: 10px 0 20px 20px; padding: 0; list-style-type: disc;">
            ${peReasoning
              .map((item) => `<li style="margin-bottom: 8px;">${item}</li>`)
              .join("")}
          </ul>`
              : ""
          }
          
          <div style="background-color: #e9ecef; padding: 10px; border-radius: 4px; margin-top: 15px; font-size: 14px;">
            <strong>Clinical Correlation:</strong> This analysis demonstrates how the patient's symptoms and examination findings relate to the pathophysiology of ${systemAffected}, helping to narrow the differential diagnosis and guide further investigation.
          </div>
        </div>
      </section>
    `;
  }
  return ""; // Return empty string if no reasoning to show
}

function generateSOCRATESExplanation(formData) {
  const {
    site = "",
    onset = "",
    character = "",
    severity = "",
    radiation = "",
    timing = "",
    exacerbating = "",
    relieving = "",
    associatedSymptoms = "",
    systemAffected = "",
  } = formData;

  if (!site && !onset && !character) {
    return ""; // Don't show if no relevant data
  }

  const explanations = [];

  if (site) {
    let explanation = `<strong>Site (${site}):</strong> `;
    if (
      site.toLowerCase().includes("retrosternal") ||
      site.toLowerCase().includes("chest")
    ) {
      explanation += `In cardiac conditions like myocardial ischemia, pain is often retrosternal because the heart is located in the mediastinum behind the sternum. The visceral pain fibers from the heart enter the spinal cord at T1-T4 levels, which is why the pain is typically felt in this central chest region.`;
    } else if (site.toLowerCase().includes("epigastr")) {
      explanation += `Epigastric pain can occur in cardiac ischemia due to the shared embryological origin of the heart and upper abdominal organs, leading to referred pain patterns through the T5-T9 dermatomes.`;
    } else if (
      site.toLowerCase().includes("left arm") ||
      site.toLowerCase().includes("shoulder")
    ) {
      explanation += `Referred pain to the left arm/shoulder occurs because the heart and arm share the same spinal cord segments (C3-C5 and T1-T2). The brain may misinterpret the visceral afferent signals as coming from the somatic structures of the arm.`;
    } else if (
      site.toLowerCase().includes("jaw") ||
      site.toLowerCase().includes("neck")
    ) {
      explanation += `Jaw or neck pain in cardiac conditions results from the convergence of visceral afferent fibers from the heart with somatic afferent fibers from these areas at the spinal cord level (trigeminocervical complex).`;
    } else {
      explanation += `The location of pain provides important diagnostic clues about the affected organ system and potential underlying pathology.`;
    }
    explanations.push(explanation);
  }

  if (onset) {
    let explanation = `<strong>Onset (${onset}):</strong> `;
    if (
      onset.toLowerCase().includes("sudden") ||
      onset.toLowerCase().includes("acute")
    ) {
      explanation += `Sudden onset is characteristic of acute vascular events like myocardial infarction or pulmonary embolism, where there is abrupt occlusion of blood flow to tissues.`;
    } else {
      explanation += `The timing of symptom onset helps differentiate between acute and chronic conditions, with more gradual onset suggesting conditions like stable angina or heart failure.`;
    }
    explanations.push(explanation);
  }

  if (character) {
    let explanation = `<strong>Character (${character}):</strong> `;
    if (
      character.toLowerCase().includes("pressure") ||
      character.toLowerCase().includes("tightness")
    ) {
      explanation += `Pressure or tightness suggests myocardial ischemia, where reduced blood flow leads to inadequate oxygen supply to the heart muscle, causing a sensation of heaviness or constriction.`;
    } else if (
      character.toLowerCase().includes("tearing") ||
      character.toLowerCase().includes("ripping")
    ) {
      explanation += `Tearing pain is classic for aortic dissection, where blood enters the arterial wall, creating a false lumen and causing severe, sharp pain that may radiate to the back.`;
    } else if (
      character.toLowerCase().includes("sharp") ||
      character.toLowerCase().includes("stabbing")
    ) {
      explanation += `Sharp pain may indicate pericarditis (worsening with inspiration), pleuritis, or pneumothorax, where inflammation of serous membranes causes localized, well-defined pain.`;
    } else if (character.toLowerCase().includes("burning")) {
      explanation += `Burning pain often suggests esophageal reflux or gastritis, where gastric acid irritates the esophageal or gastric mucosa.`;
    }
    explanations.push(explanation);
  }

  if (radiation) {
    let explanation = `<strong>Radiation (${radiation}):</strong> `;
    if (
      radiation.toLowerCase().includes("left arm") ||
      radiation.toLowerCase().includes("shoulder")
    ) {
      explanation += `Radiation to the left arm occurs because the heart and arm share the same spinal cord segments (C8-T1). The brain misinterprets the visceral afferent signals from the heart as coming from the somatic structures of the arm.`;
    } else if (
      radiation.toLowerCase().includes("jaw") ||
      radiation.toLowerCase().includes("neck")
    ) {
      explanation += `Radiation to the jaw or neck is due to the convergence of visceral afferent fibers from the heart with somatic afferent fibers from these areas at the spinal cord level (trigeminocervical complex).`;
    } else if (radiation.toLowerCase().includes("back")) {
      explanation += `Back radiation is characteristic of aortic dissection, where the tearing of the aortic wall causes severe pain that radiates to the interscapular region.`;
    } else if (radiation.toLowerCase().includes("epigastr")) {
      explanation += `Radiation to the epigastrium can occur with inferior wall myocardial infarction due to irritation of the adjacent diaphragm (phrenic nerve, C3-C5).`;
    }
    explanations.push(explanation);
  }

  if (timing) {
    let explanation = `<strong>Timing (${timing}):</strong> `;
    if (timing.toLowerCase().includes("exertion")) {
      explanation += `Exertional symptoms suggest conditions with fixed oxygen supply, like stable angina, where increased myocardial oxygen demand during activity cannot be met due to coronary artery disease.`;
    } else if (timing.toLowerCase().includes("rest")) {
      explanation += `Rest pain may indicate unstable angina or Prinzmetal's angina, where coronary artery spasm reduces blood flow independent of oxygen demand.`;
    } else if (timing.toLowerCase().includes("nocturnal")) {
      explanation += `Nocturnal symptoms can occur in heart failure due to fluid redistribution when lying down, increasing pulmonary venous pressure and causing orthopnea or paroxysmal nocturnal dyspnea.`;
    }
    explanations.push(explanation);
  }

  if (exacerbating) {
    let explanation = `<strong>Exacerbated by (${exacerbating}):</strong> `;
    if (exacerbating.toLowerCase().includes("exertion")) {
      explanation += `Symptoms worsened by exertion suggest conditions where oxygen demand increases, such as in stable angina or heart failure.`;
    } else if (
      exacerbating.toLowerCase().includes("breath") ||
      exacerbating.toLowerCase().includes("inspiration")
    ) {
      explanation += `Worsening with inspiration suggests pleural or pericardial inflammation, where movement of the inflamed surfaces causes sharp, localized pain.`;
    } else if (
      exacerbating.toLowerCase().includes("food") ||
      exacerbating.toLowerCase().includes("meal")
    ) {
      explanation += `Post-prandial worsening may indicate gastrointestinal causes like peptic ulcer disease or mesenteric ischemia.`;
    } else if (exacerbating.toLowerCase().includes("position")) {
      explanation += `Positional changes may suggest pericarditis (relieved by sitting forward) or musculoskeletal causes.`;
    }
    explanations.push(explanation);
  }

  if (relieving) {
    let explanation = `<strong>Relieved by (${relieving}):</strong> `;
    if (relieving.toLowerCase().includes("rest")) {
      explanation += `Relief with rest is classic for stable angina, where decreased myocardial oxygen demand allows supply to meet demand.`;
    } else if (relieving.toLowerCase().includes("nitro")) {
      explanation += `Nitroglycerin relieves symptoms by causing venous and coronary artery dilation, reducing preload and increasing coronary blood flow.`;
    } else if (
      relieving.toLowerCase().includes("antacid") ||
      relieving.toLowerCase().includes("food")
    ) {
      explanation += `Relief with antacids or food suggests gastroesophageal reflux disease (GERD) or peptic ulcer disease.`;
    } else if (relieving.toLowerCase().includes("sitting forward")) {
      explanation += `Relief when sitting forward is characteristic of pericarditis, as this position reduces pressure on the inflamed pericardium.`;
    }
    explanations.push(explanation);
  }

  if (associatedSymptoms) {
    let explanation = `<strong>Associated Symptoms (${associatedSymptoms}):</strong> `;
    if (
      associatedSymptoms.toLowerCase().includes("dyspn") ||
      associatedSymptoms.toLowerCase().includes("shortness of breath")
    ) {
      explanation += `Dyspnea may indicate pulmonary congestion from left ventricular failure or reduced cardiac output.`;
    } else if (
      associatedSymptoms.toLowerCase().includes("nausea") ||
      associatedSymptoms.toLowerCase().includes("vomit")
    ) {
      explanation += `Nausea and vomiting can occur with inferior wall MI due to vagal stimulation or as part of the vasovagal response to pain.`;
    } else if (
      associatedSymptoms.toLowerCase().includes("diaphores") ||
      associatedSymptoms.toLowerCase().includes("sweat")
    ) {
      explanation += `Diaphoresis results from sympathetic nervous system activation in response to pain or hemodynamic compromise.`;
    } else if (associatedSymptoms.toLowerCase().includes("palpitation")) {
      explanation += `Palpitations may indicate arrhythmias, which can accompany acute coronary syndromes or occur secondary to electrolyte imbalances.`;
    } else if (
      associatedSymptoms.toLowerCase().includes("syncope") ||
      associatedSymptoms.toLowerCase().includes("presyncope")
    ) {
      explanation += `Syncope suggests reduced cerebral perfusion, which can occur with severe aortic stenosis, arrhythmias, or massive pulmonary embolism.`;
    }
    explanations.push(explanation);
  }

  if (explanations.length === 0) {
    return "";
  }

  return `
    <section class="section" style="margin-top: 20px;">
      <h2 style="color: #212529; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">SOCRATES Analysis</h2>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px;">
        <p>The following explains how the patient's symptoms relate to the underlying pathophysiology in ${
          systemAffected || "the affected system"
        }:</p>
        <ul style="margin: 10px 0 20px 20px; padding: 0; list-style-type: disc;">
          ${explanations
            .map(
              (exp) =>
                `<li style="margin-bottom: 12px; line-height: 1.5;">${exp}</li>`
            )
            .join("")}
        </ul>
        <div style="background-color: #e9ecef; padding: 10px; border-radius: 4px; margin-top: 15px; font-size: 14px;">
          <strong>Educational Note:</strong> This SOCRATES analysis helps connect the patient's symptoms to potential underlying pathologies, guiding the diagnostic process and differential diagnosis.
        </div>
      </div>
    </section>
  `;
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
        <div class="warning-box" style="margin-top: 20px;">
          <strong>REMINDER:</strong> The AI-generated differential diagnoses and investigation summaries are 
          provided as a learning aid for this introductory course. These are starting points to help you 
          connect the patient's history and physical exam findings. <strong>Do not discuss these specific 
          AI-generated insights with others.</strong> Focus on understanding how the clinical presentation 
          leads to the suggested investigations and potential diagnoses.
        </div>
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
            grid-template-columns: minmax(150px, 180px) 1fr; 
            gap: 12px 20px; 
            margin: 15px 0;
            page-break-inside: avoid;
            break-inside: avoid;
            align-items: baseline;
        }
        .grid .label { 
            font-weight: 600;
            color: #495057;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .grid .value {
            word-break: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
        }
       
        /* Table styling with overflow handling */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            table-layout: fixed;
            word-wrap: break-word;
            page-break-inside: auto;
        }
        th, td {
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        /* Moved .grid .label styles above with enhanced styling */
        .recommendation { font-weight: bold; }
        .recommendation.critical { color: #dc3545; }
        .recommendation.normal { color: #198754; }
        
        /* Clinical Reasoning Section Styles */
        .reasoning-section {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #0d6efd;
        }
        .reasoning-section h3 {
            color: #0d6efd;
            margin-top: 0;
            font-size: 18px;
            border-bottom: 1px dashed #dee2e6;
            padding-bottom: 8px;
        }
        .reasoning-list {
            margin: 10px 0 20px 20px;
            padding: 0;
        }
        .reasoning-list li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        .educational-note {
            background-color: #e7f5ff;
            border-left: 4px solid #4dabf7;
            padding: 12px 15px;
            margin-top: 20px;
            border-radius: 4px;
            font-size: 14px;
        }
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
        .warning-box {
            background-color: #fde8e8;
            border-left: 4px solid #e53e3e;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
            color: #9b2c2c;
            font-size: 14px;
            line-height: 1.5;
        }
        .warning-box strong {
            color: #c53030;
            font-weight: 600;
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
        
        ${
          generateClinicalReasoningSection(formData)
            ? generateClinicalReasoningSection(formData)
            : ""
        }
        
        
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
                <p><strong>Important:</strong> This report is generated for <strong>medical education and training purposes only</strong>. 
                It is <strong>not a substitute for professional medical advice, diagnosis, or treatment</strong>. 
                Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
                
                <p><strong>Confidentiality warning:</strong> This report is for your <strong>personal educational use only</strong>. 
                <strong>DO NOT</strong> share this report with faculty, tutors, or other students. You have to write your own history. 
                It is only designed to help you organize your thoughts and prepare for potential case discussions. 
                The patient's name and identifying details must <strong>never</strong> be shared, unless allowed.  
                This is <strong>not</strong> meant to be a source for cheating or a replacement for your own learning and critical thinking.</p>
            </div>
       
            <div style="color: #adb5bd; font-size: 20px; margin-top: 20px;">
                Socrates<sup style="font-size: 9px; margin-left: 5px">Beta</sup>
            </div>
                 <div style="margin-top: 15px; font-size: 11px;">
                Developed and coded by <strong>Momen</strong>
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

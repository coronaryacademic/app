// === AI Demo Functionality ===
import { firebaseAI } from "./firebase-ai.js";

export function initAIDemo() {
  try {
    console.log("[AI-DEMO] Starting initialization...");
    const aiButton = document.getElementById("ai-generate");
    const aiOutput = document.getElementById("ai-output");
    const aiModel = document.getElementById("ai-model");

    console.log("[AI-DEMO] Elements found:", {
      aiButton: !!aiButton,
      aiOutput: !!aiOutput,
      aiModel: !!aiModel,
    });

    if (!aiButton || !aiOutput || !aiModel) {
      console.warn("[BAU] AI demo elements not found - missing elements:", {
        aiButton: !aiButton,
        aiOutput: !aiOutput,
        aiModel: !aiModel,
      });
      return;
    }

    // Hoisted helper to ensure HTML report generator globals are available
    function ensureHTMLReportGenerator() {
      return new Promise((resolve) => {
        if (window.generateHTMLReport && window.initHTMLReportGenerator) {
          return resolve(true);
        }
        const existing = document.querySelector(
          'script[src="cont/00.bau/src/html-report-generator.js"]'
        );
        if (existing) {
          existing.addEventListener("load", () => resolve(true));
          existing.addEventListener("error", () => resolve(false));
          return;
        }
        const s = document.createElement("script");
        s.src = "cont/00.bau/src/html-report-generator.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
      });
    }

    // Initialize Firebase AI and update model options
    initializeFirebaseAI();

    async function initializeFirebaseAI() {
      try {
        // Ensure report generator is present (handles rare race conditions)
        const ok = await ensureHTMLReportGenerator();
        try {
          if (typeof window.initHTMLReportGenerator === "function") {
            window.initHTMLReportGenerator();
          }
        } catch {}
        if (!ok || typeof window.generateHTMLReport !== "function") {
          console.error("[AI-DEMO] HTML report generator unavailable");
          aiOutput.innerHTML = `<p style="color: red;">Report generator not loaded. Please try again.</p>`;
          return;
        }
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
      aiModel.innerHTML = '';

      // Group models by provider and type
      const modelGroups = models.reduce((groups, model) => {
        const provider = model.provider || 'other';
        const type = model.type || 'other';
        if (!groups[provider]) {
          groups[provider] = {};
        }
        if (!groups[provider][type]) {
          groups[provider][type] = [];
        }
        groups[provider][type].push(model);
        return groups;
      }, {});

      // Create optgroups for each provider and type
      Object.entries(modelGroups).forEach(([provider, types]) => {
        Object.entries(types).forEach(([type, modelList]) => {
          const groupLabel = `${provider.toUpperCase()} ${type === 'vercel' ? 'API' : type.toUpperCase()}`;
          const optgroup = document.createElement('optgroup');
          optgroup.label = groupLabel;
          
          modelList.forEach((model) => {
            const option = document.createElement("option");
            option.value = model.value;
            option.textContent = model.text;
            // Store additional model metadata as data attributes
            option.dataset.type = model.type;
            option.dataset.provider = model.provider;
            if (model.apiBase) {
              option.dataset.apiBase = model.apiBase;
            }
            optgroup.appendChild(option);
          });
          
          aiModel.appendChild(optgroup);
        });
      });

      // Add a default disabled option at the top
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.disabled = true;
      defaultOption.selected = true;
      defaultOption.textContent = 'Select AI model';
      aiModel.insertBefore(defaultOption, aiModel.firstChild);

      // Restore saved model selection
      const savedModel = localStorage.getItem("aiModel");
      if (savedModel && models.some((m) => m.value === savedModel)) {
        aiModel.value = savedModel;
      }
    }

    // Helper: parse metadata (reportId, reportCount, build) from generated HTML
    function parseReportMetadataFromHTML(html) {
      try {
        const idMatch = html.match(/ID:\s*([A-Z0-9-]+)/i);
        const countMatch = html.match(/Report\s*#(\d+)/i);
        const buildMatch = html.match(/Build\s*([0-9.]+)/i);
        return {
          reportId: idMatch ? idMatch[1] : null,
          reportCount: countMatch ? Number(countMatch[1]) : null,
          buildVersion: buildMatch ? buildMatch[1] : null,
        };
      } catch {
        return { reportId: null, reportCount: null, buildVersion: null };
      }
    }

    // Helper: build a short summary from form data
    function buildHistorySummary(data) {
      const parts = [];
      if (data.chiefComplaint) parts.push(`CC: ${data.chiefComplaint}`);
      const socrates = [data.site, data.onset, data.character]
        .filter(Boolean)
        .join(" · ");
      if (socrates) parts.push(`SOCRATES: ${socrates}`);
      if (data.severity) parts.push(`Severity: ${data.severity}`);
      return parts.join(" | ") || "Clinical history entry";
    }

    // Helper: build a DOM-based snapshot compatible with bau.js applySnapshotToForm()
    function buildFormSnapshot() {
      const root =
        document.getElementById("history-form-container") || document.body;

      const snapshot = {};
      const rosData = {};

      // Handle inputs and textareas
      const inputs = root.querySelectorAll("input, textarea");
      inputs.forEach((el) => {
        const tag = (el.tagName || "").toLowerCase();
        const type = (el.type || "").toLowerCase();
        const key = el.id || el.name;
        if (!key) return;

        if (type === "radio") {
          if (el.checked) snapshot[el.name] = el.value;
          return;
        }

        if (type === "checkbox") {
          // Special handling for ROS checkboxes collected under _rosData
          if (el.classList && el.classList.contains("ros")) {
            const systemRaw = el.getAttribute("data-system");
            const system = systemRaw ? String(systemRaw).trim() : "";
            // Resolve value similar to restore logic
            const value =
              el.value ||
              el.getAttribute("data-value") ||
              el.getAttribute("aria-label") ||
              el.id ||
              el.name ||
              "";
            if (system && el.checked) {
              if (!rosData[system]) rosData[system] = [];
              if (!rosData[system].includes(String(value))) {
                rosData[system].push(String(value));
              }
            }
            return;
          }
          snapshot[key] = !!el.checked;
          return;
        }

        // Textual inputs/textarea
        snapshot[key] = el.value || "";
      });

      // Second pass: be defensive and collect any ROS by data-system even if class="ros" is missing
      try {
        const rosBoxes = root.querySelectorAll('input[type="checkbox"][data-system]');
        rosBoxes.forEach((el) => {
          const system = (el.getAttribute("data-system") || "").trim();
          if (!system || !el.checked) return;
          const value =
            el.value ||
            el.getAttribute("data-value") ||
            el.getAttribute("aria-label") ||
            el.id ||
            el.name ||
            "";
          if (!value) return;
          if (!rosData[system]) rosData[system] = [];
          if (!rosData[system].includes(String(value))) {
            rosData[system].push(String(value));
          }
        });
      } catch {}

      // Handle selects (single by text; multiple as array of texts)
      const selects = root.querySelectorAll("select");
      selects.forEach((sel) => {
        const key = sel.id || sel.name;
        if (!key) return;
        if (sel.multiple) {
          const arr = Array.from(sel.selectedOptions)
            .map((opt) => (opt.text || "").trim())
            .filter(Boolean);
          snapshot[key] = arr;
        } else {
          const opt = sel.options[sel.selectedIndex];
          const text = opt && !opt.disabled ? (opt.text || "").trim() : "";
          snapshot[key] = text;
        }
      });

      if (Object.keys(rosData).length) snapshot._rosData = rosData;
      try {
        const allRos = root.querySelectorAll('input[type="checkbox"][data-system]');
        const checkedRos = root.querySelectorAll('input[type="checkbox"][data-system]:checked');
        console.debug("[SNAPSHOT] Built form snapshot", {
          hasROS: !!snapshot._rosData,
          rosSystems: snapshot._rosData ? Object.keys(snapshot._rosData) : [],
          rosCounts: snapshot._rosData
            ? Object.fromEntries(
                Object.entries(snapshot._rosData).map(([k, v]) => [
                  k,
                  Array.isArray(v) ? v.length : 0,
                ])
              )
            : {},
          rosTotalInputs: allRos.length,
          rosCheckedInputs: checkedRos.length,
        });
      } catch {}
      return snapshot;
    }

    // Helper: save report metadata to Firestore histories
    async function saveReportToHistory({
      formData,
      htmlReport,
      aiModelValue,
      aiContent,
    }) {
      try {
        const auth = window.auth;
        const db = window.db;
        const { addDoc, collection, serverTimestamp } = window;
        const user = auth?.currentUser || null;

        if (!user) {
          console.warn("[AI-DEMO] Not signed in; skipping history save");
          return { saved: false, reason: "unauthenticated" };
        }
        if (!db || !addDoc || !collection || !serverTimestamp) {
          console.warn(
            "[AI-DEMO] Firestore SDK not available on window; skipping history save"
          );
          return { saved: false, reason: "no-firestore" };
        }

        const meta = parseReportMetadataFromHTML(htmlReport);
        const snapshot = buildFormSnapshot();
        try {
          console.debug("[HISTORY:SAVE] Snapshot ROS before save", {
            hasROS: !!snapshot._rosData,
            rosData: snapshot._rosData || null,
          });
        } catch {}

        // Skip duplicate save if snapshot hasn't changed since a history was loaded
        const currentHash = JSON.stringify(snapshot);
        if (
          window.__bauBaselineHash &&
          window.__bauBaselineHash === currentHash
        ) {
          console.log(
            "[AI-DEMO] No form changes since history load; skipping history save"
          );
          return { saved: false, reason: "no-change" };
        }
        const docData = {
          // Identity
          uid: user.uid,
          patientName: formData.patientName || "Unknown Patient",
          // Content summary
          summary: buildHistorySummary(formData),
          chiefComplaint: formData.chiefComplaint || "",
          // Full form snapshot for restoration
          data: snapshot,
          // Report metadata
          reportId: meta.reportId,
          reportCount: meta.reportCount,
          buildVersion: meta.buildVersion,
          // AI context
          aiModel: aiModelValue || null,
          hasAI: !!aiModelValue && !!aiContent,
          // Timestamps
          createdAt: serverTimestamp(),
          createdAtTs: serverTimestamp(),
          createdMs: Date.now(),
        };

        const colRef = collection(db, "users", user.uid, "histories");
        await addDoc(colRef, docData);
        console.log("[AI-DEMO] History saved", docData);
        // Update baseline after successful save
        try {
          window.__bauBaselineHash = currentHash;
          window.__bauBaselineSnapshot = snapshot;
        } catch {}
        return { saved: true };
      } catch (err) {
        console.warn("[AI-DEMO] Failed to save history:", err);
        return { saved: false, reason: "error", error: err };
      }
    }

    // Status tracking functions
    function showStatusBox() {
      const statusBox = document.getElementById("report-status");
      if (statusBox) {
        statusBox.style.display = "block";
        // Reset all steps to pending state
        for (let i = 1; i <= 4; i++) {
          const step = document.getElementById(`status-step-${i}`);
          if (step) {
            step.style.opacity = "0.6";
            const icon = step.querySelector(".status-icon");
            if (icon) icon.textContent = "○";
          }
        }
      }
    }

    function updateStatus(stepNumber, completed = false) {
      const step = document.getElementById(`status-step-${stepNumber}`);
      if (step) {
        if (completed) {
          step.style.opacity = "1";
          const icon = step.querySelector(".status-icon");
          if (icon) {
            icon.textContent = "✓";
            icon.style.color = "#28a745";
          }
        } else {
          step.style.opacity = "1";
          const icon = step.querySelector(".status-icon");
          if (icon) {
            icon.innerHTML = '<div class="loading-spinner"></div>';
          }
        }
      }
    }

    function hideStatusBox() {
      const statusBox = document.getElementById("report-status");
      if (statusBox) {
        statusBox.style.display = "none";
      }
    }

    // AI generation handler
    aiButton.addEventListener("click", async (e) => {
      console.log("[AI-DEMO] Button clicked!");
      e.preventDefault();

      const selectedModel = aiModel.value;
      console.log("[AI-DEMO] Selected model:", selectedModel);

      // Show loading state and status box
      aiButton.disabled = true;
      aiButton.textContent = "Generating...";
      aiOutput.style.display = "none";
      showStatusBox();
      
      // Step 1: Sending inputs to client
      updateStatus(1, false);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Collect form data for processing
      const formData = collectFormData();
      updateStatus(1, true);
      
      // Step 2: Report setting up
      updateStatus(2, false);
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        let aiContent = null;
        updateStatus(2, true);

        // Step 3: AI Assessment (if model selected)
        if (selectedModel) {
          updateStatus(3, false);
          console.log("[AI-DEMO] Generating AI content with model:", selectedModel);
          
          try {
            // Build the clinical tutor prompt
            const prompt = buildAIPrompt(formData);
            console.log("[AI-DEMO] Using prompt:", prompt.substring(0, 200) + "...");
            
            // Generate AI content using Firebase AI
            const aiResult = await firebaseAI.generateContent(selectedModel, prompt);
            
            if (aiResult.success) {
              aiContent = aiResult.content;
              console.log("[AI-DEMO] AI content generated successfully");
              updateStatus(3, true);
              
              // Save model selection
              localStorage.setItem("aiModel", selectedModel);
            } else {
              console.error("[AI-DEMO] AI generation failed:", aiResult.error);
              // Skip AI step but continue with report
              updateStatus(3, true);
            }
          } catch (aiError) {
            console.error("[AI-DEMO] AI generation error:", aiError);
            // Skip AI step but continue with report
            updateStatus(3, true);
          }
        } else {
          // No AI model selected, mark step 3 as skipped with X
          const step = document.getElementById("status-step-3");
          if (step) {
            step.style.opacity = "1";
            const icon = step.querySelector(".status-icon");
            if (icon) {
              icon.textContent = "✗";
              icon.style.color = "#dc3545";
            }
          }
        }

        // Step 4: Finishing up
        updateStatus(4, false);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate the HTML report with the AI content and model information
        const htmlReport = window.generateHTMLReport(formData, aiContent, {
          modelInfo: {
            modelUsed: selectedModel,
            fallbackUsed: false,
            timestamp: Date.now()
          }
        });
        if (!htmlReport) return;
        (window.openHTMLReportInNewTab || (() => {}))(htmlReport);

        // Save to Firestore history (best-effort)
        const saveResult = await saveReportToHistory({
          formData,
          htmlReport: htmlReport, // Use the htmlReport variable we already have
          aiModelValue: selectedModel,
          aiContent,
        });

        // Refresh sidebar if available
        if (
          saveResult.saved &&
          typeof window.renderHistorySidebar === "function"
        ) {
          try {
            await window.renderHistorySidebar();
          } catch (e) {
            console.warn("[AI-DEMO] Sidebar refresh failed:", e);
          }
        }

        updateStatus(4, true);
        
        // Hide status box and show success message
        setTimeout(() => {
          hideStatusBox();
          const aiStatus = selectedModel && aiContent
            ? "with AI assessment"
            : selectedModel && !aiContent
            ? "(AI assessment failed, report generated without AI)"
            : "(No AI model selected)";
          aiOutput.innerHTML = `
            <div class="ai-suggestions" style="text-align: center; padding: 20px;">
              <h3 style="margin-bottom: 15px; color: var(--all-text);">Report Generated Successfully</h3>
              <p style="color: #198754; font-weight: 600; margin-bottom: 10px;">Clinical report has been opened in a new tab ${aiStatus}.</p>
              <p style="margin-top: 8px; color: var(--all-text); opacity: 0.85; font-size: 13px; margin-bottom: 0;">${
                window.auth?.currentUser
                  ? "Saved to your history."
                  : "Sign in to save to history."
              }</p>
            </div>
          `;
          aiOutput.style.display = "block";
        }, 500);
      } catch (error) {
        console.error("Report generation error:", error);
        hideStatusBox();
        aiOutput.innerHTML = `<p style="color: red;">Error generating report: ${error.message}</p>`;
        aiOutput.style.display = "block";
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
        studentNotes: getElementValue("student-notes"),
      };
    }

    function buildAIPrompt(data) {
      // Use the clinical tutor prompt from the HTML report generator
      if (typeof window.generateClinicalTutorPrompt === "function") {
        try {
          return window.generateClinicalTutorPrompt(data);
        } catch (e) {
          console.warn("[AI-DEMO] Failed to use clinical tutor prompt, falling back to basic prompt:", e);
        }
      }
      
      // Fallback to basic prompt if clinical tutor prompt is not available
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

      if (data.studentNotes) {
        prompt += `\nStudent Notes & Clinical Reasoning: ${data.studentNotes}\n`;
        prompt += `\nPlease consider the student's notes and reasoning above when providing your analysis.\n`;
      }

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

// Expose initializer globally so BAU can re-init after dynamic loads
try {
  // Assign without overwriting if already set
  if (!window.initAIDemo) window.initAIDemo = initAIDemo;
} catch {}

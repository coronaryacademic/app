// === Enhanced Progress Tracker Functionality ===
export function initProgressTracker() {
  try {
    const tracker = document.getElementById("progress-tracker");
    if (!tracker) return;

    // Enhanced section mapping with better organization
    const sections = {
      "patient-info": ["patient-name", "age"],
      "social-history": [
        "sh-smoking",
        "sh-alcohol",
        "sh-drugs",
        "sh-occupation",
        "sh-living",
        "sh-travel",
      ],
      "chief-complaint": ["chief-complaint"],
      "socrates": ["site", "onset", "character", "radiation", "associations", "time-course", "exacerbating", "severity"],
      "past-medical": ["past-medical"],
      "past-surgical": ["past-surgical"],
      "drug-history": ["current-medications", "allergies"],
      "family-history": ["family-history"],
      "review-systems": ["constitutional", "cardiovascular", "respiratory", "gastrointestinal", "genitourinary", "musculoskeletal", "neurological", "psychiatric", "endocrine", "hematologic", "allergic", "dermatologic"],
      "ice": ["ideas", "concerns", "expectations"],
      "review-of-systems": [], // ROS handled specially
      "examination": [
        "examination",
      ],
      "investigations": [
        "investigations",
      ],
      "differential-diagnosis": [
        "differential-diagnosis",
      ],
      "management-plan": [
        "management-plan",
      ],
    };

    // Add modern styling to progress tracker
    enhanceProgressTrackerStyling();

    // Add click-to-scroll functionality
    addProgressItemClickHandlers();

    function checkSectionCompletion(sectionKey) {
      if (sectionKey === "review-of-systems") {
        const rosSelects = document.querySelectorAll(
          '#ros-table select[id^="ros-"]'
        );
        let completedCount = 0;
        rosSelects.forEach((select) => {
          if (select.value && select.value.trim() !== "") {
            completedCount++;
          }
        });
        return completedCount >= Math.ceil(rosSelects.length * 0.5);
      }


      const fieldIds = sections[sectionKey] || [];
      let completedCount = 0;
      
      for (const fieldId of fieldIds) {
        const field = document.getElementById(fieldId);
        if (!field) continue;
        
        if (field.tagName === "SELECT") {
          if (field.multiple) {
            // Multi-select: check for at least one valid selection
            const selectedOptions = Array.from(field.selectedOptions).filter(
              (opt) => opt.value && opt.value.trim() !== "" && !opt.disabled
            );
            if (selectedOptions.length > 0) completedCount++;
          } else {
            // Single select: robust validation
            const currentValue = field.value;
            if (!currentValue || currentValue.trim() === "") continue;
            
            const selectedOption = Array.from(field.options).find(opt => opt.value === currentValue);
            if (!selectedOption) continue;
            
            // Check if it's not a disabled placeholder option
            if (selectedOption.disabled) continue;
            
            // Check if it's not an empty or placeholder option
            if (selectedOption.value === "" || selectedOption.textContent.toLowerCase().includes("select")) continue;
            
            completedCount++;
          }
        } else if (field.tagName === "TEXTAREA" || field.tagName === "INPUT") {
          const value = field.value && field.value.trim();
          if (value && value.length > 0) completedCount++;
        }
      }
      
      // For most sections, require all fields to be completed.
      // For larger sections, allow partial completion, EXCEPT Social History which requires ALL fields.
      let requiredCompletion = fieldIds.length <= 3 ? fieldIds.length : Math.ceil(fieldIds.length * 0.8);
      if (sectionKey === "social-history") {
        requiredCompletion = fieldIds.length; // must complete all SH fields
      }
      return completedCount >= requiredCompletion && fieldIds.length > 0;
    }

    function updateProgressTracker() {
      const items = tracker.querySelectorAll(".progress-item");
      items.forEach((item) => {
        const sectionKey = item.getAttribute("data-section");
        if (!sectionKey) return;
        const isCompleted = checkSectionCompletion(sectionKey);
        const icon = item.querySelector(".progress-icon");
        if (icon) {
          icon.textContent = isCompleted ? "✓" : "○";
          icon.style.color = isCompleted ? "#28a745" : "#6c757d";
        }
        item.classList.toggle("completed", isCompleted);
      });
    }

    // Initial update
    updateProgressTracker();

    // Listen for form changes with debouncing
    let updateTimeout;
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(updateProgressTracker, 100);
    };

    document.addEventListener("input", debouncedUpdate);
    document.addEventListener("change", debouncedUpdate);

    function enhanceProgressTrackerStyling() {
      const tracker = document.getElementById("progress-tracker");
      if (!tracker) return;

      // Add modern CSS styles
      const style = document.createElement('style');
      style.textContent = `
        #progress-tracker {
          transition: all 0.3s ease;
        }
        
        .progress-item {
          transition: all 0.3s ease;
          cursor: pointer;
          border-radius: 8px;
          margin: 4px 0;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .progress-item:hover {
          background: rgba(44, 201, 199, 0.1);
          transform: translateX(4px);
        }
        
        .progress-item.completed {
          background: rgba(40, 167, 69, 0.15);
          border-left: 3px solid #28a745;
        }
        
        .progress-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          background: #e9ecef;
          color: #6c757d;
          transition: all 0.3s ease;
        }
        
        .progress-item.completed .progress-icon {
          background: #28a745;
          color: white;
          transform: scale(1.1);
        }
        
        .progress-item span {
          font-size: 13px;
          font-weight: 500;
          transition: color 0.3s ease;
        }
        
        .progress-item.completed span {
          color: #28a745;
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }

    function addProgressItemClickHandlers() {
      const progressItems = document.querySelectorAll('.progress-item');
      
      progressItems.forEach(item => {
        item.addEventListener('click', () => {
          const sectionKey = item.getAttribute('data-section');
          scrollToFormSection(sectionKey);
        });
      });
    }

    function scrollToFormSection(sectionKey) {
      // Map section keys to actual form elements
      const sectionMappings = {
        'patient-info': 'patient-name', 
        'chief-complaint': 'chief-complaint',
        'history-presenting-complaint': 'site',
        'past-medical-history': 'past-medical-history',
        'medications': 'medications',
        'allergies': 'allergies',
        'family-history': 'family-history',
        'social-history': 'sh-smoking',
        'ice': 'ice',
        'review-of-systems': 'ros-table',
        'examination': 'examination',
        'investigations': 'investigations',
        'differential-diagnosis': 'differential-diagnosis',
        'management-plan': 'management-plan'
      };

      const targetFieldId = sectionMappings[sectionKey];
      const targetElement = document.getElementById(targetFieldId);
      
      if (targetElement) {
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add highlight effect
        targetElement.style.transition = 'box-shadow 0.3s ease';
        targetElement.style.boxShadow = '0 0 0 3px rgba(44, 201, 199, 0.3)';
        
        setTimeout(() => {
          targetElement.style.boxShadow = '';
        }, 2000);
      }
    }

    // Export for external use
    window.updateProgressTracker = updateProgressTracker;
    window.checkSectionCompletion = checkSectionCompletion;
    window.scrollToFormSection = scrollToFormSection;
  } catch (e) {
    console.warn("[BAU] Progress tracker init error:", e);
  }
}

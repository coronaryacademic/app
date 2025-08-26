// === Student Auto-fill Functionality ===
export function initStudentAutofill() {
  try {
    // Auto-fill student information from localStorage when page loads
    function fillStudentInfo() {
      const studentData = localStorage.getItem("studentData");
      if (!studentData) return;

      try {
        const data = JSON.parse(studentData);

        // Fill student name
        const studentNameField = document.getElementById("student-name");
        if (studentNameField && data.studentName) {
          studentNameField.value = data.studentName;
          studentNameField.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // Fill student number
        const studentNumberField = document.getElementById("student-number");
        if (studentNumberField && data.studentNumber) {
          studentNumberField.value = data.studentNumber;
          studentNumberField.dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }

        console.log("[BAU] Student information auto-filled");
      } catch (e) {
        console.warn("[BAU] Error parsing student data:", e);
      }
    }

    // Auto-fill on page load with a slight delay to ensure DOM is ready
    setTimeout(fillStudentInfo, 100);

    // Export for external use
    window.fillStudentInfo = fillStudentInfo;
  } catch (e) {
    console.warn("[BAU] Student auto-fill init error:", e);
  }
}

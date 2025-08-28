// Sidebar toggle logic
let overlayHandlerAdded = false; // Prevent duplicate event listeners
let isAnimating = false; // Prevent rapid clicking issues

// Guard: nav button may not exist (e.g., when sidebar markup is commented out)
const __navToggleBtn = document.querySelector(".nav-button");
if (__navToggleBtn)
  __navToggleBtn.addEventListener("click", function () {
    // Prevent rapid clicking
    if (isAnimating) return;

    const sidebar = document.querySelector(".side-bar-container");
    const overlay = document.getElementById("sidebarOverlay");
    const header = document.querySelector(".header-container");
    const navButton = document.querySelector(".nav-button");
    const navRects = document.querySelectorAll(".nav-button svg rect");
    const icon = document.getElementById("icon");

    if (sidebar.classList.contains("show")) {
      // Closing sidebar - use the new function
      closeSidebar();
    } else {
      // Opening sidebar
      isAnimating = true;
      resetNavButtonStates();

      sidebar.style.visibility = "visible";
      sidebar.classList.add("show");
      sidebar.classList.remove("hiding");

      overlay.style.visibility = "visible";
      overlay.classList.add("show");
      overlay.classList.remove("hiding");

      // Add footer to overlay if it doesn't exist (dynamic version)
      if (!overlay.querySelector(".overlay-footer")) {
        const overlayFooter = document.createElement("div");
        overlayFooter.className = "overlay-footer";
        const ver =
          (window.AppVersion && String(window.AppVersion)) || "v1.19.5 GS";
        overlayFooter.innerHTML = `<span class="overlay-version" data-role="app-version" style="font-size: 10px; color: rgba(243, 243, 243, 0.7); position: fixed; bottom: 5px; left: 50%; transform: translateX(-50%); z-index: 1001;">${ver}</span>`;
        overlay.appendChild(overlayFooter);
      }

      // Lock scroll: fix body and preserve current scroll position
      const currentY =
        window.scrollY || document.documentElement.scrollTop || 0;
      document.body.dataset.scrollLockY = String(currentY);
      document.body.style.top = `-${currentY}px`;
      document.body.classList.add("no-scroll");
      navButton.style.zIndex = "1100";

      header.classList.add("no-shadow");

      // Force the entire hamburger SVG and all bars to white on open
      const iconSvg = document.getElementById("icon");
      if (iconSvg) {
        iconSvg.style.setProperty("fill", "rgb(243, 243, 243)", "important");
      }

      if (navRects && navRects.length) {
        const tb = document.getElementById("topBar");
        const mb = document.getElementById("middleBar");
        const bb = document.getElementById("bottomBar");
        if (tb) tb.style.setProperty("fill", "rgb(243, 243, 243)", "important");
        if (mb) mb.style.setProperty("fill", "rgb(243, 243, 243)", "important");
        if (bb) bb.style.setProperty("fill", "rgb(243, 243, 243)", "important");
      }

      // Set home SVG fill to white on open
      const homeSvg = document.querySelector(".logo-container svg");
      if (homeSvg) {
        homeSvg.style.setProperty("fill", "rgb(243, 243, 243)", "important");
      }

      // Set theme toggle icon to white on open
      const themeIconImg = document.getElementById("themeIcon");
      if (themeIconImg) {
        // Use filter to white-out the icon regardless of theme
        themeIconImg.style.setProperty(
          "filter",
          "brightness(0) invert(1)",
          "important"
        );
      }

      // Set button color to white on open
      const rightSectionButtons = document.querySelectorAll(
        ".right-section button"
      );
      rightSectionButtons.forEach((btn) =>
        btn.style.setProperty("color", "rgb(243, 243, 243)", "important")
      );

      // FIXED: Transform hamburger to X immediately for smooth animation
      icon.classList.add("active");

      // Start nav button animations
      setTimeout(() => {
        animateNavButtonsIn();
        isAnimating = false; // Allow next click after animation starts
      }, 200);

      // Add document click handler for "click anywhere to close"
      if (!overlayHandlerAdded) {
        // Small delay to prevent immediate closure from the nav button click
        setTimeout(() => {
          document.addEventListener("click", handleDocumentClick);
          overlayHandlerAdded = true;
        }, 100);
      }
    }
  });

// Updated handleDocumentClick function - no exclusions, click anywhere to close
function handleDocumentClick(event) {
  const sidebar = document.querySelector(".side-bar-container");

  // Close the sidebar if it's open - NO EXCLUSIONS, click anywhere to close
  if (sidebar.classList.contains("show")) {
    closeSidebar();
  }
}

// Helper function to reset nav button states
function resetNavButtonStates() {
  const buttons = document.querySelectorAll(".nav-bar");
  buttons.forEach((btn) => {
    // Clear ALL animation classes
    btn.classList.remove(
      "animate-in",
      "animate-in-bounce",
      "animate-out",
      "animate-out-fade"
    );

    // Reset to default hidden state
    btn.style.removeProperty("opacity");
    btn.style.removeProperty("transform");
    btn.style.removeProperty("pointer-events");
    btn.style.removeProperty("animation-delay");

    // Force reflow
    void btn.offsetWidth;
  });
}

// Function to animate nav buttons in with staggered timing
function animateNavButtonsIn(useBouncyAnimation = false) {
  const buttons = document.querySelectorAll(".nav-bar");
  const animationClass = useBouncyAnimation
    ? "animate-in-bounce"
    : "animate-in";

  buttons.forEach((btn, index) => {
    // Clear any existing animation classes first
    btn.classList.remove(
      "animate-out",
      "animate-out-fade",
      "animate-in",
      "animate-in-bounce"
    );

    // Force reflow to ensure clean state
    void btn.offsetWidth;

    // Use setTimeout for staggered entrance
    setTimeout(() => {
      btn.classList.add(animationClass);
    }, index * 80); // 80ms stagger for smoother effect
  });
}

// Function to animate nav buttons out with REVERSE staggered timing
function animateNavButtonsOut(useFadeAnimation = false) {
  const buttons = document.querySelectorAll(".nav-bar");
  const animationClass = useFadeAnimation ? "animate-out-fade" : "animate-out";

  // Convert to array and reverse for exit animation
  const buttonArray = Array.from(buttons);

  buttonArray.forEach((btn, index) => {
    // Clear entrance animation classes
    btn.classList.remove("animate-in", "animate-in-bounce");

    // Force reflow
    void btn.offsetWidth;

    // Use original index for reverse stacking effect
    // Last button animates first (index 0), first button animates last
    setTimeout(() => {
      btn.classList.add(animationClass);
    }, index * 60); // 60ms stagger for exit
  });
}

// Enhanced delegated handler for dynamically loaded nav buttons
document.addEventListener("click", function (e) {
  const button = e.target.closest(".nav-bar");
  if (!button) return;

  const page = button.getAttribute("data-page");
  if (page) {
    loadContent(page).then(() => {
      // updateNavActiveState handles the active state
    });

    // Sidebar close logic with animation
    const sidebar = document.querySelector(".side-bar-container");
    const header = document.querySelector(".header-container");
    const overlay = document.getElementById("sidebarOverlay");
    const navButton = document.querySelector(".nav-button");
    const navRects = document.querySelectorAll(".nav-button svg rect");
    const icon = document.getElementById("icon");

    if (sidebar.classList.contains("show")) {
      // Animate buttons out before closing
      animateNavButtonsOut(true);

      // FIXED: Transform X back to hamburger immediately
      icon.classList.remove("active");

      // Delay sidebar close to let animation complete
      setTimeout(() => {
        sidebar.classList.remove("show");
        overlay.classList.remove("show");
        document.body.classList.remove("no-scroll");
        navButton.style.zIndex = "1001";

        // Remove inline fills to revert color to CSS vars
        navRects.forEach((rect) => (rect.style.fill = ""));

        // Restore home SVG fill
        const homeSvg = document.querySelector(".logo-container svg");
        if (homeSvg) {
          homeSvg.style.fill = "";
        }

        // Restore theme toggle icon filter
        const themeIconImg = document.getElementById("themeIcon");
        if (themeIconImg) {
          themeIconImg.style.filter = "";
        }

        // Restore button colors
        const rightSectionButtons = document.querySelectorAll(
          ".right-section button"
        );
        rightSectionButtons.forEach((btn) => (btn.style.color = ""));

        setTimeout(() => header.classList.remove("no-shadow"), 300);
      }, 300); // Increased delay to let exit animation complete
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// Single DOMContentLoaded handler for animation events
document.addEventListener("DOMContentLoaded", () => {
  // Logo click handler
  const logo = document.querySelector(".hover-logo");
  if (logo) {
    logo.onclick = function () {
      goHome();
    };
  }

  // Load stored page
  const storedPage = sessionStorage.getItem("currentPage") || "bau";
  loadContent(storedPage).then(() => {
    updateNavActiveState(storedPage);
    // Ensure sidebar button is visible if we're on dashboard
    if (storedPage === "dashboard") {
      console.log("[SCRIPT] Dashboard detected on page load, ensuring sidebar");
      setTimeout(() => {
        console.log("[SCRIPT] Timeout triggered for dashboard sidebar");
        if (typeof window.ensureHistorySidebar === "function") {
          window.ensureHistorySidebar();
        } else {
          console.log(
            "[SCRIPT] ensureHistorySidebar function not available on page load"
          );
        }
      }, 500);
    }
  });

  // Animation end event handlers
  document.addEventListener("animationend", (e) => {
    if (!e.target.classList.contains("nav-bar")) return;

    const btn = e.target;

    // Handle exit animations - buttons should return to hidden state
    if (
      e.animationName === "slideOutToTop" ||
      e.animationName === "fadeSlideOut"
    ) {
      btn.classList.remove("animate-out", "animate-out-fade");
      // Buttons return to default hidden state via CSS
    }

    // Handle entrance animations - buttons should remain visible
    if (
      e.animationName === "slideInFromTop" ||
      e.animationName === "bounceInFromBottom"
    ) {
      btn.classList.remove("animate-in", "animate-in-bounce");
      // Override default hidden state to keep buttons visible
      btn.style.opacity = "1";
      btn.style.transform = "translateY(0) scale(1)";
      btn.style.pointerEvents = "auto";
    }
  });
});

// ---- Header Title Sync with Loaded Page ----
function setHeaderTitleByPage(page) {
  try {
    const el = document.getElementById("page-title");
    if (!el) return;

    const map = {
      bau: "Socrates Beta",
      dashboard: "Dashboard",
    };

    const title = map[page] || "Socrates Beta";
    if (title === "Socrates Beta") {
      el.innerHTML =
        'Socrates<sup style="font-size: 12px; margin-left: 5px">Beta</sup>';
    } else {
      el.textContent = title;
    }
  } catch (e) {
    // no-op
  }
}
// expose globally for index module to call
window.setHeaderTitleByPage = setHeaderTitleByPage;

// ---- Execute inline <script> tags from dynamically injected HTML ----
// When we fetch and inject HTML (e.g., BAU), any inline scripts do not auto-execute.
// This helper finds <script> tags inside a container and re-inserts them so they run.
function executeInlineScripts(container) {
  try {
    if (!container) return;
    const scripts = Array.from(container.querySelectorAll("script"));
    if (!scripts.length) return;
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      // Copy attributes (type, module, etc.)
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.src) {
        // External script: recreate to execute
        newScript.src = oldScript.src;
      } else {
        // Inline script: transfer its code
        newScript.textContent = oldScript.textContent || "";
      }
      // Replace in DOM to trigger execution
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  } catch (e) {
    console.warn("[SCRIPT] executeInlineScripts error:", e);
  }
}

// ---- Global App Version Sync ----
function updateAppVersionUI(version) {
  const ver =
    (version && String(version)) ||
    (window.AppVersion && String(window.AppVersion)) ||
    "v1.19.5 GS";
  document.querySelectorAll('[data-role="app-version"]').forEach((el) => {
    el.textContent = ver;
  });
}

// Listen for version changes dispatched from pages like home.js
window.addEventListener("app-version-changed", (e) => {
  const ver =
    e && e.detail && e.detail.version ? e.detail.version : window.AppVersion;
  updateAppVersionUI(ver);
});

// Initial sync on load in case elements are present before event fires
document.addEventListener("DOMContentLoaded", () => {
  if (window.AppVersion) {
    updateAppVersionUI(window.AppVersion);
  }
});

// Live Firestore listener so ALL users see updates
(function initAppVersionRealtime() {
  let attempts = 0;
  const maxAttempts = 50; // ~10s if interval=200ms

  function tryInit() {
    attempts++;
    const hasFirestore = !!(
      window.db &&
      window.doc &&
      window.onSnapshot &&
      window.getDoc &&
      window.setDoc
    );
    if (!hasFirestore) {
      if (attempts < maxAttempts) return setTimeout(tryInit, 200);
      console.warn(
        "[VersionSync] Firebase not ready; skipping realtime listener"
      );
      return;
    }

    try {
      const targetRef = window.doc(window.db, "adminData", "appMeta");

      // Initial fetch to populate on first load
      window
        .getDoc(targetRef)
        .then((snap) => {
          const data = snap.exists() ? snap.data() : {};
          const ver =
            data && data.version
              ? String(data.version)
              : window.AppVersion || "v1.19.5 GS";
          if (ver) {
            window.AppVersion = ver;
            updateAppVersionUI(ver);
            window.dispatchEvent(
              new CustomEvent("app-version-changed", {
                detail: { version: ver },
              })
            );
          }
        })
        .catch((err) =>
          console.warn("[VersionSync] Initial getDoc failed:", err)
        );

      // Subscribe for live changes
      window.onSnapshot(
        targetRef,
        (snap) => {
          const data = snap.exists() ? snap.data() : {};
          if (!data) return;
          const ver = data.version ? String(data.version) : null;
          if (ver && ver !== window.AppVersion) {
            window.AppVersion = ver;
            updateAppVersionUI(ver);
            window.dispatchEvent(
              new CustomEvent("app-version-changed", {
                detail: { version: ver },
              })
            );
          }
        },
        (error) => {
          console.warn("[VersionSync] onSnapshot error:", error);
        }
      );

      console.log(
        "[VersionSync] Realtime listener attached to adminData/appMeta"
      );
    } catch (e) {
      console.warn("[VersionSync] Failed to init listener:", e);
    }
  }

  // Defer setup slightly to allow index.html module to expose Firebase globals
  setTimeout(tryInit, 300);
})();

// Rest of your functions remain the same...
function goHome() {
  // Check if we're on the BAU page and refresh it
  if (
    window.location.pathname.includes("bau") ||
    document.getElementById("history-form-container")
  ) {
    // Refresh the page to ensure clean state
    window.location.href = window.location.href;
    return;
  }

  // Original home navigation logic for other pages
  // Clear form and show success message when header SVG is clicked
  const form = document.getElementById("history-form-container");
  if (form) {
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      // Skip student name and student number fields to preserve them
      if (input.id === "student-name" || input.id === "student-number") {
        return;
      }

      if (input.type === "checkbox" || input.type === "radio") {
        input.checked = false;
      } else if (input.tagName === "SELECT") {
        input.selectedIndex = 0;
      } else {
        input.value = "";
      }
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // Show success message in the load-history-message div with smooth animation
    const loadHistoryMessage = document.getElementById("load-history-message");
    if (loadHistoryMessage) {
      loadHistoryMessage.textContent = "New form is loaded successfully.";
      // Show with smooth animation
      loadHistoryMessage.style.display = "block";
      loadHistoryMessage.style.marginBottom = "10px";
      // Small delay to ensure display change is processed
      setTimeout(() => {
        loadHistoryMessage.style.opacity = "1";
        loadHistoryMessage.style.transform = "translateY(0) scale(1)";
      }, 10);
      // Hide the message after 3 seconds with smooth animation
      setTimeout(() => {
        loadHistoryMessage.style.opacity = "0";
        loadHistoryMessage.style.transform = "translateY(-20px) scale(0.95)";
        loadHistoryMessage.style.marginBottom = "0";
        // Hide display after animation completes
        setTimeout(() => {
          loadHistoryMessage.style.display = "none";
        }, 500);
      }, 3000);
    }
    return; // Don't navigate away, just clear the form
  }

  try {
    // Ensure BAU is the remembered page
    sessionStorage.setItem("currentPage", "bau");
  } catch (e) {
    // ignore storage errors
  }

  // Prefer SPA navigation if available
  if (typeof loadContent === "function") {
    loadContent("bau")
      .then(() => {
        if (typeof updateNavActiveState === "function") {
          updateNavActiveState("bau");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch(() => {
        // Fallback: hard reload to index (which defaults to BAU)
        window.location.href = "index.html";
      });
  } else {
    // Fallback: hard reload to index (which defaults to BAU)
    window.location.href = "index.html";
  }
}

function loadContent(page) {
  console.log(`loadContent called with page: ${page}`);

  const mainContent = document.querySelector(".main");
  if (!mainContent) {
    return Promise.reject("Main container not found");
  }

  let filePath = "";
  let scriptPath = "";

  switch (page) {
    case "bau":
      filePath = "cont/00.bau/bau.html";
      scriptPath = "cont/00.bau/bau.js";
      break;
    case "dashboard":
      filePath = "cont/00.dashboard/dashboard.html";
      scriptPath = "cont/00.dashboard/dashboard.js";
      break;
    default:
      console.error(`Unknown page requested: ${page}`);
      return Promise.reject("Unknown page");
  }

  console.log(`Fetching file: ${filePath}`);

  return fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load " + filePath);
      }
      return response.text();
    })
    .then((html) => {
      mainContent.innerHTML = html;
      // Ensure any inline scripts in the injected HTML execute (e.g., BAU symptom linking definitions)
      executeInlineScripts(mainContent);
      sessionStorage.setItem("currentPage", page);
      updateNavActiveState(page);
      // Update header title to reflect loaded page
      if (typeof window.setHeaderTitleByPage === "function") {
        window.setHeaderTitleByPage(page);
      }

      if (page === "bau") {
        const navBtn = document.getElementById("nav-bar3");
        if (navBtn) navBtn.classList.add("active");
      }

      const oldScript = document.querySelector(
        `script[data-page-script="true"]`
      );
      if (oldScript) oldScript.remove();

      if (scriptPath) {
        return new Promise((resolve, reject) => {
          const scriptElement = document.createElement("script");
          scriptElement.src = scriptPath;
          scriptElement.dataset.pageScript = "true";
          scriptElement.onload = () => {
            console.log(`✅ ${scriptPath} loaded`);

            const capitalized = page.charAt(0).toUpperCase() + page.slice(1);
            const initFnName = `init${capitalized}`;
            if (typeof window[initFnName] === "function") {
              console.log(`🚀 Calling ${initFnName}()`);
              try {
                window[initFnName]();
              } catch (err) {
                console.error(`⚠️ Error calling ${initFnName}():`, err);
              }
            } else {
              console.warn(`🧩 No initializer function found: ${initFnName}()`);
            }

            // BAU-specific: symptom linking lives in inline scripts inside bau.html.
            // After injection and script load, explicitly initialize if available.
            if (page === "bau") {
              setTimeout(() => {
                if (typeof window.initSymptomLinking === "function") {
                  try {
                    console.log("[SCRIPT] Initializing symptom linking via initSymptomLinking()...");
                    window.initSymptomLinking();
                  } catch (e) {
                    console.warn("[SCRIPT] initSymptomLinking error:", e);
                  }
                } else {
                  console.log("[SCRIPT] initSymptomLinking() not found after BAU load");
                }
              }, 150);
            }

            // If dashboard page, ensure BAU sidebar exists
            if (page === "dashboard") {
              console.log(
                "[SCRIPT] Dashboard page loaded, ensuring BAU sidebar"
              );
              // Force load BAU script and ensure sidebar
              const bauScript = document.querySelector(
                'script[src="cont/00.bau/bau.js"]'
              );
              if (!bauScript) {
                console.log("[SCRIPT] BAU script not found, loading it");
                const s = document.createElement("script");
                s.src = "cont/00.bau/bau.js";
                s.dataset.pageScript = "true";
                s.onload = () => {
                  console.log("[SCRIPT] BAU script loaded successfully");
                  setTimeout(() => {
                    if (typeof window.renderHistorySidebar === "function") {
                      console.log(
                        "[SCRIPT] Calling renderHistorySidebar after BAU script load"
                      );
                      window.renderHistorySidebar();
                    } else {
                      console.log(
                        "[SCRIPT] renderHistorySidebar still not available after BAU load"
                      );
                    }
                    resolve();
                  }, 100);
                };
                s.onerror = () => {
                  console.error("[SCRIPT] Failed to load BAU script");
                  resolve();
                };
                document.body.appendChild(s);
              } else {
                console.log(
                  "[SCRIPT] BAU script already exists, calling renderHistorySidebar"
                );
                setTimeout(() => {
                  if (typeof window.renderHistorySidebar === "function") {
                    console.log(
                      "[SCRIPT] Calling renderHistorySidebar with existing BAU script"
                    );
                    window.renderHistorySidebar();
                  } else {
                    console.log(
                      "[SCRIPT] renderHistorySidebar not available with existing script"
                    );
                  }
                  resolve();
                }, 100);
              }
              return;
            }
            resolve();
          };
          scriptElement.onerror = () => {
            console.error(`❌ Failed to load script: ${scriptPath}`);
            reject(new Error(`Failed to load script: ${scriptPath}`));
          };
          document.body.appendChild(scriptElement);
        });
      } else {
        return Promise.resolve();
      }
    });
}

function loadScript(scriptPath, callback) {
  const existingScript = document.querySelector(`script[src="${scriptPath}"]`);
  if (existingScript) {
    console.log(`⚠️ Script already loaded: ${scriptPath}`);
    if (typeof callback === "function") callback();
    return;
  }

  const scriptElement = document.createElement("script");
  scriptElement.src = scriptPath;
  scriptElement.onload = function () {
    console.log(`✅ ${scriptPath} loaded successfully.`);
    if (typeof callback === "function") callback();
  };
  scriptElement.onerror = function () {
    console.error(`❌ Failed to load script: ${scriptPath}`);
  };
  document.body.appendChild(scriptElement);
}

function resetCounters() {
  const counters = document.querySelectorAll(".info-container div.counter");
  if (counters.length === 0) {
    console.warn("No counters found to reset.");
    return;
  }
  counters.forEach((counter) => {
    counter.innerText = "0";
  });
}

function startCounting() {
  const counters = document.querySelectorAll(".info-container .counter");

  counters.forEach((counter) => {
    let count = 0;
    const target = parseInt(counter.getAttribute("data-target")) || 100;

    const interval = setInterval(() => {
      if (count < target) {
        count++;
        counter.innerText = count;
      } else {
        clearInterval(interval);
      }
    }, 50);
  });
}

function loadContactUs() {
  loadContent("contact");
}

const backToTopBtn = document.querySelector(".back-to-top");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.remove("fade-out");
    backToTopBtn.classList.add("show");
  } else {
    if (backToTopBtn.classList.contains("show")) {
      backToTopBtn.classList.add("fade-out");
      backToTopBtn.addEventListener("transitionend", function handler() {
        backToTopBtn.classList.remove("show", "fade-out");
        backToTopBtn.removeEventListener("transitionend", handler);
      });
    }
  }
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function updateNavActiveState(page) {
  document.querySelectorAll(".nav-bar, .nav-bar5, .nav-bar6").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.querySelectorAll(`[data-page="${page}"]`).forEach((btn) => {
    btn.classList.add("active");
  });

  if (page === "bau") {
    const navBar3 = document.getElementById("nav-bar3");
    if (navBar3) navBar3.classList.add("active");
  }

  if (page === "library") {
    const navBar2 = document.getElementById("nav-bar2");
    if (navBar2) navBar2.classList.add("active");
  }

  if (page === "dashboard") {
    const navBarDashboard = document.getElementById("nav-bar-dashboard");
    if (navBarDashboard) navBarDashboard.classList.add("active");
  }
}

// Extract sidebar closing logic into a reusable function
function closeSidebar() {
  if (isAnimating) return; // Prevent rapid clicking

  const sidebar = document.querySelector(".side-bar-container");
  const overlay = document.getElementById("sidebarOverlay");
  const header = document.querySelector(".header-container");
  const navButton = document.querySelector(".nav-button");
  const navRects = document.querySelectorAll(".nav-button svg rect");
  const icon = document.getElementById("icon");

  isAnimating = true;
  animateNavButtonsOut();

  // FIXED: Transform X back to hamburger immediately for smooth animation
  icon.classList.remove("active");

  sidebar.classList.add("hiding");
  sidebar.classList.remove("show");

  overlay.classList.add("hiding");
  overlay.classList.remove("show");

  document.body.classList.remove("no-scroll");
  // Restore scroll position and clear fixed positioning
  const lockedY = parseInt(document.body.dataset.scrollLockY || "0", 10) || 0;
  document.body.style.top = "";
  delete document.body.dataset.scrollLockY;
  window.scrollTo(0, lockedY);
  navButton.style.zIndex = "1001";

  // Restore original colors
  navRects.forEach((rect) => (rect.style.fill = ""));

  // Restore SVG fill
  const iconSvg = document.getElementById("icon");
  if (iconSvg) {
    iconSvg.style.fill = "";
  }

  // Restore home SVG fill
  const homeSvg = document.querySelector(".logo-container svg");
  if (homeSvg) {
    homeSvg.style.fill = "";
  }

  // Restore theme toggle icon filter
  const themeIconImg = document.getElementById("themeIcon");
  if (themeIconImg) {
    themeIconImg.style.filter = "";
  }

  const rightSectionButtons = document.querySelectorAll(
    ".right-section button"
  );
  rightSectionButtons.forEach((btn) => (btn.style.color = ""));

  setTimeout(() => {
    sidebar.classList.remove("hiding");
    sidebar.style.visibility = "hidden";
    overlay.classList.remove("hiding");
    overlay.style.visibility = "hidden";
    header.classList.remove("no-shadow");
    isAnimating = false; // Allow next click after everything is done
  }, 600);

  // Remove the document click handler
  document.removeEventListener("click", handleDocumentClick);
  overlayHandlerAdded = false;
}

// Function to load dashboard from sidebar (same as dropdown logic)
function loadDashboardFromSidebar() {
  const mainContainer = document.querySelector(".main");
  if (!mainContainer) {
    console.error("Main container not found");
    return Promise.reject("Main container not found");
  }

  return fetch("cont/00.dashboard/dashboard.html")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load dashboard.html");
      return response.text();
    })
    .then((html) => {
      mainContainer.innerHTML = html;
      sessionStorage.setItem("currentPage", "dashboard");
      if (typeof window.setHeaderTitleByPage === "function") {
        window.setHeaderTitleByPage("dashboard");
      }

      // Call dashboard initialization functions if they exist
      if (typeof window.initDashboard === "function") {
        window.initDashboard();
      }

      if (typeof window.animateDashboardActiveSection === "function") {
        window.animateDashboardActiveSection();
      }
      // Ensure BAU sidebar is present on dashboard
      return ensureHistorySidebar().catch(() => {});
    });
}

// Ensure BAU history sidebar exists: load BAU script if needed and render sidebar
function ensureHistorySidebar() {
  console.log("[SCRIPT] ensureHistorySidebar called");
  return new Promise((resolve) => {
    // Always try to render the sidebar to ensure button visibility
    const tryRender = () => {
      console.log(
        "[SCRIPT] Trying to render sidebar, function exists:",
        typeof window.renderHistorySidebar
      );
      try {
        if (typeof window.renderHistorySidebar === "function") {
          console.log("[SCRIPT] Calling renderHistorySidebar");
          window.renderHistorySidebar();
        } else {
          console.log("[SCRIPT] renderHistorySidebar function not available");
        }
      } catch (e) {
        console.error("[SCRIPT] Error calling renderHistorySidebar:", e);
      }
    };

    // If button exists but might be hidden, always call render
    const toggleBtn = document.getElementById("bau-history-external-toggle");
    console.log("[SCRIPT] Toggle button found:", !!toggleBtn);
    if (toggleBtn) {
      tryRender();
      return resolve();
    }

    const hasBauScript = !!document.querySelector(
      'script[src="cont/00.bau/bau.js"]'
    );
    const afterReady = () => {
      try {
        if (typeof window.renderHistorySidebar === "function") {
          window.renderHistorySidebar();
        }
      } catch (_) {}
      resolve();
    };

    if (hasBauScript) {
      afterReady();
    } else {
      const s = document.createElement("script");
      s.src = "cont/00.bau/bau.js";
      s.dataset.pageScript = "true";
      s.onload = afterReady;
      s.onerror = () => resolve();
      document.body.appendChild(s);
    }
  });
}

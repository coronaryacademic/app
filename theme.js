// Available themes
const AVAILABLE_THEMES = {
  light: { name: 'Light', icon: '🌞' },
  dark: { name: 'Dark', icon: '🌙' },
  winter: { name: 'Winter', icon: '❄️' },
  medical: { name: 'Medical', icon: '🏥' },
  icu: { name: 'ICU', icon: '🩺' },
  emergency: { name: 'Emergency', icon: '🚨' }
};

// Apply saved theme and update everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const savedThemeRaw = localStorage.getItem("theme");
  const savedTheme = (savedThemeRaw ? savedThemeRaw.toLowerCase() : null) || "light";
  applyTheme(savedTheme);
  preloadLogos();
});

// Toggle theme when the icon is clicked (cycles through themes)
function toggleTheme() {
  const currentThemeRaw = document.documentElement.getAttribute("data-theme") || localStorage.getItem("theme") || "light";
  const currentTheme = String(currentThemeRaw).toLowerCase();
  const themeKeys = Object.keys(AVAILABLE_THEMES);
  const currentIndex = themeKeys.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themeKeys.length;
  const newTheme = themeKeys[nextIndex];
  applyTheme(newTheme);
}

// Set specific theme
function setTheme(themeName) {
  if (AVAILABLE_THEMES[themeName]) {
    applyTheme(themeName);
  }
}

// Apply theme globally
function applyTheme(theme) {
  const normalized = String(theme).toLowerCase();
  const validTheme = AVAILABLE_THEMES[normalized] ? normalized : 'light';
  document.documentElement.setAttribute("data-theme", validTheme);
  localStorage.setItem("theme", validTheme);
  updateThemeIcon(validTheme);
  updateAllLogos(validTheme);
  updateDiagnosisIcon(validTheme);
  updateThemeSelector(validTheme);
  try {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: validTheme } }));
  } catch (e) {
    // ignore
  }
}

// Update the theme toggle icon with smooth fade transition
function updateThemeIcon(theme) {
  const themeIcon = document.getElementById("themeIcon");
  if (!themeIcon) return;

  themeIcon.style.transition = "transform 0.15s ease";
  themeIcon.style.transform = "scale(0.8)";

  setTimeout(() => {
    // Use different icons based on theme
    if (theme === "dark") {
      themeIcon.src = "icons/LMI.svg";
    } else {
      themeIcon.src = "icons/DMI.svg";
    }
    themeIcon.style.transform = "scale(1)";
  }, 150);
}

// Update all logos based on theme
function updateAllLogos(theme) {
  const mainLogo = document.getElementById("main-logo");
  const hoverLogo = document.getElementById("hover-logo");
  const aboutLogo = document.querySelector(".logo-aboutus");

  // Use dark logos for dark themes, light logos for light themes
  const isDarkTheme = theme === "dark";

  if (mainLogo) {
    mainLogo.src = isDarkTheme ? "icons/dark-logo.webp" : "icons/header-logo-2.webp";
  }

  if (hoverLogo) {
    hoverLogo.src = isDarkTheme ? "icons/dark-logo-line.webp" : "icons/header-logo.webp";
  }

  if (aboutLogo) {
    aboutLogo.src = isDarkTheme ? "icons/logo-dark.webp" : "icons/logo.webp";
  }
}

// Update diagnosis icon based on theme
function updateDiagnosisIcon(theme) {
  const diagnosisIcon = document.getElementById("diagnosis-icon");
  if (diagnosisIcon) {
    const isDarkTheme = theme === "dark";
    diagnosisIcon.src = isDarkTheme ? "icons/diagnosis_white.png" : "icons/diagnosis.png";
  }
}

// Preload all theme-sensitive assets
function preloadLogos() {
  const logos = [
    "icons/dark-logo.webp",
    "icons/dark-logo-line.webp",
    "icons/header-logo-2.webp",
    "icons/header-logo.webp",
    "icons/logo-dark.webp",
    "icons/logo.webp",
    "icons/diagnosis.png",
    "icons/diagnosis_white.png",
    "icons/LMI.svg",
    "icons/DMI.svg",
  ];
  logos.forEach((src) => (new Image().src = src));
}

// Watch for diagnosis icon dynamically inserted into DOM
const observer = new MutationObserver((mutationsList) => {
  const theme = localStorage.getItem("theme") || "light";
  mutationsList.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const diagIcon = node.querySelector("#diagnosis-icon");
        if (diagIcon) {
          updateDiagnosisIcon(theme);
        }
      }
    });
  });
});

const mainContent = document.querySelector(".main");
if (mainContent) {
  observer.observe(mainContent, { childList: true, subtree: true });
}

// Create theme selector for settings page
function createThemeSettingsUI() {
  const themeSection = document.createElement('div');
  themeSection.className = 'settings-section';
  themeSection.innerHTML = `
    <h3 style="color: var(--text-color); margin-bottom: 20px; font-size: 18px;">Theme Selection</h3>
    <div id="theme-options-grid" style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    "></div>
  `;

  const grid = themeSection.querySelector('#theme-options-grid');
  
  Object.entries(AVAILABLE_THEMES).forEach(([key, theme]) => {
    const themeCard = document.createElement('div');
    themeCard.className = 'theme-card';
    themeCard.style.cssText = `
      padding: 15px;
      border: 2px solid var(--borderbottom);
      border-radius: 10px;
      background: var(--header-bg);
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    `;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (key === currentTheme) {
      themeCard.style.borderColor = 'var(--link-hover-color)';
      themeCard.style.backgroundColor = 'var(--selc-la)';
    }
    
    themeCard.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">${theme.icon}</div>
      <div style="color: var(--text-color); font-weight: 500;">${theme.name}</div>
    `;
    
    themeCard.addEventListener('click', () => {
      setTheme(key);
      // Update all cards
      grid.querySelectorAll('.theme-card').forEach(card => {
        card.style.borderColor = 'var(--borderbottom)';
        card.style.backgroundColor = 'var(--header-bg)';
      });
      // Highlight selected card
      themeCard.style.borderColor = 'var(--link-hover-color)';
      themeCard.style.backgroundColor = 'var(--selc-la)';
    });
    
    themeCard.addEventListener('mouseenter', () => {
      if (key !== (localStorage.getItem('theme') || 'light')) {
        themeCard.style.backgroundColor = 'var(--nav-hover)';
      }
    });
    
    themeCard.addEventListener('mouseleave', () => {
      if (key !== (localStorage.getItem('theme') || 'light')) {
        themeCard.style.backgroundColor = 'var(--header-bg)';
      }
    });
    
    grid.appendChild(themeCard);
  });

  return themeSection;
}

// Update theme selector active state
function updateThemeSelector(currentTheme) {
  // Update settings page theme cards if they exist
  const themeCards = document.querySelectorAll('.theme-card');
  themeCards.forEach((card, index) => {
    const themeKey = Object.keys(AVAILABLE_THEMES)[index];
    if (themeKey === currentTheme) {
      card.style.borderColor = 'var(--link-hover-color)';
      card.style.backgroundColor = 'var(--selc-la)';
    } else {
      card.style.borderColor = 'var(--borderbottom)';
      card.style.backgroundColor = 'var(--header-bg)';
    }
  });
}

// Ensure diagnosis icon is updated on full page load
window.addEventListener("load", () => {
  const theme = localStorage.getItem("theme") || "light";
  updateDiagnosisIcon(theme);
});

// Make functions globally available
window.setTheme = setTheme;
window.AVAILABLE_THEMES = AVAILABLE_THEMES;
window.createThemeSettingsUI = createThemeSettingsUI;

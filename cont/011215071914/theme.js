// Load the theme and logo from localStorage on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // Set logos based on saved theme
  setInitialLogo(savedTheme);

  // Setup theme toggle button after DOM is loaded
  setupThemeToggle();
});

// Function to set the logo based on the theme
function setInitialLogo(theme) {
  const logoElement = document.getElementById("main-logo");
  const hoverLogoElement = document.getElementById("hover-logo");

  // Get the correct path to icons based on current page location
  const iconsPath = getIconsPath();

  const darkLogo1 = `${iconsPath}dark-logo.webp`;
  const darkLogo2 = `${iconsPath}dark-logo-line.webp`;
  const lightLogo1 = `${iconsPath}header-logo-2.webp`;
  const lightLogo2 = `${iconsPath}header-logo.webp`;

  if (logoElement && hoverLogoElement) {
    if (theme === "dark") {
      logoElement.src = darkLogo1;
      hoverLogoElement.src = darkLogo2;
    } else {
      logoElement.src = lightLogo1;
      hoverLogoElement.src = lightLogo2;
    }
  } else {
    console.warn("[THEME] Logo elements not found on this page");
  }
}

// Function to toggle between light and dark themes
function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  // Apply the new theme
  document.documentElement.setAttribute("data-theme", newTheme);

  // Save the new theme to localStorage
  localStorage.setItem("theme", newTheme);

  // Update logos immediately on toggle
  switchLogo(newTheme);

  // Update theme icon if it exists
  updateThemeIcon(newTheme);
}

// Function to switch logos based on the theme
function switchLogo(theme) {
  const logoElement = document.getElementById("main-logo");
  const hoverLogoElement = document.getElementById("hover-logo");

  // Get the correct path to icons based on current page location
  const iconsPath = getIconsPath();

  const darkLogo1 = `${iconsPath}dark-logo.webp`;
  const darkLogo2 = `${iconsPath}dark-logo-line.webp`;
  const lightLogo1 = `${iconsPath}header-logo-2.webp`;
  const lightLogo2 = `${iconsPath}header-logo.webp`;

  if (logoElement && hoverLogoElement) {
    if (theme === "dark") {
      logoElement.src = darkLogo1;
      hoverLogoElement.src = darkLogo2;
    } else {
      logoElement.src = lightLogo1;
      hoverLogoElement.src = lightLogo2;
    }
  }
}

// Function to update theme icon
function updateThemeIcon(theme) {
  const themeIcon = document.getElementById("themeIcon");
  if (themeIcon) {
    const iconsPath = getIconsPath();
    if (theme === "dark") {
      themeIcon.src = `${iconsPath}LMI.svg`; // Light mode icon (to switch to light)
    } else {
      themeIcon.src = `${iconsPath}DMI.svg`; // Dark mode icon (to switch to dark)
    }
  }
}

// Function to get the correct path to icons based on current page location
function getIconsPath() {
  const currentPath = window.location.pathname;

  // If we're in a subdirectory (like login pages), go back to root
  if (currentPath.includes("/cont/")) {
    return "../../icons/";
  }
  // If we're at root level
  else {
    return "icons/";
  }
}

// Function to setup theme toggle button
function setupThemeToggle() {
  // Try different possible selectors for the theme toggle button
  const themeToggleBtn =
    document.getElementById("themeToggleBtn") ||
    document.getElementById("theme-toggle") ||
    document.querySelector(".theme-toggle") ||
    document.querySelector('[onclick="toggleTheme()"]');

  if (themeToggleBtn) {
    // Remove any existing onclick to avoid duplicates
    themeToggleBtn.removeAttribute("onclick");

    // Add click event listener
    themeToggleBtn.addEventListener("click", toggleTheme);
    console.log("[THEME] Theme toggle button setup successfully");

    // Set initial theme icon
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    updateThemeIcon(currentTheme);
  } else {
    console.warn("[THEME] Theme toggle button not found on this page");
  }
}

// Make toggleTheme available globally for inline onclick handlers
window.toggleTheme = toggleTheme;

// Preload logos for better performance
function preloadLogos() {
  const iconsPath = getIconsPath();

  const logosToPreload = [
    `${iconsPath}dark-logo.webp`,
    `${iconsPath}dark-logo-line.webp`,
    `${iconsPath}header-logo-2.webp`,
    `${iconsPath}header-logo.webp`,
  ];

  logosToPreload.forEach((logoSrc) => {
    const img = new Image();
    img.src = logoSrc;
    img.onerror = () => {
      console.warn(`[THEME] Failed to preload logo: ${logoSrc}`);
    };
  });

  console.log("[THEME] Logo preloading initiated");
}

// Preload logos on initial load
preloadLogos();

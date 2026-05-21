const themeToggleButton = document.getElementById("themeToggle");
const burgerMenuButton = document.getElementById("burgerMenu");
const mainNav = document.getElementById("mainNav");
const siteHeader = document.querySelector(".site-header");

// =====================
// THEME TOGGLE
// =====================
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  themeToggleButton.textContent = "Light Mode";
}

themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");

  if (isDark) {
    localStorage.setItem("theme", "dark");
    themeToggleButton.textContent = "Light Mode";
  } else {
    localStorage.setItem("theme", "light");
    themeToggleButton.textContent = "Dark Mode";
  }
});

// =====================
// BURGER MENU
// =====================
burgerMenuButton.addEventListener("click", () => {
  burgerMenuButton.classList.toggle("active");
  mainNav.classList.toggle("active");

  if (siteHeader) {
    const menuIsOpen = mainNav.classList.contains("active");
    siteHeader.classList.toggle("mobile-menu-open", menuIsOpen);
    if (menuIsOpen) {
      siteHeader.classList.remove("mobile-header-hidden");
    }
  }
});

// =====================
// CLOSE MENU WHEN LINK CLICKED (MOBILE UX FIX)
// =====================
const navLinks = mainNav.querySelectorAll("a");

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    burgerMenuButton.classList.remove("active");
    mainNav.classList.remove("active");
    if (siteHeader) {
      siteHeader.classList.remove("mobile-menu-open");
    }
  });
});
// =====================
// MOBILE HEADER HIDE / REVEAL ON SCROLL
// =====================
let lastScrollY = window.scrollY;
let ticking = false;

function shouldUseMobileHeaderScroll() {
  return window.matchMedia("(max-width: 600px)").matches;
}

function updateMobileHeader() {
  if (!siteHeader) return;

  const currentScrollY = window.scrollY;
  const menuIsOpen = mainNav && mainNav.classList.contains("active");

  if (!shouldUseMobileHeaderScroll()) {
    siteHeader.classList.remove("mobile-header-hidden", "mobile-menu-open");
    lastScrollY = currentScrollY;
    ticking = false;
    return;
  }

  if (menuIsOpen) {
    siteHeader.classList.remove("mobile-header-hidden");
    siteHeader.classList.add("mobile-menu-open");
    lastScrollY = currentScrollY;
    ticking = false;
    return;
  }

  siteHeader.classList.remove("mobile-menu-open");

  // Keep the header visible near the top so the page still feels natural.
  if (currentScrollY < 40) {
    siteHeader.classList.remove("mobile-header-hidden");
  } else if (currentScrollY > lastScrollY + 8) {
    // Scrolling down: hide it.
    siteHeader.classList.add("mobile-header-hidden");
  } else if (currentScrollY < lastScrollY - 8) {
    // Scrolling up: bring it back.
    siteHeader.classList.remove("mobile-header-hidden");
  }

  lastScrollY = currentScrollY;
  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(updateMobileHeader);
    ticking = true;
  }
}, { passive: true });

window.addEventListener("resize", updateMobileHeader);

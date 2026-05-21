const themeToggleButton = document.getElementById("themeToggle");
const burgerMenuButton = document.getElementById("burgerMenu");
const mainNav = document.getElementById("mainNav");

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
});

// =====================
// CLOSE MENU WHEN LINK CLICKED (MOBILE UX FIX)
// =====================
const navLinks = mainNav.querySelectorAll("a");

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    burgerMenuButton.classList.remove("active");
    mainNav.classList.remove("active");
  });
});
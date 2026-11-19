(() => {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const key = "sharon-portfolio-theme";
  let button;

  function restoreChoice() {
    try {
      const saved = localStorage.getItem(key);
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // Browser storage can be disabled.
    }
    return null;
  }

  let choice = restoreChoice();

  function applyTheme() {
    const theme = choice ?? "light";
    root.dataset.theme = theme;
    themeColor.content = theme === "dark" ? "#14151e" : "#f7f7f4";
    if (button) {
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    }
  }

  applyTheme();
  window.addEventListener("storage", event => {
    if (event.key !== key && event.key !== null) return;
    choice = restoreChoice();
    applyTheme();
  });

  document.addEventListener("DOMContentLoaded", () => {
    button = document.querySelector(".theme-button");
    button.addEventListener("click", () => {
      choice = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme();
      try {
        localStorage.setItem(key, choice);
      } catch {
        // The toggle still works for the current visit.
      }
    });
    applyTheme();
    button.hidden = false;
  });
})();

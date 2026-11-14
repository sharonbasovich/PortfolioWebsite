(() => {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const system = matchMedia("(prefers-color-scheme: dark)");
  const key = "sharon-portfolio-theme";
  let choice = "system";

  function restoreChoice() {
    try {
      const saved = localStorage.getItem(key);
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // The site also works when browser storage is unavailable.
    }
    return "system";
  }

  function applyTheme() {
    const theme = choice === "system" ? (system.matches ? "dark" : "light") : choice;
    root.dataset.theme = theme;
    root.dataset.themeChoice = choice;
    themeColor.content = theme === "dark" ? "#14151e" : "#f7f7f4";
  }

  choice = restoreChoice();
  applyTheme();
  system.addEventListener("change", applyTheme);

  document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    const picker = document.querySelector(".theme-picker");
    const button = picker.querySelector("button");
    const options = picker.querySelector("fieldset");

    function syncOptions() {
      const selected = options.querySelector('[value="' + choice + '"]');
      selected.checked = true;
      button.title = "Appearance: " + selected.labels[0].textContent.trim();
      return selected;
    }

    function close(restoreFocus = false) {
      if (options.hidden) return;
      options.hidden = true;
      button.setAttribute("aria-expanded", "false");
      if (restoreFocus) button.focus({ preventScroll: true });
    }

    button.addEventListener("click", () => {
      if (!options.hidden) {
        close();
        return;
      }
      options.hidden = false;
      button.setAttribute("aria-expanded", "true");
      syncOptions().focus({ preventScroll: true });
    });

    options.addEventListener("change", event => {
      if (!event.target.matches('input[type="radio"]')) return;
      choice = event.target.value;
      try {
        if (choice === "system") localStorage.removeItem(key);
        else localStorage.setItem(key, choice);
      } catch {
        // A session-only choice still applies.
      }
      applyTheme();
      syncOptions();
    });

    picker.addEventListener("keydown", event => {
      if (event.key !== "Escape" || options.hidden) return;
      event.preventDefault();
      close(true);
    });
    picker.addEventListener("focusout", event => {
      if (!picker.contains(event.relatedTarget)) close();
    });
    document.addEventListener("pointerdown", event => {
      if (!picker.contains(event.target)) close();
    });
    new MutationObserver(() => {
      if (header.inert) close();
    }).observe(header, { attributeFilter: ["inert"] });
    window.addEventListener("storage", event => {
      if (event.key !== key && event.key !== null) return;
      choice = restoreChoice();
      applyTheme();
      syncOptions();
    });

    syncOptions();
    picker.hidden = false;
  });
})();

const DARK_COLOR = "#0d111a";
const LIGHT_COLOR = "#eef1fa";
let installation = null;

/** Each page starts light; its toggle changes only the current page session. */
export function installTheme() {
  if (installation) return installation;
  const root = document.documentElement;
  let currentTheme;
  let disposed = false;
  const nav = document.querySelector(".site-header nav");
  let button = null;
  let sun = null;
  let moon = null;
  if (nav) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("aria-label", "Dark mode");
    button.innerHTML =
      '<svg data-theme-icon="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="12" r="3.75"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>' +
      '<svg data-theme-icon="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M20.15 14.42A8.5 8.5 0 0 1 9.58 3.85a8.5 8.5 0 1 0 10.57 10.57Z"/></svg>';
    sun = button.querySelector('[data-theme-icon="sun"]');
    moon = button.querySelector('[data-theme-icon="moon"]');
    nav.insertBefore(button, nav.querySelector(".nav-contact"));
  }

  function apply(theme) {
    if (disposed) return;
    currentTheme = theme;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content", theme === "dark" ? DARK_COLOR : LIGHT_COLOR,
    );
    if (button) {
      const dark = theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
      sun.toggleAttribute("hidden", dark);
      moon.toggleAttribute("hidden", !dark);
    }
  }

  const onClick = () => {
    apply(currentTheme === "dark" ? "light" : "dark");
  };
  button?.addEventListener("click", onClick);
  apply("light");

  const handle = {
    dispose() {
      if (disposed) return;
      disposed = true;
      button?.removeEventListener("click", onClick);
      button?.remove();
      if (installation === handle) installation = null;
    },
  };
  installation = handle;
  return handle;
}

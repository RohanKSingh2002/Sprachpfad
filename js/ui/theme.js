// Light / dark switch in the header. Until you pick one, the site follows the device setting.
// The choice is applied before the page is drawn by a small script in index.html (same storage key).

const KEY = "sprachpfad-theme";
const root = document.documentElement;
const deviceDark = window.matchMedia("(prefers-color-scheme: dark)");

/** Dark when chosen, or when nothing is chosen and the device is in dark mode. */
const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : deviceDark.matches);

function show(button) {
  const dark = isDark();
  button.setAttribute("aria-checked", String(dark));
  button.title = dark ? "Switch to light mode" : "Switch to dark mode";
}

export function initThemeSwitch() {
  const button = document.getElementById("themeSwitch");
  if (!button) return;
  show(button);
  button.addEventListener("click", () => {
    const theme = isDark() ? "light" : "dark";
    root.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {
      // Storage blocked (private mode): the choice lasts until the page is closed.
    }
    show(button);
  });
  deviceDark.addEventListener("change", () => show(button));
}

// Run before styles load, including on the public information pages.
(() => {
  const key = "sprachpfad.theme";
  const normalize = value => value === "dark" || value === "auto" ? value : "light";
  const scheme = window.matchMedia?.("(prefers-color-scheme: dark)");
  let preference;
  const apply = value => {
    preference = normalize(value);
    const theme = preference === "auto" ? (scheme?.matches ? "dark" : "light") : preference;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#09090b" : "#f5f6f8");
    window.dispatchEvent(new Event("themechange"));
    return preference;
  };
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Browsing without storage is supported. */ }
  apply(saved);
  window.sprachpfadTheme = {
    current: () => preference,
    set(value) {
      const theme = apply(value);
      try { localStorage.setItem(key, theme); return true; } catch { return false; }
    },
  };
  scheme?.addEventListener?.("change", () => { if (preference === "auto") apply(preference); });
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
})();

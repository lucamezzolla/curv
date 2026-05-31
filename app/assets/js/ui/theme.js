const THEME_VALUES = new Set(["dark", "light", "system"]);

export function createThemeController(selectElement, preferences) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

  function initialize() {
    const savedTheme = preferences.get("theme", "dark");
    applyTheme(THEME_VALUES.has(savedTheme) ? savedTheme : "dark");

    selectElement.addEventListener("change", () => {
      applyTheme(selectElement.value);
    });

    mediaQuery.addEventListener("change", () => {
      if (selectElement.value === "system") {
        applyTheme("system", { persist: false });
      }
    });
  }

  function applyTheme(theme, options = {}) {
    const { persist = true } = options;
    const normalizedTheme = THEME_VALUES.has(theme) ? theme : "dark";
    const resolvedTheme = normalizedTheme === "system"
      ? getSystemTheme()
      : normalizedTheme;

    document.documentElement.dataset.theme = resolvedTheme;
    selectElement.value = normalizedTheme;

    if (persist) {
      preferences.set("theme", normalizedTheme);
    }
  }

  function getSystemTheme() {
    return mediaQuery.matches ? "light" : "dark";
  }

  return {
    initialize,
    applyTheme,
  };
}

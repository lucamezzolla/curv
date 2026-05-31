export function createPreferencesStore(storageKey = "curv.preferences") {
  function read() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    } catch {
      return {};
    }
  }

  function write(preferences) {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  }

  function get(key, fallback = null) {
    const preferences = read();
    return preferences[key] ?? fallback;
  }

  function set(key, value) {
    const preferences = read();
    preferences[key] = value;
    write(preferences);
  }

  function setMany(values) {
    const preferences = {
      ...read(),
      ...values,
    };

    write(preferences);
  }

  return {
    get,
    set,
    setMany,
  };
}

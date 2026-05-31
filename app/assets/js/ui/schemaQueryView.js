export function createSchemaQueryView(elements, callbacks = {}) {
  elements.generateSchemaButton.addEventListener("click", () => {
    callbacks.onGenerateSchema?.();
  });

  elements.runQueryButton.addEventListener("click", () => {
    callbacks.onRunQuery?.();
  });

  elements.flattenButton.addEventListener("click", () => {
    callbacks.onFlatten?.();
  });

  elements.unflattenButton.addEventListener("click", () => {
    callbacks.onUnflatten?.();
  });

  elements.copyButton.addEventListener("click", async () => {
    const value = elements.output.value;

    if (!value) {
      callbacks.onStatus?.("There is no schema/query output to copy.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      callbacks.onStatus?.("Schema/query output copied.", "success");
    } catch {
      elements.output.select();
      document.execCommand("copy");
      callbacks.onStatus?.("Schema/query output copied.", "success");
    }
  });

  elements.clearButton.addEventListener("click", () => {
    clear();
    callbacks.onStatus?.("Schema/query output cleared.", "neutral");
  });

  function getPathExpression() {
    return elements.pathInput.value;
  }

  function setOutput(value) {
    elements.output.value = value;
    updateStats();
    flash();
  }

  function clear() {
    elements.output.value = "";
    updateStats();
  }

  function updateStats() {
    elements.stats.textContent = `${elements.output.value.length.toLocaleString()} chars`;
  }

  function flash() {
    elements.panel.classList.remove("is-flashing");

    window.requestAnimationFrame(() => {
      elements.panel.classList.add("is-flashing");
    });
  }

  return {
    getPathExpression,
    setOutput,
    clear,
  };
}

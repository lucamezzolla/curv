export function createConverterView(elements, callbacks = {}) {
  elements.convertButton.addEventListener("click", () => {
    callbacks.onConvert?.();
  });

  elements.copyButton.addEventListener("click", async () => {
    const value = elements.output.value;

    if (!value) {
      callbacks.onStatus?.("There is no converted output to copy.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      callbacks.onStatus?.("Converted output copied.", "success");
    } catch {
      elements.output.select();
      document.execCommand("copy");
      callbacks.onStatus?.("Converted output copied.", "success");
    }
  });

  elements.downloadButton.addEventListener("click", () => {
    const value = elements.output.value;

    if (!value) {
      callbacks.onStatus?.("There is no converted output to download.", "error");
      return;
    }

    callbacks.onDownload?.(value, getTargetFormat());
  });

  elements.clearButton.addEventListener("click", () => {
    clear();
    callbacks.onStatus?.("Converter output cleared.", "neutral");
  });

  function getTargetFormat() {
    return elements.targetFormat.value;
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
    getTargetFormat,
    setOutput,
    clear,
  };
}

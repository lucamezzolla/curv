import { formatJson, minifyJson } from "./core/formatter.js";

const elements = {
  input: document.querySelector("#jsonInput"),
  output: document.querySelector("#jsonOutput"),
  inputStats: document.querySelector("#inputStats"),
  outputStats: document.querySelector("#outputStats"),
  statusBar: document.querySelector(".status-bar"),
  statusMessage: document.querySelector("#statusMessage"),
  indentSize: document.querySelector("#indentSize"),
  formatButton: document.querySelector("#formatButton"),
  minifyButton: document.querySelector("#minifyButton"),
  copyButton: document.querySelector("#copyButton"),
  clearButton: document.querySelector("#clearButton"),
};

function initializeApp() {
  elements.formatButton.addEventListener("click", handleFormat);
  elements.minifyButton.addEventListener("click", handleMinify);
  elements.copyButton.addEventListener("click", handleCopy);
  elements.clearButton.addEventListener("click", handleClear);
  elements.input.addEventListener("input", updateStats);

  updateStats();
  setStatus("Ready.", "neutral");
}

function handleFormat() {
  try {
    const indentSize = Number(elements.indentSize.value);
    const formattedJson = formatJson(elements.input.value, indentSize);

    elements.output.value = formattedJson;
    updateStats();
    setStatus("JSON formatted successfully.", "success");
  } catch (error) {
    elements.output.value = "";
    updateStats();
    setStatus(error.message, "error");
  }
}

function handleMinify() {
  try {
    const minifiedJson = minifyJson(elements.input.value);

    elements.output.value = minifiedJson;
    updateStats();
    setStatus("JSON minified successfully.", "success");
  } catch (error) {
    elements.output.value = "";
    updateStats();
    setStatus(error.message, "error");
  }
}

async function handleCopy() {
  const value = elements.output.value;

  if (!value) {
    setStatus("There is no output to copy.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setStatus("Output copied to clipboard.", "success");
  } catch {
    elements.output.select();
    document.execCommand("copy");
    setStatus("Output copied to clipboard.", "success");
  }
}

function handleClear() {
  elements.input.value = "";
  elements.output.value = "";
  updateStats();
  setStatus("Workspace cleared.", "neutral");
}

function updateStats() {
  elements.inputStats.textContent = formatCharacterCount(elements.input.value.length);
  elements.outputStats.textContent = formatCharacterCount(elements.output.value.length);
}

function formatCharacterCount(count) {
  return `${count.toLocaleString()} chars`;
}

function setStatus(message, type = "neutral") {
  elements.statusMessage.textContent = message;
  elements.statusBar.classList.remove("is-success", "is-error");

  if (type === "success") {
    elements.statusBar.classList.add("is-success");
  }

  if (type === "error") {
    elements.statusBar.classList.add("is-error");
  }
}

initializeApp();
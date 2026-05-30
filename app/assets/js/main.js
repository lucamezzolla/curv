import {
  analyzeJsonStructure,
  analyzeText,
  createEmptyJsonStats,
  formatTextStats,
} from "./core/analyzer.js";
import { formatJson, minifyJson } from "./core/formatter.js";
import { validateJson } from "./core/validator.js";
import { createJsonEditor } from "./ui/editor.js";
import {
  createOutputFilename,
  downloadTextFile,
  readTextFile,
} from "./ui/fileActions.js";
import { createNotificationCenter } from "./ui/notifications.js";

const AUTO_FORMAT_PASTE_THRESHOLD = 25000;

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
  validateButton: document.querySelector("#validateButton"),
  copyButton: document.querySelector("#copyButton"),
  downloadButton: document.querySelector("#downloadButton"),
  clearButton: document.querySelector("#clearButton"),
  fileInput: document.querySelector("#fileInput"),
  validityValue: document.querySelector("#validityValue"),
  objectsValue: document.querySelector("#objectsValue"),
  arraysValue: document.querySelector("#arraysValue"),
  keysValue: document.querySelector("#keysValue"),
  depthValue: document.querySelector("#depthValue"),
};

const editor = createJsonEditor(elements.input, elements.output);

const notifications = createNotificationCenter(
  elements.statusBar,
  elements.statusMessage
);

function initializeApp() {
  elements.formatButton.addEventListener("click", handleFormat);
  elements.minifyButton.addEventListener("click", handleMinify);
  elements.validateButton.addEventListener("click", handleValidate);
  elements.copyButton.addEventListener("click", handleCopy);
  elements.downloadButton.addEventListener("click", handleDownload);
  elements.clearButton.addEventListener("click", handleClear);
  elements.fileInput.addEventListener("change", handleFileUpload);

  editor.onInput(handleInputChange);
  editor.onPaste(handlePaste);
  document.addEventListener("keydown", handleKeyboardShortcuts);

  updateStats();
  updateInspector("Not checked", createEmptyJsonStats());
  notifications.setStatus("Ready.", "neutral");
}

function handleFormat() {
  try {
    const indentSize = Number(elements.indentSize.value);
    const formattedJson = formatJson(editor.getInput(), indentSize);
    const validation = validateJson(formattedJson);

    editor.setOutput(formattedJson);
    updateStats();
    updateInspectorFromValidation(validation);
    notifications.setStatus("JSON formatted successfully.", "success");
  } catch (error) {
    editor.setOutput("");
    updateStats();
    updateInspectorFromValidation(validateJson(editor.getInput()));
    notifications.setStatus(error.message, "error");
  }
}

function handleMinify() {
  try {
    const minifiedJson = minifyJson(editor.getInput());
    const validation = validateJson(minifiedJson);

    editor.setOutput(minifiedJson);
    updateStats();
    updateInspectorFromValidation(validation);
    notifications.setStatus("JSON minified successfully.", "success");
  } catch (error) {
    editor.setOutput("");
    updateStats();
    updateInspectorFromValidation(validateJson(editor.getInput()));
    notifications.setStatus(error.message, "error");
  }
}

function handleValidate() {
  const validation = validateJson(editor.getInput());

  updateInspectorFromValidation(validation);

  if (validation.valid) {
    notifications.setStatus("Valid JSON.", "success");
    return;
  }

  notifications.setStatus(validation.message, "error");
}

async function handleCopy() {
  const value = editor.getOutput();

  if (!value) {
    notifications.setStatus("There is no output to copy.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    notifications.setStatus("Output copied to clipboard.", "success");
  } catch {
    editor.selectOutput();
    document.execCommand("copy");
    notifications.setStatus("Output copied to clipboard.", "success");
  }
}

function handleDownload() {
  const value = editor.getOutput();

  if (!value) {
    notifications.setStatus("There is no output to download.", "error");
    return;
  }

  downloadTextFile(createOutputFilename(), value);
  notifications.setStatus("Output downloaded successfully.", "success");
}

function handleClear() {
  editor.clear();
  elements.fileInput.value = "";
  updateStats();
  updateInspector("Not checked", createEmptyJsonStats());
  notifications.setStatus("Workspace cleared.", "neutral");
  editor.focusInput();
}

async function handleFileUpload(event) {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  try {
    const content = await readTextFile(file);

    editor.setInput(content);
    editor.setOutput("");
    updateStats();
    updateInspector("Not checked", createEmptyJsonStats());
    notifications.setStatus(`Loaded ${file.name}.`, "success");
  } catch (error) {
    notifications.setStatus(error.message, "error");
  }
}

function handleInputChange() {
  updateStats();
  updateInspector("Not checked", createEmptyJsonStats());
}

function handlePaste(event) {
  const pastedText = event.clipboardData?.getData("text");

  if (!pastedText || pastedText.length > AUTO_FORMAT_PASTE_THRESHOLD) {
    return;
  }

  const validation = validateJson(pastedText);

  if (!validation.valid) {
    return;
  }

  event.preventDefault();

  const indentSize = Number(elements.indentSize.value);
  const formattedJson = JSON.stringify(validation.data, null, indentSize);

  editor.setInput(formattedJson);
  editor.setOutput("");
  updateStats();
  updateInspectorFromValidation(validation);
  notifications.setStatus("Pasted JSON was formatted automatically.", "success");
}

function handleKeyboardShortcuts(event) {
  const key = event.key.toLowerCase();
  const isModifierPressed = event.ctrlKey || event.metaKey;

  if (!isModifierPressed) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    handleFormat();
    return;
  }

  if (event.shiftKey && key === "m") {
    event.preventDefault();
    handleMinify();
    return;
  }

  if (event.shiftKey && key === "v") {
    event.preventDefault();
    handleValidate();
    return;
  }

  if (event.shiftKey && key === "c") {
    event.preventDefault();
    handleCopy();
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    handleClear();
  }
}

function updateStats() {
  elements.inputStats.textContent = formatTextStats(
    analyzeText(editor.getInput())
  );

  elements.outputStats.textContent = formatTextStats(
    analyzeText(editor.getOutput())
  );
}

function updateInspectorFromValidation(validation) {
  if (!validation.valid) {
    updateInspector("Invalid", createEmptyJsonStats());
    return;
  }

  updateInspector("Valid", analyzeJsonStructure(validation.data));
}

function updateInspector(validity, stats) {
  elements.validityValue.textContent = validity;
  elements.objectsValue.textContent = stats.objects.toLocaleString();
  elements.arraysValue.textContent = stats.arrays.toLocaleString();
  elements.keysValue.textContent = stats.keys.toLocaleString();
  elements.depthValue.textContent = stats.depth.toLocaleString();
}

initializeApp();

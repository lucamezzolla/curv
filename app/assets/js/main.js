import {
  analyzeJsonStructure,
  analyzeText,
  createEmptyJsonStats,
  formatTextStats,
} from "./core/analyzer.js";
import {
  indentSelection,
  unindentSelection,
} from "./core/editorCommands.js";
import { formatJson, minifyJson } from "./core/formatter.js";
import { compareJson } from "./core/diffEngine.js";
import {
  removeNullValues,
  sortJsonKeys,
} from "./core/transformer.js";
import { validateJson } from "./core/validator.js";
import { createDiffView } from "./ui/diffView.js";
import { createJsonEditor } from "./ui/editor.js";
import {
  createOutputFilename,
  downloadTextFile,
  readTextFile,
} from "./ui/fileActions.js";
import { createNotificationCenter } from "./ui/notifications.js";
import { createTreeView } from "./ui/treeView.js";
import { createValidationPanel } from "./ui/validationPanel.js";

const AUTO_FORMAT_PASTE_THRESHOLD = 25000;
const LARGE_INPUT_WARNING_THRESHOLD = 250000;
const AUTO_VALIDATION_DELAY = 400;

const elements = {
  input: document.querySelector("#jsonInput"),
  output: document.querySelector("#jsonOutput"),
  inputStats: document.querySelector("#inputStats"),
  outputStats: document.querySelector("#outputStats"),
  statusBar: document.querySelector(".status-bar"),
  statusMessage: document.querySelector("#statusMessage"),
  indentSize: document.querySelector("#indentSize"),
  autoFormatPaste: document.querySelector("#autoFormatPaste"),
  formatButton: document.querySelector("#formatButton"),
  minifyButton: document.querySelector("#minifyButton"),
  validateButton: document.querySelector("#validateButton"),
  sortKeysButton: document.querySelector("#sortKeysButton"),
  removeNullsButton: document.querySelector("#removeNullsButton"),
  compareButton: document.querySelector("#compareButton"),
  copyButton: document.querySelector("#copyButton"),
  downloadButton: document.querySelector("#downloadButton"),
  clearButton: document.querySelector("#clearButton"),
  fileInput: document.querySelector("#fileInput"),
  validityValue: document.querySelector("#validityValue"),
  objectsValue: document.querySelector("#objectsValue"),
  arraysValue: document.querySelector("#arraysValue"),
  keysValue: document.querySelector("#keysValue"),
  depthValue: document.querySelector("#depthValue"),
  validationPanel: document.querySelector("#validationPanel"),
  validationTitle: document.querySelector("#validationTitle"),
  validationBadge: document.querySelector("#validationBadge"),
  validationMessage: document.querySelector("#validationMessage"),
  validationLine: document.querySelector("#validationLine"),
  validationColumn: document.querySelector("#validationColumn"),
  validationPosition: document.querySelector("#validationPosition"),
  treePanel: document.querySelector("#treePanel"),
  treeContainer: document.querySelector("#treeContainer"),
  treeEmpty: document.querySelector("#treeEmpty"),
  treeSearch: document.querySelector("#treeSearch"),
  treeResultStats: document.querySelector("#treeResultStats"),
  clearTreeSearchButton: document.querySelector("#clearTreeSearchButton"),
  expandTreeButton: document.querySelector("#expandTreeButton"),
  collapseTreeButton: document.querySelector("#collapseTreeButton"),
  treeSelectedTitle: document.querySelector("#treeSelectedTitle"),
  treeSelectedPath: document.querySelector("#treeSelectedPath"),
  treeSelectedType: document.querySelector("#treeSelectedType"),
  copySelectedPathButton: document.querySelector("#copySelectedPathButton"),
  copySelectedValueButton: document.querySelector("#copySelectedValueButton"),
  diffPanel: document.querySelector("#diffPanel"),
  diffLeftInput: document.querySelector("#diffLeftInput"),
  diffRightInput: document.querySelector("#diffRightInput"),
  runDiffButton: document.querySelector("#runDiffButton"),
  clearDiffButton: document.querySelector("#clearDiffButton"),
  diffSummary: document.querySelector("#diffSummary"),
  diffFilterButtons: document.querySelectorAll("[data-diff-filter]"),
  diffEmpty: document.querySelector("#diffEmpty"),
  diffResults: document.querySelector("#diffResults"),
};

const editor = createJsonEditor(elements.input, elements.output);

const notifications = createNotificationCenter(
  elements.statusBar,
  elements.statusMessage
);

const validationPanel = createValidationPanel({
  panel: elements.validationPanel,
  title: elements.validationTitle,
  badge: elements.validationBadge,
  message: elements.validationMessage,
  line: elements.validationLine,
  column: elements.validationColumn,
  position: elements.validationPosition,
});

const diffView = createDiffView(
  {
    panel: elements.diffPanel,
    left: elements.diffLeftInput,
    right: elements.diffRightInput,
    runButton: elements.runDiffButton,
    clearButton: elements.clearDiffButton,
    summary: elements.diffSummary,
    filterButtons: elements.diffFilterButtons,
    empty: elements.diffEmpty,
    results: elements.diffResults,
  },
  {
    onCopy: (message) => notifications.setStatus(message, "success"),
    onClear: () => notifications.setStatus("Diff workspace cleared.", "neutral"),
  }
);

const treeView = createTreeView(
  {
    panel: elements.treePanel,
    container: elements.treeContainer,
    empty: elements.treeEmpty,
    search: elements.treeSearch,
    resultStats: elements.treeResultStats,
    clearSearchButton: elements.clearTreeSearchButton,
    expandAllButton: elements.expandTreeButton,
    collapseAllButton: elements.collapseTreeButton,
    selectedTitle: elements.treeSelectedTitle,
    selectedPath: elements.treeSelectedPath,
    selectedType: elements.treeSelectedType,
    copySelectedPathButton: elements.copySelectedPathButton,
    copySelectedValueButton: elements.copySelectedValueButton,
  },
  {
    onCopy: (message) => notifications.setStatus(message, "success"),
  }
);

let autoValidationTimer = null;

function initializeApp() {
  elements.formatButton.addEventListener("click", handleFormat);
  elements.minifyButton.addEventListener("click", handleMinify);
  elements.validateButton.addEventListener("click", handleValidate);
  elements.sortKeysButton.addEventListener("click", handleSortKeys);
  elements.removeNullsButton.addEventListener("click", handleRemoveNulls);
  elements.compareButton.addEventListener("click", revealDiffPanel);
  elements.runDiffButton.addEventListener("click", handleCompareJson);
  elements.copyButton.addEventListener("click", handleCopy);
  elements.downloadButton.addEventListener("click", handleDownload);
  elements.clearButton.addEventListener("click", handleClear);
  elements.fileInput.addEventListener("change", handleFileUpload);

  editor.onInput(handleInputChange);
  editor.onPaste(handlePaste);
  editor.onKeyDown(handleEditorKeyDown);
  document.addEventListener("keydown", handleKeyboardShortcuts);

  updateStats();
  updateInspector("Not checked", createEmptyJsonStats());
  validationPanel.setIdle();
  treeView.clear();
  notifications.setStatus("Ready.", "neutral");
}

function handleFormat() {
  window.clearTimeout(autoValidationTimer);

  try {
    const indentSize = getIndentSize();
    const formattedJson = formatJson(editor.getInput(), indentSize);
    const validation = validateJson(formattedJson);

    editor.setOutput(formattedJson);
    updateStats();
    updateInspectorFromValidation(validation);
    validationPanel.setFromValidation(validation);
    revealValidationPanel();
    notifications.setStatus("JSON formatted successfully.", "success");
  } catch (error) {
    const validation = validateJson(editor.getInput());

    editor.setOutput("");
    updateStats();
    updateInspectorFromValidation(validation);
    validationPanel.setFromValidation(validation);
    revealValidationPanel();
    notifications.setStatus(error.message, "error");
  }
}

function handleMinify() {
  window.clearTimeout(autoValidationTimer);

  try {
    const minifiedJson = minifyJson(editor.getInput());
    const validation = validateJson(minifiedJson);

    editor.setOutput(minifiedJson);
    updateStats();
    updateInspectorFromValidation(validation);
    validationPanel.setFromValidation(validation);
    revealValidationPanel();
    notifications.setStatus("JSON minified successfully.", "success");
  } catch (error) {
    const validation = validateJson(editor.getInput());

    editor.setOutput("");
    updateStats();
    updateInspectorFromValidation(validation);
    validationPanel.setFromValidation(validation);
    revealValidationPanel();
    notifications.setStatus(error.message, "error");
  }
}

function handleValidate() {
  window.clearTimeout(autoValidationTimer);

  const validation = validateJson(editor.getInput());

  updateInspectorFromValidation(validation);
  validationPanel.setFromValidation(validation);
  revealValidationPanel();

  if (validation.valid) {
    notifications.setStatus("Valid JSON.", "success");
    return;
  }

  notifications.setStatus(validation.message, "error");
}

function handleSortKeys() {
  window.clearTimeout(autoValidationTimer);

  try {
    const transformedJson = sortJsonKeys(editor.getInput(), getIndentSize());
    const validation = validateJson(transformedJson);

    editor.setOutput(transformedJson);
    updateStats();
    updateInspectorFromValidation(validation);
    validationPanel.setFromValidation(validation);
    revealValidationPanel();
    notifications.setStatus("JSON keys sorted successfully.", "success");
  } catch (error) {
    const validation = validateJson(editor.getInput());

    editor.setOutput("");
    updateStats();
    updateInspectorFromValidation(validation);
    validationPanel.setFromValidation(validation);
    revealValidationPanel();
    notifications.setStatus(error.message, "error");
  }
}

function handleRemoveNulls() {
  window.clearTimeout(autoValidationTimer);

  try {
    const transformedJson = removeNullValues(editor.getInput(), getIndentSize());
    const validation = validateJson(transformedJson);

    editor.setOutput(transformedJson);
    updateStats();
    updateInspectorFromValidation(validation);
    validationPanel.setFromValidation(validation);
    revealValidationPanel();
    notifications.setStatus("Null values removed successfully.", "success");
  } catch (error) {
    const validation = validateJson(editor.getInput());

    editor.setOutput("");
    updateStats();
    updateInspectorFromValidation(validation);
    validationPanel.setFromValidation(validation);
    revealValidationPanel();
    notifications.setStatus(error.message, "error");
  }
}

function handleCompareJson() {
  try {
    const result = compareJson(diffView.getLeftInput(), diffView.getRightInput());

    diffView.render(result);
    revealDiffPanel();

    if (result.summary.total === 0) {
      notifications.setStatus("JSON documents are semantically equal.", "success");
      return;
    }

    notifications.setStatus(`${result.summary.total} differences found.`, "warning");
  } catch (error) {
    notifications.setStatus(error.message, "error");
    revealDiffPanel();
  }
}

function revealDiffPanel() {
  elements.diffPanel.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
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
  window.clearTimeout(autoValidationTimer);

  editor.clear();
  elements.fileInput.value = "";
  updateStats();
  updateInspector("Not checked", createEmptyJsonStats());
  validationPanel.setIdle();
  treeView.clear();
  notifications.setStatus("Workspace cleared.", "neutral");
  editor.focusInput();
}

async function handleFileUpload(event) {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  window.clearTimeout(autoValidationTimer);

  try {
    const content = await readTextFile(file);

    editor.setInput(content);
    editor.setOutput("");
    updateStats();
    updateInspector("Not checked", createEmptyJsonStats());
    validationPanel.setIdle();
    treeView.clear();

    if (content.length > LARGE_INPUT_WARNING_THRESHOLD) {
      notifications.setStatus(`Loaded ${file.name}. Large file detected; automatic validation was skipped.`, "warning");
      return;
    }

    scheduleAutomaticValidation();
    notifications.setStatus(`Loaded ${file.name}.`, "success");
  } catch (error) {
    notifications.setStatus(error.message, "error");
  }
}

function handleInputChange() {
  updateStats();
  updateInspector("Not checked", createEmptyJsonStats());
  validationPanel.setIdle();
  treeView.clear();
  scheduleAutomaticValidation();
}

function scheduleAutomaticValidation() {
  window.clearTimeout(autoValidationTimer);

  const input = editor.getInput();

  if (!input.trim()) {
    notifications.setStatus("Ready.", "neutral");
    return;
  }

  if (input.length > LARGE_INPUT_WARNING_THRESHOLD) {
    notifications.setStatus("Large input detected; automatic validation was skipped.", "warning");
    return;
  }

  autoValidationTimer = window.setTimeout(() => {
    const validation = validateJson(editor.getInput());

    updateInspectorFromValidation(validation);
    validationPanel.setFromValidation(validation);
    revealValidationPanel();

    if (validation.valid) {
      notifications.setStatus("Valid JSON.", "success");
      return;
    }

    notifications.setStatus(validation.message, "error");
  }, AUTO_VALIDATION_DELAY);
}

function handlePaste(event) {
  const pastedText = event.clipboardData?.getData("text");

  if (!pastedText) {
    return;
  }

  if (pastedText.length > LARGE_INPUT_WARNING_THRESHOLD) {
    notifications.setStatus("Large paste detected; auto-format was skipped.", "warning");
    return;
  }

  if (!elements.autoFormatPaste.checked || pastedText.length > AUTO_FORMAT_PASTE_THRESHOLD) {
    return;
  }

  const validation = validateJson(pastedText);

  if (!validation.valid) {
    return;
  }

  event.preventDefault();
  window.clearTimeout(autoValidationTimer);

  const formattedJson = JSON.stringify(validation.data, null, getIndentSize());

  editor.setInput(formattedJson);
  editor.setOutput("");
  updateStats();
  updateInspectorFromValidation(validation);
  validationPanel.setFromValidation(validation);
  revealValidationPanel();
  notifications.setStatus("Pasted JSON was formatted automatically.", "success");
}

function handleEditorKeyDown(event) {
  if (event.key === "Tab") {
    event.preventDefault();

    if (event.shiftKey) {
      unindentSelection(editor, getIndentSize());
      updateStats();
      scheduleAutomaticValidation();
      return;
    }

    indentSelection(editor, " ".repeat(getIndentSize()));
    updateStats();
    scheduleAutomaticValidation();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    editor.blurInput();
  }
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

  if (event.shiftKey && key === "s") {
    event.preventDefault();
    handleSortKeys();
    return;
  }

  if (event.shiftKey && key === "n") {
    event.preventDefault();
    handleRemoveNulls();
    return;
  }

  if (event.shiftKey && key === "d") {
    event.preventDefault();
    revealDiffPanel();
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


function revealValidationPanel({ scroll = true } = {}) {
  validationPanel.flash();

  if (!scroll) {
    return;
  }

  window.requestAnimationFrame(() => {
    const panelTop = elements.validationPanel.getBoundingClientRect().top + window.scrollY;
    const scrollOffset = 24;

    window.scrollTo({
      top: Math.max(panelTop - scrollOffset, 0),
      behavior: "smooth",
    });
  });
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
    treeView.clear("Fix validation errors to generate the tree view.");
    return;
  }

  updateInspector("Valid", analyzeJsonStructure(validation.data));
  treeView.render(validation.data);
}

function updateInspector(validity, stats) {
  elements.validityValue.textContent = validity;
  elements.objectsValue.textContent = stats.objects.toLocaleString();
  elements.arraysValue.textContent = stats.arrays.toLocaleString();
  elements.keysValue.textContent = stats.keys.toLocaleString();
  elements.depthValue.textContent = stats.depth.toLocaleString();
}

function getIndentSize() {
  return Number(elements.indentSize.value);
}

initializeApp();

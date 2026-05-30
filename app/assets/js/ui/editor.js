export function createJsonEditor(inputElement, outputElement) {
  function getInput() {
    return inputElement.value;
  }

  function setInput(value) {
    inputElement.value = value;
  }

  function getOutput() {
    return outputElement.value;
  }

  function setOutput(value) {
    outputElement.value = value;
  }

  function clear() {
    inputElement.value = "";
    outputElement.value = "";
  }

  function onInput(callback) {
    inputElement.addEventListener("input", callback);
  }

  function onPaste(callback) {
    inputElement.addEventListener("paste", callback);
  }

  function onKeyDown(callback) {
    inputElement.addEventListener("keydown", callback);
  }

  function insertAtSelection(value) {
    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;
    const currentValue = inputElement.value;

    inputElement.value = `${currentValue.slice(0, start)}${value}${currentValue.slice(end)}`;
    inputElement.selectionStart = start + value.length;
    inputElement.selectionEnd = start + value.length;
  }

  function replaceSelection(start, end, value, cursorOffset = value.length) {
    const currentValue = inputElement.value;

    inputElement.value = `${currentValue.slice(0, start)}${value}${currentValue.slice(end)}`;
    inputElement.selectionStart = start + cursorOffset;
    inputElement.selectionEnd = start + cursorOffset;
  }

  function getSelection() {
    return {
      start: inputElement.selectionStart,
      end: inputElement.selectionEnd,
      value: inputElement.value.slice(inputElement.selectionStart, inputElement.selectionEnd),
    };
  }

  function blurInput() {
    inputElement.blur();
  }

  function focusInput() {
    inputElement.focus();
  }

  function selectOutput() {
    outputElement.select();
  }

  return {
    getInput,
    setInput,
    getOutput,
    setOutput,
    clear,
    onInput,
    onPaste,
    onKeyDown,
    insertAtSelection,
    replaceSelection,
    getSelection,
    blurInput,
    focusInput,
    selectOutput,
  };
}

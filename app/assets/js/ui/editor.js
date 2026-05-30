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
    focusInput,
    selectOutput,
  };
}

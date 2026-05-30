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
    selectOutput,
  };
}

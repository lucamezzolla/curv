import { parseJson } from "./validator.js";

export function formatJson(input, indentSize = 2) {
  const parsedJson = parseJson(input);
  return JSON.stringify(parsedJson, null, indentSize);
}

export function minifyJson(input) {
  const parsedJson = parseJson(input);
  return JSON.stringify(parsedJson);
}

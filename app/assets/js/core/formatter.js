export function formatJson(input, indentSize = 2) {
  const parsedJson = parseJson(input);
  return JSON.stringify(parsedJson, null, indentSize);
}

export function minifyJson(input) {
  const parsedJson = parseJson(input);
  return JSON.stringify(parsedJson);
}

function parseJson(input) {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    throw new Error("Input is empty.");
  }

  return JSON.parse(normalizedInput);
}
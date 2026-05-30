export function parseJson(input) {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    throw new Error("Input is empty.");
  }

  return JSON.parse(normalizedInput);
}

export function validateJson(input) {
  parseJson(input);
  return true;
}
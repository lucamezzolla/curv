export function parseJson(input) {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    throw createValidationError("Input is empty.", input);
  }

  try {
    return JSON.parse(normalizedInput);
  } catch (error) {
    throw createValidationError(error.message, normalizedInput);
  }
}

export function validateJson(input) {
  try {
    const parsedJson = parseJson(input);

    return {
      valid: true,
      data: parsedJson,
      message: "Valid JSON.",
      error: null,
    };
  } catch (error) {
    return {
      valid: false,
      data: null,
      message: error.message,
      error,
    };
  }
}

function createValidationError(message, input) {
  const details = extractErrorDetails(message, input);
  const error = new Error(formatValidationMessage(message, details));

  error.name = "JsonValidationError";
  error.details = details;

  return error;
}

function extractErrorDetails(message, input) {
  const position = extractPosition(message);
  const lineColumn = position === null
    ? extractLineColumn(message)
    : getLineAndColumnFromPosition(input, position);

  return {
    rawMessage: message,
    position,
    line: lineColumn?.line ?? null,
    column: lineColumn?.column ?? null,
  };
}

function extractPosition(message) {
  const match = message.match(/position\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function extractLineColumn(message) {
  const match = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);

  if (!match) {
    return null;
  }

  return {
    line: Number(match[1]),
    column: Number(match[2]),
  };
}

function getLineAndColumnFromPosition(input, position) {
  const slice = input.slice(0, position);
  const lines = slice.split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;

  return {
    line,
    column,
  };
}

function formatValidationMessage(message, details) {
  if (details.line !== null && details.column !== null) {
    return `Invalid JSON: ${message} (line ${details.line}, column ${details.column}).`;
  }

  return `Invalid JSON: ${message}`;
}

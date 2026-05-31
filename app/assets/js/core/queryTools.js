import { parseJson } from "./validator.js";

export function queryJson(input, pathExpression) {
  const parsedJson = parseJson(input);
  const tokens = parsePathExpression(pathExpression);
  const value = tokens.reduce((currentValue, token) => {
    if (currentValue === undefined || currentValue === null) {
      return undefined;
    }

    return currentValue[token];
  }, parsedJson);

  if (value === undefined) {
    throw new Error("No value found for the provided path.");
  }

  return JSON.stringify(value, null, 2);
}

export function flattenJson(input) {
  const parsedJson = parseJson(input);
  const result = {};

  flattenValue(parsedJson, "$", result);

  return JSON.stringify(result, null, 2);
}

export function unflattenJson(input) {
  const parsedJson = parseJson(input);

  if (!isPlainObject(parsedJson)) {
    throw new Error("Unflatten requires a JSON object whose keys are paths.");
  }

  const result = {};

  Object.entries(parsedJson).forEach(([path, value]) => {
    setValueAtPath(result, parsePathExpression(path), value);
  });

  return JSON.stringify(result, null, 2);
}

function flattenValue(value, path, result) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      result[path] = [];
      return;
    }

    value.forEach((item, index) => {
      flattenValue(item, `${path}[${index}]`, result);
    });
    return;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      result[path] = {};
      return;
    }

    entries.forEach(([key, childValue]) => {
      flattenValue(childValue, joinObjectPath(path, key), result);
    });
    return;
  }

  result[path] = value;
}

function setValueAtPath(target, tokens, value) {
  if (tokens[0] === "$") {
    tokens = tokens.slice(1);
  }

  let current = target;

  tokens.forEach((token, index) => {
    const isLast = index === tokens.length - 1;
    const nextToken = tokens[index + 1];

    if (isLast) {
      current[token] = value;
      return;
    }

    if (current[token] === undefined) {
      current[token] = typeof nextToken === "number" ? [] : {};
    }

    current = current[token];
  });
}

export function parsePathExpression(expression) {
  const normalizedExpression = expression.trim();

  if (!normalizedExpression) {
    throw new Error("Path expression is empty.");
  }

  const tokens = [];
  let index = 0;

  while (index < normalizedExpression.length) {
    const char = normalizedExpression[index];

    if (char === "$") {
      tokens.push("$");
      index += 1;
      continue;
    }

    if (char === ".") {
      index += 1;
      const match = normalizedExpression.slice(index).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);

      if (!match) {
        throw new Error("Invalid dot path segment.");
      }

      tokens.push(match[0]);
      index += match[0].length;
      continue;
    }

    if (char === "[") {
      const end = normalizedExpression.indexOf("]", index);

      if (end === -1) {
        throw new Error("Unclosed bracket in path expression.");
      }

      const rawToken = normalizedExpression.slice(index + 1, end).trim();

      if (/^\d+$/.test(rawToken)) {
        tokens.push(Number(rawToken));
      } else {
        tokens.push(JSON.parse(rawToken));
      }

      index = end + 1;
      continue;
    }

    const match = normalizedExpression.slice(index).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);

    if (!match) {
      throw new Error("Invalid path expression.");
    }

    tokens.push(match[0]);
    index += match[0].length;
  }

  return tokens;
}

function joinObjectPath(parentPath, key) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return `${parentPath}.${key}`;
  }

  return `${parentPath}[${JSON.stringify(key)}]`;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

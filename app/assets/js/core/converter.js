import { parseJson } from "./validator.js";

export function convertJson(input, targetFormat) {
  const parsedJson = parseJson(input);

  if (targetFormat === "yaml") {
    return jsonToYaml(parsedJson);
  }

  if (targetFormat === "csv") {
    return jsonToCsv(parsedJson);
  }

  if (targetFormat === "markdown") {
    return jsonToMarkdownTable(parsedJson);
  }

  if (targetFormat === "query-params") {
    return jsonToQueryParams(parsedJson);
  }

  throw new Error(`Unsupported conversion format: ${targetFormat}`);
}

function jsonToYaml(value, indentLevel = 0) {
  const indent = "  ".repeat(indentLevel);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    return value
      .map((item) => {
        if (isPrimitive(item)) {
          return `${indent}- ${formatYamlPrimitive(item)}`;
        }

        const nested = jsonToYaml(item, indentLevel + 1);
        return `${indent}-\n${nested}`;
      })
      .join("\n");
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return "{}";
    }

    return entries
      .map(([key, childValue]) => {
        if (isPrimitive(childValue)) {
          return `${indent}${escapeYamlKey(key)}: ${formatYamlPrimitive(childValue)}`;
        }

        return `${indent}${escapeYamlKey(key)}:\n${jsonToYaml(childValue, indentLevel + 1)}`;
      })
      .join("\n");
  }

  return `${indent}${formatYamlPrimitive(value)}`;
}

function jsonToCsv(value) {
  const rows = normalizeRows(value);
  const columns = collectColumns(rows);

  if (rows.length === 0 || columns.length === 0) {
    return "";
  }

  const header = columns.map(escapeCsvCell).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCsvCell(getCsvValue(row[column]))).join(","))
    .join("\n");

  return `${header}\n${body}`;
}

function jsonToMarkdownTable(value) {
  const rows = normalizeRows(value);
  const columns = collectColumns(rows);

  if (rows.length === 0 || columns.length === 0) {
    return "";
  }

  const header = `| ${columns.join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows
    .map((row) => `| ${columns.map((column) => escapeMarkdownCell(getCsvValue(row[column]))).join(" | ")} |`)
    .join("\n");

  return `${header}\n${separator}\n${body}`;
}

function jsonToQueryParams(value) {
  if (!isPlainObject(value)) {
    throw new Error("Query params conversion requires a JSON object at the root.");
  }

  const params = new URLSearchParams();

  appendQueryParams(params, "", value);

  return params.toString();
}

function appendQueryParams(params, prefix, value) {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendQueryParams(params, `${prefix}[${index}]`, item);
    });
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, childValue]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      appendQueryParams(params, path, childValue);
    });
    return;
  }

  params.append(prefix, String(value));
}

function normalizeRows(value) {
  if (Array.isArray(value)) {
    return value.map((item) => flattenRow(item));
  }

  if (isPlainObject(value)) {
    return [flattenRow(value)];
  }

  throw new Error("CSV and Markdown table conversion require a JSON object or an array at the root.");
}

function collectColumns(rows) {
  const columns = new Set();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });

  return Array.from(columns);
}

function flattenRow(value, prefix = "", result = {}) {
  if (Array.isArray(value)) {
    result[prefix || "value"] = JSON.stringify(value);
    return result;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      result[prefix || "value"] = "{}";
      return result;
    }

    entries.forEach(([key, childValue]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      flattenRow(childValue, path, result);
    });

    return result;
  }

  result[prefix || "value"] = value;
  return result;
}

function getCsvValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function escapeCsvCell(value) {
  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function escapeMarkdownCell(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, "<br>");
}

function escapeYamlKey(key) {
  if (/^[A-Za-z0-9_-]+$/.test(key)) {
    return key;
  }

  return JSON.stringify(key);
}

function formatYamlPrimitive(value) {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    if (value === "") {
      return '""';
    }

    if (/[:#\n\r]|^\s|\s$|^(true|false|null)$/i.test(value)) {
      return JSON.stringify(value);
    }

    return value;
  }

  return String(value);
}

function isPrimitive(value) {
  return value === null || typeof value !== "object";
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

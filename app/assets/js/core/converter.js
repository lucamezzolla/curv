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

  if (targetFormat === "java-record") {
    return jsonToJavaRecord(parsedJson);
  }

  if (targetFormat === "java-class") {
    return jsonToJavaClass(parsedJson);
  }

  if (targetFormat === "sql-table") {
    return jsonToSqlCreateTable(parsedJson);
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

function jsonToJavaRecord(value) {
  const sample = extractObjectSample(value);
  const className = inferClassName(sample, "CurvDto");
  const fields = Object.entries(sample)
    .map(([key, childValue]) => `    ${inferJavaType(childValue)} ${toJavaIdentifier(key)}`)
    .join(",\n");

  return `public record ${className}(\n${fields}\n) {}`;
}

function jsonToJavaClass(value) {
  const sample = extractObjectSample(value);
  const className = inferClassName(sample, "CurvDto");
  const fields = Object.entries(sample)
    .map(([key, childValue]) => `    private ${inferJavaType(childValue)} ${toJavaIdentifier(key)};`)
    .join("\n");

  const accessors = Object.entries(sample)
    .map(([key, childValue]) => {
      const type = inferJavaType(childValue);
      const fieldName = toJavaIdentifier(key);
      const methodSuffix = capitalize(fieldName);

      return [
        `    public ${type} get${methodSuffix}() {`,
        `        return ${fieldName};`,
        "    }",
        "",
        `    public void set${methodSuffix}(${type} ${fieldName}) {`,
        `        this.${fieldName} = ${fieldName};`,
        "    }",
      ].join("\n");
    })
    .join("\n\n");

  return `public class ${className} {\n${fields}\n\n${accessors}\n}`;
}

function jsonToSqlCreateTable(value) {
  const sample = extractObjectSample(value);
  const tableName = inferTableName(sample, "curv_data");

  const columns = Object.entries(sample)
    .map(([key, childValue]) => `  ${toSqlIdentifier(key)} ${inferSqlType(childValue)}`)
    .join(",\n");

  return `CREATE TABLE ${tableName} (\n${columns}\n);`;
}

function extractObjectSample(value) {
  if (Array.isArray(value)) {
    const objectSample = value.find(isPlainObject);

    if (!objectSample) {
      throw new Error("Developer converters require a JSON object or an array of objects.");
    }

    return objectSample;
  }

  if (isPlainObject(value)) {
    return value;
  }

  throw new Error("Developer converters require a JSON object or an array of objects.");
}

function inferClassName(sample, fallback) {
  const candidateKeys = ["type", "name", "entity", "model", "resource"];

  for (const key of candidateKeys) {
    const value = sample[key];

    if (typeof value === "string" && value.trim()) {
      return `${toPascalCase(value)}Dto`;
    }
  }

  return fallback;
}

function inferTableName(sample, fallback) {
  const candidateKeys = ["type", "entity", "resource"];

  for (const key of candidateKeys) {
    const value = sample[key];

    if (typeof value === "string" && value.trim()) {
      return toSnakeCase(value);
    }
  }

  return fallback;
}

function inferJavaType(value) {
  if (value === null) {
    return "Object";
  }

  if (Array.isArray(value)) {
    const firstDefinedValue = value.find((item) => item !== null && item !== undefined);
    const itemType = firstDefinedValue === undefined ? "Object" : inferJavaType(firstDefinedValue);

    return `List<${itemType}>`;
  }

  if (isPlainObject(value)) {
    return "Map<String, Object>";
  }

  if (typeof value === "boolean") {
    return "boolean";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "double";
  }

  return "String";
}

function inferSqlType(value) {
  if (value === null) {
    return "TEXT";
  }

  if (Array.isArray(value) || isPlainObject(value)) {
    return "JSON";
  }

  if (typeof value === "boolean") {
    return "BOOLEAN";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? "INT" : "DOUBLE";
  }

  if (typeof value === "string") {
    if (looksLikeDateTime(value)) {
      return "DATETIME";
    }

    if (value.length > 255) {
      return "TEXT";
    }

    return "VARCHAR(255)";
  }

  return "TEXT";
}

function looksLikeDateTime(value) {
  return /^\d{4}-\d{2}-\d{2}/.test(value);
}

function toJavaIdentifier(value) {
  const identifier = String(value)
    .replace(/[^A-Za-z0-9_$]+(.)?/g, (_, next) => next ? next.toUpperCase() : "")
    .replace(/^[^A-Za-z_$]+/, "");

  const safeIdentifier = identifier || "value";

  return isJavaReservedWord(safeIdentifier) ? `${safeIdentifier}Value` : safeIdentifier;
}

function toSqlIdentifier(value) {
  const identifier = toSnakeCase(value);

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    return identifier;
  }

  return `\`${String(value).replaceAll("`", "``")}\``;
}

function toPascalCase(value) {
  const words = String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  const result = words.map((word) => capitalize(word.toLowerCase())).join("");

  return result || "Curv";
}

function toSnakeCase(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "curv_data";
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isJavaReservedWord(value) {
  return new Set([
    "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
    "class", "const", "continue", "default", "do", "double", "else", "enum",
    "extends", "final", "finally", "float", "for", "goto", "if", "implements",
    "import", "instanceof", "int", "interface", "long", "native", "new",
    "package", "private", "protected", "public", "return", "short", "static",
    "strictfp", "super", "switch", "synchronized", "this", "throw", "throws",
    "transient", "try", "void", "volatile", "while"
  ]).has(value);
}

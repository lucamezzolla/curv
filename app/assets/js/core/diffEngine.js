import { parseJson } from "./validator.js";

export function compareJson(leftInput, rightInput) {
  const left = parseJson(leftInput);
  const right = parseJson(rightInput);
  const changes = [];

  compareValues(left, right, "$", changes);

  return {
    left,
    right,
    changes,
    summary: summarizeChanges(changes),
  };
}

function compareValues(left, right, path, changes) {
  if (left === undefined && right !== undefined) {
    changes.push(createChange("added", path, undefined, right));
    return;
  }

  if (left !== undefined && right === undefined) {
    changes.push(createChange("removed", path, left, undefined));
    return;
  }

  const leftType = getValueType(left);
  const rightType = getValueType(right);

  if (leftType !== rightType) {
    changes.push(createChange("type-changed", path, left, right, leftType, rightType));
    return;
  }

  if (leftType === "object") {
    compareObjects(left, right, path, changes);
    return;
  }

  if (leftType === "array") {
    compareArrays(left, right, path, changes);
    return;
  }

  if (!Object.is(left, right)) {
    changes.push(createChange("changed", path, left, right, leftType, rightType));
  }
}

function compareObjects(left, right, path, changes) {
  const keys = Array.from(new Set([
    ...Object.keys(left),
    ...Object.keys(right),
  ])).sort((a, b) => a.localeCompare(b));

  for (const key of keys) {
    compareValues(left[key], right[key], joinObjectPath(path, key), changes);
  }
}

function compareArrays(left, right, path, changes) {
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    compareValues(left[index], right[index], `${path}[${index}]`, changes);
  }
}

function createChange(type, path, leftValue, rightValue, leftType = getValueType(leftValue), rightType = getValueType(rightValue)) {
  return {
    type,
    path,
    leftType,
    rightType,
    leftValue,
    rightValue,
  };
}

function summarizeChanges(changes) {
  return changes.reduce(
    (summary, change) => {
      summary.total += 1;
      summary[change.type] = (summary[change.type] ?? 0) + 1;
      return summary;
    },
    {
      total: 0,
      added: 0,
      removed: 0,
      changed: 0,
      "type-changed": 0,
    }
  );
}

export function formatDiffValue(value) {
  if (value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return JSON.stringify(value, null, 2);
}

function getValueType(value) {
  if (value === undefined) {
    return "undefined";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  return typeof value === "object" ? "object" : typeof value;
}

function joinObjectPath(parentPath, key) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return `${parentPath}.${key}`;
  }

  return `${parentPath}[${JSON.stringify(key)}]`;
}

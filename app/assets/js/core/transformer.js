import { parseJson } from "./validator.js";

export function sortJsonKeys(input, indentSize = 2) {
  const parsedJson = parseJson(input);
  const transformedJson = sortKeysDeep(parsedJson);

  return JSON.stringify(transformedJson, null, indentSize);
}

export function removeNullValues(input, indentSize = 2) {
  const parsedJson = parseJson(input);
  const transformedJson = removeNullValuesDeep(parsedJson);

  return JSON.stringify(transformedJson, null, indentSize);
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce((result, key) => {
        result[key] = sortKeysDeep(value[key]);
        return result;
      }, {});
  }

  return value;
}

function removeNullValuesDeep(value) {
  if (Array.isArray(value)) {
    return value.map(removeNullValuesDeep);
  }

  if (isPlainObject(value)) {
    return Object.entries(value).reduce((result, [key, childValue]) => {
      if (childValue === null) {
        return result;
      }

      result[key] = removeNullValuesDeep(childValue);
      return result;
    }, {});
  }

  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

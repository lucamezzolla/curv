import { parseJson } from "./validator.js";

export function generateJsonSchema(input) {
  const parsedJson = parseJson(input);
  const schema = inferSchema(parsedJson);

  return JSON.stringify(
    {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      ...schema,
    },
    null,
    2
  );
}

function inferSchema(value) {
  if (Array.isArray(value)) {
    return inferArraySchema(value);
  }

  if (value === null) {
    return {
      type: "null",
    };
  }

  if (typeof value === "object") {
    return inferObjectSchema(value);
  }

  if (typeof value === "number") {
    return {
      type: Number.isInteger(value) ? "integer" : "number",
    };
  }

  return {
    type: typeof value,
  };
}

function inferObjectSchema(value) {
  const entries = Object.entries(value);
  const properties = {};
  const required = [];

  for (const [key, childValue] of entries) {
    properties[key] = inferSchema(childValue);

    if (childValue !== null && childValue !== undefined) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: true,
  };
}

function inferArraySchema(value) {
  if (value.length === 0) {
    return {
      type: "array",
      items: {},
    };
  }

  const itemSchemas = value.map(inferSchema);
  const mergedSchema = mergeSchemas(itemSchemas);

  return {
    type: "array",
    items: mergedSchema,
  };
}

function mergeSchemas(schemas) {
  if (schemas.length === 1) {
    return schemas[0];
  }

  const uniqueTypes = Array.from(new Set(schemas.map((schema) => schema.type)));

  if (uniqueTypes.length > 1) {
    return {
      anyOf: uniqueByJson(schemas),
    };
  }

  const [type] = uniqueTypes;

  if (type === "object") {
    return mergeObjectSchemas(schemas);
  }

  if (type === "array") {
    return mergeArraySchemas(schemas);
  }

  return schemas[0];
}

function mergeObjectSchemas(schemas) {
  const properties = {};
  const requiredSets = schemas.map((schema) => new Set(schema.required ?? []));
  const allKeys = new Set();

  schemas.forEach((schema) => {
    Object.keys(schema.properties ?? {}).forEach((key) => allKeys.add(key));
  });

  for (const key of allKeys) {
    const childSchemas = schemas
      .map((schema) => schema.properties?.[key])
      .filter(Boolean);

    properties[key] = mergeSchemas(childSchemas);
  }

  const required = Array.from(allKeys).filter((key) =>
    requiredSets.every((set) => set.has(key))
  );

  return {
    type: "object",
    properties,
    required,
    additionalProperties: true,
  };
}

function mergeArraySchemas(schemas) {
  return {
    type: "array",
    items: mergeSchemas(schemas.map((schema) => schema.items ?? {})),
  };
}

function uniqueByJson(values) {
  const seen = new Set();

  return values.filter((value) => {
    const key = JSON.stringify(value);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

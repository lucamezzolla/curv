export function analyzeText(value) {
  return {
    characters: value.length,
    bytes: new Blob([value]).size,
    lines: countLines(value),
  };
}

export function analyzeJsonStructure(value) {
  const stats = {
    objects: 0,
    arrays: 0,
    keys: 0,
    depth: 0,
  };

  visit(value, 1, stats);

  return stats;
}

export function createEmptyJsonStats() {
  return {
    objects: 0,
    arrays: 0,
    keys: 0,
    depth: 0,
  };
}

export function formatTextStats(stats) {
  return `${formatNumber(stats.characters)} chars · ${formatNumber(stats.lines)} lines`;
}

function visit(value, depth, stats) {
  stats.depth = Math.max(stats.depth, depth);

  if (Array.isArray(value)) {
    stats.arrays += 1;

    for (const item of value) {
      visit(item, depth + 1, stats);
    }

    return;
  }

  if (isPlainObject(value)) {
    stats.objects += 1;
    const entries = Object.entries(value);
    stats.keys += entries.length;

    for (const [, childValue] of entries) {
      visit(childValue, depth + 1, stats);
    }
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function countLines(value) {
  if (!value) {
    return 0;
  }

  return value.split("\n").length;
}

function formatNumber(value) {
  return value.toLocaleString();
}

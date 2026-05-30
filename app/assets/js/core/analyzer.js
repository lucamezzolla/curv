export function analyzeText(value) {
  return {
    characters: value.length,
    bytes: new Blob([value]).size,
    lines: countLines(value),
  };
}

export function formatTextStats(stats) {
  return `${formatNumber(stats.characters)} chars · ${formatNumber(stats.lines)} lines`;
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
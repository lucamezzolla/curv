import { formatDiffValue } from "../core/diffEngine.js";

const CHANGE_LABELS = {
  added: "Added",
  removed: "Removed",
  changed: "Changed",
  "type-changed": "Type changed",
};

export function createDiffView(elements, callbacks = {}) {
  elements.clearButton.addEventListener("click", () => {
    elements.left.value = "";
    elements.right.value = "";
    clear();
    callbacks.onClear?.();
  });

  elements.results.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-diff-copy]");

    if (!button) {
      return;
    }

    try {
      await navigator.clipboard.writeText(button.dataset.diffCopy);
      callbacks.onCopy?.("Diff path copied.");
    } catch {
      callbacks.onCopy?.("Unable to copy diff path.");
    }
  });

  function getLeftInput() {
    return elements.left.value;
  }

  function getRightInput() {
    return elements.right.value;
  }

  function render(result) {
    renderSummary(result.summary);
    renderChanges(result.changes);
    flash();
  }

  function clear() {
    elements.summary.textContent = "No comparison yet.";
    elements.results.innerHTML = "";
    elements.empty.hidden = false;
    elements.empty.textContent = "Compare two JSON documents to see semantic differences.";
  }

  function renderSummary(summary) {
    if (summary.total === 0) {
      elements.summary.textContent = "No differences found.";
      return;
    }

    elements.summary.textContent = `${summary.total} differences · ${summary.added} added · ${summary.removed} removed · ${summary.changed} changed · ${summary["type-changed"]} type changed`;
  }

  function renderChanges(changes) {
    elements.results.innerHTML = "";

    if (changes.length === 0) {
      elements.empty.hidden = false;
      elements.empty.textContent = "The two JSON documents are semantically equal.";
      return;
    }

    elements.empty.hidden = true;

    for (const change of changes) {
      elements.results.appendChild(createChangeItem(change));
    }
  }

  function createChangeItem(change) {
    const item = document.createElement("article");
    item.className = `diff-item diff-item-${change.type}`;

    const header = document.createElement("div");
    header.className = "diff-item-header";

    const label = document.createElement("span");
    label.className = "diff-change-label";
    label.textContent = CHANGE_LABELS[change.type] ?? change.type;

    const path = document.createElement("code");
    path.className = "diff-path";
    path.textContent = change.path;

    const copyButton = document.createElement("button");
    copyButton.className = "tree-action-button";
    copyButton.type = "button";
    copyButton.textContent = "Copy path";
    copyButton.dataset.diffCopy = change.path;

    header.appendChild(label);
    header.appendChild(path);
    header.appendChild(copyButton);

    const values = document.createElement("div");
    values.className = "diff-values";

    values.appendChild(createValueBlock("Left", change.leftValue, change.leftType));
    values.appendChild(createValueBlock("Right", change.rightValue, change.rightType));

    item.appendChild(header);
    item.appendChild(values);

    return item;
  }

  function createValueBlock(label, value, type) {
    const block = document.createElement("div");
    block.className = "diff-value-block";

    const title = document.createElement("span");
    title.className = "diff-value-title";
    title.textContent = `${label} · ${type}`;

    const pre = document.createElement("pre");
    pre.textContent = formatDiffValue(value);

    block.appendChild(title);
    block.appendChild(pre);

    return block;
  }

  function flash() {
    elements.panel.classList.remove("is-flashing");

    window.requestAnimationFrame(() => {
      elements.panel.classList.add("is-flashing");
    });
  }

  return {
    getLeftInput,
    getRightInput,
    render,
    clear,
  };
}

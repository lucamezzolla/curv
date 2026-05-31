import { formatDiffValue } from "../core/diffEngine.js";

const CHANGE_LABELS = {
  added: "Added",
  removed: "Removed",
  changed: "Changed",
  "type-changed": "Type changed",
};

export function createDiffView(elements, callbacks = {}) {
  let currentChanges = [];
  let currentSummary = null;
  let activeFilter = "all";

  elements.clearButton.addEventListener("click", () => {
    elements.left.value = "";
    elements.right.value = "";
    clear();
    callbacks.onClear?.();
  });

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.diffFilter;
      updateActiveFilterButton();
      renderChanges(currentChanges);
    });
  });

  elements.results.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-diff-copy]");

    if (!button) {
      return;
    }

    try {
      await navigator.clipboard.writeText(button.dataset.diffCopy);
      callbacks.onCopy?.(button.dataset.diffCopyMessage ?? "Diff value copied.");
    } catch {
      callbacks.onCopy?.("Unable to copy diff value.");
    }
  });

  function getLeftInput() {
    return elements.left.value;
  }

  function getRightInput() {
    return elements.right.value;
  }

  function render(result) {
    currentChanges = result.changes;
    currentSummary = result.summary;
    activeFilter = "all";
    updateActiveFilterButton();
    renderSummary(result.summary);
    renderChanges(result.changes);
    flash();
  }

  function clear() {
    currentChanges = [];
    currentSummary = null;
    activeFilter = "all";
    updateActiveFilterButton();
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

    const filteredChanges = activeFilter === "all"
      ? changes
      : changes.filter((change) => change.type === activeFilter);

    updateFilteredSummary(filteredChanges.length);

    if (changes.length === 0) {
      elements.empty.hidden = false;
      elements.empty.textContent = "The two JSON documents are semantically equal.";
      return;
    }

    if (filteredChanges.length === 0) {
      elements.empty.hidden = false;
      elements.empty.textContent = "No differences match the selected filter.";
      return;
    }

    elements.empty.hidden = true;

    for (const change of filteredChanges) {
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

    values.appendChild(createValueBlock("Left", change.leftValue, change.leftType, "left"));
    values.appendChild(createValueBlock("Right", change.rightValue, change.rightType, "right"));

    item.appendChild(header);
    item.appendChild(values);

    return item;
  }

  function createValueBlock(label, value, type, side) {
    const block = document.createElement("div");
    block.className = "diff-value-block";

    const title = document.createElement("span");
    title.className = "diff-value-title";
    title.textContent = `${label} · ${type}`;

    const pre = document.createElement("pre");
    pre.textContent = formatDiffValue(value);

    const actions = document.createElement("div");
    actions.className = "diff-copy-actions";

    const copyButton = document.createElement("button");
    copyButton.className = "diff-value-copy-button";
    copyButton.type = "button";
    copyButton.textContent = `Copy ${side}`;
    copyButton.dataset.diffCopy = formatCopyPayload(value);
    copyButton.dataset.diffCopyMessage = `${label} value copied.`;
    copyButton.disabled = value === undefined;

    actions.appendChild(copyButton);

    block.appendChild(title);
    block.appendChild(pre);
    block.appendChild(actions);

    return block;
  }

  function updateFilteredSummary(filteredCount) {
    if (!currentSummary) {
      return;
    }

    if (currentSummary.total === 0) {
      elements.summary.textContent = "No differences found.";
      return;
    }

    const filterLabel = activeFilter === "all" ? "all differences" : `${activeFilter} differences`;
    elements.summary.textContent = `${filteredCount} shown (${filterLabel}) · ${currentSummary.total} total · ${currentSummary.added} added · ${currentSummary.removed} removed · ${currentSummary.changed} changed · ${currentSummary["type-changed"]} type changed`;
  }

  function updateActiveFilterButton() {
    elements.filterButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.diffFilter === activeFilter);
    });
  }

  function formatCopyPayload(value) {
    if (value === undefined) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    return JSON.stringify(value, null, 2);
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

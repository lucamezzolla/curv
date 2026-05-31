function createElement(tagName, className, textContent = "") {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}

export function createTreeView(elements, callbacks = {}) {
  let currentData = null;
  let nodeId = 0;
  let totalNodeCount = 0;
  let selectedNodeId = null;
  const nodeValues = new Map();
  const nodePaths = new Map();
  const nodeTypes = new Map();
  const nodeLabels = new Map();

  elements.search.addEventListener("input", () => {
    renderCurrent({ flash: false });
  });

  elements.clearSearchButton.addEventListener("click", () => {
    elements.search.value = "";
    renderCurrent();
    elements.search.focus();
  });

  elements.expandAllButton.addEventListener("click", () => {
    setAllDetailsOpen(true);
  });

  elements.collapseAllButton.addEventListener("click", () => {
    setAllDetailsOpen(false);
  });

  elements.container.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-tree-action]");

    if (!button) {
      return;
    }

    const id = button.dataset.treeNodeId;
    const action = button.dataset.treeAction;

    if (action === "select-node") {
      selectNode(id);
      return;
    }

    if (action === "copy-path") {
      await copyValue(nodePaths.get(id), "Path copied.");
      return;
    }

    if (action === "copy-value") {
      await copyValue(formatCopyValue(nodeValues.get(id)), "Value copied.");
    }
  });

  elements.copySelectedPathButton.addEventListener("click", async () => {
    if (!selectedNodeId) {
      return;
    }

    await copyValue(nodePaths.get(selectedNodeId), "Selected path copied.");
  });

  elements.copySelectedValueButton.addEventListener("click", async () => {
    if (!selectedNodeId) {
      return;
    }

    await copyValue(formatCopyValue(nodeValues.get(selectedNodeId)), "Selected value copied.");
  });

  function render(data) {
    currentData = data;
    totalNodeCount = countNodes(data);
    renderCurrent();
  }

  function clear(message = "Validate JSON to generate the tree view.") {
    currentData = null;
    totalNodeCount = 0;
    selectedNodeId = null;
    nodeValues.clear();
    nodePaths.clear();
    nodeTypes.clear();
    nodeLabels.clear();
    elements.container.innerHTML = "";
    updateSelectionPanel(null);
    elements.resultStats.textContent = "No tree generated yet.";
    elements.empty.textContent = message;
    elements.empty.hidden = false;
  }

  function renderCurrent({ flash = true } = {}) {
    nodeId = 0;
    nodeValues.clear();
    nodePaths.clear();
    nodeTypes.clear();
    nodeLabels.clear();
    elements.container.innerHTML = "";

    if (currentData === null || currentData === undefined) {
      clear();
      return;
    }

    const query = elements.search.value.trim().toLowerCase();
    const rendered = renderNode(currentData, "$", "root", 0, query);

    if (!rendered) {
      elements.resultStats.textContent = query
        ? `0 matching nodes out of ${formatNumber(totalNodeCount)}.`
        : `0 nodes.`;
      elements.empty.textContent = "No matching nodes found.";
      elements.empty.hidden = false;
      return;
    }

    elements.empty.hidden = true;
    elements.container.appendChild(rendered.element);
    elements.resultStats.textContent = query
      ? `${formatNumber(nodeValues.size)} matching nodes out of ${formatNumber(totalNodeCount)}.`
      : `${formatNumber(totalNodeCount)} nodes in this JSON tree.`;

    if (flash) {
      flashPanel();
    }
  }

  function renderNode(value, path, label, depth, query) {
    const id = String(nodeId++);
    const type = getValueType(value);
    const preview = getPreview(value, type);
    const searchableText = `${label} ${path} ${type} ${preview}`.toLowerCase();

    nodeValues.set(id, value);
    nodePaths.set(id, path);
    nodeTypes.set(id, type);
    nodeLabels.set(id, label);

    if (type === "object" || type === "array") {
      const entries = type === "array"
        ? value.map((childValue, index) => [String(index), childValue])
        : Object.entries(value);

      const children = entries
        .map(([childKey, childValue]) => {
          const childPath = type === "array"
            ? `${path}[${childKey}]`
            : joinObjectPath(path, childKey);

          return renderNode(childValue, childPath, childKey, depth + 1, query);
        })
        .filter(Boolean);

      const matches = !query || searchableText.includes(query) || children.length > 0;

      if (!matches) {
        return null;
      }

      const details = createElement("details", "tree-node tree-node-branch");
      details.open = depth < 2 || Boolean(query);

      const summary = createElement("summary", "tree-summary");
      summary.appendChild(createNodeHeader(id, label, path, type, preview));
      details.appendChild(summary);

      const childrenContainer = createElement("div", "tree-children");

      for (const child of children) {
        childrenContainer.appendChild(child.element);
      }

      details.appendChild(childrenContainer);

      return {
        element: details,
      };
    }

    const matches = !query || searchableText.includes(query);

    if (!matches) {
      return null;
    }

    const item = createElement("div", "tree-node tree-node-leaf");
    item.appendChild(createNodeHeader(id, label, path, type, preview));

    return {
      element: item,
    };
  }

  function createNodeHeader(id, label, path, type, preview) {
    const header = createElement("div", selectedNodeId === id ? "tree-node-header is-selected" : "tree-node-header");

    const main = createElement("button", "tree-node-main tree-node-select");
    main.type = "button";
    main.dataset.treeAction = "select-node";
    main.dataset.treeNodeId = id;

    const labelElement = createElement("span", "tree-node-label", label);
    const typeElement = createElement("span", `tree-node-type tree-node-type-${type}`, type);
    const previewElement = createElement("span", "tree-node-preview", preview);

    main.appendChild(labelElement);
    main.appendChild(typeElement);

    if (preview) {
      main.appendChild(previewElement);
    }

    const actions = createElement("div", "tree-node-actions");

    actions.appendChild(createActionButton("copy-path", id, "Copy path"));
    actions.appendChild(createActionButton("copy-value", id, "Copy value"));

    header.appendChild(main);
    header.appendChild(actions);

    header.title = path;

    return header;
  }

  function createActionButton(action, id, label) {
    const button = createElement("button", "tree-action-button", label);

    button.type = "button";
    button.dataset.treeAction = action;
    button.dataset.treeNodeId = id;

    return button;
  }

  function selectNode(id) {
    selectedNodeId = id;
    updateSelectionPanel(id);
    highlightSelectedNode();
  }

  function updateSelectionPanel(id) {
    if (!id) {
      elements.selectedTitle.textContent = "No node selected";
      elements.selectedPath.textContent = "Select a node from the tree to inspect its path and value.";
      elements.selectedType.textContent = "—";
      elements.copySelectedPathButton.disabled = true;
      elements.copySelectedValueButton.disabled = true;
      return;
    }

    const type = nodeTypes.get(id);
    const label = nodeLabels.get(id);
    const path = nodePaths.get(id);
    const value = nodeValues.get(id);

    elements.selectedTitle.textContent = label;
    elements.selectedPath.textContent = path;
    elements.selectedType.textContent = type;
    elements.copySelectedPathButton.disabled = false;
    elements.copySelectedValueButton.disabled = false;
    elements.selectedPath.title = getSelectionPreview(value, type);
  }

  function highlightSelectedNode() {
    elements.container.querySelectorAll(".tree-node-header.is-selected").forEach((node) => {
      node.classList.remove("is-selected");
    });

    if (!selectedNodeId) {
      return;
    }

    const selectedButton = elements.container.querySelector(`[data-tree-node-id="${selectedNodeId}"][data-tree-action="select-node"]`);
    selectedButton?.closest(".tree-node-header")?.classList.add("is-selected");
  }

  function setAllDetailsOpen(open) {
    elements.container.querySelectorAll("details").forEach((details) => {
      details.open = open;
    });
  }

  function flashPanel() {
    elements.panel.classList.remove("is-flashing");

    window.requestAnimationFrame(() => {
      elements.panel.classList.add("is-flashing");
    });
  }

  async function copyValue(value, successMessage) {
    if (value === undefined) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(value));
      callbacks.onCopy?.(successMessage);
    } catch {
      callbacks.onCopy?.("Unable to copy value.");
    }
  }

  function formatCopyValue(value) {
    if (typeof value === "string") {
      return value;
    }

    if (value === undefined) {
      return "";
    }

    return JSON.stringify(value, null, 2);
  }

  return {
    render,
    clear,
  };
}

function getSelectionPreview(value, type) {
  if (type === "string") {
    return value;
  }

  if (type === "object" || type === "array") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function countNodes(value) {
  if (Array.isArray(value)) {
    return 1 + value.reduce((total, item) => total + countNodes(item), 0);
  }

  if (value !== null && typeof value === "object") {
    return 1 + Object.values(value).reduce((total, item) => total + countNodes(item), 0);
  }

  return 1;
}

function formatNumber(value) {
  return value.toLocaleString();
}

function getValueType(value) {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  return typeof value === "object" ? "object" : typeof value;
}

function getPreview(value, type) {
  if (type === "object") {
    return `${Object.keys(value).length} keys`;
  }

  if (type === "array") {
    return `${value.length} items`;
  }

  if (type === "string") {
    return JSON.stringify(value.length > 80 ? `${value.slice(0, 80)}…` : value);
  }

  if (type === "null") {
    return "null";
  }

  return String(value);
}

function joinObjectPath(parentPath, key) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return `${parentPath}.${key}`;
  }

  return `${parentPath}[${JSON.stringify(key)}]`;
}

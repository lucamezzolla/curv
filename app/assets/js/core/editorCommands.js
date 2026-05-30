export function indentSelection(editor, indentText) {
  const selection = editor.getSelection();

  if (selection.start === selection.end) {
    editor.insertAtSelection(indentText);
    return;
  }

  const input = editor.getInput();
  const lineStart = input.lastIndexOf("\n", selection.start - 1) + 1;
  const selectedBlock = input.slice(lineStart, selection.end);
  const indentedBlock = selectedBlock
    .split("\n")
    .map((line) => `${indentText}${line}`)
    .join("\n");

  editor.replaceSelection(lineStart, selection.end, indentedBlock);
}

export function unindentSelection(editor, indentSize) {
  const selection = editor.getSelection();
  const input = editor.getInput();
  const lineStart = input.lastIndexOf("\n", selection.start - 1) + 1;
  const selectedBlock = input.slice(lineStart, selection.end || selection.start);

  if (!selectedBlock) {
    removeIndentBeforeCursor(editor, indentSize);
    return;
  }

  const lines = selectedBlock.split("\n");
  const unindentedBlock = lines
    .map((line) => removeLineIndent(line, indentSize))
    .join("\n");

  editor.replaceSelection(lineStart, lineStart + selectedBlock.length, unindentedBlock);
}

function removeIndentBeforeCursor(editor, indentSize) {
  const selection = editor.getSelection();
  const input = editor.getInput();
  const lineStart = input.lastIndexOf("\n", selection.start - 1) + 1;
  const beforeCursor = input.slice(lineStart, selection.start);
  const removableSpaces = Math.min(countTrailingSpaces(beforeCursor), indentSize);

  if (removableSpaces === 0) {
    return;
  }

  editor.replaceSelection(
    selection.start - removableSpaces,
    selection.start,
    "",
    0
  );
}

function removeLineIndent(line, indentSize) {
  if (line.startsWith(" ".repeat(indentSize))) {
    return line.slice(indentSize);
  }

  if (line.startsWith("\t")) {
    return line.slice(1);
  }

  return line.replace(/^ {1,}/, "");
}

function countTrailingSpaces(value) {
  const match = value.match(/ +$/);
  return match ? match[0].length : 0;
}

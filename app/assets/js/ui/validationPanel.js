const PANEL_CLASSES = {
  valid: "is-valid",
  invalid: "is-invalid",
};

const BADGE_CLASSES = {
  neutral: "validation-badge-neutral",
  valid: "validation-badge-valid",
  invalid: "validation-badge-invalid",
};

export function createValidationPanel(elements) {
  function setIdle() {
    setPanelState("neutral");
    elements.title.textContent = "Not checked yet";
    elements.badge.textContent = "Idle";
    elements.message.textContent = "Run validation or format JSON to inspect the current input.";
    setDetails();
  }

  function setValid() {
    setPanelState("valid");
    elements.title.textContent = "JSON is valid";
    elements.badge.textContent = "Valid";
    elements.message.textContent = "Curv parsed the input successfully. No syntax issues were found.";
    setDetails();
  }

  function setInvalid(error) {
    const details = error?.details ?? {};

    setPanelState("invalid");
    elements.title.textContent = "JSON is invalid";
    elements.badge.textContent = "Invalid";
    elements.message.textContent = details.rawMessage
      ? `Parser message: ${details.rawMessage}`
      : error?.message ?? "The input could not be parsed as JSON.";

    setDetails({
      line: details.line,
      column: details.column,
      position: details.position,
    });
  }

  function setFromValidation(validation) {
    if (validation.valid) {
      setValid();
      return;
    }

    setInvalid(validation.error);
  }

  function flash() {
    elements.panel.classList.remove("is-flashing");

    window.requestAnimationFrame(() => {
      elements.panel.classList.add("is-flashing");
    });
  }

  function setPanelState(state) {
    elements.panel.classList.remove(PANEL_CLASSES.valid, PANEL_CLASSES.invalid);
    elements.badge.classList.remove(
      BADGE_CLASSES.neutral,
      BADGE_CLASSES.valid,
      BADGE_CLASSES.invalid
    );

    if (state === "valid") {
      elements.panel.classList.add(PANEL_CLASSES.valid);
      elements.badge.classList.add(BADGE_CLASSES.valid);
      return;
    }

    if (state === "invalid") {
      elements.panel.classList.add(PANEL_CLASSES.invalid);
      elements.badge.classList.add(BADGE_CLASSES.invalid);
      return;
    }

    elements.badge.classList.add(BADGE_CLASSES.neutral);
  }

  function setDetails(details = {}) {
    elements.line.textContent = formatDetail(details.line);
    elements.column.textContent = formatDetail(details.column);
    elements.position.textContent = formatDetail(details.position);
  }

  function formatDetail(value) {
    return value === null || value === undefined ? "—" : value.toLocaleString();
  }

  return {
    setIdle,
    setValid,
    setInvalid,
    setFromValidation,
    flash,
  };
}

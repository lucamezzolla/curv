const STATUS_CLASSES = {
  success: "is-success",
  error: "is-error",
  warning: "is-warning",
};

export function createNotificationCenter(statusBarElement, statusMessageElement) {
  function setStatus(message, type = "neutral") {
    statusMessageElement.textContent = message;

    statusBarElement.classList.remove(
      STATUS_CLASSES.success,
      STATUS_CLASSES.error,
      STATUS_CLASSES.warning
    );

    if (type === "success") {
      statusBarElement.classList.add(STATUS_CLASSES.success);
    }

    if (type === "error") {
      statusBarElement.classList.add(STATUS_CLASSES.error);
    }

    if (type === "warning") {
      statusBarElement.classList.add(STATUS_CLASSES.warning);
    }
  }

  return {
    setStatus,
  };
}

export function formatCurrency(amount, currency = "RUB") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatShortDate(dateStr) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function showAlert(container, message, type = "error") {
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

export function clearAlert(container) {
  container.innerHTML = "";
}

export function setLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = "Загрузка…";
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

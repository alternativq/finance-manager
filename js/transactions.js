import { getSupabase, requireAuth } from "./supabase.js";
import { initLayout } from "./layout.js";
import {
  formatCurrency,
  formatShortDate,
  showAlert,
  clearAlert,
  setLoading,
  todayISO,
} from "./utils.js";

const session = await requireAuth();
if (!session) throw new Error("Unauthorized");

await initLayout("transactions.html");

const supabase = getSupabase();
const userId = session.user.id;

let categories = [];
let currency = "RUB";
let allTransactions = [];

const form = document.getElementById("transaction-form");
const alertBox = document.getElementById("alert");
const tableBody = document.getElementById("transactions-body");
const typeSelect = document.getElementById("type");
const categorySelect = document.getElementById("category");
const filterSearch = document.getElementById("filter-search");
const filterType = document.getElementById("filter-type");
const filterCategory = document.getElementById("filter-category");
const filterDateFrom = document.getElementById("filter-date-from");
const filterDateTo = document.getElementById("filter-date-to");
const modal = document.getElementById("delete-modal");
const deleteConfirmBtn = document.getElementById("delete-confirm");
let pendingDeleteId = null;

async function loadData() {
  const [catRes, profileRes, txRes] = await Promise.all([
    supabase.from("categories").select("*").eq("user_id", userId).order("name"),
    supabase.from("profiles").select("currency").eq("id", userId).single(),
    supabase
      .from("transactions")
      .select("*, categories(name, color)")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  categories = catRes.data || [];
  currency = profileRes.data?.currency || "RUB";
  allTransactions = txRes.data || [];

  updateCategoryOptions();
  renderTransactions();
}

function updateCategoryOptions() {
  const type = typeSelect.value;
  const filtered = categories.filter((c) => c.type === type);

  categorySelect.innerHTML = filtered
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");

  const filterCatOptions = categories
    .map((c) => `<option value="${c.id}">${c.name} (${c.type === "income" ? "доход" : "расход"})</option>`)
    .join("");
  filterCategory.innerHTML = `<option value="">Все категории</option>${filterCatOptions}`;
}

function getFilteredTransactions() {
  const search = filterSearch.value.trim().toLowerCase();
  const type = filterType.value;
  const catId = filterCategory.value;
  const dateFrom = filterDateFrom.value;
  const dateTo = filterDateTo.value;

  return allTransactions.filter((t) => {
    if (type && t.type !== type) return false;
    if (catId && t.category_id !== catId) return false;
    if (dateFrom && t.transaction_date < dateFrom) return false;
    if (dateTo && t.transaction_date > dateTo) return false;
    if (search) {
      const desc = (t.description || "").toLowerCase();
      const catName = (t.categories?.name || "").toLowerCase();
      if (!desc.includes(search) && !catName.includes(search)) return false;
    }
    return true;
  });
}

function renderTransactions() {
  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Операции не найдены</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered
    .map(
      (t) => `
    <tr>
      <td>${formatShortDate(t.transaction_date)}</td>
      <td><span class="badge badge-${t.type}">${t.type === "income" ? "Доход" : "Расход"}</span></td>
      <td>${t.description || "—"}</td>
      <td>${
        t.categories
          ? `<span class="category-dot" style="background:${t.categories.color}"></span>${t.categories.name}`
          : "—"
      }</td>
      <td class="${t.type === "income" ? "card-value income" : "card-value expense"}" style="font-size:1rem">
        ${t.type === "income" ? "+" : "−"}${formatCurrency(t.amount, currency)}
      </td>
      <td>
        <button class="btn btn-danger btn-sm" data-delete="${t.id}">Удалить</button>
      </td>
    </tr>`
    )
    .join("");

  tableBody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingDeleteId = btn.dataset.delete;
      modal.classList.remove("hidden");
    });
  });
}

typeSelect.addEventListener("change", updateCategoryOptions);

form.date.value = todayISO();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert(alertBox);

  const submitBtn = form.querySelector('[type="submit"]');
  setLoading(submitBtn, true);

  try {
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: form.type.value,
      category_id: form.category.value || null,
      amount: parseFloat(form.amount.value),
      description: form.description.value.trim() || null,
      transaction_date: form.date.value,
    });

    if (error) throw error;

    showAlert(alertBox, "Операция добавлена", "success");
    form.amount.value = "";
    form.description.value = "";
    form.date.value = todayISO();
    await loadData();
  } catch (err) {
    showAlert(alertBox, err.message);
  } finally {
    setLoading(submitBtn, false);
  }
});

[filterSearch, filterType, filterCategory, filterDateFrom, filterDateTo].forEach((el) => {
  el.addEventListener("input", renderTransactions);
  el.addEventListener("change", renderTransactions);
});

document.getElementById("filter-reset")?.addEventListener("click", () => {
  filterSearch.value = "";
  filterType.value = "";
  filterCategory.value = "";
  filterDateFrom.value = "";
  filterDateTo.value = "";
  renderTransactions();
});

document.getElementById("delete-cancel")?.addEventListener("click", () => {
  pendingDeleteId = null;
  modal.classList.add("hidden");
});

deleteConfirmBtn?.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  setLoading(deleteConfirmBtn, true);

  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", pendingDeleteId)
      .eq("user_id", userId);

    if (error) throw error;
    modal.classList.add("hidden");
    pendingDeleteId = null;
    await loadData();
  } catch (err) {
    showAlert(alertBox, err.message);
  } finally {
    setLoading(deleteConfirmBtn, false);
  }
});

await loadData();

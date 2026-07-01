import { getSupabase, requireAuth } from "./supabase.js";
import { initLayout } from "./layout.js";
import { formatCurrency, formatShortDate } from "./utils.js";

const session = await requireAuth();
if (!session) throw new Error("Unauthorized");

await initLayout("dashboard.html");

const supabase = getSupabase();
const userId = session.user.id;

const [balanceRes, recentRes, profileRes] = await Promise.all([
  supabase.from("transactions").select("type, amount").eq("user_id", userId),
  supabase
    .from("transactions")
    .select("*, categories(name, color)")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5),
  supabase.from("profiles").select("currency").eq("id", userId).single(),
]);

const currency = profileRes.data?.currency || "RUB";
const transactions = balanceRes.data || [];

let totalIncome = 0;
let totalExpense = 0;
for (const t of transactions) {
  if (t.type === "income") totalIncome += Number(t.amount);
  else totalExpense += Number(t.amount);
}
const balance = totalIncome - totalExpense;

document.getElementById("balance-value").textContent = formatCurrency(balance, currency);
document.getElementById("income-value").textContent = formatCurrency(totalIncome, currency);
document.getElementById("expense-value").textContent = formatCurrency(totalExpense, currency);

const recentList = document.getElementById("recent-transactions");
const recent = recentRes.data || [];

if (recent.length === 0) {
  recentList.innerHTML = `
    <div class="empty-state">
      <p>Операций пока нет</p>
      <a href="transactions.html" class="btn btn-primary" style="margin-top:1rem">Добавить первую</a>
    </div>`;
} else {
  recentList.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Описание</th>
            <th>Категория</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          ${recent
            .map(
              (t) => `
            <tr>
              <td>${formatShortDate(t.transaction_date)}</td>
              <td>${t.description || "—"}</td>
              <td>
                ${
                  t.categories
                    ? `<span class="category-dot" style="background:${t.categories.color}"></span>${t.categories.name}`
                    : "—"
                }
              </td>
              <td class="${t.type === "income" ? "card-value income" : "card-value expense"}" style="font-size:1rem">
                ${t.type === "income" ? "+" : "−"}${formatCurrency(t.amount, currency)}
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

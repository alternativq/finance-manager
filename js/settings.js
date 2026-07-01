import { getSupabase, requireAuth } from "./supabase.js";
import { initLayout } from "./layout.js";
import { showAlert } from "./utils.js";

const session = await requireAuth();
if (!session) throw new Error("Unauthorized");

await initLayout("settings.html");

const supabase = getSupabase();
const userId = session.user.id;
const exportBtn = document.getElementById("export-btn");
const importInput = document.getElementById("import-file");
const backupBtn = document.getElementById("backup-btn");
const alertBox = document.getElementById("alert");

exportBtn?.addEventListener("click", async () => {
  try {
    const [transactions, categories, budgets, goals, subscriptions] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId),
      supabase.from("categories").select("*").eq("user_id", userId),
      supabase.from("budgets").select("*").eq("user_id", userId),
      supabase.from("financial_goals").select("*").eq("user_id", userId),
      supabase.from("subscriptions").select("*").eq("user_id", userId),
    ]);

    const data = {
      exported_at: new Date().toISOString(),
      transactions: transactions.data,
      categories: categories.data,
      budgets: budgets.data,
      financial_goals: goals.data,
      subscriptions: subscriptions.data,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert(alertBox, "Данные экспортированы", "success");
  } catch (err) {
    showAlert(alertBox, err.message);
  }
});

importInput?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.transactions) {
      throw new Error("Неверный формат файла");
    }

    const confirmed = confirm(
      "Импорт добавит транзакции из файла. Продолжить?"
    );
    if (!confirmed) return;

    const toInsert = (data.transactions || []).map((t) => ({
      user_id: userId,
      type: t.type,
      amount: t.amount,
      description: t.description,
      transaction_date: t.transaction_date,
      category_id: null,
    }));

    if (toInsert.length > 0) {
      const { error } = await supabase.from("transactions").insert(toInsert);
      if (error) throw error;
    }

    showAlert(alertBox, `Импортировано ${toInsert.length} операций`, "success");
  } catch (err) {
    showAlert(alertBox, err.message);
  } finally {
    importInput.value = "";
  }
});

backupBtn?.addEventListener("click", async () => {
  try {
    const [transactions, categories, budgets, goals, subscriptions] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId),
      supabase.from("categories").select("*").eq("user_id", userId),
      supabase.from("budgets").select("*").eq("user_id", userId),
      supabase.from("financial_goals").select("*").eq("user_id", userId),
      supabase.from("subscriptions").select("*").eq("user_id", userId),
    ]);

    const data = {
      transactions: transactions.data,
      categories: categories.data,
      budgets: budgets.data,
      financial_goals: goals.data,
      subscriptions: subscriptions.data,
    };

    const name = `Резервная копия ${new Date().toLocaleDateString("ru-RU")}`;

    const { error } = await supabase.from("backups").insert({
      user_id: userId,
      name,
      data,
    });

    if (error) throw error;
    showAlert(alertBox, "Резервная копия сохранена в облаке", "success");
  } catch (err) {
    showAlert(alertBox, err.message);
  }
});

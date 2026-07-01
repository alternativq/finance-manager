import { getSupabase, getUser } from "./supabase.js";

const NAV_ITEMS = [
  { href: "dashboard.html", label: "Обзор", icon: "📊" },
  { href: "transactions.html", label: "Операции", icon: "💳" },
  { href: "statistics.html", label: "Статистика", icon: "📈" },
  { href: "budgets.html", label: "Бюджеты", icon: "🎯" },
  { href: "subscriptions.html", label: "Подписки", icon: "🔔" },
  { href: "settings.html", label: "Настройки", icon: "⚙️" },
];

export async function initLayout(activePage) {
  const user = await getUser();
  if (!user) return;

  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  const navLinks = NAV_ITEMS.map(
    (item) => `
      <a href="${item.href}" class="nav-link ${item.href === activePage ? "active" : ""}">
        <span>${item.icon}</span>
        ${item.label}
      </a>
    `
  ).join("");

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">💰</div>
      Менеджер финансов
    </div>
    <nav class="sidebar-nav">${navLinks}</nav>
    <div class="user-info">
      <div class="user-email">${user.email}</div>
      <button id="logout-btn" class="btn btn-secondary btn-sm btn-block" style="margin-top:0.5rem">
        Выйти
      </button>
    </div>
  `;

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });
}

import { requireAuth } from "./supabase.js";
import { initLayout } from "./layout.js";

const session = await requireAuth();
if (!session) throw new Error("Unauthorized");

await initLayout("statistics.html");

// Графики — этап 5. Chart.js подключён через CDN, логика будет добавлена позже.
document.getElementById("stats-placeholder").classList.remove("hidden");

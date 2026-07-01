import { getSupabase, redirectIfAuthed } from "./supabase.js";
import { showAlert, clearAlert, setLoading } from "./utils.js";

await redirectIfAuthed();

const form = document.getElementById("login-form");
const alertBox = document.getElementById("alert");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert(alertBox);

  const email = form.email.value.trim();
  const password = form.password.value;
  const submitBtn = form.querySelector('[type="submit"]');

  if (!email || !password) {
    showAlert(alertBox, "Заполните все поля");
    return;
  }

  setLoading(submitBtn, true);

  try {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showAlert(alertBox, translateError(error.message));
      return;
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    showAlert(alertBox, err.message);
  } finally {
    setLoading(submitBtn, false);
  }
});

function translateError(msg) {
  if (msg.includes("Invalid login credentials")) {
    return "Неверный email или пароль";
  }
  if (msg.includes("Email not confirmed")) {
    return "Подтвердите email — проверьте почту";
  }
  return msg;
}

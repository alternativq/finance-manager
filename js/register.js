import { getSupabase, redirectIfAuthed } from "./supabase.js";
import { showAlert, clearAlert, setLoading } from "./utils.js";

await redirectIfAuthed();

const form = document.getElementById("register-form");
const alertBox = document.getElementById("alert");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert(alertBox);

  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirm = form.confirm.value;
  const submitBtn = form.querySelector('[type="submit"]');

  if (!email || !password) {
    showAlert(alertBox, "Заполните обязательные поля");
    return;
  }

  if (password.length < 6) {
    showAlert(alertBox, "Пароль должен быть не менее 6 символов");
    return;
  }

  if (password !== confirm) {
    showAlert(alertBox, "Пароли не совпадают");
    return;
  }

  setLoading(submitBtn, true);

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      showAlert(alertBox, error.message);
      return;
    }

    if (data.session) {
      window.location.href = "dashboard.html";
    } else {
      showAlert(
        alertBox,
        "Аккаунт создан! Проверьте почту для подтверждения, затем войдите.",
        "success"
      );
      form.reset();
    }
  } catch (err) {
    showAlert(alertBox, err.message);
  } finally {
    setLoading(submitBtn, false);
  }
});

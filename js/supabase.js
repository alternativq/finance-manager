import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm";

let client = null;

export function getSupabase() {
  if (!window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.anonKey) {
    throw new Error(
      "Не настроен Supabase. Скопируйте js/config.example.js в js/config.js и укажите URL и ключ."
    );
  }

  if (
    window.SUPABASE_CONFIG.url.includes("your-project") ||
    window.SUPABASE_CONFIG.anonKey.includes("your-anon")
  ) {
    throw new Error(
      "Замените placeholder-значения в js/config.js на реальные данные из Supabase Dashboard."
    );
  }

  if (!client) {
    client = createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
  }

  return client;
}

export async function getSession() {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth(redirectTo = "login.html") {
  const session = await getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

export async function redirectIfAuthed(redirectTo = "dashboard.html") {
  const session = await getSession();
  if (session) {
    window.location.href = redirectTo;
  }
}

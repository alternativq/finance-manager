-- Менеджер финансов — полная схема БД для Supabase
-- Выполните в SQL Editor вашего проекта Supabase

-- ============================================================
-- 1. Профили пользователей
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  currency text not null default 'RUB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. Категории доходов/расходов
-- ============================================================
create type public.transaction_type as enum ('income', 'expense');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type public.transaction_type not null,
  icon text default 'tag',
  color text default '#6366f1',
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

-- ============================================================
-- 3. Транзакции (доходы и расходы)
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  description text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
create index transactions_user_type_idx on public.transactions (user_id, type);

-- ============================================================
-- 4. Бюджеты
-- ============================================================
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  period text not null default 'monthly' check (period in ('weekly', 'monthly', 'yearly')),
  start_date date not null default date_trunc('month', current_date)::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. Финансовые цели
-- ============================================================
create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  deadline date,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 6. Подписки
-- ============================================================
create type public.billing_period as enum ('weekly', 'monthly', 'quarterly', 'yearly');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  billing_period public.billing_period not null default 'monthly',
  next_billing_date date not null,
  category_id uuid references public.categories (id) on delete set null,
  is_active boolean not null default true,
  notify_days_before integer not null default 3 check (notify_days_before >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 7. Уведомления
-- ============================================================
create type public.notification_type as enum (
  'budget_exceeded',
  'subscription_reminder',
  'goal_reached',
  'goal_deadline'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, is_read, created_at desc);

-- ============================================================
-- 8. Резервные копии
-- ============================================================
create table public.backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Функции и триггеры
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger transactions_updated_at before update on public.transactions
  for each row execute function public.handle_updated_at();
create trigger budgets_updated_at before update on public.budgets
  for each row execute function public.handle_updated_at();
create trigger financial_goals_updated_at before update on public.financial_goals
  for each row execute function public.handle_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- Автосоздание профиля и категорий по умолчанию при регистрации
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );

  insert into public.categories (user_id, name, type, icon, color) values
    (new.id, 'Зарплата', 'income', 'briefcase', '#22c55e'),
    (new.id, 'Фриланс', 'income', 'laptop', '#10b981'),
    (new.id, 'Подарки', 'income', 'gift', '#14b8a6'),
    (new.id, 'Продукты', 'expense', 'shopping-cart', '#ef4444'),
    (new.id, 'Транспорт', 'expense', 'car', '#f97316'),
    (new.id, 'Жильё', 'expense', 'home', '#eab308'),
    (new.id, 'Развлечения', 'expense', 'gamepad-2', '#a855f7'),
    (new.id, 'Здоровье', 'expense', 'heart-pulse', '#ec4899'),
    (new.id, 'Образование', 'expense', 'graduation-cap', '#3b82f6'),
    (new.id, 'Прочее', 'expense', 'more-horizontal', '#6b7280');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Представление баланса пользователя
create or replace view public.user_balance as
select
  user_id,
  coalesce(sum(case when type = 'income' then amount else 0 end), 0) as total_income,
  coalesce(sum(case when type = 'expense' then amount else 0 end), 0) as total_expense,
  coalesce(sum(case when type = 'income' then amount else -amount end), 0) as balance
from public.transactions
group by user_id;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.financial_goals enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.backups enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Categories
create policy "Users can manage own categories" on public.categories
  for all using (auth.uid() = user_id);

-- Transactions
create policy "Users can manage own transactions" on public.transactions
  for all using (auth.uid() = user_id);

-- Budgets
create policy "Users can manage own budgets" on public.budgets
  for all using (auth.uid() = user_id);

-- Financial goals
create policy "Users can manage own goals" on public.financial_goals
  for all using (auth.uid() = user_id);

-- Subscriptions
create policy "Users can manage own subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id);

-- Notifications
create policy "Users can manage own notifications" on public.notifications
  for all using (auth.uid() = user_id);

-- Backups
create policy "Users can manage own backups" on public.backups
  for all using (auth.uid() = user_id);

-- Balance view (read-only через security invoker)
grant select on public.user_balance to authenticated;

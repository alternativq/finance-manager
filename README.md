# Менеджер финансов

Статический веб-сайт для учёта личных финансов. **Node.js не нужен** — только HTML, CSS, JavaScript и Supabase.

## Стек

- HTML / CSS / JavaScript (ES modules)
- [Supabase](https://supabase.com) — база данных, авторизация, RLS
- Supabase JS SDK через CDN (jsDelivr)

## Этапы разработки

| Этап | Статус | Описание |
|------|--------|----------|
| 1 | ✅ | БД + регистрация/вход |
| 2 | ✅ | Добавление доходов и расходов |
| 3 | ✅ | Личный кабинет с балансом |
| 4 | ✅ | История операций с поиском и фильтрами |
| 5 | 🔜 | Графики и статистика |
| 6 | 🔜 | Бюджеты и финансовые цели |
| 7 | 🔜 | Подписки и уведомления |
| 8 | ✅ | Экспорт, импорт, резервное копирование |

## Быстрый старт

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Откройте **SQL Editor** и выполните скрипт `supabase/schema.sql`
3. В **Authentication → Providers → Email** включите Email (при желании отключите подтверждение email для разработки)
4. Скопируйте **Project URL** и **anon public key** из **Settings → API**

### 2. Конфигурация

```powershell
copy js\config.example.js js\config.js
```

Откройте `js/config.js` и вставьте ваш URL и anon key.

### 3. Запуск локально

Сайт нужно открывать через локальный сервер (не `file://`), иначе ES modules и Supabase Auth не работают.

**Вариант A — Python (если установлен):**
```powershell
cd C:\Users\danek\Projects\finance-manager
python -m http.server 5500
```
Откройте http://localhost:5500

**Вариант B — расширение Live Server в VS Code / Cursor**

**Вариант C — любой статический хостинг** (GitHub Pages, Netlify, Cloudflare Pages)

### 4. Supabase Auth — redirect URLs

В Supabase Dashboard → **Authentication → URL Configuration** добавьте:
- `http://localhost:5500`
- ваш продакшен-домен (если есть)

## Структура проекта

```
finance-manager/
├── index.html          # Главная
├── login.html          # Вход
├── register.html       # Регистрация
├── dashboard.html      # Обзор и баланс
├── transactions.html   # Операции
├── statistics.html     # Статистика (этап 5)
├── budgets.html        # Бюджеты (этап 6)
├── subscriptions.html  # Подписки (этап 7)
├── settings.html       # Экспорт/импорт
├── css/styles.css
├── js/
│   ├── config.js       # Ваши ключи Supabase (не коммитить)
│   ├── supabase.js     # Клиент Supabase
│   ├── auth, dashboard, transactions…
└── supabase/schema.sql # SQL-схема БД
```

## Деплой

Загрузите все файлы на любой статический хостинг. Единственное требование — `js/config.js` с ключами Supabase. Anon key безопасен для клиента (защита через RLS).

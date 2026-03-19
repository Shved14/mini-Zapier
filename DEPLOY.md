# mini-Zapier — Развёртывание и проверка

## Архитектура

```
Frontend (:3007)  →  API Gateway (:3000)  →  Auth Service (:3001)
                                           →  Workflow Service (:3002)
                                           →  Execution Service (:3003)
                                           →  Notification Service (:3006)
                                           →  Realtime Service (:3010)

PostgreSQL (:5433)   Redis (:6379)
```

---

## Вариант 1: Docker Compose (рекомендуется)

### Требования
- Docker Desktop с поддержкой docker-compose
- ~4 GB RAM свободно

### Запуск

```bash
# 1. Перейти в корень проекта
cd mini-Zapier

# 2. Поднять всё одной командой
docker-compose up --build -d

# 3. Применить миграции Prisma (первый запуск)
docker exec mz-auth npx prisma db push
docker exec mz-workflow npx prisma db push
docker exec mz-notification npx prisma db push

# 4. Проверить что все контейнеры работают
docker-compose ps
```

### Проверка здоровья

```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Workflow Service
curl http://localhost:3002/health

# Execution Service
curl http://localhost:3003/health

# Notification Service
curl http://localhost:3006/health

# Realtime Service
curl http://localhost:3010/health

# Frontend
curl http://localhost:3007/
```

### Функциональная проверка

```bash
# 1. Регистрация пользователя
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test"}'

# Запомнить token из ответа, подставить ниже

# 2. Логин
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# 3. Создать workflow (подставить свой токен)
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Test Workflow","triggerType":"webhook"}'

# 4. Получить список workflows
curl http://localhost:3000/workflows \
  -H "Authorization: Bearer <TOKEN>"
```

### Логи

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f auth-service
docker-compose logs -f api-gateway
```

### Остановка

```bash
docker-compose down

# С удалением данных
docker-compose down -v
```

---

## Вариант 2: Локальный запуск (без Docker)

### Требования
- Node.js 18+
- PostgreSQL 16 (порт 5433 или 5432)
- Redis 7 (порт 6379)

### 1. Поднять инфраструктуру

```bash
# Только БД и Redis через Docker
docker-compose up postgres redis -d
```

### 2. Установить зависимости и мигрировать

```bash
# Auth Service
cd services/auth-service
npm install
npx prisma db push
npm run dev

# Workflow Service (в новом терминале)
cd services/workflow-service
npm install
npx prisma db push
npm run dev

# Execution Service (в новом терминале)
cd services/execution-service
npm install
npm run dev

# Notification Service (в новом терминале)
cd services/notification-service
npm install
npx prisma db push
npm run dev

# Realtime Service (в новом терминале)
cd services/realtime-service
npm install
npm run dev

# API Gateway (в новом терминале)
cd services/api-gateway
npm install
npm run dev

# Frontend (в новом терминале)
cd frontend
npm install
npm run dev
```

### 3. Открыть в браузере

```
http://localhost:3007
```

---

## Деплой на сервер (Production)

### Подготовка сервера (Ubuntu/Debian)

```bash
# 1. Установить Docker и docker-compose
curl -fsSL https://get.docker.com | sh
sudo apt install docker-compose-plugin -y

# 2. Клонировать проект
git clone <repo-url> /opt/mini-zapier
cd /opt/mini-zapier

# 3. Настроить .env для продакшена
cp .env .env.production
nano .env.production
```

### Что обязательно поменять в `.env.production`:

| Переменная | Описание |
|---|---|
| `JWT_SECRET` | Сгенерировать новый: `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | Сложный пароль для БД |
| `SMTP_*` | Реальный SMTP для отправки email |
| `TELEGRAM_BOT_TOKEN` | Настоящий токен бота |
| `CORS_ORIGIN` | URL вашего домена |

### Запуск на сервере

```bash
# Запуск с production env
docker-compose --env-file .env.production up --build -d

# Миграции
docker exec mz-auth npx prisma db push
docker exec mz-workflow npx prisma db push
docker exec mz-notification npx prisma db push
```

### Nginx reverse proxy (если нужен домен)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3007;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Порты

| Сервис | Порт |
|---|---|
| API Gateway | 3000 |
| Auth Service | 3001 |
| Workflow Service | 3002 |
| Execution Service | 3003 |
| Notification Service | 3006 |
| Realtime Service | 3010 |
| Frontend | 3007 |
| PostgreSQL | 5433 |
| Redis | 6379 |

---

## Troubleshooting

**Контейнер не стартует:**
```bash
docker-compose logs <service-name>
```

**Ошибка подключения к БД:**
```bash
# Проверить что postgres поднялся
docker exec mz-postgres pg_isready -U postgres
```

**Prisma миграция не работает:**
```bash
docker exec -it mz-auth sh
npx prisma db push --force-reset  # ОСТОРОЖНО: удалит данные
```

**Frontend не видит API:**
- Проверить что API Gateway на порту 3000 отвечает
- Проверить nginx.conf — все пути (`/auth`, `/workflows`, `/execute`) должны проксироваться

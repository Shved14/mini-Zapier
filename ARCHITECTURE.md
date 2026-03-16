# mini-Zapier - Микросервисная архитектура

## 🎯 Обзор проекта

**mini-Zapier** - это платформа автоматизации workflow, построенная на микросервисной архитектуре. Платформа позволяет пользователям создавать автоматические рабочие процессы между различными приложениями и сервисами.

## 🏗️ Архитектура

### Микросервисы

| Сервис | Порт | Описание | База данных |
|--------|------|----------|-------------|
| **API Gateway** | 3000 | Единая точка входа, авторизация, проксирование | - |
| **Auth Service** | 3001 | Аутентификация, OAuth, JWT | minizapier_auth |
| **Workflow Service** | 3002 | Управление workflow и шагами | minizapier_workflows |
| **Execution Service** | 3003 | Выполнение workflow, BullMQ очереди | minizapier_executions |
| **Trigger Service** | 3004 | Триггеры (webhook, cron, email) | minizapier_triggers |
| **Action Service** | 3005 | Действия (HTTP, email, Telegram, DB) | minizapier_actions |
| **Notification Service** | 3006 | Уведомления (email, Telegram, push) | minizapier_notifications |
| **Frontend** | 3007 | React приложение с визуальным редактором | - |

### Инфраструктура

| Компонент | Порт | Описание |
|-----------|------|----------|
| **PostgreSQL** | 5432 | Основная база данных (6 отдельных БД) |
| **Redis** | 6379 | Кэширование, сессии, очереди BullMQ |
| **Nginx** | 80/443 | Reverse proxy, SSL termination, rate limiting |

## 📋 Детальное описание сервисов

### 1. API Gateway (Порт 3000)

**Ответственности:**
- Единая точка входа для всех клиентских запросов
- JWT аутентификация и авторизация
- OAuth интеграция (Google, GitHub)
- Проксирование запросов к соответствующим сервисам
- Rate limiting и безопасность
- Swagger документация

**Технологический стек:**
- NestJS
- JWT + Passport
- OAuth (Google, GitHub)
- Winston (логирование)
- Helmet, Compression

**Основные эндпоинты:**
```
POST   /auth/login
POST   /auth/register
GET    /auth/oauth/google
GET    /auth/oauth/github
GET    /workflows/*
POST   /workflows/*
GET    /triggers/*
POST   /triggers/*
```

### 2. Auth Service (Порт 3001)

**Ответственности:**
- Регистрация и аутентификация пользователей
- OAuth интеграция
- Управление сессиями
- Восстановление пароля
- Подтверждение email

**База данных:**
```sql
Users (id, email, password_hash, name, created_at, updated_at)
Accounts (id, user_id, provider, provider_account_id, refresh_token)
Sessions (id, user_id, token, expires_at, created_at)
```

**Технологический стек:**
- NestJS + Prisma ORM
- bcryptjs для хэширования паролей
- JWT токены
- Email сервис для подтверждения

### 3. Workflow Service (Порт 3002)

**Ответственности:**
- Создание и хранение workflow
- Управление шагами и связями
- Валидация workflow
- Версионирование workflow

**База данных:**
```sql
Workflows (id, user_id, name, description, active, created_at, updated_at)
Steps (id, workflow_id, type, config, position_x, position_y, order)
Connections (id, workflow_id, from_step_id, to_step_id, condition)
```

**Типы шагов:**
- **Trigger**: Запуск workflow
- **Action**: Выполнение действий
- **Condition**: Условные переходы
- **Transform**: Преобразование данных

### 4. Execution Service (Порт 3003)

**Ответственности:**
- Выполнение workflow
- Управление очередями BullMQ
- Retry механизмы и обработка ошибок
- Логирование выполнений
- Мониторинг состояния

**База данных:**
```sql
WorkflowRuns (id, workflow_id, status, started_at, completed_at, error)
StepRuns (id, workflow_run_id, step_id, status, input_data, output_data, started_at, completed_at)
JobQueue (id, job_type, data, status, attempts, max_attempts, created_at)
```

**Технологический стек:**
- BullMQ для очередей
- Redis для хранения очередей
- Winston для логирования
- Retry механизмы с экспоненциальным backoff

### 5. Trigger Service (Порт 3004)

**Ответственности:**
- Webhook триггеры
- Cron-based планирование
- Email триггеры
- Управление подписками на события

**База данных:**
```sql
Triggers (id, workflow_id, type, config, active, created_at, updated_at)
WebhookEndpoints (id, trigger_id, endpoint_url, secret, active)
CronSchedules (id, trigger_id, cron_expression, timezone, next_run)
EmailTriggers (id, trigger_id, email_address, filters)
```

**Типы триггеров:**
- **Webhook**: HTTP эндпоинты для внешних систем
- **Cron**: Планировщик по времени
- **Email**: Триггеры по входящим email
- **Database**: Изменения в базе данных

### 6. Action Service (Порт 3005)

**Ответственности:**
- HTTP запросы к внешним API
- Отправка email (SMTP)
- Telegram бот интеграция
- Операции с базами данных
- Преобразование данных

**База данных:**
```sql
Actions (id, workflow_id, type, config, created_at, updated_at)
HttpActions (id, action_id, url, method, headers, body_template)
EmailActions (id, action_id, to, subject, body_template, smtp_config)
TelegramActions (id, action_id, bot_token, chat_id, message_template)
DbActions (id, action_id, connection_config, query_template)
```

**Интеграции:**
- **HTTP**: REST API, GraphQL
- **Email**: SMTP, SendGrid, AWS SES
- **Telegram**: Bot API
- **Базы данных**: PostgreSQL, MySQL, MongoDB

### 7. Notification Service (Порт 3006)

**Ответственности:**
- Мульти-канальные уведомления
- Управление предпочтениями пользователей
- Шаблоны уведомлений
- История уведомлений
- Real-time доставка

**База данных:**
```sql
Notifications (id, user_id, type, channel, content, status, sent_at)
NotificationTemplates (id, type, channel, template, variables)
UserPreferences (id, user_id, channel, enabled, settings)
DeliveryLogs (id, notification_id, channel, status, error_message, sent_at)
```

**Каналы уведомлений:**
- **Email**: SMTP интеграция
- **Telegram**: Bot API
- **Push**: Web push notifications
- **Webhook**: Custom webhook endpoints

### 8. Frontend (Порт 3007)

**Ответственности:**
- Визуальный редактор workflow
- Панель управления и мониторинг
- Управление пользователями и настройками
- Real-time обновления

**Технологический стек:**
- React 18 + TypeScript
- Vite (сборка)
- TailwindCSS (стили)
- Framer Motion (анимации)
- ReactFlow (визуальный редактор)
- Zustand (state management)
- React Query (серверное состояние)

**Основные страницы:**
- **Dashboard**: Обзор workflow и статистика
- **Workflow Editor**: Визуальный конструктор
- **Settings**: Управление профилем и интеграциями
- **Monitoring**: Логи и история выполнений
- **Integrations**: Управление внешними сервисами

## 🔧 Инфраструктура

### Docker Compose конфигурация

```yaml
# Основные сервисы
- postgres:15-alpine     # База данных
- redis:7-alpine         # Кэш и очереди
- nginx:alpine          # Reverse proxy

# Приложение сервисы
- api-gateway:3000      # Шлюз
- auth-service:3001     # Аутентификация
- workflow-service:3002 # Workflow
- execution-service:3003 # Выполнение
- trigger-service:3004  # Триггеры
- action-service:3005   # Действия
- notification-service:3006 # Уведомления
- frontend:3007         # React приложение
```

### База данных

**Разделение на 6 баз данных:**
1. `minizapier_auth` - Пользователи и аутентификация
2. `minizapier_workflows` - Workflow и шаги
3. `minizapier_executions` - История выполнений
4. `minizapier_triggers` - Триггеры и планирование
5. `minizapier_actions` - Действия и интеграции
6. `minizapier_notifications` - Уведомления

### Nginx конфигурация

**Функции:**
- Reverse proxy для всех сервисов
- SSL termination
- Rate limiting (API: 10r/s, Login: 1r/s)
- Gzip сжатие
- Статические файлы для frontend
- Health checks

## 🚀 Развертывание

### Локальная разработка

```bash
# Установка зависимостей
npm run setup

# Запуск всех сервисов
npm run docker:up

# Просмотр логов
npm run docker:logs

# Остановка
npm run docker:down
```

### Переменные окружения

**Обязательные:**
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/minizapier
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
```

**OAuth:**
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Email:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🔒 Безопасность

### Реализованные меры

1. **Аутентификация:**
   - JWT токены с истечением срока
   - OAuth 2.0 (Google, GitHub)
   - bcryptjs для хэширования паролей

2. **Авторизация:**
   - Role-based access control
   - Проверка прав доступа к ресурсам

3. **Network Security:**
   - Rate limiting (Nginx)
   - CORS конфигурация
   - Security headers (Helmet)

4. **Data Protection:**
   - Валидация входных данных
   - SQL injection защита (Prisma ORM)
   - XSS защита

## 📊 Мониторинг и логирование

### Логирование

- **Winston** для структурированного логирования
- **Уровни:** error, warn, info, debug
- **Формат:** JSON с метаданными
- **Хранение:** Логи в Docker контейнерах

### Health Checks

Каждый сервис предоставляет эндпоинт `/health`:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "auth-service",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected"
}
```

### Метрики

- **Response time** для каждого эндпоинта
- **Error rate** по типам ошибок
- **Queue size** для BullMQ
- **Database connections** и запросы
- **Memory usage** сервисов

## 🔄 CI/CD

### GitHub Actions

```yaml
# Стадии:
1. Test (unit + integration)
2. Build Docker images
3. Security scan
4. Deploy to staging
5. Run E2E tests
6. Deploy to production
```

### Деплоймент

- **Blue-Green deployment** для нулевого простоя
- **Health checks** перед переключением трафика
- **Rollback** автоматический при ошибках
- **Monitoring** после деплоймента

## 🧪 Тестирование

### Unit тесты

- **Jest** для всех сервисов
- **Покрытие:** минимум 80%
- **Моки:** внешние зависимости

### Integration тесты

- **TestContainers** для базы данных
- **Redis** in-memory для тестов
- **API Gateway** интеграционные тесты

### E2E тесты

- **Playwright** для frontend
- **API тесты** для всех эндпоинтов
- **Workflow execution** полные сценарии

## 📈 Масштабирование

### Горизонтальное масштабирование

- **Stateless сервисы** (кроме Auth)
- **Load balancer** (Nginx)
- **Database read replicas**
- **Redis cluster**

### Оптимизация производительности

- **Connection pooling** для баз данных
- **Caching** в Redis
- **Compression** (Gzip)
- **CDN** для статических файлов

## 🛠️ Разработка

### Структура репозитория

```
mini-Zapier/
├── services/              # Микросервисы
│   ├── api-gateway/      # Порт 3000
│   ├── auth-service/     # Порт 3001
│   ├── workflow-service/ # Порт 3002
│   ├── execution-service/ # Порт 3003
│   ├── trigger-service/  # Порт 3004
│   ├── action-service/   # Порт 3005
│   └── notification-service/ # Порт 3006
├── frontend/             # React приложение (Порт 3007)
├── infrastructure/       # Docker, Nginx, конфиги
│   ├── docker-compose.yml
│   ├── nginx/
│   └── init-db.sql
├── prisma/              # Общие схемы и миграции
├── docs/                # Документация
└── scripts/             # Helper скрипты
```

### Конвенции

- **TypeScript** строгий режим
- **ESLint + Prettier** для форматирования
- **Conventional Commits** для git
- **Semantic Versioning** для релизов

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Базовая микросервисная архитектура
- ✅ Core workflow функциональность
- ✅ Базовые интеграции (HTTP, Email)

### Phase 2 (Next)
- 🔄 Advanced интеграции (Slack, Salesforce)
- 🔄 AI/ML действия
- 🔄 Real-time collaboration
- 🔄 Mobile приложение

### Phase 3 (Future)
- 📋 Enterprise features (SSO, RBAC)
- 📋 Advanced monitoring
- 📋 Multi-tenant architecture
- 📋 Plugin system

---

## 📞 Поддержка

- **Documentation:** `/docs`
- **API Docs:** Swagger на каждом сервисе
- **Monitoring:** `/health` эндпоинты
- **Logs:** Docker logs

**Архитектура готова к production развертыванию и масштабированию!** 🚀

# mini-Zapier

Микросервисная платформа автоматизации workflow, аналог Zapier.

## Архитектура

### Сервисы

- **API Gateway** (порт 3000) - Единая точка входа, авторизация, проксирование
- **Auth Service** (порт 3001) - Аутентификация, JWT, OAuth (Google, GitHub)
- **Workflow Service** (порт 3002) - Управление workflow
- **Execution Service** (порт 3003) - Выполнение workflow, BullMQ очереди
- **Trigger Service** (порт 3004) - Триггеры (webhook, cron, email)
- **Action Service** (порт 3005) - Действия (HTTP, email, Telegram, DB)
- **Notification Service** (порт 3006) - Уведомления
- **Frontend** (порт 3007) - React приложение

### Инфраструктура

- PostgreSQL (порт 5432)
- Redis (порт 6379)
- Nginx (порт 80/443)

## Быстрый старт

### Разработка

```bash
# Установка зависимостей
npm run setup

# Запуск всех сервисов
npm run docker:up

# Логи
npm run docker:logs
```

### Локальная разработка

```bash
# Запуск каждого сервиса отдельно
npm run dev:api-gateway
npm run dev:auth-service
npm run dev:workflow-service
npm run dev:execution-service
npm run dev:trigger-service
npm run dev:action-service
npm run dev:notification-service
npm run dev:frontend
```

## Структура проекта

```
mini-Zapier/
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── workflow-service/
│   ├── execution-service/
│   ├── trigger-service/
│   ├── action-service/
│   └── notification-service/
├── frontend/
├── infrastructure/
│   ├── docker-compose.yml
│   └── nginx/
└── package.json
```

## Технологии

- **Backend**: Node.js, TypeScript, NestJS, Prisma, PostgreSQL, Redis, BullMQ
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Framer Motion
- **Infrastructure**: Docker, Docker Compose, Nginx
- **Auth**: JWT, OAuth (Google, GitHub)
- **API**: Swagger/OpenAPI
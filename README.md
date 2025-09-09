<p align="center">
  <img src="apps/frontend/public/next.svg" width="120" alt="Logo" />
</p>

## Flohmarkt Plus Monorepo

TypeScript monorepo for a marketplace platform with multiple NestJS microservices and a Next.js frontend.

### Apps

- `apps/auth`: Authentication and users
- `apps/billing`: Payments/Billing
- `apps/listings`: Listings CRUD
- `apps/markets`: Markets management
- `apps/messages`: Realtime messaging (WebSockets)
- `apps/orders`: Orders
- `apps/frontend`: Next.js (App Router) UI

### Tech

- Backend: NestJS, MongoDB (via Mongoose), RabbitMQ (RMQ), WebSockets
- Frontend: Next.js 14, Tailwind, next-intl
- Tooling: Jest, ESLint, Prettier, Docker

## Prerequisites

- Node.js 18+
- npm 9+ (root workspace)
- pnpm 9+ (recommended for `apps/frontend`)
- Docker and Docker Compose (optional, for full stack via containers)

## Setup

1) Install root dependencies

```bash
npm install
```

2) Install frontend dependencies

```bash
cd apps/frontend
pnpm install
```

3) Configure secrets and environment

- Copy files from `secrets.example/` to `secrets/` and update values as needed
- Ensure a valid Mongo connection in `secrets/mongodb_uri.txt`
- Ensure a JWT secret in `secrets/jwt_secret.txt`

## Run with Docker (recommended for first run)

This starts MongoDB, RabbitMQ and all services, plus the frontend.

```bash
docker compose up --build
```

Services will be available at:

- Frontend: `http://localhost:3000`
- Auth: `http://localhost:3001`
- Billing: `http://localhost:3002`
- Listings: `http://localhost:3003`
- Markets: `http://localhost:3004`
- Messages: `http://localhost:3005`
- Orders: `http://localhost:3006`

(Ports depend on `docker-compose.yml` and each app's `main.ts` — adjust if needed.)

## Run locally (without Docker)

Start backing services (MongoDB, RabbitMQ) or point to hosted ones via env/secrets. Then run the apps you need.

### Backend services (NestJS)

From the repo root, you can start each project with the Nest CLI project name (see `nest-cli.json`).

```bash
# Orders
npx nest start orders --watch

# Auth
npx nest start auth --watch

# Billing
npx nest start billing --watch

# Listings
npx nest start listings --watch

# Markets
npx nest start markets --watch

# Messages (WebSockets)
npx nest start messages --watch
```

Alternatively, you can run a single dev server with:

```bash
npm run start:dev
```

But for a monorepo you typically specify the project (as above) to run each service concurrently in separate terminals.

### Frontend (Next.js)

```bash
cd apps/frontend
pnpm dev
```

Visit `http://localhost:3000`.

## Seeding data

Some services include simple seed endpoints/utilities under `apps/*/src/seeds`. Inspect the code to run seeds as needed, or add your own seed scripts.

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests (project-specific config, example for orders)
npm run test:e2e
```

## Lint & Format

```bash
# Lint
npm run lint

# Format
npm run format
```

## Project structure

```
apps/
  auth/ billing/ listings/ markets/ messages/ orders/ frontend/
libs/
  common/ (shared DTOs, guards, strategies, RMQ, etc.)
docker-compose.yml
secrets/ (runtime secrets; copy from secrets.example/)
```

## Notes

- The monorepo is configured via `nest-cli.json`. Use those project names with the Nest CLI.
- Frontend uses `pnpm`. Keep using `pnpm` inside `apps/frontend` to respect its lockfile.
- When using Docker, environment values are read from files in `secrets/`.

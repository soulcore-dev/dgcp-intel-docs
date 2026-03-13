# E03 — Package.json por Servicio

> DGCP INTEL | Etapa 3 — Pre-Código | 2026-03-13

---

## 1. Root (Monorepo)

```json
{
  "name": "dgcp-intel",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.4.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "db:generate": "pnpm --filter @dgcp/db generate",
    "db:migrate": "supabase db push",
    "db:seed": "pnpm --filter @dgcp/db seed"
  },
  "devDependencies": {
    "turbo": "^2.1.3",
    "typescript": "^5.4.5",
    "@types/node": "^20.14.0",
    "prettier": "^3.3.2",
    "eslint": "^9.5.0"
  }
}
```

---

## 2. apps/web — Next.js 15 (Dashboard)

```json
{
  "name": "@dgcp/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@dgcp/db": "workspace:*",
    "@dgcp/shared": "workspace:*",
    "@supabase/supabase-js": "^2.44.4",
    "@supabase/ssr": "^0.4.0",
    "recharts": "^2.12.7",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0",
    "lucide-react": "^0.400.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@radix-ui/react-badge": "^1.0.0",
    "sonner": "^1.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.4",
    "postcss": "^8.4.39",
    "autoprefixer": "^10.4.19"
  }
}
```

### Env vars requeridas (apps/web):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=https://api.dgcp-intel.railway.app
```

---

## 3. apps/api — Fastify (Backend REST)

```json
{
  "name": "@dgcp/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format cjs --dts",
    "start": "node dist/index.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "fastify": "^4.28.1",
    "@fastify/jwt": "^8.0.1",
    "@fastify/cors": "^9.0.1",
    "@fastify/rate-limit": "^9.1.0",
    "@fastify/swagger": "^8.14.0",
    "@fastify/swagger-ui": "^4.0.1",
    "@dgcp/db": "workspace:*",
    "@dgcp/shared": "workspace:*",
    "@dgcp/scoring": "workspace:*",
    "@dgcp/ocds-client": "workspace:*",
    "@supabase/supabase-js": "^2.44.4",
    "bullmq": "^5.8.3",
    "ioredis": "^5.4.1",
    "zod": "^3.23.8",
    "pino": "^9.3.1",
    "pino-pretty": "^11.2.1"
  },
  "devDependencies": {
    "tsx": "^4.16.2",
    "tsup": "^8.1.0",
    "vitest": "^2.0.2",
    "@vitest/coverage-v8": "^2.0.2"
  }
}
```

### Env vars requeridas (apps/api):

```env
PORT=3001
NODE_ENV=production
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
JWT_SECRET=
REDIS_URL=redis://...
TELEGRAM_BOT_TOKEN=
CLAUDE_API_KEY=
```

---

## 4. apps/worker — BullMQ (Job Processor)

```json
{
  "name": "@dgcp/worker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format cjs",
    "start": "node dist/index.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@dgcp/db": "workspace:*",
    "@dgcp/shared": "workspace:*",
    "@dgcp/scoring": "workspace:*",
    "@dgcp/ocds-client": "workspace:*",
    "@supabase/supabase-js": "^2.44.4",
    "bullmq": "^5.8.3",
    "ioredis": "^5.4.1",
    "telegraf": "^4.16.3",
    "@anthropic-ai/sdk": "^0.24.3",
    "zod": "^3.23.8",
    "pino": "^9.3.1",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "tsx": "^4.16.2",
    "tsup": "^8.1.0",
    "vitest": "^2.0.2"
  }
}
```

### 5 Queues del Worker:

| Queue | Concurrency | Rate Limit |
|-------|-------------|------------|
| `scan-queue` | 3 | 60 req/min OCDS |
| `score-queue` | 10 | ilimitado |
| `alert-queue` | 5 | Telegram 30 msg/s |
| `propose-queue` | 2 | 5 Claude calls/min |
| `submit-queue` | 1 | 1 submit a la vez por tenant |

### Env vars requeridas (apps/worker):

```env
NODE_ENV=production
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
REDIS_URL=redis://...
TELEGRAM_BOT_TOKEN=
CLAUDE_API_KEY=
BROWSER_SERVICE_URL=http://browser:3002
WEBHOOK_DOMAIN=https://worker.dgcp-intel.railway.app
```

---

## 5. apps/browser — Playwright (Browser Service)

```json
{
  "name": "@dgcp/browser",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format cjs",
    "start": "node dist/index.js",
    "test": "playwright test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@dgcp/db": "workspace:*",
    "@dgcp/shared": "workspace:*",
    "@supabase/supabase-js": "^2.44.4",
    "playwright": "^1.45.2",
    "fastify": "^4.28.1",
    "bullmq": "^5.8.3",
    "ioredis": "^5.4.1",
    "zod": "^3.23.8",
    "pino": "^9.3.1"
  },
  "devDependencies": {
    "tsx": "^4.16.2",
    "tsup": "^8.1.0",
    "@playwright/test": "^1.45.2"
  }
}
```

### Env vars requeridas (apps/browser):

```env
PORT=3002
NODE_ENV=production
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
REDIS_URL=redis://...
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
```

---

## 6. Packages Compartidos

### packages/scoring

```json
{
  "name": "@dgcp/scoring",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs --dts",
    "dev": "tsup src/index.ts --format cjs --dts --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@dgcp/shared": "workspace:*",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "tsup": "^8.1.0",
    "vitest": "^2.0.2"
  }
}
```

### packages/ocds-client

```json
{
  "name": "@dgcp/ocds-client",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs --dts",
    "dev": "tsup src/index.ts --format cjs --dts --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@dgcp/shared": "workspace:*",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "tsup": "^8.1.0",
    "vitest": "^2.0.2",
    "msw": "^2.3.4"
  }
}
```

### packages/db

```json
{
  "name": "@dgcp/db",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs --dts",
    "generate": "supabase gen types typescript --local > src/database.types.ts",
    "seed": "tsx src/seed.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.44.4"
  },
  "devDependencies": {
    "supabase": "^1.178.2",
    "tsup": "^8.1.0",
    "tsx": "^4.16.2"
  }
}
```

### packages/shared

```json
{
  "name": "@dgcp/shared",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs --dts",
    "dev": "tsup src/index.ts --format cjs --dts --watch"
  },
  "dependencies": {
    "zod": "^3.23.8",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "tsup": "^8.1.0"
  }
}
```

---

## 7. Turbo Pipeline (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

---

*Anterior: [01_REPO_STRUCTURE.md](01_REPO_STRUCTURE.md)*
*Siguiente: [03_INFRA_CONFIG.md](03_INFRA_CONFIG.md)*
*JANUS — 2026-03-13*

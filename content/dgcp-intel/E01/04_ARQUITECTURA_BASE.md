# E01 — Arquitectura Base del Sistema

> DGCP INTEL | Etapa 1 — Análisis | 2026-03-13

---

## 1. Visión de Alto Nivel — C4 Context

```mermaid
C4Context
    title DGCP INTEL — Contexto del Sistema

    Person(user, "Empresa Registrada", "Constructora, proveedor\n de bienes/servicios al Estado")
    Person(admin, "Administrador DGCP INTEL", "Gestión de plataforma,\nsoporte, analytics")

    System(app, "DGCP INTEL", "SaaS multi-tenant\nInteligencia de licitaciones\nautomática end-to-end")

    System_Ext(dgcp, "API OCDS / DGCP", "Fuente oficial licitaciones\ndatosabiertos.dgcp.gob.do")
    System_Ext(portal, "Portal SECP", "Portal oficial de sumisión\ncomunidad.comprasdominicana.gob.do")
    System_Ext(claude, "Claude API", "Generación de propuestas\nanálisis de pliegos")
    System_Ext(telegram, "Telegram / WhatsApp", "Notificaciones y confirmaciones")
    System_Ext(dgii, "DGII / TSS", "Validación RNC y\ncumplimiento fiscal")

    Rel(user, app, "Configura empresa,\nconfirma en chat")
    Rel(admin, app, "Gestiona plataforma")
    Rel(app, dgcp, "Polling OCDS cada 8h")
    Rel(app, portal, "Auto-submit via Playwright")
    Rel(app, claude, "Genera propuestas técnicas")
    Rel(app, telegram, "Alertas y confirmaciones")
    Rel(app, dgii, "Valida RNC onboarding")
    Rel(portal, user, "Confirmación oferta enviada")
```

---

## 2. Arquitectura de Servicios (C4 Container)

```mermaid
graph TB
    subgraph VERCEL["☁️ Vercel"]
        FE["Next.js 15\n(App Router + TypeScript)\n\n/dashboard — pipeline\n/oportunidades — licitaciones\n/propuestas — docs IA\n/config — perfil empresa\n/admin — panel admin"]
    end

    subgraph RAILWAY["🚂 Railway (3 servicios)"]
        API["api-service\nFastify + TypeScript\nPort 3001\n\n/api/v1/licitaciones\n/api/v1/oportunidades\n/api/v1/propuestas\n/api/v1/pipeline\n/api/v1/submissions"]

        WORKER["worker-service\nNode.js + BullMQ\n\nQueues:\n• scan-queue\n• score-queue\n• alert-queue\n• propose-queue\n• submit-queue"]

        BROWSER["browser-service\nNode.js + Playwright\nChromium headless\n\nEndpoints internos:\n• POST /login\n• POST /download-pliego\n• POST /submit-oferta"]

        REDIS["Redis\nBullMQ backend\nJob persistence"]
    end

    subgraph SUPABASE["🗄️ Supabase"]
        DB["PostgreSQL\nRow Level Security\n\nSchemas:\n• public (app data)\n• auth (Supabase)\n• storage"]

        STORE["Storage Buckets\n• pliegos/{tenant_id}/\n• propuestas/{tenant_id}/\n• evidencias/{tenant_id}/"]

        AUTH_SB["Supabase Auth\nMagic Link + JWT\nRoles: owner|member|viewer"]
    end

    FE -->|JWT Auth| API
    FE -->|Direct DB| SUPABASE
    API --> DB
    API --> STORE
    API -->|Enqueue jobs| REDIS
    WORKER -->|Consume jobs| REDIS
    WORKER --> DB
    WORKER -->|Internal HTTP| BROWSER
    BROWSER --> STORE
```

---

## 3. Modelo de Base de Datos

```mermaid
erDiagram
    tenants {
        uuid id PK
        string nombre_empresa
        string rnc
        string plan
        boolean activo
        jsonb config
        timestamp created_at
    }

    users {
        uuid id PK
        uuid tenant_id FK
        string email
        string rol
        timestamp created_at
    }

    empresa_perfil {
        uuid id PK
        uuid tenant_id FK
        string[] unspsc_codes
        string[] keywords
        numeric budget_min_dop
        numeric budget_max_dop
        integer score_umbral
        string telegram_chat_id
        text rpe_usuario_encrypted
        text rpe_password_encrypted
    }

    licitaciones {
        string ocid PK
        string title
        string description
        string status
        string modality
        numeric amount_dop
        string entity_name
        string[] unspsc_codes
        timestamp tender_start
        timestamp tender_end
        jsonb raw_ocds
        timestamp synced_at
    }

    oportunidades_tenant {
        uuid id PK
        uuid tenant_id FK
        string licitacion_ocid FK
        integer score
        jsonb score_breakdown
        string estado_pipeline
        timestamp alertado_at
        boolean propuesta_generada
        timestamp submitted_at
        string confirmacion_dgcp
    }

    propuestas {
        uuid id PK
        uuid oportunidad_id FK
        uuid tenant_id FK
        string tipo
        string storage_path
        jsonb metadata
        timestamp generated_at
    }

    submissions {
        uuid id PK
        uuid oportunidad_id FK
        uuid tenant_id FK
        string status
        string[] screenshot_paths
        string confirmacion_numero
        jsonb playwright_log
        timestamp submitted_at
    }

    tenants ||--o{ users : "tiene"
    tenants ||--|| empresa_perfil : "configura"
    tenants ||--o{ oportunidades_tenant : "detecta"
    licitaciones ||--o{ oportunidades_tenant : "origina"
    oportunidades_tenant ||--o{ propuestas : "genera"
    oportunidades_tenant ||--o{ submissions : "ejecuta"
```

---

## 4. Row Level Security (Multi-tenant)

```sql
-- Cada tenant solo ve SUS datos
-- Aplicado automáticamente en Supabase

-- oportunidades_tenant
CREATE POLICY "tenant_isolation" ON oportunidades_tenant
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- propuestas
CREATE POLICY "tenant_isolation" ON propuestas
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- submissions
CREATE POLICY "tenant_isolation" ON submissions
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- licitaciones → READ ONLY para todos (cache global)
CREATE POLICY "public_read" ON licitaciones
  FOR SELECT USING (true);
```

---

## 5. Cola de Jobs (BullMQ)

```mermaid
graph LR
    subgraph QUEUES["Queues BullMQ"]
        Q1["scan-queue\nCron: 6AM/2PM/10PM\nPoll OCDS API → cache licitaciones"]
        Q2["score-queue\nTrigger: nuevo proceso detectado\nScore por cada tenant con match"]
        Q3["alert-queue\nTrigger: score ≥ umbral\nEnviar Telegram/WhatsApp"]
        Q4["propose-queue\nTrigger: usuario responde PROPUESTA\nClaude genera 5 docs"]
        Q5["submit-queue\nTrigger: usuario responde APLICAR\nPlaywright auto-submit"]
    end

    Q1 -->|"nuevo proceso"| Q2
    Q2 -->|"score alto"| Q3
    Q3 -->|"usuario responde"| Q4
    Q4 -->|"usuario confirma"| Q5
```

### Configuración de jobs
```typescript
// scan-queue — máxima prioridad, tolerante a fallos
scanQueue.add('poll-ocds', {}, {
  repeat: { cron: '0 6,14,22 * * *' },
  attempts: 5,
  backoff: { type: 'exponential', delay: 60000 }
})

// submit-queue — crítico, no perder
submitQueue.add('auto-submit', { tenantId, oportunidadId }, {
  attempts: 3,
  backoff: { type: 'fixed', delay: 30000 },
  priority: 1  // máxima prioridad
})
```

---

## 6. Estructura de Repositorio

```
dgcp-intel/
├── apps/
│   ├── web/                    → Next.js 15 (Vercel)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── dashboard/
│   │   │   ├── oportunidades/
│   │   │   ├── propuestas/
│   │   │   ├── pipeline/
│   │   │   └── config/
│   │   └── components/
│   ├── api/                    → Fastify API (Railway)
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── worker/                 → BullMQ Workers (Railway)
│   │   ├── queues/
│   │   ├── processors/
│   │   │   ├── scan.processor.ts
│   │   │   ├── score.processor.ts
│   │   │   ├── alert.processor.ts
│   │   │   ├── propose.processor.ts
│   │   │   └── submit.processor.ts
│   │   └── services/
│   └── browser/                → Playwright Service (Railway)
│       ├── handlers/
│       │   ├── login.handler.ts
│       │   ├── download.handler.ts
│       │   └── submit.handler.ts
│       └── utils/
├── packages/
│   ├── scoring/                → Engine de scoring (shared)
│   ├── ocds-client/            → Cliente API OCDS
│   ├── db/                     → Supabase client + types
│   └── shared/                 → Types compartidos
├── supabase/
│   ├── migrations/             → SQL migrations
│   └── seed/
└── docker/
    └── browser/                → Dockerfile Playwright
```

---

## 7. Variables de Entorno por Servicio

```bash
# Compartidas
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# API Service
JWT_SECRET=
PORT=3001

# Worker
REDIS_URL=
CLAUDE_API_KEY=
TELEGRAM_BOT_TOKEN=
OCDS_API_BASE=https://api.dgcp.gob.do/api/
DGCP_API_BASE=https://datosabiertos.dgcp.gob.do/api-dgcp/v1/

# Browser Service (interno)
BROWSER_SERVICE_URL=http://browser:3002
BROWSER_SERVICE_KEY=    → secret interno entre services
```

---

*Anterior: [03_MODELO_NEGOCIO.md](03_MODELO_NEGOCIO.md)*
*Siguiente: [05_FLUJOS_PRINCIPALES.md](05_FLUJOS_PRINCIPALES.md)*
*JANUS — 2026-03-13*

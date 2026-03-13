# E04 — Browser Service (Playwright)

> DGCP INTEL | Etapa 4 — Desarrollo | Sprint 3 | 2026-03-13

---

## Responsabilidad

`apps/browser` es un microservicio HTTP interno (no expuesto a internet) que Railway
ejecuta con Docker. Solo `apps/worker` lo llama. Tiene 3 funciones:

```mermaid
graph LR
    W["apps/worker\nsubmit.ts"] -->|HTTP POST /login| B["apps/browser\nPlaywright"]
    W -->|HTTP POST /fill-form| B
    W -->|HTTP POST /screenshot| B
    B --> DGCP["portalweb.dgcp.gob.do\nRPE Portal"]
    B --> SUP["Supabase Storage\nevidencias/"]
```

---

## Estructura de archivos

```
apps/browser/src/
├── index.ts              — Fastify HTTP server :3002
├── service/
│   ├── browser.ts        — Playwright browser singleton (Chromium headed=false)
│   ├── session.ts        — Login RPE + storageState reutilizable ~8h
│   ├── form.ts           — Navegación + llenado formulario DGCP
│   └── screenshot.ts     — Captura pantalla + upload a Storage
└── routes/
    ├── login.ts          — POST /login → { storageState, expires_at }
    ├── fill.ts           — POST /fill-form → { screenshot_path, form_data }
    └── health.ts         — GET /health
```

---

## Flujo de submit (8 pasos)

```mermaid
sequenceDiagram
    participant W as worker/submit.ts
    participant B as browser service
    participant P as Portal DGCP (Playwright)
    participant S as Supabase Storage

    W->>B: POST /login { rnc, password_encrypted }
    B->>P: page.goto(RPE_LOGIN_URL)
    B->>P: fill('#rnc', rnc) + fill('#password', pwd)
    B->>P: click('button[type=submit]')
    P-->>B: redirect → dashboard RPE
    B->>B: page.context().storageState() → guardar ~8h
    B-->>W: { storageState, expires_at }

    W->>B: POST /fill-form { ocid, form_data, storageState }
    B->>P: newContext({ storageState }) → ya autenticado
    B->>P: goto(DGCP_OFERTA_URL + ocid)
    B->>P: Llenar campos: monto, RNC, representante
    B->>P: uploadFile() × N documentos PDF
    B->>P: page.screenshot() → Buffer PNG
    B->>S: storage.upload('evidencias/{tenantId}/preview.png')
    B-->>W: { screenshot_path, form_data_snapshot }

    W->>Telegram: Enviar screenshot para confirmación usuario
    Note over W: Esperar ENVIAR o CANCELAR (max 30 min)

    W->>B: POST /submit { storageState, ocid }
    B->>P: click('button#confirmar-envio')
    B->>P: waitForSelector('.confirmacion-numero')
    B->>P: Extraer número confirmación DGCP
    B-->>W: { confirmacion: 'CONF-2026-XXXXX', time_ms }
```

---

## Código de referencia — `session.ts`

```typescript
import { chromium, BrowserContext } from 'playwright'
import { getSupabaseService } from '@dgcp/db'

const DGCP_RPE_URL = 'https://portalweb.dgcp.gob.do/rpe/login'
const SESSION_TTL_HOURS = 8

export async function getRPESession(
  tenantId: string,
  rncDecrypted: string,
  passwordDecrypted: string,
): Promise<string> {  // retorna storageState serializado
  const db = getSupabaseService()

  // Intentar reusar sesión guardada
  const { data: perfil } = await db
    .from('empresa_perfil')
    .select('rpe_session_state, rpe_session_expires')
    .eq('tenant_id', tenantId)
    .single()

  if (perfil?.rpe_session_state && perfil.rpe_session_expires) {
    const expires = new Date(perfil.rpe_session_expires)
    if (expires > new Date()) {
      return perfil.rpe_session_state  // Reusar sesión válida
    }
  }

  // Login fresco con Playwright
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(DGCP_RPE_URL, { waitUntil: 'networkidle' })
  await page.fill('#rnc', rncDecrypted)
  await page.fill('#password', passwordDecrypted)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 30_000 })

  const storageState = JSON.stringify(await context.storageState())
  await browser.close()

  // Guardar sesión en DB
  const expires = new Date()
  expires.setHours(expires.getHours() + SESSION_TTL_HOURS)

  await db.from('empresa_perfil').update({
    rpe_session_state: storageState,
    rpe_session_expires: expires.toISOString(),
  }).eq('tenant_id', tenantId)

  return storageState
}
```

---

## Variables de entorno requeridas

```env
PORT=3002
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
VAULT_KEY=          # Misma clave que apps/api para descifrar RPE
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
```

---

## Dockerfile (referencia E03)

Usa imagen base `mcr.microsoft.com/playwright:v1.45.2-jammy` que ya tiene
Chromium pre-instalado. Ver [03_INFRA_CONFIG.md](../E03/03_INFRA_CONFIG.md).

---

*Sprint 3 — pendiente de implementación*
*JANUS — 2026-03-13*

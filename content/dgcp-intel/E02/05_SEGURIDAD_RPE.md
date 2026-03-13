# E02 — Seguridad: Credenciales RPE

> DGCP INTEL | Etapa 2 — Diseño | 2026-03-13

---

## 1. Amenazas y Requerimientos

Las credenciales RPE son las más sensibles del sistema:
- Permiten sumir ofertas legalmente vinculantes de millones de RD$
- Acceso al portal gubernamental oficial
- Compromiso legal de la empresa

```mermaid
graph TD
    subgraph AMENAZAS["⚠️ Amenazas"]
        T1["Robo en tránsito\n(HTTPS mitiga)"]
        T2["Robo en reposo\n(DB breach)"]
        T3["Logs / stdout leak"]
        T4["Screenshot leak\n(Playwright)"]
        T5["Insider access\n(equipo SoulCore)"]
        T6["Submit no autorizado\n(bug / hack)"]
    end

    subgraph MITIGACIONES["🛡️ Mitigaciones"]
        M1["TLS 1.3 obligatorio"]
        M2["Supabase Vault AES-256"]
        M3["Sanitizar logs — nunca loguear creds"]
        M4["Screenshots sin campos password"]
        M5["Supabase Vault — SoulCore no accede"]
        M6["Doble confirmación humana siempre"]
    end

    T1 --> M1
    T2 --> M2
    T3 --> M3
    T4 --> M4
    T5 --> M5
    T6 --> M6
```

---

## 2. Arquitectura de Cifrado con Supabase Vault

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as API Backend
    participant VAULT as Supabase Vault
    participant DB as PostgreSQL
    participant W as Worker

    Note over FE,VAULT: GUARDAR CREDENCIALES
    FE->>API: POST /perfil/rpe-credentials\n{usuario, password} via HTTPS
    API->>VAULT: vault.create_secret(usuario, 'rpe_usuario_{tenant_id}')
    VAULT-->>API: secret_id_1
    API->>VAULT: vault.create_secret(password, 'rpe_password_{tenant_id}')
    VAULT-->>API: secret_id_2
    API->>DB: UPDATE empresa_perfil SET\nrpe_usuario_secret_id = secret_id_1,\nrpe_password_secret_id = secret_id_2
    API->>API: Verificar login con Playwright (test)
    API-->>FE: { login_exitoso: true }

    Note over W,VAULT: USAR CREDENCIALES (auto-submit)
    W->>DB: GET empresa_perfil WHERE tenant_id = X
    DB-->>W: { rpe_usuario_secret_id, rpe_password_secret_id }
    W->>VAULT: vault.decrypted_secrets WHERE id = secret_id_1
    VAULT-->>W: usuario_plain (en memoria)
    W->>VAULT: vault.decrypted_secrets WHERE id = secret_id_2
    VAULT-->>W: password_plain (en memoria)
    W->>W: Playwright.fill(usuario, password)
    W->>W: Limpiar variables de memoria post-uso
```

---

## 3. Schema de Almacenamiento

```sql
-- Las credenciales NO están en empresa_perfil como texto
-- Están en Supabase Vault (extensión pgsodium)
-- empresa_perfil solo guarda los IDs de referencia

ALTER TABLE public.empresa_perfil
  ADD COLUMN rpe_usuario_secret_id UUID,  -- ref a vault.secrets
  ADD COLUMN rpe_password_secret_id UUID; -- ref a vault.secrets

-- Para obtener credenciales (solo service_role)
-- SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = $1;

-- Nadie excepto la service_role key puede leer vault.decrypted_secrets
-- La anon key y el JWT del usuario NO tienen acceso al vault
```

---

## 4. Reglas de Oro para Credenciales

```mermaid
graph TD
    R1["🚫 NUNCA en logs\nNunca console.log(password)\nNunca en error messages"]
    R2["🚫 NUNCA en screenshots\nPlaywright masquea campos password\nauto-matically (type=password)"]
    R3["🚫 NUNCA en DB raw\nSolo IDs de vault — nunca texto plano"]
    R4["🚫 NUNCA en frontend\nJamás enviar credenciales al browser"]
    R5["✅ Solo en memoria\nDecifrar → usar → limpiar\nen el mismo proceso"]
    R6["✅ Sesión reutilizable\nStorageState serializado en vault\nevita login repetido (válido ~8h)"]
    R7["✅ Doble confirmación\nSiempre screenshot preview\n+ ENVIAR/CANCELAR del usuario"]
    R8["✅ Audit log\nCada uso de credenciales\nregistrado en jobs_log"]
```

---

## 5. Session Management de Playwright

```typescript
// browser/src/handlers/session.handler.ts

interface RPESession {
  tenantId: string
  storageState: PlaywrightStorageState
  expiresAt: Date
}

export async function getOrRefreshSession(tenantId: string): Promise<RPESession> {
  // 1. Verificar si hay sesión válida en DB
  const perfil = await db.empresa_perfil.findUnique({ where: { tenant_id: tenantId } })

  if (perfil.rpe_session_state && perfil.rpe_session_expires > new Date()) {
    return {
      tenantId,
      storageState: JSON.parse(perfil.rpe_session_state),
      expiresAt: perfil.rpe_session_expires
    }
  }

  // 2. No hay sesión válida → hacer login
  const credentials = await getCredentials(tenantId)  // del Vault
  const storageState = await doLogin(credentials)

  // 3. Guardar nueva sesión (serializada) en DB
  await db.empresa_perfil.update({
    where: { tenant_id: tenantId },
    data: {
      rpe_session_state: JSON.stringify(storageState),
      rpe_session_expires: new Date(Date.now() + 8 * 60 * 60 * 1000)  // 8h
    }
  })

  // 4. Limpiar credenciales de memoria
  credentials.usuario = ''
  credentials.password = ''

  return { tenantId, storageState, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) }
}

async function doLogin(creds: { usuario: string; password: string }): Promise<PlaywrightStorageState> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('https://comunidad.comprasdominicana.gob.do/STS/DGCP/Login.aspx')
  await page.fill('#usuario', creds.usuario)
  await page.fill('#password', creds.password)  // type=password — no en screenshots
  await page.click('#btnLogin')
  await page.waitForURL('**/dashboard**')

  const storageState = await context.storageState()
  await browser.close()
  return storageState
}
```

---

## 6. Otras Medidas de Seguridad del Sistema

### Rate Limiting (API)
```typescript
// Fastify rate limit
app.register(fastifyRateLimit, {
  global: true,
  max: 100,                  // 100 req/min por IP
  timeWindow: '1 minute',
  keyGenerator: (req) => req.user?.tenant_id ?? req.ip
})

// Endpoints críticos — más restrictivos
app.register(fastifyRateLimit, {
  max: 5,
  timeWindow: '1 hour',
  routes: ['/api/v1/*/aplicar', '/api/v1/*/propuesta']
})
```

### JWT y Multi-tenancy
```typescript
// Middleware — extraer tenant_id del JWT de Supabase
export async function tenantMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const user = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1])
  if (!user.data.user) return reply.status(401).send({ error: 'Unauthorized' })

  const userTenant = await db.user_tenants.findFirst({
    where: { user_id: user.data.user.id }
  })
  if (!userTenant) return reply.status(403).send({ error: 'No tenant assigned' })

  req.tenantId = userTenant.tenant_id
  req.userRol = userTenant.rol
}
```

### Plan Enforcement
```typescript
// Verificar límites según plan
export function checkPlanLimits(tenant: Tenant, action: string) {
  const limits = {
    starter: { propuestas_mes: 5, auto_submit: false, categorias: 1 },
    growth:  { propuestas_mes: 20, auto_submit: true, categorias: 3 },
    scale:   { propuestas_mes: 999, auto_submit: true, categorias: 999 }
  }
  const plan = limits[tenant.plan]

  if (action === 'auto_submit' && !plan.auto_submit) {
    throw new PlanLimitError('Auto-submit requiere plan GROWTH o superior')
  }
}
```

---

## 7. Checklist de Seguridad Pre-Submit (Playwright)

```typescript
// Verificaciones obligatorias antes de cualquier submit
export async function verificarPreSubmit(oportunidadId: string, tenantId: string) {
  const checks = {
    documentos_completos: false,
    credenciales_activas: false,
    deadline_vigente: false,
    plan_permite_submit: false,
    no_submit_duplicado: false
  }

  // 1. Verificar 8 documentos en Storage
  const propuestas = await db.propuestas.findMany({ where: { oportunidad_id: oportunidadId } })
  checks.documentos_completos = propuestas.length >= 4 && propuestas.every(p => p.status === 'ready')

  // 2. Verificar credenciales RPE
  const perfil = await db.empresa_perfil.findUnique({ where: { tenant_id: tenantId } })
  checks.credenciales_activas = !!perfil.rpe_usuario_secret_id && !!perfil.rpe_password_secret_id

  // 3. Verificar deadline no vencido
  const oportunidad = await db.oportunidades_tenant.findUnique({ where: { id: oportunidadId }, include: { licitacion: true } })
  checks.deadline_vigente = oportunidad.licitacion.tender_end > new Date()

  // 4. Verificar plan
  const tenant = await db.tenants.findUnique({ where: { id: tenantId } })
  checks.plan_permite_submit = ['growth', 'scale', 'enterprise'].includes(tenant.plan)

  // 5. Sin submit duplicado
  const existingSubmission = await db.submissions.findFirst({
    where: { oportunidad_id: oportunidadId, status: { in: ['submitted', 'confirmando'] } }
  })
  checks.no_submit_duplicado = !existingSubmission

  const allPassed = Object.values(checks).every(Boolean)
  if (!allPassed) throw new PreSubmitError('Verificación pre-submit fallida', checks)

  return checks
}
```

---

*Anterior: [04_DASHBOARD_WIREFRAMES.md](04_DASHBOARD_WIREFRAMES.md)*
*Siguiente: [06_CHK_02_VERIFICADO.md](06_CHK_02_VERIFICADO.md)*
*JANUS — 2026-03-13*

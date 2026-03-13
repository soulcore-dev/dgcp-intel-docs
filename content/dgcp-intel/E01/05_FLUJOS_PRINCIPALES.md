# E01 — Flujos Principales del Sistema

> DGCP INTEL | Etapa 1 — Análisis | 2026-03-13

---

## Flujo 1 — Ciclo Completo: Detección → Sumisión

```mermaid
flowchart TD
    START["⏰ Cron 6AM / 2PM / 10PM"] --> POLL

    POLL["📡 Worker: Poll OCDS API\nGET /api/ocds/tender\n?publishedFrom=lastScan"] --> FILTER

    FILTER{"🆕 ¿Nuevos procesos?"}
    FILTER -->|No| END_SCAN["💤 Fin ciclo — esperar siguiente"]
    FILTER -->|Sí N procesos| CACHE

    CACHE["💾 Cache en Supabase\ntabla: licitaciones\n(upsert por ocid)"] --> MATCH

    MATCH["🏢 Match por tenant\nPara cada empresa:\n• UNSPSC match\n• Keywords match\n• Monto en rango"] --> SCORE_Q

    SCORE_Q["📊 Encolar score-queue\n(un job por tenant con match)"] --> SCORE

    SCORE["🧮 Scoring Engine\n6 componentes → 0-100\nver 06_SCORING_ENGINE.md"] --> CHECK_SCORE

    CHECK_SCORE{"Score ≥ umbral\ndel tenant?"}
    CHECK_SCORE -->|No| SAVE_LOW["💾 Guardar oportunidad\nestado: EVALUADA\nsin alertar"]
    CHECK_SCORE -->|Sí| ALERT

    ALERT["📱 Telegram / WhatsApp\nResumen con score + monto\n+ deadline + entity"] --> WAIT_USER

    WAIT_USER{"Usuario responde"}
    WAIT_USER -->|"DESCARTAR"| DISCARD["💾 Estado: DESCARTADA"]
    WAIT_USER -->|"PROPUESTA"| PROPOSE
    WAIT_USER -->|Timeout 24h| AUTO_SAVE["💾 Estado: PENDIENTE"]

    PROPOSE["🤖 Claude API\nGenera 5 documentos:\n1. Propuesta técnica\n2. Carta presentación\n3. Presupuesto desglosado\n4. Checklist legal\n5. Timeline"] --> SAVE_DOCS

    SAVE_DOCS["💾 Storage Supabase\n/propuestas/{tenant}/{ocid}/\nLinks en dashboard"] --> NOTIFY_DOCS

    NOTIFY_DOCS["📱 Telegram\n'Propuesta lista — revisa dashboard\nResponde APLICAR para auto-submit'"] --> WAIT_APPLY

    WAIT_APPLY{"Usuario responde"}
    WAIT_APPLY -->|"APLICAR"| SUBMIT_Q
    WAIT_APPLY -->|"NO"| MANUAL["📋 Estado: EN PREPARACION\n(usuario gestiona manual)"]

    SUBMIT_Q["🎯 Encolar submit-queue\nPrioridad máxima"] --> PLAYWRIGHT

    PLAYWRIGHT["🎭 Browser Service\nPlaywright Chromium\n8 pasos → ver Flujo 3"] --> PREVIEW

    PREVIEW["📸 Screenshot formulario\nEnviar a Telegram:\n'¿ENVIAR o CANCELAR?'"] --> WAIT_CONFIRM

    WAIT_CONFIRM{"Usuario confirma"}
    WAIT_CONFIRM -->|"CANCELAR"| ABORT["Estado: CANCELADA\nNo se envió oferta"]
    WAIT_CONFIRM -->|"ENVIAR"| FINAL_SUBMIT

    FINAL_SUBMIT["✅ Click 'Enviar Oferta'\nCapturar confirmación DGCP\nScreenshots evidencia"] --> POST_SUBMIT

    POST_SUBMIT["💾 Pipeline: APLICADA\nEvidencias en Storage\nNotificación: email + Telegram"] --> TRACK

    TRACK["🔄 Tracking automático\nMonitorear adjudicación\nAlerta si ganamos"]

    style START fill:#1a1a2e,color:#00d4ff
    style SCORE fill:#16213e,color:#7c3aed
    style PROPOSE fill:#0d361a,color:#10b981
    style PLAYWRIGHT fill:#361a0d,color:#f59e0b
    style FINAL_SUBMIT fill:#0d3616,color:#10b981
```

---

## Flujo 2 — Onboarding de Nueva Empresa

```mermaid
flowchart LR
    LAND["🌐 Landing Page\ndgcp-intel.com"] --> PLAN

    PLAN["Selecciona plan\nSTARTER/GROWTH/SCALE"] --> PAY

    PAY["💳 Pago\n(Stripe / manual)"] --> CREATE_TENANT

    CREATE_TENANT["🏢 Crear tenant\nSupabase Auth\nRol: owner"] --> EMAIL

    EMAIL["📧 Magic Link\nal email registrado"] --> LOGIN

    LOGIN["🔐 Login App\nDashboard vacío"] --> WIZARD

    subgraph WIZARD["🧙 Wizard Onboarding (5 pasos)"]
        W1["1️⃣ Datos empresa\nNombre, RNC, sector"]
        W2["2️⃣ Categorías UNSPSC\nSeleccionar de lista\n(multi-select con búsqueda)"]
        W3["3️⃣ Keywords adicionales\nPalabras clave de su negocio"]
        W4["4️⃣ Sweet spot presupuesto\nRango min-max DOP"]
        W5["5️⃣ Notificaciones\nTelegram chat ID\nUmbral score para alertar"]
        W6["6️⃣ Credenciales RPE\n(opcional — para auto-submit)\nEncriptado con Supabase Vault"]

        W1 --> W2 --> W3 --> W4 --> W5 --> W6
    end

    WIZARD --> ACTIVATE

    ACTIVATE["✅ Activar monitoreo\nWorker encolado\nPróximo ciclo: detectará"] --> READY

    READY["🎉 Empresa activa\nDashboard con primeras\noportunidades en 8h max"]
```

---

## Flujo 3 — Browser Service (Auto-submit detallado)

```mermaid
sequenceDiagram
    participant W as Worker
    participant B as Browser Service
    participant PW as Playwright
    participant PORTAL as Portal DGCP
    participant SUP as Supabase

    W->>B: POST /submit {tenantId, oportunidadId}
    B->>SUP: GET credenciales RPE (tenant)
    SUP-->>B: {usuario, password} descifrado

    B->>PW: launch chromium headless

    Note over PW,PORTAL: PASO 1 — Verificación pre-submit
    B->>SUP: Verificar 8 docs en storage
    SUP-->>B: ✅ todos presentes

    Note over PW,PORTAL: PASO 2 — Login
    PW->>PORTAL: GET /STS/DGCP/Login.aspx
    PW->>PORTAL: fill(usuario) + fill(password)
    PORTAL-->>PW: Redirect + session cookie
    PW->>PW: screenshot("01_login.png")
    PW->>SUP: save storageState (reusar sesión)

    Note over PW,PORTAL: PASO 3 — Navegar al proceso
    PW->>PORTAL: GET /ContractNoticeManagement/Index
    PW->>PORTAL: buscar por código DGCP
    PW->>PORTAL: click "Detalle"
    PW->>PW: screenshot("02_proceso.png")
    PW->>PORTAL: click "Presentar Oferta"

    Note over PW,PORTAL: PASO 4 — Llenar formulario
    PW->>PORTAL: fill RNC, Razón Social, Rep. Legal
    PW->>PORTAL: fill Monto oferta
    PW->>PORTAL: fill Email, Teléfono
    PW->>PW: screenshot("03_formulario.png")

    Note over PW,PORTAL: PASO 5 — Upload documentos
    PW->>SUP: Descargar 8 PDFs a temp
    PW->>PORTAL: setInputFiles([8 PDFs])
    PORTAL-->>PW: Confirmación uploads
    PW->>PW: screenshot("04_docs.png")

    Note over PW,PORTAL: PASO 6 — Preview y confirmación
    B->>W: Enviar screenshot 03+04 al usuario
    W->>W: Telegram: "¿ENVIAR o CANCELAR?"

    alt Usuario responde ENVIAR
        Note over PW,PORTAL: PASO 7 — Submit final
        PW->>PORTAL: click "Enviar Oferta"
        PORTAL-->>PW: Confirmación + número CONF-XXXX
        PW->>PW: screenshot("05_confirmacion.png")
        PW->>SUP: Guardar screenshots en storage
        B-->>W: {status: "success", confirmacion: "CONF-2026-XXXXX"}
        W->>SUP: Update submission (status: submitted)
        W->>W: Telegram + Email: "✅ Oferta enviada"
    else Usuario responde CANCELAR
        B->>PW: Cerrar browser sin submit
        B-->>W: {status: "cancelled"}
        W->>SUP: Update submission (status: cancelled)
    end
```

---

## Flujo 4 — Tracking Post-Sumisión

```mermaid
stateDiagram-v2
    [*] --> DETECTADA : Worker detecta en OCDS
    DETECTADA --> EVALUADA : Score calculado
    EVALUADA --> DESCARTADA : Score bajo / usuario descarta
    EVALUADA --> EN_PREPARACION : Usuario confirma interés
    EN_PREPARACION --> PROPUESTA_LISTA : IA genera docs
    PROPUESTA_LISTA --> APLICADA : Auto-submit exitoso
    PROPUESTA_LISTA --> APLICADA_MANUAL : Usuario sube manual
    APLICADA --> EN_EVALUACION : DGCP abre sobres
    EN_EVALUACION --> GANADA : Adjudicación favorable
    EN_EVALUACION --> PERDIDA : Otro ganó
    GANADA --> CONTRATO_FIRMADO : Firma contrato
    CONTRATO_FIRMADO --> EN_EJECUCION : Inicio obras
    EN_EJECUCION --> COMPLETADO : Obra finalizada
    DESCARTADA --> [*]
    PERDIDA --> [*]
    COMPLETADO --> [*]
```

---

## Flujo 5 — Generación de Propuesta IA

```mermaid
sequenceDiagram
    participant W as Worker (propose-queue)
    participant SUP as Supabase
    participant CLAUDE as Claude API
    participant STORE as Storage

    W->>SUP: GET licitacion (ocid, raw_ocds, docs URLs)
    W->>SUP: GET empresa_perfil (tenant)
    W->>W: Download pliego PDF (si público)
    W->>W: Extract text del pliego (pdf-parse)

    Note over W,CLAUDE: Prompt 1 — Propuesta Técnica (8-12 págs)
    W->>CLAUDE: system: "Eres experto en licitaciones RD..."
    W->>CLAUDE: context: {pliego_texto, perfil_empresa, specs_obra}
    CLAUDE-->>W: Propuesta técnica en Markdown

    Note over W,CLAUDE: Prompt 2 — Carta Presentación
    W->>CLAUDE: context: {entidad_compradora, empresa, experiencia}
    CLAUDE-->>W: Carta personalizada

    Note over W,CLAUDE: Prompt 3 — Presupuesto Desglosado
    W->>CLAUDE: context: {monto_referencial, tipo_obra, keywords}
    CLAUDE-->>W: Presupuesto: MO 30% + Mat 40% + Eq 15% + Util 15%

    Note over W,CLAUDE: Prompt 4 — Checklist Legal
    W->>CLAUDE: context: {modalidad, entidad, monto}
    CLAUDE-->>W: Lista documentos requeridos + estado

    Note over W,CLAUDE: Prompt 5 — Timeline
    W->>CLAUDE: context: {deadline, tipo_obra, complejidad}
    CLAUDE-->>W: Cronograma semana a semana

    W->>W: Convertir Markdown → PDF (puppeteer)
    W->>STORE: Upload 5 PDFs a /propuestas/{tenant}/{ocid}/
    W->>SUP: Update oportunidad (propuesta_generada: true)
    W->>W: Telegram: "5 documentos listos en dashboard"
```

---

*Anterior: [04_ARQUITECTURA_BASE.md](04_ARQUITECTURA_BASE.md)*
*Siguiente: [06_SCORING_ENGINE.md](06_SCORING_ENGINE.md)*
*JANUS — 2026-03-13*

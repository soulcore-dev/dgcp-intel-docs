# E01 — Ecosistema Técnico DGCP

> DGCP INTEL | Etapa 1 — Análisis | 2026-03-13

---

## 1. Mapa de Portales y APIs

```mermaid
graph TD
    subgraph PUBLIC["🌐 Acceso Público — Sin Auth"]
        OCDS["API OCDS\napi.dgcp.gob.do/api/\nEst: OCDS v1.1.5 JSON"]
        DGCPAPI["API DGCP v1\ndatosabiertos.dgcp.gob.do/api-dgcp/v1\nJSON — actualiza cada 8h"]
        OPENDATA["Portal Open Data\ndatosabiertos.dgcp.gob.do\nDescarga JSON/CSV/Excel"]
        SEARCH["Portal Búsqueda Pública\ncomunidad.comprasdominicana.gob.do\n/Public/Tendering/ContractNoticeManagement/Index"]
        PACC["Plan Anual Compras\n/Public/App/AnnualPurchasingPlanManagementPublic"]
    end

    subgraph AUTH["🔐 Requiere Login RPE"]
        LOGIN["Login Portal\n/STS/DGCP/Login.aspx"]
        SUBMIT["Sumisión de Oferta\nFormulario + Upload docs"]
        DOWNLOAD["Algunos pliegos\nDocumentos restringidos"]
    end

    subgraph INTEROP["🔄 Interoperabilidad"]
        DGII["DGII API\nValidación RNC + estado fiscal"]
        TSS["TSS\nValidación seguridad social"]
        RMERCANTIL["Registro Mercantil\nValidación empresa"]
    end

    style PUBLIC fill:#0d2136,color:#00d4ff
    style AUTH fill:#1a0d36,color:#ef4444
    style INTEROP fill:#0d361a,color:#10b981
```

---

## 2. API OCDS — Estructura de Datos

La fuente principal. Datos estructurados en estándar internacional Open Contracting.

```mermaid
graph LR
    subgraph OCDS_RELEASE["Release OCDS (un proceso)"]
        OCID["ocid\nIdentificador único proceso"]
        TAG["tag\nplanning|tender|award|contract"]
        PARTIES["parties[]\nbyer + tenderers + suppliers"]
        TENDER["tender{}\nTítulo, descripción, estado\nmontos, fechas, UNSPSC"]
        AWARDS["awards[]\nGanador, monto adjudicado"]
        CONTRACTS["contracts[]\nContrato firmado, fechas"]
    end

    OCID --> TAG
    TAG --> PARTIES
    TAG --> TENDER
    TENDER --> AWARDS
    AWARDS --> CONTRACTS
```

### Campos clave del objeto `tender`
```json
{
  "tender": {
    "id": "DGCP-2026-XXXX",
    "title": "Rehabilitación Carretera...",
    "status": "active | complete | cancelled",
    "procurementMethod": "open | restricted | limited | direct",
    "procurementMethodDetails": "Licitación Pública Nacional",
    "value": { "amount": 28500000, "currency": "DOP" },
    "tenderPeriod": {
      "startDate": "2026-03-01T00:00:00Z",
      "endDate": "2026-04-15T00:00:00Z"
    },
    "itemsClassification": [
      { "scheme": "UNSPSC", "id": "72141000", "description": "Construcción Autopistas" }
    ],
    "documents": [
      { "id": "doc-1", "title": "Pliego de Condiciones", "url": "https://..." }
    ]
  }
}
```

---

## 3. Clasificación UNSPSC para Obras — Códigos Prioritarios

```mermaid
mindmap
  root((UNSPSC Obras RD))
    72000000 Servicios Construcción
      72100000 Infraestructura
        72141000 Autopistas y Carreteras
        72142000 Puentes y Túneles
        72143000 Obras Hidráulicas
      72150000 Edificación
        72151000 Edificios Residenciales
        72152000 Edificios Comerciales
        72153000 Edificios Gubernamentales
    30000000 Materiales Construcción
      30110000 Cemento y Hormigón
      30130000 Estructuras Metálicas
      30150000 Materiales Acabado
    72200000 Servicios Ingeniería
      72210000 Ingeniería Civil
      72220000 Supervisión de Obras
```

### Los 16 códigos UNSPSC de construcción más frecuentes en DGCP
| Código | Descripción |
|--------|-------------|
| 72141000 | Construcción de autopistas, carreteras y calles |
| 72142000 | Construcción de puentes y túneles |
| 72143000 | Construcción de obras hidráulicas |
| 72151100 | Construcción de edificios residenciales |
| 72151500 | Construcción de edificios comerciales |
| 72151600 | Construcción de instalaciones industriales |
| 72152100 | Construcción de escuelas y hospitales |
| 72152900 | Construcción de instalaciones militares |
| 72153600 | Construcción de edificios gubernamentales |
| 72154200 | Instalación de sistemas eléctricos |
| 72154300 | Instalación de sistemas de plomería |
| 72154700 | Instalación de HVAC |
| 72200000 | Servicios de ingeniería |
| 72210000 | Ingeniería civil |
| 72220000 | Supervisión y control de obras |
| 30110000 | Suministro cemento y hormigón |

---

## 4. URLs Mapeadas del Portal DGCP

| Función | URL |
|---------|-----|
| Búsqueda pública | `/Public/Tendering/ContractNoticeManagement/Index` |
| Detalle proceso | `/Public/Tendering/ContractNoticePhases/View` |
| Login RPE | `/STS/DGCP/Login.aspx` |
| Registro proveedores | `/Public/Users/UserRegister/Index` |
| Plan Anual Compras | `/Public/App/AnnualPurchasingPlanManagementPublic/Index` |
| Búsqueda proveedores | `/Public/Companies/SupplierSearchPublic/Index` |

### Campos de formulario detectados (para Playwright)
| Campo | ID/Name |
|-------|---------|
| Unidad Compradora | `txtAuthorityCompanyCodeText` |
| Categoría UNSPSC | `txtMainCategoryText` |
| Fecha publicación | `dtmbOfficialPublishDate*` |
| País/Región | Country / Region dropdowns |
| Autocomplete entidad | `AuthorityCompanyCodeAutoComplete` |

---

## 5. Estrategia de Datos para el SaaS

```mermaid
flowchart TD
    A["⏰ Cron Job — 3x/día\n6AM / 2PM / 10PM"] --> B

    B["🔍 OCDS API Poll\napi.dgcp.gob.do/api/\nÚltimas 24h — tag: tender"] --> C

    C{"¿Proceso nuevo?"}
    C -->|Sí| D["💾 Cache en Supabase\ntabla: licitaciones\nDatos OCDS completos"]
    C -->|No - ya existe| E["🔄 Update estado\nsi cambió status/fechas"]

    D --> F["🏢 Match por Tenant\nPara cada empresa registrada:\n¿Match UNSPSC? ¿Match keywords?\n¿Monto en sweet spot?"]
    F -->|Match ≥ 1 tenant| G["📊 Scoring Engine\nPor tenant — 6 componentes"]
    G -->|Score ≥ umbral| H["📱 Alerta Telegram/WhatsApp\nResumen + score + deadline"]

    style A fill:#1a1a2e,color:#00d4ff
    style D fill:#0d361a,color:#10b981
    style G fill:#16213e,color:#7c3aed
    style H fill:#361a0d,color:#f59e0b
```

### Tablas Supabase para datos DGCP
```
licitaciones          → cache global de procesos OCDS
  ocid (PK)
  title, description
  status              → active | complete | cancelled
  modality            → LPN | CP | SO | etc.
  amount_dop
  tender_start, tender_end
  entity_name, entity_id
  unspsc_codes[]      → array
  documents[]         → URLs pliegos
  raw_ocds            → JSONB completo
  created_at, updated_at

oportunidades_tenant  → procesadas por empresa
  id (PK)
  tenant_id (FK)      → RLS: cada empresa solo ve las suyas
  licitacion_ocid (FK)
  score               → 0-100
  score_breakdown     → JSONB {capacidades, presupuesto, ...}
  estado_pipeline     → DETECTADA|EVALUADA|PREPARACION|APLICADA|GANADA|PERDIDA
  alertado_at
  propuesta_generada  → boolean
  submitted_at
  confirmacion_dgcp
```

---

## 6. Integración con Sistemas Externos

### DGII — Validación RNC
- Consulta: `https://www.dgii.gov.do/app/WebApps/ConsultasWeb/consultas/rnc.aspx`
- Uso: Verificar que empresa cliente tiene RNC activo antes de activar cuenta
- Interoperabilidad: SECP ya valida contra DGII automáticamente

### TSS — Validación Seguridad Social
- Verificar cumplimiento de obligaciones
- Requerido en documentación RPE

### Playwright — Portal DGCP
```mermaid
sequenceDiagram
    participant W as Worker (Railway)
    participant PW as Playwright
    participant PORTAL as Portal DGCP
    participant S as Supabase

    W->>S: Obtener credenciales RPE (tenant_id)
    S-->>W: {usuario, password} AES-256
    W->>PW: Lanzar Chromium headless
    PW->>PORTAL: GET /STS/DGCP/Login.aspx
    PW->>PORTAL: Fill usuario + password
    PORTAL-->>PW: Session cookie
    PW->>S: Guardar storageState (reusar sesión)

    Note over W,PORTAL: Sesión válida por ~8h
    Note over PW: Reutilizar storageState\npara requests posteriores
```

---

*Anterior: [01_CONTEXTO_LEGAL.md](01_CONTEXTO_LEGAL.md)*
*Siguiente: [03_MODELO_NEGOCIO.md](03_MODELO_NEGOCIO.md)*
*JANUS — 2026-03-13*

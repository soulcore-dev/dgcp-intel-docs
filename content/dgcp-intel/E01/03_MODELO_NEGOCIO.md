# E01 — Modelo de Negocio SaaS

> DGCP INTEL | Etapa 1 — Análisis | 2026-03-13

---

## 1. Propuesta de Valor

```mermaid
graph LR
    subgraph ANTES["❌ Sin DGCP INTEL"]
        A1["2-3h/día buscar licitaciones"]
        A2["30-45min evaluar cada una"]
        A3["8-16h redactar propuesta"]
        A4["2-4h organizar documentos"]
        A5["30-60min subir al portal"]
        A6["1h/día seguimiento"]
        TOTAL_A["TOTAL: 15-25h por licitación"]
    end

    subgraph DESPUES["✅ Con DGCP INTEL"]
        B1["0 min — detección automática"]
        B2["0 min — scoring automático"]
        B3["0 min — IA genera propuesta"]
        B4["0 min — docs auto-organizados"]
        B5["0 min — Playwright auto-sube"]
        B6["0 min — pipeline automático"]
        TOTAL_B["TOTAL: ~2 min (confirmar)"]
    end

    TOTAL_A -->|"DGCP INTEL"| TOTAL_B
```

---

## 2. Segmentación de Mercado

### Target primario — MIPYMEs constructoras RD
- **Por qué**: Ley 47-25 garantiza 30% del presupuesto a MIPYMEs
- **Tamaño**: 14,536 empresas participaron en contrataciones 2024
- **Problema agudo**: No tienen equipo dedicado a licitaciones
- **Poder adquisitivo**: Contratos desde RD$50M → pagan SaaS fácilmente

### Segmentos
```mermaid
pie title Segmentación de Clientes
    "MIPYMEs Construcción" : 50
    "Empresas Medianas Multisector" : 25
    "Grandes Empresas (all categories)" : 15
    "Consultoras / Gestoras de licitaciones" : 10
```

| Segmento | Tamaño empresa | Plan | Precio/mes |
|----------|---------------|------|-----------|
| STARTER | 1-10 empleados, 1 categoría UNSPSC | Básico | RD$3,500 |
| GROWTH | 10-50 empleados, 3 categorías | Pro | RD$8,500 |
| SCALE | 50+ empleados, ilimitado | Business | RD$18,000 |
| ENTERPRISE | Grupos empresariales | Enterprise | Custom |

---

## 3. Planes y Features

```mermaid
graph TD
    subgraph STARTER["STARTER — RD$3,500/mes"]
        S1["✅ Monitoreo 1 categoría UNSPSC"]
        S2["✅ Alertas Telegram"]
        S3["✅ Scoring automático"]
        S4["✅ 5 propuestas IA/mes"]
        S5["❌ Auto-submit"]
        S6["❌ Multi-usuario"]
    end

    subgraph GROWTH["GROWTH — RD$8,500/mes"]
        G1["✅ 3 categorías UNSPSC"]
        G2["✅ Alertas Telegram + Email"]
        G3["✅ Scoring + análisis pliego"]
        G4["✅ 20 propuestas IA/mes"]
        G5["✅ Auto-submit portal DGCP"]
        G6["✅ 3 usuarios"]
        G7["✅ Dashboard analytics"]
    end

    subgraph SCALE["SCALE — RD$18,000/mes"]
        SC1["✅ Categorías ilimitadas"]
        SC2["✅ WhatsApp Business"]
        SC3["✅ Propuestas IA ilimitadas"]
        SC4["✅ Auto-submit multi-cuenta RPE"]
        SC5["✅ Usuarios ilimitados"]
        SC6["✅ API access"]
        SC7["✅ Reportes personalizados"]
        SC8["✅ Soporte prioritario"]
    end
```

---

## 4. Modelo de Revenue

### Proyección conservadora (Año 1)

| Mes | Tenants | MRR (RD$) | ARR (RD$) |
|-----|---------|-----------|-----------|
| 1-2 | 5 | 42,500 | — |
| 3-4 | 15 | 127,500 | — |
| 5-6 | 30 | 255,000 | — |
| 7-9 | 60 | 510,000 | — |
| 10-12 | 100 | 850,000 | — |
| **Año 1** | **100** | **850,000** | **~RD$5M** |

### ROI del cliente
- Un contrato ganado de RD$50M genera comisión del gestor o margen de 15-22%
- → RD$7.5M a 11M por contrato
- → SaaS se paga solo con **una sola licitación ganada**

---

## 5. Flujo de Onboarding de Empresa

```mermaid
sequenceDiagram
    participant E as Empresa
    participant WEB as Landing Page
    participant APP as DGCP INTEL App
    participant SUPABASE as Supabase Auth
    participant WORKER as Worker

    E->>WEB: Visita landing
    E->>WEB: Selecciona plan + paga
    WEB->>SUPABASE: Crear tenant + usuario
    SUPABASE-->>E: Email magic link

    E->>APP: Login + Setup profile
    APP->>E: Wizard onboarding:
    Note over APP,E: 1. Datos empresa (RNC, razón social)\n2. Categorías UNSPSC de su negocio\n3. Keywords adicionales\n4. Rango presupuesto (sweet spot)\n5. Credenciales RPE (para auto-submit)\n6. Telegram/WhatsApp para alertas

    APP->>WORKER: Activar monitoreo para tenant
    WORKER-->>E: Primera alerta en próximo ciclo
```

---

## 6. Métricas SaaS Clave

| KPI | Target Mes 6 | Target Año 1 |
|-----|-------------|-------------|
| MRR | RD$255K | RD$850K |
| Tenants activos | 30 | 100 |
| Churn rate | <5%/mes | <3%/mes |
| NPS | >50 | >65 |
| Licitaciones detectadas/tenant/mes | 50+ | 80+ |
| Propuestas generadas/mes (total) | 150+ | 600+ |
| Tasa conversión (detect→apply) | 15% | 20% |
| Tasa adjudicación clientes | 15% | 18% |

---

## 7. Ventaja Competitiva

```mermaid
graph TD
    V1["🔑 OCDS API\nFuente estructurada oficial\nNo scraping = no se rompe"]
    V2["🤖 Auto-submit real\nPlaywright → portal DGCP\nNadie más lo hace"]
    V3["📊 Scoring histórico\nAprende de adjudicaciones pasadas\nMejora con el tiempo"]
    V4["⚖️ Ley 47-25 nativa\nActualizado con nueva ley\nCompetidores desactualizados"]
    V5["🏢 Multi-tenant SaaS\nUna empresa paga por el valor\nNo necesita IT propio"]

    V1 --> MOAT["VENTAJA COMPETITIVA\n(Difícil de replicar)"]
    V2 --> MOAT
    V3 --> MOAT
    V4 --> MOAT
    V5 --> MOAT

    style MOAT fill:#1a1a2e,color:#00d4ff
```

---

*Anterior: [02_ECOSISTEMA_DGCP.md](02_ECOSISTEMA_DGCP.md)*
*Siguiente: [04_ARQUITECTURA_BASE.md](04_ARQUITECTURA_BASE.md)*
*JANUS — 2026-03-13*

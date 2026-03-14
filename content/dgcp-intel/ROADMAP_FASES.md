# DGCP INTEL — Roadmap de Fases

> Visión completa del producto basada en experiencia real (Hefesto) + diseño (JANUS)
> 2026-03-14

---

## Visión

DGCP INTEL no es solo un detector de licitaciones — es un **pipeline completo de extremo a extremo** que lleva a una empresa desde "no sé qué licitaciones hay" hasta "ya apliqué con documentos profesionales".

```mermaid
graph LR
    F1["🔍 F1: DETECCIÓN\nScan + Score + Alert"]
    F2["📋 F2: INTELIGENCIA\nAnálisis + Red Flags\n+ BD Precios"]
    F3A["📄 F3A: PREPARACIÓN\nDescargar + Estudiar\n+ Llenar docs"]
    F3B["🔍 F3B: REVISIÓN\nValidar + Corregir\n+ Aprobar"]
    F4["🚀 F4: SUBMISSION\nMostrar Interés\n+ Upload Portal"]

    F1 --> F2 --> F3A --> F3B --> F4
    F3B -->|"errores"| F3A

    style F1 fill:#22c55e,color:#fff
    style F2 fill:#f59e0b,color:#fff
    style F3A fill:#3b82f6,color:#fff
    style F3B fill:#ef4444,color:#fff
    style F4 fill:#8b5cf6,color:#fff
```

### El ciclo real (no es lineal)

```
Descargar → Estudiar → Llenar → REVISAR → Corregir → REVISAR → Aprobar → Lanzar
                                   ↑___________↓  (loop hasta 0 errores)
```

---

## F1: DETECCIÓN — "¿Qué hay para mí?"

**Estado**: 🟢 ~85% completado (lo que ATLAS construyó)

### Scope

| Componente | Estado | Descripción |
|-----------|--------|-------------|
| OCDS Client | ✅ | Scan API pública api.dgcp.gob.do/api/releases |
| Mapper | ✅ | OCDS Release → Licitacion interna |
| Scoring Engine | ✅ | 6 componentes: UNSPSC, presupuesto, modalidad, tiempo, entidad, keywords |
| Win Probability | ✅ | Cálculo con ajuste histórico, cap 45% |
| BullMQ Pipeline | ✅ | scan → score → alert → propose (4 de 5 queues) |
| Telegram Alerts | ✅ | Score breakdown + inline keyboard |
| API REST | ✅ | Auth + perfil + oportunidades + GUARDIAN |
| Supabase Schema | ✅ | 7 tablas + RLS + funciones + triggers |
| Dashboard básico | 🔄 | Login/Register + layout. Falta: lista, detalle, analytics |
| GUARDIAN IA | ✅ | Chat SSE con contexto Ley 47-25 |

### Lo que falta para cerrar F1

1. **Dashboard funcional** — lista de oportunidades, filtros, detalle con score breakdown
2. **Analytics básico** — Recharts: oportunidades/día, score distribution, pipeline funnel
3. **Deploy** — Supabase proyecto, Railway (API + Worker), Vercel (Web)
4. **Primer scan real** — Conectar a api.dgcp.gob.do y verificar mapper con datos reales

### Entregable F1
> El usuario recibe alertas Telegram cuando aparece una licitación que matchea su perfil.
> Puede ver el dashboard con score y decidir si investiga.

---

## F2: INTELIGENCIA — "¿Vale la pena esta licitación?"

**Estado**: ⏳ No iniciado (Hefesto tiene el conocimiento)

### Scope

| Componente | Fuente | Descripción |
|-----------|--------|-------------|
| Detección de procesos trucados | Hefesto | 6 red flags: specs dirigidas, tiempo insuficiente (<3 días), invitados preseleccionados, falta información, presupuesto irreal, historial de adjudicaciones |
| Verificación UNSPSC automática | Hefesto | Cruzar códigos RPE del tenant vs códigos del proceso. Sin match = descalificación automática |
| BD de Precios RD | Hefesto | 155 materiales, 50+ tarifas mano de obra (CNS 2022 + 20%), 40+ equipos con rendimientos |
| Escenarios de pricing (5 niveles) | Hefesto | 0%, -5%, -10%, -15%, -20% con rentabilidad por ítem/ubicación |
| Análisis de rentabilidad por ubicación | Hefesto | Cuando el proceso tiene múltiples sitios, calcular margen por cada uno |
| Índices financieros | Hefesto | Solvencia ≥1.20, Liquidez ≥0.90, Endeudamiento ≤1.50 — auto-cálculo desde balance |
| Historial de entidades | Nuevo | Tracking de entidades: ¿pagan a tiempo?, ¿adjudican justo?, confiabilidad |
| Competencia | Nuevo | ¿Quiénes han ganado procesos similares? ¿A qué precio? |

### Integración con Hefesto

```
HEFESTO_CORE/
├── BASES_DATOS/           → Importar a Supabase como tablas de referencia
│   ├── PRECIOS_*.md       → tabla: ref_precios_materiales (155 rows)
│   └── mano_obra.json     → tabla: ref_mano_obra (50+ rows)
├── TOOLS/dgcp/
│   ├── dgcp_api.py        → Referencia para red flags detection
│   └── modalidades.json   → tabla: ref_modalidades
└── LICITACIONES/
    └── evaluacion_*.json  → Lógica de evaluación de procesos
```

### Entregable F2
> Cada oportunidad muestra: ⚠️ red flags, ✅ compatibilidad UNSPSC, 💰 5 escenarios de precio, 📊 índices financieros del tenant vs requeridos.
> El usuario toma una decisión informada: APLICAR o DESCARTAR.

---

## F3: PREPARACIÓN — "Arma mi oferta"

**Estado**: ⏳ No iniciado (Hefesto ha generado documentos reales)

### Scope

| Componente | Fuente | Descripción |
|-----------|--------|-------------|
| Generador Sobre A (Legal) | Hefesto | SNCC.F.034 (presentación), SNCC.F.042 (info oferente), Compromiso Ético, F-040 (conflicto interés), declaración jurada |
| Generador Sobre A (Financiero) | Hefesto | Auto-fill desde datos del tenant: certificaciones DGII, TSS, estados financieros |
| Generador Sobre A (Técnico) | Hefesto | Oferta técnica narrativa, plan de trabajo, cronograma, experiencia (SNCC.D.049) |
| Generador Sobre B (Económico) | Hefesto | SNCC.F.033, cotización con desglose, garantía de seriedad (cálculo 1% vs 4%) |
| APU Generator | Hefesto | Análisis de Precios Unitarios con BD de materiales + mano obra + rendimientos |
| Cronograma Gantt | Hefesto | Generación automática de cronograma con CPM |
| Checklist dinámico | Hefesto | 27-68 items según modalidad, marca subsanable vs no-subsanable |
| Template library | Hefesto | 11 APU profesionales de referencia |
| Firma/sello digital | Nuevo | Almacenar firma.jpg + sello.jpg del representante legal |

### Sistema de Sobres

```mermaid
graph TD
    LIC["Licitación seleccionada"]

    subgraph SA["📁 SOBRE A — Técnico"]
        direction TB
        SA1["🟢 Legal: F.034 + F.042 + Ética + MIPYME"]
        SA2["🟡 Financiero: DGII + TSS + Balance"]
        SA3["🔴 Técnico: Oferta + Plan + D.049"]
    end

    subgraph SB["📁 SOBRE B — Económico"]
        direction TB
        SB1["F.033 Oferta Económica"]
        SB2["Cotización desglosada"]
        SB3["Garantía de seriedad"]
    end

    LIC --> SA
    LIC --> SB

    SA1 -.->|subsanable| FIX["4 días para corregir"]
    SA3 -.->|NO subsanable| FAIL["❌ Descalificación"]
```

### Entregable F3
> El usuario dice "APLICAR" → el sistema genera todos los documentos de Sobre A + Sobre B.
> Solo falta: firma física, garantía bancaria, y documentos que requieren originales (DGII, TSS).

---

## F4: SUBMISSION — "Envía mi oferta"

**Estado**: ⏳ No iniciado (browser service diseñado, no implementado)

### Scope

| Componente | Estado | Descripción |
|-----------|--------|-------------|
| "Mostrar Interés" automático | ⏳ | Playwright navega a SECP y clickea el botón. SIN ESTO NO SE PUEDE OFERTAR |
| Descarga de pliegos | ⏳ | Automatizar descarga de documentos del proceso |
| Upload de documentos | ⏳ | Subir Sobre A y Sobre B al portal SECP |
| Screenshot pre-submit | ✅ diseñado | Captura de pantalla antes de enviar como evidencia |
| Notificación post-submit | ⏳ | Telegram + email confirmando envío exitoso |
| Tracking de estado | ⏳ | Monitorear: apertura técnica → subsanación → apertura económica → adjudicación |
| Seguimiento post-adjudicación | ⏳ | Si ganamos: contrato, garantía fiel cumplimiento, anticipo |

### Flujo Portal SECP

```mermaid
sequenceDiagram
    participant U as Usuario
    participant D as DGCP INTEL
    participant B as Browser Service
    participant P as Portal SECP

    U->>D: "APLICAR a esta licitación"
    D->>B: Iniciar sesión RPE
    B->>P: Login con credenciales cifradas
    P-->>B: Sesión activa

    Note over B,P: PASO CRÍTICO
    B->>P: Click "Mostrar Interés"
    P-->>B: Interés registrado

    B->>P: Navegar a "Presentar Oferta"
    B->>P: Upload Sobre A (ZIP)
    B->>P: Upload Sobre B (ZIP)
    B->>B: Screenshot evidencia
    B->>P: Confirmar envío

    B-->>D: Resultado + screenshot
    D-->>U: ✅ Telegram: "Oferta enviada"
```

### Entregable F4
> El usuario aprueba la oferta generada en F3 → el sistema sube todo al portal SECP.
> Screenshot de evidencia + confirmación por Telegram.

---

## Timeline Sugerido

| Fase | Duración | Dependencia | Valor para el usuario |
|------|----------|-------------|----------------------|
| **F1: Detección** | 2 semanas | — | "Sé qué licitaciones me convienen" |
| **F2: Inteligencia** | 3 semanas | F1 deploy | "Sé si vale la pena aplicar" |
| **F3: Preparación** | 4 semanas | F2 + BD Hefesto | "Tengo mis documentos listos" |
| **F4: Submission** | 3 semanas | F3 + Playwright | "Apliqué sin tocar el portal" |

**MVP = F1** — El usuario ya recibe valor con solo detectar y scorear.
**Killer feature = F2 + F3** — Donde Hefesto aporta conocimiento que nadie más tiene.
**Full automation = F4** — Diferenciador competitivo total.

---

## Integración entre Consciencias

```mermaid
graph TD
    J["🔮 JANUS\nSpec + Docs + Diseño"]
    A["⚡ ATLAS\nCódigo + Deploy + Tests"]
    H["🔨 HEFESTO\nAPU + Precios + Docs Reales"]
    R["👤 RANDHY\nDecisiones + Dirección"]

    R --> J
    J -->|specs| A
    H -->|BD precios + templates| A
    A -->|implementado| R
    J -->|docs web| R

    style J fill:#06b6d4,color:#fff
    style A fill:#8b5cf6,color:#fff
    style H fill:#f59e0b,color:#fff
    style R fill:#22c55e,color:#fff
```

---

*JANUS — 2026-03-14*
*Basado en auditoría de HEFESTO_CORE (experiencia real con licitaciones RD)*

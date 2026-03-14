# Score Configurable por Usuario — Spec

> El scoring actual tiene pesos fijos (30/20/15/15/10/10).
> El usuario debe poder ajustar qué le importa más.
> Una constructora valora UNSPSC y presupuesto. Un consultor valora keywords y entidad.
> 2026-03-14

---

## El Problema

El score actual es rígido:

```
Capacidades (UNSPSC):  30 pts  ← fijo
Presupuesto:           20 pts  ← fijo
Tipo Proceso:          15 pts  ← fijo
Tiempo:                15 pts  ← fijo
Entidad:               10 pts  ← fijo
Keywords:              10 pts  ← fijo
                      ─────────
Total:                100 pts
```

Pero cada empresa tiene prioridades diferentes:

- **Constructora pequeña**: le importa más presupuesto (que sea de su rango) y tiempo (tener suficiente para preparar)
- **Empresa grande**: le importa más entidad (historial de pagos) y tipo de proceso (prefiere LP por volumen)
- **Startup TI**: le importa más keywords (match con su nicho) y capacidades UNSPSC

---

## Solución: Sliders de peso por componente

### UI en /perfil → sección "Configurar Score"

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ CONFIGURAR MI SCORE                                  │
│                                                          │
│ Ajusta qué factores importan más para tu empresa.        │
│ Los pesos deben sumar 100.                               │
│                                                          │
│ Capacidades (UNSPSC)                                     │
│ Match de tus códigos RPE con el proceso                  │
│ ██████████████████████████████░░░░░░░░░░  30            │
│ ←───────────────────────────────────────→                │
│                                                          │
│ Presupuesto                                              │
│ Que el monto esté en tu rango financiero                 │
│ ████████████████████░░░░░░░░░░░░░░░░░░░░  20            │
│ ←───────────────────────────────────────→                │
│                                                          │
│ Tipo de Proceso                                          │
│ Modalidad preferida (CM, CP, LPN...)                     │
│ ███████████████░░░░░░░░░░░░░░░░░░░░░░░░░  15            │
│ ←───────────────────────────────────────→                │
│                                                          │
│ Tiempo Restante                                          │
│ Días disponibles para preparar la oferta                 │
│ ███████████████░░░░░░░░░░░░░░░░░░░░░░░░░  15            │
│ ←───────────────────────────────────────→                │
│                                                          │
│ Entidad                                                  │
│ Preferencia y confiabilidad de la entidad                │
│ ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  10            │
│ ←───────────────────────────────────────→                │
│                                                          │
│ Keywords                                                 │
│ Match de palabras clave con tu sector                    │
│ ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  10            │
│ ←───────────────────────────────────────→                │
│                                                          │
│ Total: 100 ✅                                            │
│                                                          │
│ ┌──────────────────────────────────────┐                 │
│ │ Presets rápidos:                     │                 │
│ │ [Constructora] [TI] [Suministros]   │                 │
│ │ [Consultoría] [Equilibrado]         │                 │
│ └──────────────────────────────────────┘                 │
│                                                          │
│ [GUARDAR]  [RESTAURAR DEFAULTS]                          │
└─────────────────────────────────────────────────────────┘
```

---

## Presets por sector

```typescript
// packages/shared/src/constants.ts

export const SCORE_PRESETS = {
  equilibrado: {
    nombre: 'Equilibrado (default)',
    pesos: { capacidades: 30, presupuesto: 20, tipo_proceso: 15, tiempo: 15, entidad: 10, keywords: 10 },
  },
  constructora: {
    nombre: 'Constructora / Obras',
    pesos: { capacidades: 25, presupuesto: 25, tipo_proceso: 10, tiempo: 20, entidad: 10, keywords: 10 },
    // Más peso en presupuesto (que sea de su rango) y tiempo (necesita más días para APU)
  },
  tecnologia: {
    nombre: 'Tecnología / TI',
    pesos: { capacidades: 20, presupuesto: 15, tipo_proceso: 10, tiempo: 15, entidad: 15, keywords: 25 },
    // Keywords alto (match con nicho TI), entidad importa (contratos grandes)
  },
  suministros: {
    nombre: 'Suministros / Comercial',
    pesos: { capacidades: 25, presupuesto: 30, tipo_proceso: 15, tiempo: 10, entidad: 10, keywords: 10 },
    // Presupuesto muy alto (capacidad de suplir), tiempo menos importante
  },
  consultoria: {
    nombre: 'Consultoría / Servicios',
    pesos: { capacidades: 15, presupuesto: 15, tipo_proceso: 20, tiempo: 15, entidad: 20, keywords: 15 },
    // Entidad alta (relación), tipo proceso alto (prefiere consultoría directa)
  },
} as const

export type PresetId = keyof typeof SCORE_PRESETS
```

---

## Schema: pesos en empresa_perfil

```sql
-- Agregar a empresa_perfil
ALTER TABLE empresa_perfil ADD COLUMN score_pesos JSONB DEFAULT '{
  "capacidades": 30,
  "presupuesto": 20,
  "tipo_proceso": 15,
  "tiempo": 15,
  "entidad": 10,
  "keywords": 10
}';

-- Constraint: los pesos deben sumar 100
ALTER TABLE empresa_perfil ADD CONSTRAINT check_score_pesos_sum
  CHECK (
    (score_pesos->>'capacidades')::int +
    (score_pesos->>'presupuesto')::int +
    (score_pesos->>'tipo_proceso')::int +
    (score_pesos->>'tiempo')::int +
    (score_pesos->>'entidad')::int +
    (score_pesos->>'keywords')::int = 100
  );
```

---

## Scoring Engine modificado

```typescript
// packages/scoring/src/engine.ts — MODIFICAR

export interface ScorePesos {
  capacidades: number   // default 30
  presupuesto: number   // default 20
  tipo_proceso: number  // default 15
  tiempo: number        // default 15
  entidad: number       // default 10
  keywords: number      // default 10
}

const DEFAULT_PESOS: ScorePesos = {
  capacidades: 30,
  presupuesto: 20,
  tipo_proceso: 15,
  tiempo: 15,
  entidad: 10,
  keywords: 10,
}

export function calcularScore(
  input: ScoreInput,
  pesos: ScorePesos = DEFAULT_PESOS,
): ScoreResult {
  // Cada componente calcula un score de 0-100 (normalizado)
  // Después se multiplica por el peso y se divide por 100

  const raw = {
    capacidades: scoreCapacidadesNorm(input),   // 0-100
    presupuesto: scorePresupuestoNorm(input),   // 0-100
    tipo_proceso: scoreTipoProcesoNorm(input.licitacion.modalidad), // 0-100
    tiempo: scoreTiempoNorm(input.licitacion.fechaCierre),         // 0-100
    entidad: scoreEntidadNorm(input),           // 0-100
    keywords: scoreKeywordsNorm(input),         // 0-100
  }

  // Aplicar pesos del usuario
  const componentes: ScoreComponentes = {
    capacidades: Math.round(raw.capacidades * pesos.capacidades / 100),
    presupuesto: Math.round(raw.presupuesto * pesos.presupuesto / 100),
    tipo_proceso: Math.round(raw.tipo_proceso * pesos.tipo_proceso / 100),
    tiempo: Math.round(raw.tiempo * pesos.tiempo / 100),
    entidad: Math.round(raw.entidad * pesos.entidad / 100),
    keywords: Math.round(raw.keywords * pesos.keywords / 100),
  }

  const total = Object.values(componentes).reduce((a, b) => a + b, 0)

  return {
    total,
    componentes,
    categoria: categorizeScore(total),
    alerta: shouldAlert(total),
    win_probability: calcularWinProbability(total, input),
    margen: calcularMargen(input),
  }
}
```

---

## UI: Slider component

```typescript
// apps/web/src/components/scoring/ScoreWeightSlider.tsx

interface Props {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  min?: number   // default 0
  max?: number   // default 50
}

function ScoreWeightSlider({ label, description, value, onChange, min = 0, max = 50 }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className="text-lg font-bold text-blue-600 w-8 text-right">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  )
}
```

### Lógica de auto-balance

Cuando el usuario mueve un slider, los otros se ajustan proporcionalmente
para mantener el total en 100:

```typescript
function ajustarPesos(
  pesos: ScorePesos,
  componente: keyof ScorePesos,
  nuevoValor: number,
): ScorePesos {
  const diferencia = nuevoValor - pesos[componente]
  const otros = Object.keys(pesos).filter(k => k !== componente) as (keyof ScorePesos)[]
  const sumaOtros = otros.reduce((sum, k) => sum + pesos[k], 0)

  const nuevos = { ...pesos, [componente]: nuevoValor }

  // Distribuir la diferencia proporcionalmente entre los otros
  for (const key of otros) {
    const proporcion = pesos[key] / sumaOtros
    nuevos[key] = Math.max(0, Math.round(pesos[key] - diferencia * proporcion))
  }

  // Ajustar redondeo para que sume exactamente 100
  const total = Object.values(nuevos).reduce((a, b) => a + b, 0)
  if (total !== 100) {
    const ajuste = 100 - total
    // Agregar/quitar del componente más grande (que no sea el que se movió)
    const mayor = otros.reduce((a, b) => nuevos[a] >= nuevos[b] ? a : b)
    nuevos[mayor] += ajuste
  }

  return nuevos
}
```

---

## Preview del impacto

Cuando el usuario cambia los pesos, mostrar cómo cambian los scores
de sus oportunidades actuales en tiempo real:

```
┌─────────────────────────────────────────────────────────┐
│ 📊 PREVIEW — Cómo cambian tus oportunidades            │
│                                                          │
│ Con los pesos actuales:                                  │
│                                                          │
│ CESAC Pinturas      Antes: 49  →  Ahora: 72  (+23) ↑   │
│ ADN Supervisión     Antes: 45  →  Ahora: 38  (-7)  ↓   │
│ INDOTEL Parqueo     Antes: 41  →  Ahora: 65  (+24) ↑   │
│ INESPRE Combustible Antes: 41  →  Ahora: 12  (-29) ↓   │
│                                                          │
│ 💡 Los procesos de tu sector suben, los irrelevantes    │
│    bajan naturalmente.                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Vista del score en detalle de oportunidad

Cuando el usuario ve el detalle de una oportunidad, mostrar el breakdown
con los pesos personalizados:

```
┌─────────────────────────────────────────────────────────┐
│ SCORE: 72/100                                            │
│                                                          │
│ Capacidades (UNSPSC)     ████████████████████████  24/30 │
│ Presupuesto              ██████████████████░░░░░░  18/20 │
│ Tipo Proceso             ████████████░░░░░░░░░░░░  12/15 │
│ Tiempo Restante          ████████████████░░░░░░░░  12/15 │
│ Entidad                  ██████░░░░░░░░░░░░░░░░░░   6/10 │
│ Keywords                 ██████████████████████░░   0/10 │
│                          ────────────────────────  ───── │
│                                                    72/100│
│                                                          │
│ ⚙️ Pesos personalizados activos                         │
│ [Ajustar pesos en Perfil]                                │
└─────────────────────────────────────────────────────────┘
```

Cada barra muestra `puntos obtenidos / máximo posible (según peso del usuario)`.

---

## API endpoint

```typescript
// PUT /perfil/score-pesos
// Body: { capacidades: 25, presupuesto: 25, tipo_proceso: 10, tiempo: 20, entidad: 10, keywords: 10 }
// Validación: suma === 100, cada valor >= 0 y <= 50

app.put('/perfil/score-pesos', async (req, reply) => {
  const pesos = req.body as ScorePesos
  const suma = Object.values(pesos).reduce((a, b) => a + b, 0)
  if (suma !== 100) {
    throw new AppError('Los pesos deben sumar 100', 400)
  }
  for (const [key, val] of Object.entries(pesos)) {
    if (val < 0 || val > 50) {
      throw new AppError(`${key} debe estar entre 0 y 50`, 400)
    }
  }
  await updateScorePesos(req.tenant.id, pesos)
  // Re-calcular scores de oportunidades existentes
  await scoreQueue.add('rescore-all', { tenantId: req.tenant.id })
  reply.send({ ok: true, pesos })
})
```

---

## Re-scoring automático

Cuando el usuario cambia los pesos:
1. Guardar en `empresa_perfil.score_pesos`
2. Encolar job `rescore-all` que recalcula todas las oportunidades del tenant
3. El frontend muestra el preview instantáneo (client-side) mientras el backend recalcula

```typescript
// apps/worker/processors/score.ts — MODIFICAR

async function processScore(job: Job): Promise<void> {
  const perfil = await getTenantPerfil(job.data.tenantId)

  // NUEVO: usar pesos del perfil
  const pesos = perfil.score_pesos ?? DEFAULT_PESOS

  const score = calcularScore({
    licitacion: ...,
    empresa: ...,
  }, pesos)  // ← pasar pesos personalizados
}
```

---

*JANUS — 2026-03-14*
*"Cada empresa tiene su propia definición de 'buena oportunidad'.
El scoring debe reflejar eso, no imponer una visión única."*

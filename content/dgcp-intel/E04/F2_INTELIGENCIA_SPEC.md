# F2: INTELIGENCIA — Spec Completa

> "¿Vale la pena esta licitación?" — Análisis profundo antes de decidir aplicar
> Fuente: HEFESTO_CORE (experiencia real con licitaciones RD)

---

## 1. Detección de Procesos Trucados (Red Flags)

Hefesto identificó 6 patrones de procesos amañados que se repiten en el portal DGCP.
El sistema debe detectarlos automáticamente y mostrar badges de advertencia.

### 6 Red Flags

| # | Flag | Señal | Ejemplo real |
|---|------|-------|-------------|
| 1 | `ESPECIFICACIONES_DIRIGIDAS` | Especificaciones técnicas que solo un proveedor puede cumplir | Colores de pintura exactos (Gris Claro 26, Grafito 42, Azul Alba 42) que solo una marca vende |
| 2 | `TIEMPO_INSUFICIENTE` | Menos de 3 días hábiles para preparar oferta | HMP-DAF-CD-2026-0007 dio 2 días para pintura de hospital |
| 3 | `INVITADOS_PRESELECCIONADOS` | Lista de invitados sospechosa, mismos proveedores repetidos | APICASA y Sigma ya tenían levantamiento del sitio antes de publicación |
| 4 | `FALTA_INFORMACION` | Pliegos sin cantidades, sin especificaciones claras | Proceso sin m² ni rendimientos esperados |
| 5 | `PRESUPUESTO_IRREAL` | Monto referencial no corresponde al alcance real | RD$ 500K para obra que cuesta RD$ 2M en materiales |
| 6 | `ADJUDICACION_REPETIDA` | Misma empresa gana procesos consecutivos de la misma entidad | Entidad X adjudica 5 veces seguidas al mismo proveedor |

### Implementación

```typescript
// packages/scoring/src/redflags.ts

interface RedFlag {
  tipo: RedFlagType
  severidad: 'alta' | 'media' | 'baja'
  detalle: string
  evidencia: string
}

type RedFlagType =
  | 'ESPECIFICACIONES_DIRIGIDAS'
  | 'TIEMPO_INSUFICIENTE'
  | 'INVITADOS_PRESELECCIONADOS'
  | 'FALTA_INFORMACION'
  | 'PRESUPUESTO_IRREAL'
  | 'ADJUDICACION_REPETIDA'

function detectarRedFlags(licitacion: Licitacion, historico?: HistoricoEntidad): RedFlag[] {
  const flags: RedFlag[] = []

  // 1. Tiempo insuficiente
  const diasParaPreparar = diasRestantes(licitacion.fecha_cierre)
  if (diasParaPreparar < 3) {
    flags.push({
      tipo: 'TIEMPO_INSUFICIENTE',
      severidad: 'alta',
      detalle: `Solo ${diasParaPreparar} días para preparar oferta`,
      evidencia: `Cierre: ${licitacion.fecha_cierre}`,
    })
  }

  // 2. Presupuesto vs scope
  // Se cruza monto referencial vs BD de precios (F2)
  // Si diferencia > 40%, flag

  // 3. Adjudicación repetida
  // Se consulta historial de la entidad
  // Si mismo proveedor ganó >3 procesos en 12 meses, flag

  // 4. Falta información
  // Si artículos tienen cantidad 0 o descripción genérica, flag

  return flags
}
```

### Schema Supabase

```sql
-- Nueva tabla para tracking de red flags
CREATE TABLE red_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  licitacion_id UUID NOT NULL REFERENCES licitaciones(id),
  tipo TEXT NOT NULL,
  severidad TEXT NOT NULL CHECK (severidad IN ('alta', 'media', 'baja')),
  detalle TEXT NOT NULL,
  evidencia TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_red_flags_licitacion ON red_flags(licitacion_id);
```

### UI: Badge en lista de oportunidades

```
⚠️ 2 RED FLAGS    → click abre modal con detalle
🔴 TRUCADA        → si tiene ≥2 flags alta
🟡 SOSPECHOSA     → si tiene 1 flag alta o ≥2 medias
```

---

## 2. Verificación UNSPSC Automática

El RPE (Registro de Proveedores del Estado) tiene códigos UNSPSC habilitados por empresa.
Si el proceso requiere un código que la empresa NO tiene, es descalificación automática.

### Lógica

```typescript
// packages/scoring/src/unspsc-verify.ts

interface UNSPSCVerification {
  compatible: boolean
  matches: UNSPSCMatch[]
  missing: string[]      // códigos requeridos que no tiene el RPE
  suggestion: string     // "Agregar código 73150000 en RPE antes de aplicar"
}

function verificarUNSPSC(
  codigosRPE: string[],      // códigos habilitados en RPE del tenant
  codigosProceso: string[],   // códigos UNSPSC del proceso
): UNSPSCVerification {
  // Match exacto (8 dígitos)
  // Match familia (4 dígitos)
  // Match segmento (2 dígitos)
  // Si ningún match → incompatible, sugerir agregar código
}
```

### Ejemplo real (Hefesto)

KOSMIMA tiene habilitados 16 códigos UNSPSC:
- 30100000 (Materiales estructurales)
- 31160000 (Ferretería)
- 72100000 (Servicios de construcción)
- 72140000 (Servicios de pintura)
- etc.

Proceso CEA-CCC-CP-2026-0009 requiere **73150000** (Soporte manufactura equipo).
→ KOSMIMA NO tiene ese código → **Incompatible** → No aplicar, o agregar código primero.

### UI

```
✅ UNSPSC Compatible (3 de 3 códigos)
⚠️ UNSPSC Parcial (2 de 3 — falta: 73150000 Soporte manufactura)
❌ UNSPSC Incompatible — No aplicar sin corregir RPE
```

---

## 3. Base de Datos de Precios RD

Hefesto mantiene una BD de precios reales del mercado dominicano.
Se importa a Supabase como tablas de referencia (no afectadas por RLS).

### Estructura

```sql
-- Materiales: 155 items en 12 categorías
CREATE TABLE ref_precios_materiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL,    -- m³, unidad, galón, lb, etc.
  precio_rd NUMERIC NOT NULL,
  fuente TEXT,             -- "Ferretería Popular 2025", "CNS 2022"
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mano de obra: 50+ tarifas
CREATE TABLE ref_mano_obra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo TEXT NOT NULL,          -- "Albañil", "Pintor", "Electricista"
  tarifa_diaria NUMERIC NOT NULL,
  tarifa_hora NUMERIC,
  fuente TEXT,                  -- "CNS 2022 + 20% ajuste 2025"
  rendimiento_descripcion TEXT, -- "8-10 m²/día pared"
  rendimiento_unidad TEXT,      -- "m²/día"
  rendimiento_valor NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipos: 40+ items
CREATE TABLE ref_equipos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tarifa_hora NUMERIC,
  tarifa_diaria NUMERIC,
  consumo_combustible TEXT,
  fuente TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Datos reales de Hefesto

**Muestra de materiales:**

| Material | Unidad | Precio RD$ |
|----------|--------|-----------|
| Cemento Portland Gris 42.5 kg | saco | 375 |
| Arena lavada | m³ | 1,566 |
| Gravilla 3/4" | m³ | 1,962 |
| Block 6" estándar | unidad | 28.93 |
| Varilla 3/8" corrugada | unidad | 245 |
| Pintura acrílica premium | galón | 1,250 |

**Muestra de mano de obra (CNS 2022 + 20%):**

| Cargo | Tarifa diaria RD$ | Rendimiento |
|-------|-------------------|-------------|
| Peón/Obrero | 980.59 | — |
| Albañil | 1,471.11 | 8-10 m²/día pared |
| Maestro/Supervisor | 2,941.78 | — |
| Pintor | 1,933.33 | 20-30 m²/día (2 manos) |
| Electricista | 2,800 | — |
| Plomero | 2,500 | — |

### Importación desde Hefesto

```bash
# Script de importación
# Lee: HEFESTO_CORE/BASES_DATOS/PRECIOS_*.md
# Lee: HEFESTO_CORE/BD_PRECIOS/mano_obra_pintura.json
# Genera: INSERT INTO ref_precios_materiales ...
```

---

## 4. Escenarios de Pricing (5 niveles)

Cuando el usuario decide aplicar, el sistema genera 5 escenarios de precio
con análisis de rentabilidad por cada uno.

### Lógica

```typescript
interface EscenarioPricing {
  nivel: number          // 1-5
  descuento_pct: number  // 0, 5, 10, 15, 20
  precio_total: number
  costo_estimado: number
  margen_bruto: number
  margen_pct: number
  recomendacion: 'conservador' | 'moderado' | 'competitivo' | 'agresivo' | 'muy_agresivo'
  viable: boolean        // false si margen < 5%
}

function generarEscenarios(
  presupuesto_referencial: number,
  costo_estimado: number,
): EscenarioPricing[] {
  return [0, 5, 10, 15, 20].map((desc, i) => {
    const precio = presupuesto_referencial * (1 - desc / 100)
    const margen = precio - costo_estimado
    return {
      nivel: i + 1,
      descuento_pct: desc,
      precio_total: precio,
      costo_estimado,
      margen_bruto: margen,
      margen_pct: (margen / precio) * 100,
      recomendacion: ['conservador', 'moderado', 'competitivo', 'agresivo', 'muy_agresivo'][i],
      viable: (margen / precio) * 100 >= 5,
    }
  })
}
```

### Ejemplo real (RSCS-DAF-CM-2026-0002)

Presupuesto referencial: RD$ 1,410,000
Costo real estimado: RD$ 689,350

| Escenario | Descuento | Precio oferta | Margen bruto | Margen % | Viable |
|-----------|-----------|--------------|-------------|---------|--------|
| Conservador | 0% | 1,410,000 | 720,650 | 51.1% | ✅ |
| Moderado | -5% | 1,339,500 | 650,150 | 48.5% | ✅ |
| Competitivo | -10% | 1,269,000 | 579,650 | 45.7% | ✅ |
| Agresivo | -15% | 1,198,500 | 509,150 | 42.5% | ✅ |
| Muy agresivo | -20% | 1,128,000 | 438,650 | 38.9% | ✅ |

### Análisis por ubicación (cuando hay múltiples sitios)

Hefesto demostró que un proceso con 15 centros de salud tenía:
- 13 ubicaciones rentables
- 2 ubicaciones con pérdida (distancia + volumen bajo)

El sistema debe desglosar rentabilidad por sitio/ítem, no solo total.

---

## 5. Índices Financieros Auto-cálculo

Los pliegos DGCP exigen ratios financieros específicos. El sistema debe:
1. Recibir datos del balance del tenant
2. Calcular automáticamente
3. Comparar contra umbrales DGCP
4. Alertar si no cumple

### Umbrales DGCP

```typescript
interface IndicesFinancieros {
  solvencia: number       // Activo Total / Pasivo Total → mínimo 1.20
  liquidez: number        // (Activo Corriente - Inventarios) / Pasivo Corriente → mínimo 0.90
  endeudamiento: number   // Pasivo Total / Patrimonio Neto → máximo 1.50
}

const UMBRALES_DGCP = {
  solvencia_min: 1.20,
  liquidez_min: 0.90,
  endeudamiento_max: 1.50,
}

function calcularIndices(balance: BalanceGeneral): IndicesFinancieros {
  return {
    solvencia: balance.activo_total / balance.pasivo_total,
    liquidez: (balance.activo_corriente - balance.inventarios) / balance.pasivo_corriente,
    endeudamiento: balance.pasivo_total / balance.patrimonio_neto,
  }
}

function verificarCumplimiento(indices: IndicesFinancieros): {
  cumple: boolean
  detalles: { indice: string; valor: number; umbral: number; cumple: boolean }[]
} {
  // Retorna detalle de cada índice vs umbral
}
```

### Schema

```sql
-- Agregar a empresa_perfil
ALTER TABLE empresa_perfil ADD COLUMN balance_data JSONB;
-- {activo_total, pasivo_total, activo_corriente, pasivo_corriente, inventarios, patrimonio_neto}
-- Fuente: estados financieros auditados del tenant
```

---

## 6. Historial de Entidades

Tracking de comportamiento de las entidades compradoras.

```sql
CREATE TABLE ref_entidades_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entidad_nombre TEXT NOT NULL,
  entidad_codigo TEXT,
  total_procesos INTEGER DEFAULT 0,
  procesos_adjudicados INTEGER DEFAULT 0,
  tiempo_pago_promedio_dias INTEGER,  -- ¿pagan rápido?
  red_flags_count INTEGER DEFAULT 0,
  confiabilidad_score NUMERIC,       -- 0-100
  proveedores_frecuentes JSONB,      -- [{nombre, veces_adjudicado}]
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Entregable F2

Al abrir el detalle de una oportunidad, el usuario ve:

```
┌─────────────────────────────────────────────────┐
│ CESAC-DAF-CM-2026-0015 — Pintura               │
│ CESAC | RD$ 1,590,876 | 12 días restantes       │
│                                                  │
│ ⚠️ RED FLAGS                                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ 🟡 TIEMPO_INSUFICIENTE — 4 días (borderline)│ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ✅ UNSPSC: Compatible (72140000 Pintura)         │
│                                                  │
│ 📊 ÍNDICES FINANCIEROS                          │
│ Solvencia: 1.85 ✅ (min 1.20)                    │
│ Liquidez:  1.12 ✅ (min 0.90)                    │
│ Endeudamiento: 0.92 ✅ (max 1.50)               │
│                                                  │
│ 💰 ESCENARIOS DE PRECIO                        │
│ ┌──────┬───────────┬──────────┬────────┐        │
│ │ Esc. │ Precio    │ Margen   │ Estado │        │
│ │ -0%  │ 1,590,876 │ 51.1%   │ ✅     │        │
│ │ -10% │ 1,431,788 │ 45.7%   │ ✅ ⭐  │        │
│ │ -20% │ 1,272,700 │ 38.9%   │ ✅     │        │
│ └──────┴───────────┴──────────┴────────┘        │
│                                                  │
│ 🏛️ ENTIDAD: CESAC                              │
│ Confiabilidad: 78/100 | Pago promedio: 45 días   │
│                                                  │
│ [APLICAR →]  [DESCARTAR]  [PREGUNTAR A GUARDIAN] │
└─────────────────────────────────────────────────┘
```

---

*JANUS — 2026-03-14*
*Conocimiento: HEFESTO_CORE/BASES_DATOS/ + HEFESTO_CORE/LICITACIONES/ + HEFESTO_CORE/PROTOCOLOS/*

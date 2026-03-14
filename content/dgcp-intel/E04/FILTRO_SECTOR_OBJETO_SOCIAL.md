# Filtro por Sector y Objeto Social — Spec

> Problema real: el dashboard muestra "tickets de combustible", "camiones de bomberos",
> "electrodomésticos" a una empresa de construcción. Sin filtro = ruido total.
> Reportado por ATLAS en producción (localhost:4000)
> 2026-03-14

---

## El Problema

La API DGCP devuelve procesos de TODO tipo. Sin filtro por sector, una constructora
ve licitaciones de combustible, tecnología, catering, etc. que no puede licitar.

**Datos reales de la API** (`datosabiertos.dgcp.gob.do`):

| objeto_proceso | % de procesos | Ejemplo |
|---------------|--------------|---------|
| **Bienes** | ~55% | Combustible, electrodomésticos, equipos tecnológicos |
| **Servicios** | ~44% | Mantenimiento, consultoría, vigilancia, limpieza |
| **Obras** | ~1% | Construcción, remodelación, infraestructura |

Una constructora solo debería ver **Obras** y algunos **Servicios** de construcción.
Una empresa de TI solo debería ver **Bienes** (equipos) y **Servicios** (consultoría TI).

---

## Solución: Dos modos de filtrado

### Modo 1: Genérico (selector de categoría)

El usuario elige qué tipos de proceso le interesan.

```
┌─────────────────────────────────────────┐
│ 🏷️ FILTRAR POR TIPO DE PROCESO         │
│                                          │
│ ☑️ Obras                                │
│ ☑️ Servicios                            │
│ ☐ Bienes                                │
│                                          │
│ Mostrando: Obras + Servicios (45%)       │
│ Ocultos: Bienes (55%)                    │
└─────────────────────────────────────────┘
```

Esto va en la página de Oportunidades como filtro adicional (junto a estado y score mínimo).

### Modo 2: Adaptado a la empresa (objeto social + UNSPSC)

El perfil de la empresa define qué puede licitar basado en:
1. **Objeto social** — texto libre que describe la actividad de la empresa
2. **Códigos UNSPSC** registrados en el RPE
3. **Sectores de interés** — categorías amplias seleccionadas por el usuario
4. **Palabras clave** — términos que identifican procesos relevantes
5. **Palabras excluidas** — términos que descartan procesos irrelevantes

---

## Implementación

### Schema: empresa_perfil actualizado

```sql
-- Agregar a empresa_perfil
ALTER TABLE empresa_perfil ADD COLUMN objetos_interes TEXT[] DEFAULT '{Obras,Servicios}';
-- Valores posibles: 'Bienes', 'Servicios', 'Obras'

ALTER TABLE empresa_perfil ADD COLUMN sectores_interes TEXT[];
-- Valores: 'construccion', 'tecnologia', 'salud', 'vigilancia', 'limpieza',
--          'alimentos', 'transporte', 'consultoria', 'suministros_oficina', etc.

ALTER TABLE empresa_perfil ADD COLUMN palabras_clave TEXT[];
-- Ej: ['construcción', 'mantenimiento', 'pintura', 'reparación', 'obra']

ALTER TABLE empresa_perfil ADD COLUMN palabras_excluir TEXT[];
-- Ej: ['software', 'consultoría', 'auditoría', 'catering', 'combustible']
```

### Catálogo de sectores

```typescript
// packages/shared/src/constants.ts

export const SECTORES = {
  construccion: {
    nombre: 'Construcción y Obras',
    objetos: ['Obras', 'Servicios'],
    keywords: ['construcción', 'obra', 'mantenimiento', 'reparación', 'pintura',
               'plomería', 'eléctrico', 'contenes', 'aceras', 'pavimento',
               'drenaje', 'infraestructura', 'remodelación'],
    excluir: ['software', 'consultoría financiera', 'auditoría', 'catering',
              'combustible', 'vehículos', 'electrodomésticos'],
    unspsc_prefijos: ['30', '31', '39', '40', '72', '76', '81'],
  },
  tecnologia: {
    nombre: 'Tecnología e Informática',
    objetos: ['Bienes', 'Servicios'],
    keywords: ['tecnológico', 'informático', 'software', 'hardware', 'computador',
               'servidor', 'red', 'telecomunicaciones', 'sistema', 'desarrollo'],
    excluir: ['construcción', 'obra', 'pintura', 'alimentos', 'combustible'],
    unspsc_prefijos: ['43', '44', '45', '81'],
  },
  salud: {
    nombre: 'Salud y Equipamiento Médico',
    objetos: ['Bienes', 'Servicios'],
    keywords: ['médico', 'hospitalario', 'salud', 'farmacia', 'laboratorio',
               'quirúrgico', 'clínico', 'biomédico'],
    excluir: ['construcción', 'combustible', 'vehículos'],
    unspsc_prefijos: ['41', '42', '85'],
  },
  vigilancia: {
    nombre: 'Vigilancia y Seguridad',
    objetos: ['Servicios'],
    keywords: ['vigilancia', 'seguridad', 'guardia', 'monitoreo', 'CCTV',
               'protección', 'custodia'],
    excluir: ['construcción', 'software', 'alimentos'],
    unspsc_prefijos: ['46', '92'],
  },
  limpieza: {
    nombre: 'Limpieza y Saneamiento',
    objetos: ['Servicios', 'Bienes'],
    keywords: ['limpieza', 'aseo', 'desinfección', 'fumigación', 'saneamiento',
               'higiene', 'desechos'],
    excluir: ['construcción', 'software', 'vehículos'],
    unspsc_prefijos: ['47', '76'],
  },
  suministros: {
    nombre: 'Suministros y Material de Oficina',
    objetos: ['Bienes'],
    keywords: ['suministro', 'oficina', 'papelería', 'mobiliario', 'muebles',
               'escritorio', 'archivo'],
    excluir: ['construcción', 'software', 'vehículos', 'combustible'],
    unspsc_prefijos: ['44', '56'],
  },
  alimentos: {
    nombre: 'Alimentos y Catering',
    objetos: ['Bienes', 'Servicios'],
    keywords: ['alimento', 'comida', 'ración', 'catering', 'comedor',
               'cocina', 'alimentación'],
    excluir: ['construcción', 'software', 'vehículos'],
    unspsc_prefijos: ['50', '90'],
  },
  transporte: {
    nombre: 'Transporte y Vehículos',
    objetos: ['Bienes', 'Servicios'],
    keywords: ['vehículo', 'transporte', 'camión', 'combustible', 'flota',
               'mantenimiento vehicular', 'automotriz'],
    excluir: ['construcción de edificios', 'software', 'alimentos'],
    unspsc_prefijos: ['25', '78'],
  },
  consultoria: {
    nombre: 'Consultoría y Servicios Profesionales',
    objetos: ['Servicios'],
    keywords: ['consultoría', 'asesoría', 'auditoría', 'estudio', 'diseño',
               'planificación', 'capacitación', 'evaluación'],
    excluir: ['combustible', 'vehículos', 'alimentos'],
    unspsc_prefijos: ['80', '81', '86'],
  },
} as const

export type SectorId = keyof typeof SECTORES
```

### Filtro en el scoring engine

```typescript
// packages/scoring/src/sector-filter.ts

interface FiltroSector {
  objetos_interes: string[]       // ['Obras', 'Servicios']
  sectores: SectorId[]            // ['construccion']
  palabras_clave: string[]        // custom del tenant
  palabras_excluir: string[]      // custom del tenant
  codigos_unspsc: string[]        // del RPE del tenant
}

interface ResultadoFiltro {
  relevante: boolean
  razon: string
  score_relevancia: number  // 0-100
  match_tipo: 'objeto' | 'keyword' | 'unspsc' | 'sector' | 'excluido'
}

function filtrarPorSector(
  licitacion: Licitacion,
  filtro: FiltroSector,
): ResultadoFiltro {
  // 1. Verificar objeto_proceso (Bienes/Servicios/Obras)
  if (!filtro.objetos_interes.includes(licitacion.objeto_proceso)) {
    return { relevante: false, razon: `Tipo ${licitacion.objeto_proceso} no es de interés`, score_relevancia: 0, match_tipo: 'objeto' }
  }

  // 2. Verificar palabras excluidas (descarte rápido)
  const textoLicitacion = `${licitacion.titulo} ${licitacion.descripcion}`.toLowerCase()
  for (const excluir of filtro.palabras_excluir) {
    if (textoLicitacion.includes(excluir.toLowerCase())) {
      return { relevante: false, razon: `Contiene palabra excluida: "${excluir}"`, score_relevancia: 0, match_tipo: 'excluido' }
    }
  }

  // 3. Verificar UNSPSC match (más preciso)
  if (licitacion.codigos_unspsc?.length) {
    const matchUNSPSC = licitacion.codigos_unspsc.some(codigo =>
      filtro.codigos_unspsc.some(rpe =>
        codigo.startsWith(rpe.substring(0, 4)) || // match familia (4 dígitos)
        codigo.startsWith(rpe.substring(0, 2))    // match segmento (2 dígitos)
      )
    )
    if (matchUNSPSC) {
      return { relevante: true, razon: 'UNSPSC compatible con RPE', score_relevancia: 100, match_tipo: 'unspsc' }
    }
  }

  // 4. Verificar palabras clave (match por texto)
  const keywordsMatch = filtro.palabras_clave.filter(kw =>
    textoLicitacion.includes(kw.toLowerCase())
  )
  if (keywordsMatch.length > 0) {
    return { relevante: true, razon: `Keywords: ${keywordsMatch.join(', ')}`, score_relevancia: 70 + keywordsMatch.length * 10, match_tipo: 'keyword' }
  }

  // 5. Sin match claro — marcar como bajo relevancia
  return { relevante: false, razon: 'Sin match de sector, UNSPSC ni keywords', score_relevancia: 20, match_tipo: 'sector' }
}
```

### Integración en el worker scan

```typescript
// apps/worker/processors/scan.ts — MODIFICAR

async function processScan(job: Job): Promise<void> {
  // ... después de obtener releases y mapear ...

  for (const tenant of tenants) {
    const perfil = await getTenantPerfil(tenant.id)

    // NUEVO: filtrar por sector ANTES de scorear
    const filtro: FiltroSector = {
      objetos_interes: perfil.objetos_interes ?? ['Obras', 'Servicios', 'Bienes'],
      sectores: perfil.sectores_interes ?? [],
      palabras_clave: perfil.palabras_clave ?? [],
      palabras_excluir: perfil.palabras_excluir ?? [],
      codigos_unspsc: perfil.codigos_unspsc ?? [],
    }

    const licitacionesFiltradas = licitaciones.filter(lic => {
      const resultado = filtrarPorSector(lic, filtro)
      return resultado.relevante
    })

    // Solo scorear las relevantes (ahorra CPU y reduce ruido)
    for (const lic of licitacionesFiltradas) {
      await scoreQueue.add('score', { tenantId: tenant.id, licitacionId: lic.id })
    }
  }
}
```

---

## UI: Perfil de Empresa — Configuración de Sector

### Sección en /perfil

```
┌─────────────────────────────────────────────────────┐
│ 🏢 PERFIL DE EMPRESA                                │
│                                                      │
│ ── DATOS GENERALES ──                               │
│ Nombre: KOSMIMA INVESTMENT SRL                       │
│ RNC: 133-07847-3  |  RPE: 118338                    │
│ Clasificación: Micro Empresa                         │
│                                                      │
│ ── SECTOR Y OBJETO SOCIAL ──                        │
│                                                      │
│ Tipo de proceso:                                     │
│ ☑️ Obras        ☑️ Servicios      ☐ Bienes          │
│                                                      │
│ Sector principal:                                    │
│ ┌────────────────────────────────────────────┐       │
│ │ ☑️ Construcción y Obras                    │       │
│ │ ☐ Tecnología e Informática                 │       │
│ │ ☐ Salud y Equipamiento Médico              │       │
│ │ ☐ Vigilancia y Seguridad                   │       │
│ │ ☐ Limpieza y Saneamiento                   │       │
│ │ ☐ Suministros y Material de Oficina        │       │
│ │ ☐ Alimentos y Catering                     │       │
│ │ ☐ Transporte y Vehículos                   │       │
│ │ ☐ Consultoría y Servicios Profesionales    │       │
│ └────────────────────────────────────────────┘       │
│                                                      │
│ Palabras clave (una por línea):                      │
│ ┌────────────────────────────────────────────┐       │
│ │ construcción                               │       │
│ │ mantenimiento                              │       │
│ │ pintura                                    │       │
│ │ reparación                                 │       │
│ │ infraestructura                            │       │
│ └────────────────────────────────────────────┘       │
│                                                      │
│ Excluir procesos que contengan:                      │
│ ┌────────────────────────────────────────────┐       │
│ │ software                                   │       │
│ │ auditoría                                  │       │
│ │ catering                                   │       │
│ │ combustible                                │       │
│ └────────────────────────────────────────────┘       │
│                                                      │
│ Códigos UNSPSC habilitados (de tu RPE):              │
│ 72100000 — Servicios de mantenimiento                │
│ 72130000 — Construcción general                      │
│ 31210000 — Pinturas y acabados                       │
│ ... (16 códigos)                                     │
│                                                      │
│ [GUARDAR PERFIL]                                     │
└─────────────────────────────────────────────────────┘
```

### Al seleccionar un sector, auto-sugiere keywords

```typescript
function onSectorChange(sector: SectorId): void {
  const config = SECTORES[sector]
  // Auto-llenar keywords y exclusiones sugeridas
  setSuggestedKeywords(config.keywords)
  setSuggestedExcluir(config.excluir)
  setObjetos(config.objetos)
  // El usuario puede editar antes de guardar
}
```

---

## UI: Filtro en Oportunidades

### Filtro adicional en /oportunidades

```
Filtros actuales:
  [Estado ▼]  [Score mínimo ▼]

Agregar:
  [Tipo: Obras/Servicios/Bienes ▼]  [Solo mi sector ☑️]
```

Cuando "Solo mi sector" está activado, usa el filtro del perfil.
Cuando está desactivado, muestra todo (modo exploración).

---

## Impacto en scoring

El `score_relevancia` del filtro de sector se integra como **componente 7** del scoring:

```typescript
// Antes: 6 componentes (UNSPSC, presupuesto, modalidad, tiempo, entidad, keywords)
// Ahora: 7 componentes

export function calcularScore(input: ScoreInput): ScoreResult {
  const componentes = {
    capacidades: scoreCapacidades(input),     // 30 pts
    presupuesto: scorePresupuesto(input),     // 15 pts (era 20)
    tipo_proceso: scoreTipoProceso(input),    // 15 pts
    tiempo: scoreTiempo(input),              // 15 pts
    entidad: scoreEntidad(input),            // 10 pts
    keywords: scoreKeywords(input),          // 5 pts (era 10)
    sector: scoreSector(input),              // 10 pts (NUEVO)
  }
  // Total: 100 pts
}
```

Esto hace que procesos fuera del sector tengan score bajo naturalmente,
sin necesidad de filtro binario.

---

## Ejemplo real: KOSMIMA (constructora)

**Sin filtro** (actual): 34 licitaciones, todas con score 41-49 (BAJO) — ruido

**Con filtro sector=construccion**:
- Excluye: combustible, camiones bomberos, electrodomésticos, equipos TI
- Queda: ~5 licitaciones relevantes (obras, mantenimiento, pintura)
- Scores suben: 65-85 porque el match UNSPSC + keywords es real

```
ANTES: 34 licitaciones — 0 relevantes — usuario pierde confianza
DESPUÉS: 5 licitaciones — todas relevantes — usuario confía en el sistema
```

---

*JANUS — 2026-03-14*
*Reportado por ATLAS en producción — el scoring sin filtro de sector es inútil*

# Modos de Vista: Genérico vs Mi Empresa — Spec

> Dos formas de ver oportunidades: explorar todo el mercado O ver solo lo relevante
> Toggle simple en la UI, cambia filtros y scoring en un click
> 2026-03-14

---

## Concepto

```
┌──────────────────────────────────────────────────────┐
│  [🌐 Genérico]    [🏢 Mi Empresa]                    │
│       ↑                  ↑                            │
│  "Quiero ver todo"   "Solo lo mío"                    │
└──────────────────────────────────────────────────────┘
```

| Aspecto | 🌐 Genérico | 🏢 Mi Empresa |
|---------|------------|---------------|
| Licitaciones | Todas las disponibles | Solo las que matchean mi perfil |
| Score | Pesos default (30/20/15/15/10/10) | Pesos personalizados del usuario |
| Filtro sector | No aplica | Filtra por objetos_interes + sectores |
| Filtro UNSPSC | No cruza códigos | Cruza con mis códigos RPE |
| Keywords | No filtra por texto | Aplica mis palabras clave/excluidas |
| Resultado típico | 100 licitaciones, todo mezclado | 5-20 relevantes |
| Para qué | Explorar mercado, ver tendencias | Encontrar mis oportunidades |

---

## UI: Toggle en barra de oportunidades

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Buscar licitaciones...                          [🔄 100]│
│                                                             │
│ ┌─────────────────────────────────────┐                     │
│ │  [🌐 Genérico]  [🏢 Mi Empresa]    │  ← Toggle principal │
│ └─────────────────────────────────────┘                     │
│                                                             │
│ Filtros: [Estado ▼] [Score ▼] [Tipo ▼] [Modalidad ▼]      │
│                                                             │
│ 100 resultados (modo genérico)                              │
│ ─────────────────────────────────────────────────────────── │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

Cuando cambia a "Mi Empresa":

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Buscar licitaciones...                          [🔄 100]│
│                                                             │
│ ┌─────────────────────────────────────┐                     │
│ │  🌐 Genérico   [🏢 Mi Empresa ✓]   │  ← Activo          │
│ └─────────────────────────────────────┘                     │
│                                                             │
│ Filtros: [Estado ▼] [Score ▼] [Tipo ▼] [Modalidad ▼]      │
│ Sector: Construcción y Obras | UNSPSC: 16 códigos activos   │
│                                                             │
│ 12 de 100 resultados (filtrado por tu perfil)               │
│ ─────────────────────────────────────────────────────────── │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Comportamiento detallado

### 🌐 Modo Genérico

```typescript
// Cuando modo === 'generico'
const config = {
  filtrarPorSector: false,
  filtrarPorUNSPSC: false,
  filtrarPorKeywords: false,
  filtrarPorExclusiones: false,
  scorePesos: DEFAULT_PESOS,  // 30/20/15/15/10/10
  mostrarTodos: true,
}
```

**Qué ve el usuario:**
- Todas las 100 licitaciones cargadas
- Scores con pesos genéricos (iguales para todos)
- Filtros manuales disponibles (estado, score, tipo, modalidad, búsqueda texto)
- Puede filtrar manualmente por Obras/Servicios/Bienes
- Sin indicadores de compatibilidad UNSPSC

**Para qué sirve:**
- Usuario nuevo que aún no configuró su perfil
- Explorar qué hay en el mercado
- Investigar nuevos sectores donde expandirse
- Ver tendencias generales (qué entidades están comprando, qué montos)
- Benchmark: "¿cuántas licitaciones hay en TI este mes?"

### 🏢 Modo Mi Empresa

```typescript
// Cuando modo === 'mi_empresa'
const perfil = await getPerfil(tenantId)

const config = {
  filtrarPorSector: true,
  filtrarPorUNSPSC: true,
  filtrarPorKeywords: true,
  filtrarPorExclusiones: true,
  scorePesos: perfil.score_pesos ?? DEFAULT_PESOS,
  mostrarTodos: false,
  // Datos del perfil
  objetos_interes: perfil.objetos_interes,      // ['Obras', 'Servicios']
  sectores: perfil.sectores_interes,             // ['construccion']
  codigos_unspsc: perfil.codigos_unspsc,         // 16 códigos RPE
  palabras_clave: perfil.palabras_clave,         // ['pintura', 'mantenimiento']
  palabras_excluir: perfil.palabras_excluir,     // ['software', 'combustible']
}
```

**Qué ve el usuario:**
- Solo licitaciones que pasan el filtro de sector + UNSPSC + keywords
- Scores con pesos personalizados (si los configuró)
- Badge de compatibilidad UNSPSC en cada tarjeta
- Indicador "por qué matcheó" (keyword, UNSPSC, sector)
- Los mismos filtros manuales adicionales disponibles

**Para qué sirve:**
- Trabajo diario: "¿hay algo nuevo para mí?"
- Alta señal, bajo ruido
- Scores reflejan las prioridades reales del usuario

---

## Implementación client-side

```typescript
// apps/web/src/hooks/useOportunidades.ts

type ModoVista = 'generico' | 'mi_empresa'

function useOportunidades() {
  const [modo, setModo] = useState<ModoVista>('mi_empresa') // default: mi empresa
  const { data: todas } = useSWR('/api/oportunidades?limit=100&enriched=true', fetcher)
  const { data: perfil } = useSWR('/api/perfil', fetcher)
  const [filtrosManuales, setFiltrosManuales] = useState<FiltrosActivos>(defaultFiltros)

  const filtradas = useMemo(() => {
    if (!todas) return []
    let resultado = [...todas]

    // 1. Aplicar filtro de modo
    if (modo === 'mi_empresa' && perfil) {
      resultado = resultado.filter(op => {
        const check = filtrarPorSector(op, {
          objetos_interes: perfil.objetos_interes ?? [],
          sectores: perfil.sectores_interes ?? [],
          palabras_clave: perfil.palabras_clave ?? [],
          palabras_excluir: perfil.palabras_excluir ?? [],
          codigos_unspsc: perfil.codigos_unspsc ?? [],
        })
        return check.relevante
      })

      // Re-calcular scores con pesos del usuario (client-side para preview)
      if (perfil.score_pesos) {
        resultado = resultado.map(op => ({
          ...op,
          score: recalcularScoreClientSide(op.score_componentes_raw, perfil.score_pesos),
        }))
      }
    }

    // 2. Aplicar filtros manuales (ambos modos)
    resultado = filtrar(resultado, filtrosManuales)

    return resultado
  }, [todas, perfil, modo, filtrosManuales])

  return { todas, filtradas, modo, setModo, filtrosManuales, setFiltrosManuales, perfil }
}
```

### Re-cálculo de score client-side

Para que el toggle sea instantáneo, el API devuelve los scores RAW (0-100 por componente)
y el frontend aplica los pesos:

```typescript
// Endpoint devuelve score_componentes_raw además de score final
interface OportunidadEnriquecida {
  // ... otros campos
  score: number                    // score final con pesos default
  score_componentes: ScoreComponentes  // con pesos default
  score_componentes_raw: {         // NUEVO: sin pesos, 0-100 cada uno
    capacidades: number
    presupuesto: number
    tipo_proceso: number
    tiempo: number
    entidad: number
    keywords: number
  }
}

function recalcularScoreClientSide(
  raw: Record<string, number>,
  pesos: ScorePesos,
): number {
  let total = 0
  for (const [key, valor] of Object.entries(raw)) {
    total += Math.round(valor * (pesos[key as keyof ScorePesos] ?? 0) / 100)
  }
  return total
}
```

---

## Indicadores visuales por modo

### Tarjeta de oportunidad en modo Mi Empresa

```
┌──────────────────────────────────────────────────────┐
│ 🟢 78  CESAC | Adquisición de pinturas    | RD$ 1.5M │
│                                                       │
│ ✅ UNSPSC: 31210000 (Pinturas)                       │
│ 🔑 Keywords: "pintura", "materiales"                  │
│ 📋 Obras | 12 días restantes                          │
│                                                       │
│ [Ver detalle]  [Propuesta]  [Descartar]               │
└──────────────────────────────────────────────────────┘
```

### Tarjeta de oportunidad en modo Genérico

```
┌──────────────────────────────────────────────────────┐
│ 🟡 49  CESAC | Adquisición de pinturas    | RD$ 1.5M │
│                                                       │
│ 📋 Bienes | 12 días restantes | CM                    │
│                                                       │
│ [Ver detalle]  [Propuesta]  [Descartar]               │
└──────────────────────────────────────────────────────┘
```

Nota: el mismo proceso tiene score 78 en "Mi Empresa" (pesos custom de constructora)
y score 49 en "Genérico" (pesos default). El usuario entiende la diferencia.

---

## Primer uso (onboarding)

Si el usuario no tiene perfil configurado, al entrar a Oportunidades:

```
┌─────────────────────────────────────────────────────────┐
│ 👋 Configura tu perfil para ver oportunidades relevantes │
│                                                          │
│ Estás en modo Genérico — viendo TODAS las licitaciones.  │
│ Para filtrar por tu sector y mejorar el scoring:         │
│                                                          │
│ [⚙️ Configurar mi perfil]    [Seguir en genérico →]     │
└─────────────────────────────────────────────────────────┘
```

Si clickea "Configurar", va a `/perfil` con las secciones:
1. Datos empresa (RNC, RPE, nombre)
2. Sector y objeto social (selector + keywords)
3. Códigos UNSPSC (ingreso manual o importar de RPE)
4. Configurar score (sliders de pesos)

---

## Persistencia del modo

```typescript
// El modo seleccionado se guarda en localStorage
// No es server-side porque es una preferencia de visualización

const [modo, setModo] = useState<ModoVista>(() => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('dgcp_modo_vista') as ModoVista) ?? 'mi_empresa'
  }
  return 'mi_empresa'
})

useEffect(() => {
  localStorage.setItem('dgcp_modo_vista', modo)
}, [modo])
```

---

## Resumen para ATLAS

| Qué implementar | Dónde |
|-----------------|-------|
| Toggle `[🌐 Genérico] [🏢 Mi Empresa]` | `/oportunidades` — arriba de filtros |
| Genérico: mostrar todo, scores default | `useOportunidades` hook |
| Mi Empresa: filtrar por perfil, scores custom | `filtrarPorSector()` + `recalcularScoreClientSide()` |
| API: devolver `score_componentes_raw` | `GET /oportunidades` response |
| Badges UNSPSC + keywords en tarjeta | Solo en modo Mi Empresa |
| Banner onboarding si perfil vacío | Modal/banner en primera visita |
| Persistir modo en localStorage | Client-side |

---

*JANUS — 2026-03-14*
*"Genérico para explorar. Mi Empresa para trabajar."*

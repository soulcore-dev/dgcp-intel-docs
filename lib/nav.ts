// lib/nav.ts — Navigation tree DGCP INTEL

export interface NavItem {
  title: string
  slug: string
  file: string
  status?: '✅' | '🔄' | '⏳'
  children?: NavItem[]
  isIndex?: boolean
}

export const NAV: NavItem[] = [
  {
    title: 'Índice del Proyecto',
    slug: '',
    file: '00_INDEX.md',
    status: '✅',
    isIndex: true,
  },
  {
    title: 'E01 — Análisis',
    slug: 'E01',
    file: 'E01/01_CONTEXTO_LEGAL.md',
    status: '✅',
    children: [
      {
        title: 'Marco Legal — Ley 47-25',
        slug: 'E01/contexto-legal',
        file: 'E01/01_CONTEXTO_LEGAL.md',
        status: '✅',
      },
      {
        title: 'Ecosistema DGCP — APIs y Portal',
        slug: 'E01/ecosistema-dgcp',
        file: 'E01/02_ECOSISTEMA_DGCP.md',
        status: '✅',
      },
      {
        title: 'Modelo de Negocio SaaS',
        slug: 'E01/modelo-negocio',
        file: 'E01/03_MODELO_NEGOCIO.md',
        status: '✅',
      },
      {
        title: 'Arquitectura Base',
        slug: 'E01/arquitectura-base',
        file: 'E01/04_ARQUITECTURA_BASE.md',
        status: '✅',
      },
      {
        title: 'Flujos Principales',
        slug: 'E01/flujos-principales',
        file: 'E01/05_FLUJOS_PRINCIPALES.md',
        status: '✅',
      },
      {
        title: 'Scoring Engine — 6 Componentes',
        slug: 'E01/scoring-engine',
        file: 'E01/06_SCORING_ENGINE.md',
        status: '✅',
      },
      {
        title: 'CHK-01 — Gate E01 47/47',
        slug: 'E01/chk01',
        file: 'E01/07_CHK_01_VERIFICADO.md',
        status: '✅',
      },
    ],
  },
  {
    title: 'E02 — Diseño',
    slug: 'E02',
    file: 'E02/01_API_REST_SPEC.md',
    status: '✅',
    children: [
      {
        title: 'API REST — Endpoints Completos',
        slug: 'E02/api-rest',
        file: 'E02/01_API_REST_SPEC.md',
        status: '✅',
      },
      {
        title: 'SQL Migrations — Supabase',
        slug: 'E02/sql-migrations',
        file: 'E02/02_SQL_MIGRATIONS.md',
        status: '✅',
      },
      {
        title: 'Bot Telegram — Diseño Completo',
        slug: 'E02/bot-telegram',
        file: 'E02/03_BOT_TELEGRAM.md',
        status: '✅',
      },
      {
        title: 'Dashboard Wireframes',
        slug: 'E02/dashboard-wireframes',
        file: 'E02/04_DASHBOARD_WIREFRAMES.md',
        status: '✅',
      },
      {
        title: 'Seguridad RPE — Vault AES-256',
        slug: 'E02/seguridad-rpe',
        file: 'E02/05_SEGURIDAD_RPE.md',
        status: '✅',
      },
      {
        title: 'CHK-02 — Gate E02 38/38',
        slug: 'E02/chk02',
        file: 'E02/06_CHK_02_VERIFICADO.md',
        status: '✅',
      },
      {
        title: 'GUARDIAN — Asistente IA',
        slug: 'E02/asistente-ia',
        file: 'E02/07_ASISTENTE_IA.md',
        status: '✅',
      },
    ],
  },
  {
    title: 'E03 — Pre-Código',
    slug: 'E03',
    file: 'E03/01_REPO_STRUCTURE.md',
    status: '✅',
    children: [
      {
        title: 'Estructura del Repositorio',
        slug: 'E03/repo-structure',
        file: 'E03/01_REPO_STRUCTURE.md',
        status: '✅',
      },
      {
        title: 'Package.json por Servicio',
        slug: 'E03/packages',
        file: 'E03/02_PACKAGES_JSON.md',
        status: '✅',
      },
      {
        title: 'Docker + Railway + Vercel Config',
        slug: 'E03/infra-config',
        file: 'E03/03_INFRA_CONFIG.md',
        status: '✅',
      },
      {
        title: 'Plan de Testing',
        slug: 'E03/plan-testing',
        file: 'E03/04_PLAN_TESTING.md',
        status: '✅',
      },
      {
        title: 'CHK-03 — Gate E03 32/32',
        slug: 'E03/chk03',
        file: 'E03/05_CHK_03_VERIFICADO.md',
        status: '✅',
      },
    ],
  },
  {
    title: 'E04 — Desarrollo',
    slug: 'E04',
    file: 'E04/00_INDEX.md',
    status: '🔄',
    children: [
      {
        title: 'Índice y Estado del Código',
        slug: 'E04/index',
        file: 'E04/00_INDEX.md',
        status: '🔄',
      },
      {
        title: 'Browser Service — Playwright',
        slug: 'E04/browser-service',
        file: 'E04/01_BROWSER_SERVICE.md',
        status: '🔄',
      },
      {
        title: 'Web Dashboard — Next.js 14',
        slug: 'E04/web-dashboard',
        file: 'E04/02_WEB_DASHBOARD.md',
        status: '🔄',
      },
      {
        title: 'Submit Processor — Worker→Browser',
        slug: 'E04/submit-processor',
        file: 'E04/03_SUBMIT_PROCESSOR.md',
        status: '🔄',
      },
      {
        title: 'F2 — Inteligencia (Red Flags + BD Precios)',
        slug: 'E04/f2-inteligencia',
        file: 'E04/F2_INTELIGENCIA_SPEC.md',
        status: '⏳',
      },
      {
        title: 'F3A — Preparación (Sobre A/B + APU)',
        slug: 'E04/f3-preparacion',
        file: 'E04/F3_PREPARACION_SPEC.md',
        status: '⏳',
      },
      {
        title: 'F3B — Revisión y Aprobación',
        slug: 'E04/f3b-revision',
        file: 'E04/F3B_REVISION_APROBACION_SPEC.md',
        status: '⏳',
      },
      {
        title: 'F4 — Submission (Portal SECP)',
        slug: 'E04/f4-submission',
        file: 'E04/F4_SUBMISSION_SPEC.md',
        status: '⏳',
      },
    ],
  },
  {
    title: 'Roadmap de Fases',
    slug: 'roadmap',
    file: 'ROADMAP_FASES.md',
    status: '✅',
  },
]

export function flattenNav(items: NavItem[]): NavItem[] {
  return items.flatMap(item => [item, ...flattenNav(item.children ?? [])])
}

export function findNavItem(slug: string): NavItem | undefined {
  return flattenNav(NAV).find(item => item.slug === slug)
}

export function getParents(slug: string): NavItem[] {
  const parts = slug.split('/')
  const parents: NavItem[] = []
  for (let i = 1; i < parts.length; i++) {
    const parentSlug = parts.slice(0, i).join('/')
    const parent = findNavItem(parentSlug)
    if (parent) parents.push(parent)
  }
  return parents
}

import Link from 'next/link'
import { flattenNav, NAV, NavItem } from '@/lib/nav'

export function PrevNextNav({ slug }: { slug: string }) {
  const flat = flattenNav(NAV).filter(i => i.file.endsWith('.md') && i.slug !== '')
  const idx = flat.findIndex(i => i.slug === slug)
  if (idx === -1) return null

  const prev = idx > 0 ? flat[idx - 1] : null
  const next = idx < flat.length - 1 ? flat[idx + 1] : null

  if (!prev && !next) return null

  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/docs/${prev.slug}`}
          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
        >
          <svg className="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Anterior</p>
            <p className="text-sm font-medium text-slate-700 group-hover:text-brand-700 truncate transition-colors">
              {prev.title}
            </p>
          </div>
        </Link>
      ) : <div />}

      {next ? (
        <Link
          href={`/docs/${next.slug}`}
          className="group flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all text-right"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Siguiente</p>
            <p className="text-sm font-medium text-slate-700 group-hover:text-brand-700 truncate transition-colors">
              {next.title}
            </p>
          </div>
          <svg className="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : <div />}
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDoc } from '@/lib/docs'
import { findNavItem, getParents, flattenNav, NAV, NavItem } from '@/lib/nav'
import { DocRenderer } from '@/components/DocRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { PrevNextNav } from '@/components/PrevNextNav'
import clsx from 'clsx'

interface PageProps {
  params: { slug?: string[] }
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    '✅': { label: 'Completado',  cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80 border-emerald-200' },
    '🔄': { label: 'En progreso', cls: 'bg-amber-50 text-amber-700 ring-amber-200/80 border-amber-200' },
    '⏳': { label: 'Pendiente',   cls: 'bg-slate-50 text-slate-500 ring-slate-200/80 border-slate-200' },
  }
  const s = map[status ?? '⏳']
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      s.cls,
    )}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full',
        status === '✅' ? 'bg-emerald-500' : status === '🔄' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400',
      )} />
      {s.label}
    </span>
  )
}

function ChildCards({ children }: { children: NavItem[] }) {
  if (!children.length) return null
  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">
        Documentos en esta secci&oacute;n
      </h2>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {children.map(child => (
          <Link
            key={child.slug}
            href={child.slug ? `/docs/${child.slug}` : '/docs'}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm hover:border-brand-300 hover:shadow-md hover:shadow-brand-100/50 transition-all"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-700 group-hover:text-brand-700 transition-colors truncate">
                {child.title}
              </p>
              {child.children && child.children.length > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">{child.children.length} documentos</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {child.status && <StatusBadge status={child.status} />}
              <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Breadcrumb({ slug }: { slug: string }) {
  const parents = getParents(slug)
  const current = findNavItem(slug)
  return (
    <nav className="flex items-center gap-1 text-xs text-slate-400 flex-wrap">
      <Link href="/docs" className="hover:text-brand-600 transition-colors flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        DGCP INTEL
      </Link>
      {parents.map(p => (
        <span key={p.slug} className="flex items-center gap-1">
          <span className="text-slate-300">/</span>
          <Link href={`/docs/${p.slug}`} className="hover:text-brand-600 transition-colors">
            {p.title.replace(/\s+[✅🔄⏳].*/, '')}
          </Link>
        </span>
      ))}
      {slug && current && (
        <span className="flex items-center gap-1">
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-medium">
            {current.title.replace(/\s+[✅🔄⏳].*/, '')}
          </span>
        </span>
      )}
    </nav>
  )
}

export default function DocPage({ params }: PageProps) {
  const slugParts = params.slug ?? []
  const slug = slugParts.join('/')

  const navItem = findNavItem(slug)
  if (!navItem) return notFound()

  const doc = getDoc(navItem.file)

  if (!doc) {
    return (
      <div className="px-4 sm:px-8 py-12 max-w-4xl mx-auto">
        <Breadcrumb slug={slug} />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-bold text-slate-800">{navItem.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge status={navItem.status} />
            <span className="text-xs text-slate-400">Pr&oacute;ximamente</span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Este documento a&uacute;n no est&aacute; disponible.</p>
        </div>
      </div>
    )
  }

  const children = navItem.children ?? []

  return (
    <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto">
      <div className="max-w-4xl">
        <Breadcrumb slug={slug} />
      </div>

      <div className="max-w-4xl mt-4 mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {navItem.status && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <StatusBadge status={navItem.status} />
              <span className="text-xs text-slate-400">Guardado por JANUS &middot; 2026-03-13</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex-1 min-w-0 max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 sm:px-8 py-8">
              <DocRenderer content={doc.content} />
            </div>
          </div>

          <ChildCards children={children} />
          <PrevNextNav slug={slug} />

          <footer className="mt-12 pt-5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">JANUS &mdash; Guardian del Full Software Lifecycle</p>
            <p className="text-xs text-slate-300">SOUL CORE PROTOCOL</p>
          </footer>
        </div>

        <TableOfContents content={doc.content} />
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  const allItems = flattenNav(NAV)
  return allItems
    .filter(item => item.slug !== '' && item.file.endsWith('.md'))
    .map(item => ({ slug: item.slug.split('/') }))
}

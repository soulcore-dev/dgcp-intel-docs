'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { NAV, NavItem, flattenNav } from '@/lib/nav'
import clsx from 'clsx'

const STATUS_DOT: Record<string, string> = {
  '✅': 'bg-emerald-400',
  '🔄': 'bg-amber-400',
  '⏳': 'bg-slate-600',
}

function StatusDot({ status }: { status?: string }) {
  const cls = STATUS_DOT[status ?? '⏳']
  return <span className={clsx('flex-shrink-0 w-1.5 h-1.5 rounded-full', cls)} />
}

function NavNode({ item, depth = 0, onNavigate }: { item: NavItem; depth?: number; onNavigate?: () => void }) {
  const pathname = usePathname()
  const href = item.slug ? `/docs/${item.slug}` : '/docs'
  const isActive = pathname === href
  const isAncestor = pathname.startsWith(href + '/') && href !== '/docs'
  const hasChildren = (item.children?.length ?? 0) > 0
  const [open, setOpen] = useState(isAncestor || depth === 0)

  useEffect(() => {
    if (isAncestor || isActive) setOpen(true)
  }, [isAncestor, isActive])

  return (
    <li>
      <div className={clsx(
        'group flex items-center rounded-lg transition-all',
        depth === 0 ? 'mb-0.5' : '',
        isActive
          ? 'bg-brand-600/15 text-brand-300'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
      )}>
        <span className={clsx(
          'w-0.5 self-stretch rounded-full mr-2 flex-shrink-0 transition-colors',
          isActive ? 'bg-brand-400' : 'bg-transparent',
        )} />

        {hasChildren ? (
          <button
            onClick={() => setOpen(o => !o)}
            className="flex-shrink-0 flex items-center justify-center w-4 h-4 mr-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className={clsx('w-2.5 h-2.5 transition-transform duration-150', open && 'rotate-90')}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        <Link
          href={href}
          onClick={onNavigate}
          className={clsx(
            'flex-1 flex items-center gap-2 py-1.5 pr-2 min-w-0',
            depth === 0 ? 'text-sm font-medium' : 'text-xs',
          )}
        >
          <span className="truncate leading-snug">{item.title}</span>
          <StatusDot status={item.status} />
        </Link>
      </div>

      {hasChildren && open && (
        <ul className={clsx(
          'mt-0.5 space-y-0.5',
          depth === 0 ? 'ml-3 pl-3 border-l border-slate-700/60' : 'ml-2 pl-2 border-l border-slate-700/40',
        )}>
          {item.children!.map(child => (
            <NavNode key={child.slug} item={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const totalDocs = flattenNav(NAV).filter(i => i.file.endsWith('.md')).length

  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-900/40 flex-shrink-0">
            DI
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">DGCP INTEL</p>
            <p className="text-xs text-slate-500 leading-tight mt-0.5">Inteligencia de Licitaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 border border-slate-700/40 px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
          <span className="text-xs text-slate-400">Guardian</span>
          <span className="text-xs font-mono text-brand-400 ml-auto">JANUS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 sidebar-scroll">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Documentaci&oacute;n
        </p>
        <ul className="space-y-0.5">
          {NAV.map(item => (
            <NavNode key={item.slug} item={item} depth={0} onNavigate={() => setMobileOpen(false)} />
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">SOUL CORE PROTOCOL</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-500">{totalDocs} docs</span>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#0f1117] border border-slate-700/60 text-slate-400 hover:text-white shadow-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={clsx(
        'fixed top-0 left-0 h-screen w-72 bg-[#0f1117] flex flex-col overflow-hidden z-50 border-r border-slate-800/80 transition-transform duration-300 lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-72 bg-[#0f1117] flex-col overflow-hidden z-10 border-r border-slate-800/80">
        {sidebarContent}
      </aside>
    </>
  )
}

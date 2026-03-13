'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'

interface TocItem {
  id: string
  text: string
  level: number
}

function extractHeadings(content: string): TocItem[] {
  const headings: TocItem[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/[*_`]/g, '').trim()
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      if (id && text) {
        headings.push({ id, text, level })
      }
    }
  }

  return headings
}

export function TableOfContents({ content }: { content: string }) {
  const headings = extractHeadings(content)
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    )

    for (const h of headings) {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 3) return null

  return (
    <nav className="hidden xl:block sticky top-24 w-56 flex-shrink-0 self-start">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
        En esta p&aacute;gina
      </p>
      <ul className="space-y-1 border-l border-slate-200">
        {headings.map(h => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={clsx(
                'block text-xs leading-snug py-1 border-l-2 -ml-px transition-colors',
                h.level === 3 ? 'pl-5' : 'pl-3',
                activeId === h.id
                  ? 'border-brand-500 text-brand-700 font-medium'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300',
              )}
            >
              <span className="line-clamp-2">{h.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

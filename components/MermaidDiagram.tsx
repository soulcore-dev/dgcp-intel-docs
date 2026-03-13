'use client'

import { useEffect, useRef, useState } from 'react'

let initialized = false
let counter = 0

interface Props {
  chart: string
}

export function MermaidDiagram({ chart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  // Safe ID: only alphanumeric + dash, no colons or special chars
  const idRef = useRef(`mermaid-diagram-${++counter}`)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default

        if (!initialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            flowchart: { curve: 'basis', padding: 20 },
            sequence: { actorMargin: 50, mirrorActors: false },
          })
          initialized = true
        }

        const { svg: rendered } = await mermaid.render(idRef.current, chart)

        if (!cancelled) {
          setSvg(rendered)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e))
          setLoading(false)
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [chart])

  if (loading) {
    return (
      <div className="my-6 h-32 animate-pulse rounded-lg bg-slate-100 flex items-center justify-center">
        <span className="text-slate-400 text-sm">Rendering diagram...</span>
      </div>
    )
  }

  if (error) {
    return (
      <details className="my-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-red-600">
          Diagram render error — click to see raw
        </summary>
        <pre className="mt-2 text-xs text-slate-500 overflow-auto whitespace-pre-wrap">{chart}</pre>
      </details>
    )
  }

  return (
    <div
      ref={containerRef}
      className="my-6 overflow-x-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

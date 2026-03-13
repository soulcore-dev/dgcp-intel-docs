'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MermaidDiagram } from './MermaidDiagram'

interface Props {
  content: string
}

export function DocRenderer({ content }: Props) {
  return (
    <div className="prose prose-slate max-w-none
      prose-headings:font-semibold prose-headings:tracking-tight prose-headings:scroll-mt-20
      prose-h1:text-2xl prose-h1:text-slate-900 prose-h1:mb-5 prose-h1:mt-0
      prose-h2:text-lg prose-h2:text-slate-800 prose-h2:mt-7 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2
      prose-h3:text-base prose-h3:text-slate-700 prose-h3:mt-5
      prose-h4:text-sm prose-h4:text-slate-500 prose-h4:uppercase prose-h4:tracking-wide prose-h4:font-bold
      prose-p:text-slate-600 prose-p:leading-relaxed
      prose-a:text-brand-600 prose-a:no-underline prose-a:font-medium hover:prose-a:underline
      prose-code:text-violet-700 prose-code:bg-violet-50 prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.8em] prose-code:font-mono prose-code:font-medium prose-code:border prose-code:border-violet-100
      prose-pre:bg-[#0d1117] prose-pre:text-slate-300 prose-pre:rounded-xl prose-pre:shadow-xl prose-pre:text-sm prose-pre:border prose-pre:border-slate-700/60 prose-pre:ring-1 prose-pre:ring-black/10
      prose-blockquote:border-brand-400 prose-blockquote:bg-violet-50/40 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:border-l-4
      prose-li:text-slate-600 prose-li:my-1
      prose-strong:text-slate-800 prose-strong:font-semibold
      prose-hr:border-slate-100 prose-hr:my-5
      prose-ul:text-slate-600
      prose-ol:text-slate-600
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Mermaid code blocks → render diagram
          pre({ children }) {
            return (
              <pre className="not-prose overflow-x-auto rounded-xl bg-[#0d1117] text-[0.8125rem] leading-[1.7] text-slate-300 p-5 my-5 border border-slate-700/50 shadow-lg">
                {children}
              </pre>
            )
          },

          code(props) {
            const { children, className } = props
            const lang = /language-(\w+)/.exec(className ?? '')?.[1]

            if (lang === 'mermaid') {
              return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
            }

            // Code inside <pre> — clean, no background
            if (className) {
              return <code className="font-mono text-inherit bg-transparent p-0">{children}</code>
            }

            // Inline code — styled pill
            return (
              <code className="rounded bg-violet-50 px-1.5 py-0.5 text-sm font-mono text-violet-700 not-prose border border-violet-100">
                {children}
              </code>
            )
          },

          // Tables with overflow + styling
          table({ children }) {
            return (
              <div className="not-prose overflow-x-auto rounded-xl border border-slate-200 shadow-sm my-6">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }) {
            return <thead className="bg-slate-50">{children}</thead>
          },
          th({ children }) {
            return (
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="px-4 py-3 text-sm text-slate-700 border-t border-slate-100 align-top">
                {children}
              </td>
            )
          },
          tr({ children }) {
            return <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
          },

          // Callout blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="not-prose my-4 border-l-4 border-violet-400 bg-violet-50 px-4 py-3 rounded-r-xl text-slate-600 text-sm">
                {children}
              </blockquote>
            )
          },

          // Heading anchors
          h1({ children }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return <h1 id={id} className="scroll-mt-20">{children}</h1>
          },
          h2({ children }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return <h2 id={id} className="scroll-mt-20">{children}</h2>
          },
          h3({ children }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return <h3 id={id} className="scroll-mt-20">{children}</h3>
          },

          // Horizontal rule
          hr() {
            return <hr className="my-8 border-slate-200" />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

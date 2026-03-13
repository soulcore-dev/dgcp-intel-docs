import { Sidebar } from '@/components/Sidebar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />

      <div className="lg:ml-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-4 sm:px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/70 shadow-sm shadow-slate-900/[0.04]">
          <div className="flex items-center gap-2 text-xs text-slate-400 ml-12 lg:ml-0">
            <span className="font-semibold text-slate-600">DGCP INTEL — Inteligencia de Licitaciones</span>
            <span className="text-slate-300 hidden sm:inline">&middot;</span>
            <span className="hidden sm:inline">Documentaci&oacute;n T&eacute;cnica</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-cyan-50 border border-cyan-200 px-2.5 py-1 text-[11px] font-medium text-cyan-700">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              E02 Completado
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              v1.0 &middot; JANUS
            </span>
          </div>
        </header>

        <main className="flex-1 pb-10">
          {children}
        </main>
      </div>
    </>
  )
}

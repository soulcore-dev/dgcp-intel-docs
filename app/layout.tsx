import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'DGCP INTEL — Inteligencia de Licitaciones RD — Docs',
  description: 'Documentacion tecnica del proyecto DGCP INTEL. SaaS multi-tenant de licitaciones. Lifecycle guardado por JANUS.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

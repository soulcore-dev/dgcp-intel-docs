import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'DGCPIntel2026!'
const COOKIE_NAME = 'docs-auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN || ''
const TG_CHAT_ID = process.env.TG_CHAT_ID || ''
const PROJECT_NAME = 'DGCP INTEL Docs'
const SITE_URL = process.env.SITE_URL || 'https://dgcp-intel-docs.vercel.app'

async function sendTelegram(message: string) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text: message, parse_mode: 'HTML' }),
    })
  } catch {}
}

async function getGeoInfo(ip: string) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,isp&lang=es`)
    if (res.ok) {
      const data = await res.json()
      if (data.status === 'success') {
        return { location: `${data.city}, ${data.regionName}, ${data.country}`, isp: data.isp }
      }
    }
  } catch {}
  return { location: 'Desconocida', isp: 'Desconocido' }
}

function getClientIP(headersList: Headers): string {
  return headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headersList.get('x-real-ip')
    || 'unknown'
}

const failedAttempts = new Map<string, number>()

export async function POST(request: Request) {
  const body = await request.json()
  const { password } = body
  const headersList = await headers()
  const ip = getClientIP(headersList)
  const ua = headersList.get('user-agent') || 'unknown'
  const now = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })
  const geo = await getGeoInfo(ip)

  if (password === SITE_PASSWORD) {
    failedAttempts.delete(ip)

    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    await sendTelegram(
      `SOUL CORE — Report Access\n\n` +
      `📄 Evento: LOGIN EXITOSO\n` +
      `📍 Pagina: <b>${PROJECT_NAME}</b>\n` +
      `🌐 IP: ${ip}\n` +
      `📌 Ubicacion: ${geo.location}\n` +
      `🏢 ISP: ${geo.isp}\n` +
      `🖥️ Navegador: ${ua.slice(0, 120)}\n` +
      `🕐 Hora: ${now}\n` +
      `🔗 URL: ${SITE_URL}`
    )

    return response
  }

  const attempts = (failedAttempts.get(ip) || 0) + 1
  failedAttempts.set(ip, attempts)

  if (attempts >= 3) {
    await sendTelegram(
      `SOUL CORE — Report Access\n\n` +
      `⚠️ Evento: ${attempts} INTENTOS FALLIDOS\n` +
      `📍 Pagina: <b>${PROJECT_NAME}</b>\n` +
      `🌐 IP: ${ip}\n` +
      `📌 Ubicacion: ${geo.location}\n` +
      `🏢 ISP: ${geo.isp}\n` +
      `🖥️ Navegador: ${ua.slice(0, 120)}\n` +
      `🕐 Hora: ${now}\n` +
      `🔗 URL: ${SITE_URL}`
    )
  }

  return NextResponse.json({ success: false, error: 'Contrasena incorrecta' }, { status: 401 })
}

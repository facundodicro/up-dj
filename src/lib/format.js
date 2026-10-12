import { localeTag } from './i18n'

/** Formatea segundos como m:ss (ej. 3:07) */
export function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00'
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Fecha corta según el idioma (ej. "11 oct 2026" / "Oct 11, 2026") */
export function formatDate(isoString, lang) {
  if (!isoString) return ''
  try {
    return new Date(isoString).toLocaleDateString(lang ? localeTag() : 'es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * Fecha relativa ("Hoy • 14:32", "Ayer", "Hace 3 días"); más de 7 días usa formatDate.
 */
export function formatRelative(isoString, t) {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const mins = Math.floor((now - d) / 60000)
  if (mins < 1) return t('time.now')
  if (mins < 60) return t('time.minutesAgo', { n: mins })
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString()
  if (sameDay) {
    const hm = d.toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' })
    return t('time.todayAt', { time: hm })
  }
  if (yesterday) return t('time.yesterday')
  const days = Math.floor((now - d) / 86400000)
  if (days < 7) return t('time.daysAgo', { n: days })
  return formatDate(isoString)
}

/** Tamaño de archivo legible (ej. "84,2 MB" / "84.2 MB") */
export function formatBytes(bytes, lang) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let v = bytes / 1024
  let u = 0
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024
    u += 1
  }
  const decimal = lang === 'en' ? '.' : ','
  return `${v.toFixed(1).replace('.', decimal)} ${units[u]}`
}

/**
 * Limpia el contacto de WhatsApp: solo dígitos (número con código de país
 * y área, sin "+" ni espacios). Los apodos de WhatsApp todavía no funcionan
 * como links wa.me (la función está en despliegue gradual), así que por ahora
 * solo se aceptan números.
 */
export function sanitizeWhatsapp(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 20)
}

/**
 * Construye el link de contacto de WhatsApp: wa.me/<número>.
 */
export function buildWaUrl(whatsapp, message = '') {
  const target = sanitizeWhatsapp(whatsapp)
  if (!target) return null
  const base = `https://wa.me/${target}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

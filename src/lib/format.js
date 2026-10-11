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

/** Deja solo dígitos (para WhatsApp). */
export function normalizeWhatsapp(value) {
  return String(value || '').replace(/\D/g, '')
}

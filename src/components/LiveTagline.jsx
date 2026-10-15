import { useMemo } from 'react'
import { useLang } from '../context/LanguageContext'

const DIAS_ES = [
  'primero', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho',
  'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro',
  'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta',
  'treinta y uno',
]
const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const ORDINALS_EN = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth',
  'eighteenth', 'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third',
  'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth',
  'twenty-ninth', 'thirtieth', 'thirty-first',
]
const MONTHS_EN = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

/**
 * Tagline vivo del footer: "hoy {fecha en español} es tu día" con latido sutil.
 * Se calcula una vez al montar; respeta prefers-reduced-motion.
 */
export default function LiveTagline() {
  const { lang } = useLang()
  const text = useMemo(() => {
    const now = new Date()
    const day = now.getDate()
    const month = now.getMonth()
    if (lang === 'en') {
      return `today ${MONTHS_EN[month]} ${ORDINALS_EN[day - 1]} is your day`
    }
    return `hoy ${DIAS_ES[day - 1]} de ${MESES_ES[month]} es tu día`
  }, [lang])

  return (
    <p className="mt-1 text-xs text-muted">
      <span className="animate-tagline-pulse inline-block">{text}</span>
    </p>
  )
}

import { Mail } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

/** Email de contacto público de Up! (no se muestra escrito: va en el botón). */
export const CONTACT_EMAIL = 'facundodicroce76@gmail.com'

/** Botón con sobre que abre el correo (mailto), sin mostrar la dirección. */
export function MailIconLink({ small = false }) {
  const { t } = useLang()
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      aria-label={t('footer.emailUs')}
      title={t('footer.emailUs')}
      className={`mx-0.5 inline-flex items-center justify-center rounded-full border border-clay-deep align-middle transition hover:scale-110 hover:text-ink ${
        small ? 'h-5 w-5' : 'h-6 w-6'
      }`}
    >
      <Mail size={small ? 11 : 13} />
    </a>
  )
}

/**
 * Texto con token [[MAIL]]: donde va el token se renderiza el botón-sobre
 * en vez de la dirección escrita. Se usa en Términos y Privacidad.
 */
export default function MailText({ text }) {
  const parts = String(text).split('[[MAIL]]')
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && <MailIconLink />}
    </span>
  ))
}

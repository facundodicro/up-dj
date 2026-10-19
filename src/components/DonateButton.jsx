import { useState } from 'react'
import { Coffee } from 'lucide-react'
import DonateModal from './DonateModal'
import { useLang } from '../context/LanguageContext'

/**
 * Botón "Invitame un café": abre el modal de donación (Mercado Pago + PayPal + WhatsApp).
 * La configuración vive en src/lib/config.js (DONATE_MP_ALIAS,
 * DONATE_WHATSAPP, DONATE_PAYPAL_URL/EMAIL) o en variables VITE_*.
 * Estilo: degradado cálido + sombra suave, inspirado en los kits de botones.
 */
export default function DonateButton({ className = '', variant = 'light' }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 px-3.5 py-2 text-sm font-extrabold text-white shadow-[0_6px_16px_rgba(217,119,6,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:brightness-105 active:scale-95 ${className}`}
      >
        <Coffee size={15} aria-hidden="true" />
        {t('donate.label')}
      </button>
      <DonateModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

import { useState } from 'react'
import { Heart } from 'lucide-react'
import DonateModal from './DonateModal'
import { useLang } from '../context/LanguageContext'

/**
 * Botón "Donar": abre el modal de donación (Mercado Pago + PayPal + WhatsApp).
 * La configuración vive en src/lib/config.js (DONATE_MP_ALIAS,
 * DONATE_WHATSAPP, DONATE_PAYPAL_URL/EMAIL) o en variables VITE_*.
 */
export default function DonateButton({ className = '', variant = 'light' }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)

  const styles =
    variant === 'dark'
      ? 'border-white/25 bg-white/10 text-white backdrop-blur-sm hover:border-[#00e065]/70 hover:text-[#00e065] hover:shadow-[0_0_18px_rgba(0,224,101,0.45)]'
      : 'border-black/10 bg-black/5 text-ink hover:border-[#00e065]/60 hover:text-[#00e065] hover:shadow-[0_0_18px_rgba(0,224,101,0.35)]'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-extrabold transition ${styles} ${className}`}
      >
        <Heart size={15} className="text-[#00e065]" fill="currentColor" aria-hidden="true" />
        {t('donate.label')}
      </button>
      <DonateModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

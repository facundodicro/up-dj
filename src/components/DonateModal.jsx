import { useState } from 'react'
import { Heart, Wallet, Copy, Check, MessageCircle, Globe } from 'lucide-react'
import Modal from './Modal'
import { useLang } from '../context/LanguageContext'
import {
  DONATE_MP_ALIAS,
  paypalDonateUrl,
  donateLink,
  hasRealDonateAlias,
  hasPaypal,
} from '../lib/config'

/**
 * Modal de donación/agradecimiento, estilo TechNoir.
 * - "Donar con Mercado Pago": muestra el alias con botón para copiarlo.
 *   Se oculta automáticamente si no hay un alias real configurado.
 * - "Donar desde el exterior": link PayPal. Se oculta si no está configurado.
 * - "Agradecer por WhatsApp": abre el chat con mensaje pre-cargado.
 */
export default function DonateModal({ open, onClose }) {
  const { t } = useLang()
  const [copied, setCopied] = useState(false)
  const showMercadoPago = hasRealDonateAlias()
  const showPaypal = hasPaypal()

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(DONATE_MP_ALIAS)
    } catch {
      // Fallback para navegadores sin clipboard API
      const ta = document.createElement('textarea')
      ta.value = DONATE_MP_ALIAS
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} label={t('donate.title')}>
      <div className="p-6">
        <div className="flex items-center gap-3 pr-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00e065]/15 shadow-[0_0_20px_rgba(0,224,101,0.35)]">
            <Heart size={20} className="text-[#00e065]" fill="currentColor" />
          </span>
          <div>
            <h2 className="font-display text-xl font-black text-ink">{t('donate.title')}</h2>
            <p className="text-sm font-semibold text-muted">{t('donate.subtitle')}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {showMercadoPago && (
            <div className="rounded-2xl border border-clay bg-clay-soft p-5">
              <div className="flex items-center gap-2">
                <Wallet size={19} className="text-[#00e065]" />
                <h3 className="font-display font-extrabold text-ink">{t('donate.mpTitle')}</h3>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 select-all truncate rounded-xl border border-black/10 bg-white px-4 py-2.5 font-mono text-sm font-bold text-ink">
                  {DONATE_MP_ALIAS}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-extrabold text-ink transition ${
                    copied
                      ? 'border-transparent bg-[#00e065] text-black'
                      : 'border-black/10 bg-white hover:bg-clay-soft'
                  }`}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? t('donate.copied') : t('donate.copy')}
                </button>
              </div>
              <p className="mt-2 text-xs font-semibold text-muted">{t('donate.mpHint')}</p>
            </div>
          )}

          {showPaypal && (
            <a
              href={paypalDonateUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-clay bg-clay-soft p-5 transition hover:border-neon/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neon/15">
                <Globe size={19} className="text-neon-light" />
              </span>
              <span>
                <span className="block font-display font-extrabold text-ink">
                  {t('donate.abroad')}
                </span>
                <span className="block text-xs font-semibold text-muted">
                  {t('donate.abroadHint')}
                </span>
              </span>
            </a>
          )}

          <a
            href={donateLink(t('donate.waThanks'))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 font-extrabold text-ink transition hover:brightness-110"
          >
            <MessageCircle size={19} />
            {t('donate.whatsapp')}
          </a>
        </div>
      </div>
    </Modal>
  )
}

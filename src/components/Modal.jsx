import { useEffect } from 'react'
import { X } from 'lucide-react'
import { t } from '../lib/i18n'

/** Ventana modal reutilizable: overlay oscuro + tarjeta sobre fondo night. */
export default function Modal({ open, onClose, children, maxWidth = 'max-w-md', label }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <button
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div
        className={`relative h-full w-full ${maxWidth} overflow-y-auto bg-night-card sm:h-auto sm:max-h-[92vh] sm:rounded-2xl sm:border sm:border-clay sm:shadow-2xl sm:shadow-black/60`}
      >
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute right-3 top-3 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-muted transition hover:bg-clay-soft hover:text-ink"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}

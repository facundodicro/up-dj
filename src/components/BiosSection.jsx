import { BookOpenText } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

/**
 * Sección BIOGRAFÍAS (placeholder de lanzamiento): la vitrina paga y curada
 * por Facundo se construye en la siguiente etapa; por ahora anuncia su llegada.
 */
export default function BiosSection() {
  const { t } = useLang()
  return (
    <main className="mx-auto max-w-5xl px-4 pb-44">
      <section className="mt-24" aria-label={t('dock.bios')}>
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">{t('dock.bios')}</h2>
        <div className="mt-6 rounded-3xl border border-dashed border-clay px-6 py-14 text-center">
          <BookOpenText size={38} className="mx-auto text-muted" strokeWidth={1.5} />
          <p className="mx-auto mt-4 max-w-md text-sm text-muted">{t('bios.teaser')}</p>
          <p className="mt-5 inline-block rounded-full border border-clay px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-ink">
            {t('bios.soon')}
          </p>
        </div>
      </section>
    </main>
  )
}

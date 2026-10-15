import { useLang } from '../context/LanguageContext'

const ES = [
  {
    h: '1. El servicio',
    p: 'Up! es una plataforma para que los DJs publiquen sus sets de audio y los oyentes los descubran. Al usar Up!, aceptás estos términos.',
  },
  {
    h: '2. Contenido y responsabilidad',
    p: 'Todo lo que se publique en Up! (textos, fotos, música, logos) lo sube cada DJ y es su responsabilidad. Cada DJ declara tener los derechos sobre el material que publica. Up! es la plataforma; no nos hacemos responsables por reclamos de terceros sobre el contenido que suban los DJs.',
  },
  {
    h: '3. Uso aceptable',
    p: 'No publiques contenido que no te pertenezca o sobre el que no tengas derechos, ni contenido ilegal. Podemos retirar el contenido que infrinja estos términos.',
  },
  {
    h: '4. Contacto',
    p: 'Si tenés preguntas sobre estos términos, escribinos a difacundo697@gmail.com.',
  },
]

const EN = [
  {
    h: '1. The service',
    p: 'Up! is a platform for DJs to publish their audio sets and for listeners to discover them. By using Up!, you accept these terms.',
  },
  {
    h: '2. Content and responsibility',
    p: 'Everything published on Up! (text, photos, music, logos) is uploaded by each DJ and is their responsibility. Each DJ declares they hold the rights to the material they publish. Up! is the platform; we are not responsible for third-party claims about content DJs upload.',
  },
  {
    h: '3. Acceptable use',
    p: 'Do not publish content you do not own or have no rights to, nor illegal content. We may remove content that violates these terms.',
  },
  {
    h: '4. Contact',
    p: 'If you have questions about these terms, write to difacundo697@gmail.com.',
  },
]

/** Página de Términos de uso (bilingüe según el idioma actual). */
export default function Terms() {
  const { lang } = useLang()
  const sections = lang === 'en' ? EN : ES
  return (
    <main className="mx-auto max-w-2xl px-4 pb-44 pt-24">
      <section className="rounded-3xl border border-black/10 bg-night-alt px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="font-display text-2xl font-black text-ink sm:text-[32px]">
          {lang === 'en' ? 'Terms of Use' : 'Términos de uso'}
        </h1>
        <p className="mt-2 text-xs text-muted">
          {lang === 'en' ? 'Last updated: October 15, 2026' : 'Última actualización: 15 de octubre de 2026'}
        </p>
        <div className="mt-6 space-y-6">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="text-base font-bold text-ink">{s.h}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.p}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

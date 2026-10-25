import { useLang } from '../context/LanguageContext'

const ES = [
  {
    h: '1. El servicio',
    p: 'Up! es una plataforma para que los DJs publiquen sus sets y los oyentes los descubran. Los sets NO se alojan en Up!: cada set vive en la cuenta del propio DJ en SoundCloud, YouTube o Mixcloud, y se escucha con el reproductor oficial de esa plataforma incrustado en la ficha. Al usar Up!, aceptás estos términos.',
  },
  {
    h: '2. Contenido y responsabilidad',
    p: 'Todo lo que se publique en Up! (textos, fotos, logos y links a sets) lo aporta cada DJ y es su responsabilidad. Al publicar un set, el DJ declara que es suyo, que está publicado en su propia cuenta de la plataforma y que tiene derecho a compartirlo. Up! es la vidriera; no nos hacemos responsables por reclamos de terceros sobre el contenido que aporten los DJs.',
  },
  {
    h: '3. Uso aceptable',
    p: 'No publiques contenido que no te pertenezca o sobre el que no tengas derechos, ni contenido ilegal. Podemos retirar el contenido que infrinja estos términos.',
  },
  {
    h: '4. Derechos de autor y bajas',
    p: 'Si sos titular de derechos sobre un tema incluido en un set y querés que se revise o retire un contenido, escribinos a facundodicroce76@gmail.com indicando el link del set y el tema: lo gestionamos con prioridad y, si corresponde, retiramos la publicación.',
  },
  {
    h: '5. Contacto',
    p: 'Si tenés preguntas sobre estos términos, escribinos a facundodicroce76@gmail.com.',
  },
]

const EN = [
  {
    h: '1. The service',
    p: 'Up! is a platform for DJs to publish their sets and for listeners to discover them. Sets are NOT hosted on Up!: each set lives on the DJ’s own SoundCloud, YouTube or Mixcloud account and plays through that platform’s official embedded player. By using Up!, you accept these terms.',
  },
  {
    h: '2. Content and responsibility',
    p: 'Everything published on Up! (text, photos, logos and set links) is provided by each DJ and is their responsibility. When publishing a set, the DJ declares it is theirs, that it is published on their own platform account and that they have the right to share it. Up! is the showcase; we are not responsible for third-party claims about content provided by DJs.',
  },
  {
    h: '3. Acceptable use',
    p: 'Do not publish content you do not own or have no rights to, nor illegal content. We may remove content that violates these terms.',
  },
  {
    h: '4. Copyright and takedowns',
    p: 'If you hold rights to a track included in a set and want content reviewed or removed, write to facundodicroce76@gmail.com with the set link and the track: we handle it with priority and, where appropriate, remove the publication.',
  },
  {
    h: '5. Contact',
    p: 'If you have questions about these terms, write to facundodicroce76@gmail.com.',
  },
]

/** Página de Términos de uso (bilingüe según el idioma actual). */
export default function Terms() {
  const { lang } = useLang()
  const sections = lang === 'en' ? EN : ES
  return (
    <main className="mx-auto max-w-2xl px-4 pb-44 pt-24">
      <section className="rounded-3xl border border-clay bg-night-alt px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="font-display text-2xl font-black text-ink sm:text-[32px]">
          {lang === 'en' ? 'Terms of Use' : 'Términos de uso'}
        </h1>
        <p className="mt-2 text-xs text-muted">
          {lang === 'en' ? 'Last updated: October 25, 2026' : 'Última actualización: 25 de octubre de 2026'}
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

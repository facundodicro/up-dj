import { useLang } from '../context/LanguageContext'

const ES = [
  {
    h: '1. Qué datos recopilamos',
    p: 'Datos de cuenta: tu email y contraseña (la contraseña se guarda cifrada, nunca en texto plano). Datos de perfil: nombre de DJ, biografía, foto y número de WhatsApp, solo si decidís agregarlos. Contenido: los sets de audio y las fotos que subís. Si ingresás con Google, recibimos tu nombre y tu email de tu cuenta de Google.',
  },
  {
    h: '2. Para qué usamos tus datos',
    p: 'Para crear y gestionar tu cuenta, mostrar tu perfil y tus sets en la app, y mantener el funcionamiento y la seguridad del servicio.',
  },
  {
    h: '3. Contenido público',
    p: 'Tu nombre de DJ, tu biografía, tu foto y los sets que publiques son visibles para cualquier visitante de Up!. No publiques datos personales que no quieras compartir.',
  },
  {
    h: '4. Con quién compartimos tus datos',
    p: 'No vendemos ni alquilamos tus datos personales. Solo los compartimos con los proveedores técnicos necesarios para operar el servicio (alojamiento y base de datos), o si la ley lo exige.',
  },
  {
    h: '5. Seguridad',
    p: 'Tus datos se almacenan en infraestructura segura con conexiones cifradas. Hacemos un esfuerzo razonable para protegerlos, aunque ningún sistema es completamente infalible.',
  },
  {
    h: '6. Tus derechos',
    p: 'Podés pedir en cualquier momento la eliminación de tu cuenta y de tus datos escribiendo a facundodicroce76@gmail.com.',
  },
  {
    h: '7. Cambios en esta política',
    p: 'Si modificamos esta política, publicaremos la versión actualizada en esta página.',
  },
  {
    h: '8. Contacto',
    p: 'Si tenés preguntas sobre esta política, escribinos a facundodicroce76@gmail.com.',
  },
]

const EN = [
  {
    h: '1. Data we collect',
    p: 'Account data: your email and password (passwords are stored encrypted, never in plain text). Profile data: DJ name, bio, photo and WhatsApp number, only if you choose to add them. Content: the audio sets and photos you upload. If you sign in with Google, we receive your name and email from your Google account.',
  },
  {
    h: '2. How we use your data',
    p: 'To create and manage your account, display your profile and sets in the app, and keep the service running and secure.',
  },
  {
    h: '3. Public content',
    p: 'Your DJ name, bio, photo and published sets are visible to any visitor of Up!. Do not post personal data you do not want to share.',
  },
  {
    h: '4. Sharing your data',
    p: 'We do not sell or rent your personal data. We only share it with the technical providers needed to operate the service (hosting and database), or when required by law.',
  },
  {
    h: '5. Security',
    p: 'Your data is stored on secure infrastructure with encrypted connections. We make a reasonable effort to protect it, although no system is completely infallible.',
  },
  {
    h: '6. Your rights',
    p: 'You may request deletion of your account and data at any time by writing to facundodicroce76@gmail.com.',
  },
  {
    h: '7. Changes to this policy',
    p: 'If we modify this policy, we will publish the updated version on this page.',
  },
  {
    h: '8. Contact',
    p: 'If you have questions about this policy, write to facundodicroce76@gmail.com.',
  },
]

/** Página de Política de Privacidad (bilingüe según el idioma actual). */
export default function Privacy() {
  const { lang } = useLang()
  const sections = lang === 'en' ? EN : ES
  return (
    <main className="mx-auto max-w-2xl px-4 pb-44 pt-24">
      <section className="rounded-3xl border border-clay bg-night-alt px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="font-display text-2xl font-black text-ink sm:text-[32px]">
          {lang === 'en' ? 'Privacy Policy' : 'Política de Privacidad'}
        </h1>
        <p className="mt-2 text-xs text-muted">
          {lang === 'en' ? 'Last updated: October 11, 2026' : 'Última actualización: 11 de octubre de 2026'}
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

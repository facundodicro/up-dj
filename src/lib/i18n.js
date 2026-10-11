/**
 * i18n minimalista para Up!: español (por defecto) e inglés.
 * - Detección automática: localStorage 'up-lang' → idioma del navegador →
 *   'es' si el navegador está en español, 'en' en cualquier otro caso.
 * - `t(key, vars)` traduce con la lengua actual (interpolación {var}).
 * - El LanguageContext sincroniza la lengua actual acá para que el
 *   código fuera de React (demo.js) también traduzca.
 */

export const SUPPORTED_LANGS = ['es', 'en']
export const DEFAULT_LANG = 'es'
const STORAGE_KEY = 'up-lang'

const STRINGS = {
  es: {
    'common.close': 'Cerrar',

    'header.home': 'Up! — inicio',
    'header.openProfile': 'Abrir mi perfil',
    'header.account': 'Cuenta',
    'header.createProfile': 'Crear perfil',
    'header.login': 'Iniciar sesión',
    'header.language': 'Idioma',

    'auth.title': 'Acceso a tu cuenta',
    'auth.loginTab': 'Iniciar sesión',
    'auth.registerTab': 'Crear perfil',
    'auth.loginSubtitle': 'Entrá para gestionar tu perfil y tus sets.',
    'auth.registerSubtitle': 'Creá tu perfil de DJ y empezá a compartir tus sets.',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'auth.passwordHint': 'Mínimo 6 caracteres',
    'auth.submitLogin': 'Entrar',
    'auth.submitRegister': 'Crear mi perfil',
    'auth.confirmEmail':
      'Te enviamos un email de confirmación. Revisá tu correo y después iniciá sesión.',
    'auth.welcome': '¡Perfil creado! Ya podés subir tus sets.',
    'auth.welcomeBack': '¡Hola de nuevo!',
    'auth.genericError': 'Ocurrió un error. Probá de nuevo.',
    'auth.confirmFirst': 'Tenés que confirmar tu email antes de entrar. Revisá tu correo.',
    'auth.forgot': '¿Olvidaste tu contraseña?',
    'auth.resetSubtitle': 'Te mandamos un link para crear una nueva.',
    'auth.sendLink': 'Enviar link',
    'auth.back': 'Volver',
    'auth.resetSent': '¡Listo! Revisá tu correo para seguir.',
    'auth.newPassword': 'Nueva contraseña',
    'auth.newPasswordSub': 'Elegí una contraseña nueva para tu cuenta.',
    'auth.savePassword': 'Guardar contraseña',
    'auth.passwordUpdated': 'Contraseña actualizada. Ya podés entrar.',
    'auth.google': 'Continuar con Google',
    'auth.or': 'o',
    'auth.googleDemo': 'El login con Google se activa al conectar Supabase.',
    'auth.mismatch': 'Las contraseñas no coinciden.',

    'profile.title': 'Mi perfil',
    'profile.subtitle': 'Así te van a ver quienes escuchen tus sets.',
    'profile.changePhoto': 'Cambiar foto de perfil',
    'profile.addPhoto': 'Agregar foto',
    'profile.changePhotoBtn': 'Cambiar foto',
    'profile.photoHint': 'Cuadrada queda mejor. Máx. 10 MB.',
    'profile.username': 'Nombre de usuario',
    'profile.usernamePh': 'Ej. DJ Nocturno',
    'profile.bio': 'Descripción',
    'profile.bioPh': 'Qué música hacés, de dónde sos…',
    'profile.whatsapp': 'Contacto WhatsApp',
    'profile.whatsappPh': 'Ej. 5491100000000',
    'profile.whatsappHint': 'Solo números, con código de país y área.',
    'profile.save': 'Guardar',
    'profile.saved': 'Perfil guardado.',
    'profile.saveError': 'No se pudo guardar tu perfil.',
    'profile.loadError': 'No se pudo cargar tu perfil.',
    'profile.createEvent': 'Crear evento',
    'profile.newEvent': 'Nuevo evento',
    'profile.myEvents': 'Mis eventos',
    'profile.loading': 'Cargando…',
    'profile.noEvents': 'Todavía no publicaste ningún set.',
    'profile.delete': 'Eliminar',
    'profile.confirmDelete': '¿Eliminar?',
    'profile.deleted': 'Evento eliminado.',
    'profile.deleteError': 'No se pudo eliminar.',
    'profile.signOut': 'Cerrar sesión',

    'event.title': 'Título del set',
    'event.optional': '(opcional)',
    'event.titlePh': 'Ej. Live set — Techno nocturno',
    'event.audio': 'Archivo de audio',
    'event.chooseSet': 'Elegí tu set',
    'event.audioHint': 'MP3, WAV, M4A…',
    'event.maxAudio': 'máx. 200 MB',
    'event.description': 'Descripción',
    'event.descPh': 'Contá dónde lo grabaste, qué estilo es…',
    'event.photo': 'Foto',
    'event.addPhoto': 'Agregar foto',
    'event.photoAlt': 'Foto del evento',
    'event.removePhoto': 'Quitar foto',
    'event.uploadingAudio': 'Subiendo audio…',
    'event.uploadingPhoto': 'Subiendo foto…',
    'event.save': 'Guardar evento',
    'event.publishing': 'Publicando…',
    'event.cancel': 'Cancelar',
    'event.needAudio': 'Elegí el archivo de audio de tu set.',
    'event.published': '¡Evento publicado!',
    'event.publishError': 'No se pudo publicar el evento.',

    'card.playTitle': 'Reproducir {title}',
    'card.pauseTitle': 'Pausar {title}',
    'card.whatsapp': 'WhatsApp',
    'card.noContact': 'Sin contacto',
    'card.more': 'ver más',
    'card.less': 'ver menos',
    'card.waMessage': '¡Hola! Escuché tu set en Up!',
    'card.djFallback': 'DJ',

    'player.progress': 'Progreso de reproducción',
    'player.play': 'Reproducir',
    'player.pause': 'Pausar',
    'player.close': 'Cerrar reproductor',

    'donate.label': 'Donar',
    'donate.title': 'Donar a Up!',
    'donate.subtitle': 'Tu ayuda mantiene viva la pista',
    'donate.mpTitle': 'Donar con Mercado Pago',
    'donate.copy': 'Copiar alias',
    'donate.copied': '¡Copiado!',
    'donate.mpHint': 'Pegá este alias en la app de Mercado Pago para donar.',
    'donate.abroad': 'Donar desde el exterior',
    'donate.abroadHint': 'Con tarjeta o cuenta PayPal, en tu moneda',
    'donate.whatsapp': 'Agradecer por WhatsApp',
    'donate.waThanks': 'Hola, quiero agradecer a Up!',

    'home.heroTitle': 'Sets de DJs, directo a tus oídos',
    'home.heroSub': 'Descubrí sesiones nuevas, seguí a tus DJs y escribiles por WhatsApp.',
    'home.uploadSet': 'Subir mi set',
    'home.createProfile': 'Crear mi perfil de DJ',
    'home.demo':
      'Modo demo: todo funciona en tu navegador. Conectá Supabase para que los datos sean reales y compartidos.',
    'home.latest': 'Lo último',
    'home.loadError': 'No se pudieron cargar los sets.',
    'home.emptyTitle': 'Todavía no hay sets por acá',
    'home.emptySub':
      'Cuando un DJ publique su primer set, va a aparecer en este feed. La pista está vacía… por ahora.',
    'home.publishFirst': 'Publicar el primero',
    'home.beFirst': 'Ser el primero',

    'app.tagline': 'La pista donde viven los sets.',

    'install.label': 'Instalar app',
    'install.manual':
      'Para instalarla: en Android, menú ⋮ → “Instalar app”. En iPhone, Compartir → “Agregar a la pantalla de inicio”.',
    'install.done': '¡App instalada!',

    'demo.invalidEmail': 'Ingresá un email válido.',
    'demo.shortPassword': 'La contraseña tiene que tener al menos 6 caracteres.',
    'demo.emailTaken': 'Ese email ya está registrado. Iniciá sesión.',
    'demo.badCredentials': 'Email o contraseña incorrectos.',
    'demo.avatarNotImage': 'La foto de perfil tiene que ser una imagen.',
    'demo.avatarTooBig': 'La foto no puede superar los 10 MB.',
    'demo.audioTooBig': 'El audio no puede superar los 200 MB.',
    'demo.photoNotImage': 'La foto del evento tiene que ser una imagen.',
    'demo.photoTooBig': 'La foto no puede superar los 10 MB.',
    'demo.eventNotFound': 'No se encontró el evento.',
    'demo.untitled': 'Set sin título',
  },
  en: {
    'common.close': 'Close',

    'header.home': 'Up! — home',
    'header.openProfile': 'Open my profile',
    'header.account': 'Account',
    'header.createProfile': 'Create profile',
    'header.login': 'Log in',
    'header.language': 'Language',

    'auth.title': 'Access your account',
    'auth.loginTab': 'Log in',
    'auth.registerTab': 'Create profile',
    'auth.loginSubtitle': 'Log in to manage your profile and sets.',
    'auth.registerSubtitle': 'Create your DJ profile and start sharing your sets.',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.passwordHint': 'Minimum 6 characters',
    'auth.submitLogin': 'Log in',
    'auth.submitRegister': 'Create my profile',
    'auth.confirmEmail':
      'We sent you a confirmation email. Check your inbox and then log in.',
    'auth.welcome': 'Profile created! You can now upload your sets.',
    'auth.welcomeBack': 'Welcome back!',
    'auth.genericError': 'Something went wrong. Try again.',
    'auth.confirmFirst': 'You need to confirm your email before logging in. Check your inbox.',
    'auth.forgot': 'Forgot your password?',
    'auth.resetSubtitle': "We'll send you a link to create a new one.",
    'auth.sendLink': 'Send link',
    'auth.back': 'Back',
    'auth.resetSent': 'Done! Check your email to continue.',
    'auth.newPassword': 'New password',
    'auth.newPasswordSub': 'Choose a new password for your account.',
    'auth.savePassword': 'Save password',
    'auth.passwordUpdated': 'Password updated. You can log in now.',
    'auth.google': 'Continue with Google',
    'auth.or': 'or',
    'auth.googleDemo': 'Google login activates once you connect Supabase.',
    'auth.mismatch': "Passwords don't match.",

    'profile.title': 'My profile',
    'profile.subtitle': 'This is how listeners will see you.',
    'profile.changePhoto': 'Change profile photo',
    'profile.addPhoto': 'Add photo',
    'profile.changePhotoBtn': 'Change photo',
    'profile.photoHint': 'Square works best. Max 10 MB.',
    'profile.username': 'Username',
    'profile.usernamePh': 'E.g. DJ Nocturno',
    'profile.bio': 'Bio',
    'profile.bioPh': "What music you play, where you're from…",
    'profile.whatsapp': 'WhatsApp contact',
    'profile.whatsappPh': 'E.g. 5491100000000',
    'profile.whatsappHint': 'Numbers only, with country and area code.',
    'profile.save': 'Save',
    'profile.saved': 'Profile saved.',
    'profile.saveError': "Couldn't save your profile.",
    'profile.loadError': "Couldn't load your profile.",
    'profile.createEvent': 'Create event',
    'profile.newEvent': 'New event',
    'profile.myEvents': 'My events',
    'profile.loading': 'Loading…',
    'profile.noEvents': "You haven't published any sets yet.",
    'profile.delete': 'Delete',
    'profile.confirmDelete': 'Delete?',
    'profile.deleted': 'Event deleted.',
    'profile.deleteError': "Couldn't delete it.",
    'profile.signOut': 'Log out',

    'event.title': 'Set title',
    'event.optional': '(optional)',
    'event.titlePh': 'E.g. Live set — Night techno',
    'event.audio': 'Audio file',
    'event.chooseSet': 'Choose your set',
    'event.audioHint': 'MP3, WAV, M4A…',
    'event.maxAudio': 'max 200 MB',
    'event.description': 'Description',
    'event.descPh': 'Tell us where you recorded it, what style it is…',
    'event.photo': 'Photo',
    'event.addPhoto': 'Add photo',
    'event.photoAlt': 'Event photo',
    'event.removePhoto': 'Remove photo',
    'event.uploadingAudio': 'Uploading audio…',
    'event.uploadingPhoto': 'Uploading photo…',
    'event.save': 'Save event',
    'event.publishing': 'Publishing…',
    'event.cancel': 'Cancel',
    'event.needAudio': "Choose your set's audio file.",
    'event.published': 'Event published!',
    'event.publishError': "Couldn't publish the event.",

    'card.playTitle': 'Play {title}',
    'card.pauseTitle': 'Pause {title}',
    'card.whatsapp': 'WhatsApp',
    'card.noContact': 'No contact',
    'card.more': 'show more',
    'card.less': 'show less',
    'card.waMessage': 'Hi! I listened to your set on Up!',
    'card.djFallback': 'DJ',

    'player.progress': 'Playback progress',
    'player.play': 'Play',
    'player.pause': 'Pause',
    'player.close': 'Close player',

    'donate.label': 'Donate',
    'donate.title': 'Donate to Up!',
    'donate.subtitle': 'Your help keeps the dancefloor alive',
    'donate.mpTitle': 'Donate with Mercado Pago',
    'donate.copy': 'Copy alias',
    'donate.copied': 'Copied!',
    'donate.mpHint': 'Paste this alias into the Mercado Pago app to donate.',
    'donate.abroad': 'Donate from abroad',
    'donate.abroadHint': 'With card or PayPal account, in your currency',
    'donate.whatsapp': 'Say thanks on WhatsApp',
    'donate.waThanks': 'Hi, I want to thank Up!',

    'home.heroTitle': 'DJ sets, straight to your ears',
    'home.heroSub': 'Discover new sessions, follow your DJs and message them on WhatsApp.',
    'home.uploadSet': 'Upload my set',
    'home.createProfile': 'Create my DJ profile',
    'home.demo':
      'Demo mode: everything works in your browser. Connect Supabase to make data real and shared.',
    'home.latest': 'Latest',
    'home.loadError': "Couldn't load the sets.",
    'home.emptyTitle': 'No sets here yet',
    'home.emptySub':
      "When a DJ publishes their first set, it'll show up in this feed. The dancefloor is empty… for now.",
    'home.publishFirst': 'Publish the first one',
    'home.beFirst': 'Be the first',

    'app.tagline': 'The dancefloor where sets live.',

    'install.label': 'Install app',
    'install.manual':
      'To install: on Android, menu ⋮ → “Install app”. On iPhone, Share → “Add to Home Screen”.',
    'install.done': 'App installed!',

    'demo.invalidEmail': 'Enter a valid email.',
    'demo.shortPassword': 'Password must be at least 6 characters.',
    'demo.emailTaken': 'That email is already registered. Log in.',
    'demo.badCredentials': 'Incorrect email or password.',
    'demo.avatarNotImage': 'Profile photo must be an image.',
    'demo.avatarTooBig': "Photo can't exceed 10 MB.",
    'demo.audioTooBig': "Audio can't exceed 200 MB.",
    'demo.photoNotImage': 'Event photo must be an image.',
    'demo.photoTooBig': "Photo can't exceed 10 MB.",
    'demo.eventNotFound': 'Event not found.',
    'demo.untitled': 'Untitled set',
  },
}

function detectInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored
  } catch {
    /* noop */
  }
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('es')) return 'es'
  const base = nav.split('-')[0]
  if (SUPPORTED_LANGS.includes(base)) return base
  // Visitante internacional sin idioma soportado: inglés como lingua franca
  return 'en'
}

let currentLang = detectInitial()

export function getLang() {
  return currentLang
}

export function setStoredLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return
  currentLang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* noop */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang
  }
}

// Aplica el lang inicial al <html> lo antes posible
if (typeof document !== 'undefined') {
  document.documentElement.lang = currentLang
}

/** Traduce una clave con la lengua actual. Soporta interpolación {var}. */
export function t(key, vars) {
  const dict = STRINGS[currentLang] || STRINGS[DEFAULT_LANG]
  let s = dict[key] ?? STRINGS[DEFAULT_LANG][key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v))
    }
  }
  return s
}

/** Locale para formateo de fechas/números según la lengua. */
export function localeTag() {
  return currentLang === 'es' ? 'es-AR' : 'en-US'
}

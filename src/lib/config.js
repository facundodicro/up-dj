/**
 * Configuración general de Up!: donaciones y agradecimientos.
 *
 * DONATE_MP_ALIAS: alias de Mercado Pago del creador de la app (Facundo).
 * 👉 Para cambiarlo, editá el valor por defecto acá abajo o definí la
 * variable de entorno VITE_DONATE_MP_ALIAS (en el .env o en Vercel).
 * Si el alias está vacío, la opción de Mercado Pago se oculta
 * automáticamente del modal (no se muestran datos falsos).
 *
 * DONATE_WHATSAPP: número de WhatsApp del creador, formato wa.me SIN "+"
 * ni espacios.
 * 👉 Para cambiarlo, editá el valor por defecto acá abajo o definí la
 * variable de entorno VITE_DONATE_WHATSAPP.
 */

export const MP_ALIAS_PLACEHOLDER = 'up.donaciones.mp'
export const WHATSAPP_PLACEHOLDER = '5490000000000'

export const DONATE_MP_ALIAS =
  import.meta.env.VITE_DONATE_MP_ALIAS || 'facundo.9dejulio'

export const DONATE_WHATSAPP =
  import.meta.env.VITE_DONATE_WHATSAPP || '5492262591262'

/** true si hay un alias de Mercado Pago real configurado */
export function hasRealDonateAlias() {
  return Boolean(DONATE_MP_ALIAS) && DONATE_MP_ALIAS !== MP_ALIAS_PLACEHOLDER
}

/** Mensaje pre-cargado del botón de agradecimiento por WhatsApp */
export const DONATE_MESSAGE = 'Hola, quiero agradecer a Up!'

/** Link de WhatsApp con mensaje pre-cargado */
export function donateLink(message = DONATE_MESSAGE) {
  return `https://wa.me/${DONATE_WHATSAPP}?text=${encodeURIComponent(message)}`
}

/**
 * DONATE_PAYPAL_URL: link directo de PayPal.me del creador para donaciones
 * internacionales (ej: https://paypal.me/facundo/10).
 * DONATE_PAYPAL_EMAIL: email de la cuenta PayPal del creador. Si no hay
 * URL de paypal.me, se genera automáticamente el link de donación de
 * PayPal (https://www.paypal.com/donate/?business=EMAIL&currency_code=USD).
 * 👉 Se configuran con las variables de entorno VITE_DONATE_PAYPAL_URL /
 * VITE_DONATE_PAYPAL_EMAIL (en el .env o en Vercel). Si no hay ninguno,
 * la opción "Donar desde el exterior" se oculta automáticamente del modal.
 */
export const DONATE_PAYPAL_URL = import.meta.env.VITE_DONATE_PAYPAL_URL || ''
export const DONATE_PAYPAL_EMAIL =
  import.meta.env.VITE_DONATE_PAYPAL_EMAIL || 'facundodicroce76@gmail.com'

/** URL de donación PayPal (paypal.me directo o página de donación por email) */
export function paypalDonateUrl() {
  if (DONATE_PAYPAL_URL) return DONATE_PAYPAL_URL
  if (DONATE_PAYPAL_EMAIL)
    return `https://www.paypal.com/donate/?business=${encodeURIComponent(DONATE_PAYPAL_EMAIL)}&currency_code=USD`
  return ''
}

/** true si hay alguna vía de PayPal configurada */
export function hasPaypal() {
  return Boolean(paypalDonateUrl())
}

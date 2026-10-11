/** Toast minimalista: dispara un evento que escucha <Toaster/>. */
export function toast(message, type = 'info') {
  window.dispatchEvent(
    new CustomEvent('up:toast', {
      detail: { message, type, id: `${Date.now()}-${Math.random()}` },
    }),
  )
}

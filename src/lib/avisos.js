// Notificaciones del navegador para pedidos y mensajes nuevos (solo si el usuario las activó)

export const avisosDisponibles = () => typeof window !== 'undefined' && 'Notification' in window

export const avisosActivos = () => avisosDisponibles() && Notification.permission === 'granted'

export async function pedirPermisoAvisos() {
  if (!avisosDisponibles()) return false
  return (await Notification.requestPermission()) === 'granted'
}

let ctx
function sonido() {
  try {
    ctx ||= new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = 880
    g.gain.setValueAtTime(0.08, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.35)
  } catch {
    /* sin audio disponible */
  }
}

export function avisar(titulo, cuerpo) {
  if (!avisosActivos()) return
  sonido()
  // Solo notificación del sistema cuando la pestaña no está a la vista
  if (document.visibilityState === 'visible') return
  try {
    new Notification(titulo, { body: cuerpo?.slice(0, 120), icon: '/icon-192.png', tag: titulo })
  } catch {
    /* algunos navegadores móviles solo permiten notificar desde el service worker */
  }
}

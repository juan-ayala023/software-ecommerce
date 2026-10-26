// Convierte filas de Supabase al formato que usan las pantallas

const TZ = 'America/Bogota'

const ESTADO_UI = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  cambio_direccion: 'Cambio de dirección',
  despachado: 'Despachado',
  entregado: 'Entregado',
  devuelto: 'Devuelto',
  cancelado: 'Cancelado',
}

export const estadoUI = (e) => {
  if (!e) return 'Pendiente'
  return ESTADO_UI[e.toLowerCase()] ?? e.charAt(0).toUpperCase() + e.slice(1).replace(/_/g, ' ')
}

export const estadoDB = (ui) => Object.entries(ESTADO_UI).find(([, v]) => v === ui)?.[0] ?? ui.toLowerCase()

export const titulo = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())

const fmtFecha = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const fmtHora = new Intl.DateTimeFormat('es-CO', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })

export const fechaLocal = (d = new Date()) => fmtFecha.format(new Date(d))
export const horaLocal = (d) => fmtHora.format(new Date(d))

// 'YYYY-MM-DD' de hace n días en hora de Colombia
export const haceDias = (n) => fechaLocal(Date.now() - n * 864e5)

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const fechaCorta = (ymd) => `${Number(ymd.slice(8))} ${MESES[Number(ymd.slice(5, 7)) - 1]}`

export function haceCuanto(iso) {
  const min = Math.round((Date.now() - new Date(iso)) / 6e4)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ayer' : `hace ${d} días`
}

export function mapPedido(r) {
  return {
    id: r.id,
    numero: r.numero_pedido || `#${r.id}`,
    cliente: titulo(r.cliente_nombre_completo || r.nombre) || 'Sin nombre',
    tel: r.telefono || '',
    ciudad: titulo(r.ciudad),
    depto: '',
    direccion: r.direccion_corregida || r.direccion || '',
    producto: r.productos || '—',
    total: r.total || 0,
    estado: estadoUI(r.estado),
    transportadora: r.transportadora || '',
    guia: r.guia || '',
    fecha: fechaLocal(r.created_at),
    hora: horaLocal(r.created_at),
    creado: r.created_at,
    despachado: r.despachado_en,
    nota: r.nota_cliente,
    error: r.error_envio,
  }
}

const DE = (m) => (m.sentido === 'entra' ? 'cliente' : m.autor === 'bot' ? 'bot' : 'yo')

// Agrupa los mensajes por teléfono: una conversación por cliente
export function mapChats(mensajes, pedidos, leidos) {
  const porTel = new Map()
  for (const m of mensajes) {
    if (!porTel.has(m.telefono)) porTel.set(m.telefono, [])
    porTel.get(m.telefono).push(m)
  }
  const hoy = fechaLocal()
  const chats = []
  for (const [tel, lista] of porTel) {
    lista.sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en))
    const conPedido = [...lista].reverse().find((m) => m.pedido_id)
    const pedido =
      (conPedido && pedidos.find((p) => p.id === conPedido.pedido_id)) ||
      pedidos.filter((p) => p.tel === tel).sort((a, b) => new Date(b.creado) - new Date(a.creado))[0]
    const nombre = pedido?.cliente || titulo([...lista].reverse().find((m) => m.nombre)?.nombre) || `+${tel}`

    // No hay marca de leído en la base: cuentan como nuevos los mensajes del cliente
    // posteriores a la última respuesta, hasta que se abre el chat
    let pendientes = 0
    for (let i = lista.length - 1; i >= 0 && lista[i].sentido === 'entra'; i--) pendientes++
    const noLeidos = (leidos[tel] ?? 0) >= lista.length ? 0 : pendientes

    chats.push({
      id: tel,
      telefono: tel,
      nombre,
      pedidoId: pedido?.id ?? null,
      noLeidos,
      ultimo: lista[lista.length - 1].creado_en,
      total: lista.length,
      mensajes: lista.map((m) => {
        const f = fechaLocal(m.creado_en)
        return { id: m.id, de: DE(m), texto: m.texto, iso: m.creado_en, hora: horaLocal(m.creado_en), dia: f === hoy ? 'Hoy' : fechaCorta(f) }
      }),
    })
  }
  return chats.sort((a, b) => new Date(b.ultimo) - new Date(a.ultimo))
}

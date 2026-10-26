// KPIs y feed de actividad a partir de pedidos y chats reales
import { fechaLocal, haceCuanto, haceDias } from './mapeo'
import { cop } from './format'

export function calcularReal(pedidos, chats) {
  const hoy = fechaLocal()
  const semana = haceDias(6)
  const deHoy = pedidos.filter((p) => p.fecha === hoy)
  const kpis = {
    pedidosHoy: deHoy.length,
    confirmados: deHoy.filter((p) => ['Confirmado', 'Despachado', 'Entregado'].includes(p.estado)).length,
    porDespachar: pedidos.filter((p) => p.estado === 'Confirmado' || p.estado === 'Cambio de dirección').length,
    ventasSemana: pedidos.filter((p) => p.fecha >= semana && !['Cancelado', 'Devuelto'].includes(p.estado)).reduce((a, p) => a + p.total, 0),
  }
  const ev = []
  for (const p of pedidos) {
    ev.push({ t: p.creado, tipo: 'pedido', texto: `Nuevo pedido ${p.numero}`, meta: `${p.cliente} · ${cop(p.total)}`, link: `/pedidos?q=${encodeURIComponent(p.numero)}` })
    if (p.despachado && p.guia) ev.push({ t: p.despachado, tipo: 'guia', texto: `Guía enviada a ${p.cliente.split(' ')[0]}`, meta: `${p.transportadora} ${p.guia}`, link: `/pedidos?q=${p.guia}` })
  }
  for (const c of chats) {
    for (const m of c.mensajes) {
      if (m.de === 'cliente' && m.iso) ev.push({ t: m.iso, tipo: 'mensaje', texto: `${c.nombre.split(' ')[0]} escribió`, meta: m.texto, link: `/chats?c=${c.id}` })
    }
  }
  const actividad = ev
    .sort((a, b) => new Date(b.t) - new Date(a.t))
    .slice(0, 12)
    .map((e) => ({ ...e, hace: haceCuanto(e.t) }))
  return { kpis, actividad }
}

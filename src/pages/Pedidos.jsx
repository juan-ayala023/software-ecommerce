import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Truck, MessageCircle, Phone, Search, Package, Download, SearchX, MapPin, AlertCircle, StickyNote } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, cn, useFakeLoading, useToast } from '../components/ui'
import { useStore } from '../store'
import { ESTADOS, TONO_ESTADO, TRANSPORTADORAS } from '../data/mock'
import { fechaCorta, fechaLocal, haceDias } from '../lib/mapeo'
import { cop } from '../lib/format'

const RANGOS = { hoy: 0, '7d': 6, mes: null, todo: Infinity }

function desde(rango) {
  if (rango === 'mes') return fechaLocal().slice(0, 8) + '01'
  if (rango === 'todo') return '0000'
  return haceDias(RANGOS[rango])
}

function exportarCSV(lista) {
  const cols = ['numero', 'fecha', 'hora', 'cliente', 'tel', 'ciudad', 'direccion', 'producto', 'total', 'estado', 'transportadora', 'guia']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [cols.join(','), ...lista.map((p) => cols.map((c) => esc(p[c])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `pedidos-${fechaLocal()}.csv`
  a.click()
}

export default function Pedidos() {
  const { pedidos, chats, actualizarPedido, cargaLenta, vacio, cargandoDatos } = useStore()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const fake = useFakeLoading(cargaLenta ? 2500 : 600)
  const loading = fake || cargandoDatos
  const [estado, setEstado] = useState('Todos')
  const [rango, setRango] = useState('todo')
  const q = params.get('q') || ''
  const [guiaDe, setGuiaDe] = useState(null)
  const hoy = fechaLocal()

  const enRango = pedidos.filter((p) => p.fecha >= desde(rango))
  const conteo = (e) => enRango.filter((p) => p.estado === e).length
  const lista = enRango
    .filter((p) => estado === 'Todos' || p.estado === estado)
    .filter((p) => {
      if (!q) return true
      const t = q.toLowerCase()
      return [p.numero, p.cliente, p.ciudad, p.guia, p.producto, p.tel].join(' ').toLowerCase().includes(t)
    })

  const verChat = (p) => {
    const c = chats.find((x) => x.pedidoId === p.id || x.telefono === p.tel)
    if (c) nav(`/chats?c=${c.id}`)
    else toast(`El pedido ${p.numero} no tiene conversación`, 'info')
  }

  const guardarGuia = async (transportadora, guia) => {
    const p = guiaDe
    const r = await actualizarPedido(p.id, { transportadora, guia, estado: 'Despachado' })
    if (r.error) return toast(`No se guardó: ${r.error}`, 'warn')
    setGuiaDe(null)
    toast(`Guía enviada a ${p.cliente.split(' ')[0]} por WhatsApp`)
  }

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Pago contra entrega · pedidos de Shopify"
        actions={
          <Button icon={Download} onClick={() => exportarCSV(lista)} disabled={!lista.length}>
            Exportar
          </Button>
        }
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {['Todos', ...ESTADOS].map((e) => {
          const n = e === 'Todos' ? enRango.length : conteo(e)
          return (
            <button
              key={e}
              onClick={() => setEstado(e)}
              className={cn(
                'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                estado === e ? 'border-brand/40 bg-brand/10 text-fg' : 'border-line bg-panel text-muted hover:text-fg'
              )}
            >
              {e}
              <span className={cn('rounded-full px-1.5 text-[10px]', estado === e ? 'bg-brand text-white' : 'bg-white/[0.06]')}>{n}</span>
            </button>
          )
        })}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <Input
            value={q}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
            placeholder="Buscar por #, cliente, ciudad o guía"
            className="pl-9"
          />
        </div>
        <div className="sm:w-44">
          <Select value={rango} onChange={(e) => setRango(e.target.value)}>
            <option value="hoy">Hoy</option>
            <option value="7d">Últimos 7 días</option>
            <option value="mes">Este mes</option>
            <option value="todo">Todo</option>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="hidden h-4 w-24 md:block" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : lista.length === 0 ? (
          vacio || pedidos.length === 0 ? (
            <EmptyState icon={Package} title="Aún no hay pedidos" text="Cuando un cliente compre desde la landing, el pedido aparece aquí y el bot le escribe por WhatsApp." />
          ) : (
            <EmptyState
              icon={SearchX}
              title="Sin resultados"
              text="Ningún pedido coincide con estos filtros."
              action={
                <Button
                  onClick={() => {
                    setEstado('Todos')
                    setRango('todo')
                    setParams({})
                  }}
                >
                  Limpiar filtros
                </Button>
              }
            />
          )
        ) : (
          <>
            {/* Escritorio */}
            <table className="hidden w-full text-sm lg:table">
              <thead className="border-b border-line bg-panel/60">
                <tr className="text-left text-xs text-faint">
                  <th className="px-5 py-3 font-medium">#Pedido</th>
                  <th className="py-3 font-medium">Cliente</th>
                  <th className="py-3 font-medium">Ciudad</th>
                  <th className="py-3 font-medium">Producto</th>
                  <th className="py-3 text-right font-medium">Total</th>
                  <th className="py-3 pl-6 font-medium">Estado</th>
                  <th className="py-3 font-medium">Guía</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {lista.map((p) => (
                  <tr key={p.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="font-medium">{p.numero}</div>
                      <div className="text-[11px] whitespace-nowrap text-faint">{p.fecha === hoy ? `Hoy ${p.hora}` : fechaCorta(p.fecha)}</div>
                    </td>
                    <td className="py-3">
                      <div>{p.cliente}</div>
                      <Alertas p={p} />
                    </td>
                    <td className="py-3 text-muted">{p.ciudad}</td>
                    <td className="max-w-56 py-3">
                      <span className="line-clamp-2">{p.producto}</span>
                    </td>
                    <td className="py-3 text-right font-medium tabular-nums">{cop(p.total)}</td>
                    <td className="py-3 pl-6">
                      <Badge tone={TONO_ESTADO[p.estado] || 'gray'} dot>
                        {p.estado}
                      </Badge>
                    </td>
                    <td className="py-3 text-xs">
                      {p.guia ? (
                        <>
                          <div>{p.transportadora}</div>
                          <div className="font-mono text-faint">{p.guia}</div>
                        </>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Acciones p={p} onGuia={() => setGuiaDe(p)} onChat={() => verChat(p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Móvil */}
            <div className="divide-y divide-line lg:hidden">
              {lista.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.numero}</span>
                        <Badge tone={TONO_ESTADO[p.estado] || 'gray'} dot>
                          {p.estado}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm">{p.cliente}</div>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <MapPin size={11} className="shrink-0" /> <span className="truncate">{p.ciudad} · {p.producto}</span>
                      </div>
                      <Alertas p={p} />
                    </div>
                    <div className="text-right font-semibold tabular-nums">{cop(p.total)}</div>
                  </div>
                  {p.guia && (
                    <div className="mt-2 text-xs text-muted">
                      {p.transportadora} <span className="font-mono text-faint">{p.guia}</span>
                    </div>
                  )}
                  <div className="mt-3">
                    <Acciones p={p} onGuia={() => setGuiaDe(p)} onChat={() => verChat(p)} full />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <GuiaModal pedido={guiaDe} onClose={() => setGuiaDe(null)} onSave={guardarGuia} />
    </>
  )
}

function Alertas({ p }) {
  if (!p.error && !p.nota) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {p.error && (
        <span title={p.error} className="inline-flex max-w-full items-center gap-1 truncate text-[11px] text-accent">
          <AlertCircle size={11} className="shrink-0" /> <span className="truncate">{p.error}</span>
        </span>
      )}
      {p.nota && (
        <span title={p.nota} className="inline-flex items-center gap-1 text-[11px] text-muted">
          <StickyNote size={11} /> {p.nota}
        </span>
      )}
    </div>
  )
}

function Acciones({ p, onGuia, onChat, full }) {
  const puedeGuia = p.estado === 'Confirmado' || p.estado === 'Cambio de dirección'
  return (
    <div className={cn('flex gap-1.5', full ? 'grid grid-cols-3' : 'justify-end')}>
      <Button size="xs" variant={puedeGuia ? 'primary' : 'secondary'} icon={Truck} onClick={onGuia} disabled={!puedeGuia && !p.guia}>
        {p.guia ? 'Reenviar' : 'Enviar guía'}
      </Button>
      <Button size="xs" icon={MessageCircle} onClick={onChat} aria-label="Ver chat">
        {full ? 'Ver chat' : <span className="hidden xl:inline">Ver chat</span>}
      </Button>
      <a href={`tel:+${p.tel}`} className="contents">
        <Button size="xs" icon={Phone} aria-label={`Llamar a ${p.cliente}`}>
          {full ? 'Llamar' : <span className="hidden xl:inline">Llamar</span>}
        </Button>
      </a>
    </div>
  )
}

function GuiaModal({ pedido, onClose, onSave }) {
  const [transportadora, setT] = useState('Coordinadora')
  const [guia, setGuia] = useState('')
  const [enviando, setEnviando] = useState(false)
  if (!pedido) return null
  return (
    <Modal
      open
      onClose={onClose}
      title={`Enviar guía · pedido ${pedido.numero}`}
      subtitle={`${pedido.cliente} · ${pedido.direccion}`}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            icon={Truck}
            loading={enviando}
            disabled={guia.trim().length < 6}
            onClick={async () => {
              setEnviando(true)
              await onSave(transportadora, guia.trim())
              setEnviando(false)
              setGuia('')
            }}
          >
            Enviar al cliente
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Transportadora">
          <Select value={transportadora} onChange={(e) => setT(e.target.value)}>
            {TRANSPORTADORAS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Número de guía" hint="Se envía por WhatsApp con el enlace de rastreo">
          <Input autoFocus inputMode="numeric" value={guia} onChange={(e) => setGuia(e.target.value)} placeholder="Ej. 99360060346" className="font-mono" />
        </Field>
        <div className="rounded-xl border border-line bg-panel p-3 text-xs leading-relaxed text-muted">
          <div className="mb-1 font-medium text-fg">Vista previa del mensaje</div>
          {pedido.cliente.split(' ')[0]}, tu pedido ya salió por {transportadora} 🚚 Guía {guia || '__________'}. Ten listos los {cop(pedido.total)} en efectivo.
        </div>
      </div>
    </Modal>
  )
}

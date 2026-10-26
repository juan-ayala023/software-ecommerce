import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bot, CheckCircle2, MapPin, MessageCircle, MessagesSquare, Phone, Search, Send, Truck, XCircle, PanelRight, Package, Smile, Paperclip, X } from 'lucide-react'
import { Badge, Button, EmptyState, Field, Input, Modal, Select, Skeleton, cn, useToast } from '../components/ui'
import { useStore } from '../store'
import { TONO_ESTADO, TRANSPORTADORAS } from '../data/constantes'
import { cop } from '../lib/format'

const iniciales = (n) => n.split(' ').slice(0, 2).map((x) => x[0]).join('')

export default function Chats() {
  const { chats, pedidos, enviarMensaje, marcarLeido, actualizarPedido, cargandoDatos, puedeEnviar } = useStore()
  const [params, setParams] = useSearchParams()
  const loading = cargandoDatos
  const toast = useToast()
  const [q, setQ] = useState('')
  const [panel, setPanel] = useState(false)
  const [guia, setGuia] = useState(false)
  const activoId = params.get('c')
  const activo = chats.find((c) => c.id === activoId)
  const pedido = activo && pedidos.find((p) => p.id === activo.pedidoId)

  useEffect(() => {
    if (activo?.noLeidos) marcarLeido(activo.id)
  }, [activo, marcarLeido])

  const lista = chats.filter((c) => {
    const t = q.toLowerCase()
    const pe = pedidos.find((p) => p.id === c.pedidoId)
    return c.nombre.toLowerCase().includes(t) || c.id.includes(t) || (pe && pe.numero.includes(t))
  })

  const accion = async (cambios, msg, ok) => {
    const r = await actualizarPedido(pedido.id, cambios)
    if (r.error) return toast(`No se guardó: ${r.error}`, 'warn')
    if (msg && puedeEnviar) {
      const m = await enviarMensaje(activo.id, msg, 'yo')
      if (m.error) return toast(`${ok}, pero el WhatsApp no salió: ${m.error}`, 'warn')
    }
    toast(ok)
  }

  // Devuelve true si salió; si no, el texto se queda en la caja para reintentar
  const responder = async (texto) => {
    const r = await enviarMensaje(activo.id, texto)
    if (!r.error) return true
    const fuera24h = /24\s*h/i.test(r.error)
    toast(fuera24h ? `${r.error} Llama al cliente o envía la guía con la plantilla.` : r.error, 'warn')
    return false
  }

  return (
    <div className="flex h-full">
      {/* Lista */}
      <aside className={cn('w-full shrink-0 flex-col border-r border-line md:flex md:w-80', activo ? 'hidden' : 'flex')}>
        <div className="border-b border-line p-4">
          <h1 className="mb-3 text-lg font-semibold">Chats</h1>
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre o pedido" className="pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-3.5">
                <Skeleton className="size-11 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </div>
              </div>
            ))
          ) : lista.length === 0 ? (
            <EmptyState icon={MessagesSquare} title={chats.length ? 'Sin coincidencias' : 'No hay conversaciones'} text={chats.length ? 'Prueba con otro nombre o número de pedido.' : 'El bot de WhatsApp abre un chat por cada pedido nuevo.'} />
          ) : (
            lista.map((c) => {
              const ult = c.mensajes[c.mensajes.length - 1]
              const pe = pedidos.find((p) => p.id === c.pedidoId)
              return (
                <button
                  key={c.id}
                  onClick={() => setParams({ c: c.id })}
                  className={cn('flex w-full cursor-pointer gap-3 border-l-2 px-4 py-3.5 text-left transition', c.id === activoId ? 'border-brand bg-white/[0.04]' : 'border-transparent hover:bg-white/[0.02]')}
                >
                  <Avatar nombre={c.nombre} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={cn('truncate text-sm', c.noLeidos ? 'font-semibold' : 'font-medium')}>{c.nombre}</span>
                      <span className={cn('shrink-0 text-[11px]', c.noLeidos ? 'text-brand' : 'text-faint')}>{ult.hora}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className={cn('flex-1 truncate text-xs', c.noLeidos ? 'text-fg' : 'text-muted')}>
                        {ult.de === 'bot' && <Bot size={11} className="mr-1 inline text-brand" />}
                        {ult.de === 'yo' && 'Tú: '}
                        {ult.texto}
                      </p>
                      {c.noLeidos > 0 && <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">{c.noLeidos}</span>}
                    </div>
                    {pe && (
                      <div className="mt-1.5">
                        <Badge tone={TONO_ESTADO[pe.estado] || 'gray'}>
                          {pe.numero} · {pe.estado}
                        </Badge>
                      </div>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Conversación */}
      {activo ? (
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-3 sm:px-5">
            <button onClick={() => setParams({})} className="cursor-pointer text-muted hover:text-fg md:hidden" aria-label="Volver">
              <ArrowLeft size={20} />
            </button>
            <Avatar nombre={activo.nombre} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{activo.nombre}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-ok">
                <span className="size-1.5 rounded-full bg-ok" /> WhatsApp {activo.telefono ? `· +${activo.telefono}` : '· bot activo'}
              </div>
            </div>
            {(pedido || activo.telefono) && (
              <a href={`tel:+${pedido?.tel || activo.telefono}`}>
                <Button variant="ghost" size="icon" aria-label="Llamar">
                  <Phone size={17} />
                </Button>
              </a>
            )}
            <Button variant="ghost" size="icon" aria-label="Datos del pedido" onClick={() => setPanel(!panel)} className={cn('xl:hidden', panel && 'text-brand')}>
              <PanelRight size={17} />
            </Button>
          </header>
          <Mensajes chat={activo} />
          <Composer onSend={responder} habilitado={puedeEnviar} />
        </section>
      ) : (
        <section className="hidden flex-1 md:flex">
          <EmptyState className="m-auto" icon={MessageCircle} title="Selecciona una conversación" text="Aquí verás lo que el bot habló con el cliente y podrás responder tú mismo." />
        </section>
      )}

      {/* Panel del pedido */}
      {activo && pedido && (
        <>
          {panel && <div className="fixed inset-0 z-30 bg-black/50 xl:hidden" onClick={() => setPanel(false)} />}
          <aside
            className={cn(
              'w-80 shrink-0 flex-col overflow-y-auto border-l border-line bg-bg',
              panel ? 'fixed inset-y-0 right-0 z-40 flex animate-fade-in xl:static xl:z-auto' : 'hidden xl:flex'
            )}
          >
            <PanelPedido
              pedido={pedido}
              onClose={() => setPanel(false)}
              onConfirmar={() => accion({ estado: 'Confirmado' }, `¡Listo ${pedido.cliente.split(' ')[0]}! Tu pedido ${pedido.numero} quedó confirmado ✅`, `Pedido ${pedido.numero} confirmado`)}
              onGuia={() => setGuia(true)}
              onCancelar={() => accion({ estado: 'Cancelado' }, null, `Pedido ${pedido.numero} cancelado`)}
            />
          </aside>
          <GuiaRapida
            open={guia}
            pedido={pedido}
            onClose={() => setGuia(false)}
            onSave={(t, g) => {
              setGuia(false)
              // El mensaje de despacho lo envía n8n con la plantilla aprobada
              accion({ estado: 'Despachado', transportadora: t, guia: g }, null, 'Guía enviada')
            }}
          />
        </>
      )}
    </div>
  )
}

function Avatar({ nombre, size = 'md' }) {
  const hue = [...nombre].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div
      className={cn('grid shrink-0 place-items-center rounded-full font-semibold text-white', size === 'md' ? 'size-11 text-sm' : 'size-9 text-xs')}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 55% 45%), hsl(${hue + 40} 55% 30%))` }}
    >
      {iniciales(nombre)}
    </div>
  )
}

function Mensajes({ chat }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [chat.mensajes.length, chat.id])

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto px-3 py-5 sm:px-6"
      style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {chat.mensajes.map((m, i) => {
          const mio = m.de === 'yo'
          const bot = m.de === 'bot'
          const dia = m.dia || 'Hoy'
          const nuevoDia = i === 0 || dia !== (chat.mensajes[i - 1].dia || 'Hoy')
          return (
            <div key={m.id ?? i} className="flex flex-col gap-2">
            {nuevoDia && <div className="mx-auto my-2 rounded-full bg-white/[0.05] px-3 py-1 text-[11px] text-muted">{dia}</div>}
            <div className={cn('flex animate-fade-in', mio ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm sm:max-w-[70%]',
                  mio && 'rounded-br-md bg-brand text-white',
                  bot && 'rounded-bl-md border border-brand/20 bg-[#1A1510]',
                  m.de === 'cliente' && 'rounded-bl-md bg-card ring-1 ring-line'
                )}
              >
                {bot && (
                  <div className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-brand">
                    <Bot size={12} /> Bot Ingenio
                  </div>
                )}
                {mio && <div className="mb-0.5 text-[11px] font-semibold text-white/80">Tú</div>}
                <p className="whitespace-pre-line">{m.texto}</p>
                <div className={cn('mt-0.5 text-right text-[10px]', mio ? 'text-white/70' : 'text-faint')}>{m.hora}</div>
              </div>
            </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const RAPIDAS = ['¿Confirmas tu dirección?', 'Tu pedido llega en 2 a 5 días hábiles 🚚', 'Recuerda tener el efectivo listo 💵']

function Composer({ onSend, habilitado }) {
  const [t, setT] = useState('')
  const [enviando, setEnviando] = useState(false)
  const send = async () => {
    if (!t.trim() || !habilitado || enviando) return
    setEnviando(true)
    const ok = await onSend(t.trim())
    setEnviando(false)
    if (ok !== false) setT('')
  }
  if (!habilitado) {
    return (
      <div className="shrink-0 border-t border-line bg-bg px-4 py-3 text-center text-xs text-muted sm:px-5">
        Para responder desde aquí falta configurar el webhook de n8n (<span className="font-mono">VITE_N8N_WEBHOOK</span>).
      </div>
    )
  }
  return (
    <div className="shrink-0 border-t border-line bg-bg p-3 sm:px-5">
      <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
        {RAPIDAS.map((r) => (
          <button key={r} onClick={() => setT(r)} className="shrink-0 cursor-pointer rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-line-strong hover:text-fg">
            {r}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="flex items-end gap-2"
      >
        <div className="flex flex-1 items-end rounded-2xl border border-line bg-panel px-2 focus-within:border-brand/60">
          <Button type="button" variant="ghost" size="icon" aria-label="Emoji" className="size-9">
            <Smile size={18} />
          </Button>
          <textarea
            rows={1}
            value={t}
            onChange={(e) => setT(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Escribe un mensaje"
            className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-faint"
          />
          <Button type="button" variant="ghost" size="icon" aria-label="Adjuntar" className="size-9">
            <Paperclip size={17} />
          </Button>
        </div>
        <Button type="submit" variant="primary" size="icon" className="size-10 rounded-full" aria-label="Enviar" disabled={!t.trim()} loading={enviando}>
          {!enviando && <Send size={17} />}
        </Button>
      </form>
    </div>
  )
}

function PanelPedido({ pedido, onClose, onConfirmar, onGuia, onCancelar }) {
  const cerrado = ['Despachado', 'Entregado', 'Devuelto', 'Cancelado'].includes(pedido.estado)
  return (
    <div className="flex flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Package size={16} className="text-muted" /> Pedido {pedido.numero}
        </div>
        <button onClick={onClose} className="cursor-pointer text-muted xl:hidden" aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>
      <div className="space-y-5 p-5">
        <div>
          <div className="mb-1.5 text-xs text-faint">Estado</div>
          <Badge tone={TONO_ESTADO[pedido.estado] || 'gray'} dot className="text-xs">{pedido.estado}</Badge>
          {pedido.error && <p className="mt-2 text-xs leading-snug text-accent">{pedido.error}</p>}
        </div>
        <div>
          <div className="mb-1.5 text-xs text-faint">Dirección</div>
          <div className="flex gap-2 text-sm leading-snug">
            <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
            <div>
              {pedido.direccion}
              <div className="text-muted">{[pedido.ciudad, pedido.depto].filter(Boolean).join(', ')}</div>
            </div>
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-faint">Productos</div>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-panel p-2.5">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-muted">
              <Package size={18} />
            </div>
            <div className="min-w-0 flex-1 line-clamp-2 text-sm font-medium">{pedido.producto}</div>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-muted">Total a cobrar</span>
            <span className="font-semibold">{cop(pedido.total)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted">Pago</span>
            <span>Contra entrega</span>
          </div>
        </div>
        {pedido.guia && (
          <div>
            <div className="mb-1.5 text-xs text-faint">Guía</div>
            <div className="text-sm">
              {pedido.transportadora} <span className="font-mono text-muted">{pedido.guia}</span>
            </div>
          </div>
        )}
        <div className="space-y-2 border-t border-line pt-5">
          <Button variant="success" icon={CheckCircle2} className="w-full" onClick={onConfirmar} disabled={pedido.estado === 'Confirmado' || cerrado}>
            Confirmar
          </Button>
          <Button variant="primary" icon={Truck} className="w-full" onClick={onGuia} disabled={cerrado && !pedido.guia}>
            {pedido.guia ? 'Reenviar guía' : 'Enviar guía'}
          </Button>
          <Button variant="danger" icon={XCircle} className="w-full" onClick={onCancelar} disabled={cerrado}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

function GuiaRapida({ open, pedido, onClose, onSave }) {
  const [t, setT] = useState('Coordinadora')
  const [g, setG] = useState('')
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Enviar guía · ${pedido.numero}`}
      subtitle={pedido.direccion}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon={Truck} disabled={g.trim().length < 6} onClick={() => { onSave(t, g.trim()); setG('') }}>
            Enviar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Transportadora">
          <Select value={t} onChange={(e) => setT(e.target.value)}>
            {TRANSPORTADORAS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </Field>
        <Field label="Número de guía">
          <Input autoFocus value={g} onChange={(e) => setG(e.target.value)} placeholder="Ej. 99360060346" className="font-mono" />
        </Field>
      </div>
    </Modal>
  )
}

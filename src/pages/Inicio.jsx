import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageCircle,
  ShoppingBag, CheckCircle2, Truck, Wallet, ArrowUpRight, Rocket, Activity, Radar, ChevronRight,
} from 'lucide-react'
import { Card, CardHeader, EmptyState, Button, Skeleton, cn } from '../components/ui'
import { ProductThumb } from '../components/brand'
import { MiniEtapas, VeredictoBadge } from '../components/launch'
import { useStore } from '../store'
import { ETAPAS } from '../data/constantes'
import { cop } from '../lib/format'
import { calcularReal } from '../lib/actividad'

const ICONO_ACT = {
  pedido: { i: CheckCircle2, c: 'text-ok bg-ok/10' },
  guia: { i: Truck, c: 'text-info bg-info/10' },
  mensaje: { i: MessageCircle, c: 'text-info bg-info/10' },
}

export default function Inicio() {
  const { lanzamientos, pedidos, chats, cargandoDatos: loading, session } = useStore()
  const enCurso = lanzamientos.filter((l) => l.veredicto !== 'DESCARTAR' && l.etapa < 6)
  const { kpis: K, actividad } = useMemo(() => calcularReal(pedidos, chats), [pedidos, chats])

  const kpis = [
    { label: 'Pedidos hoy', value: K.pedidosHoy, delta: `${pedidos.length} en total`, icon: ShoppingBag, tone: 'text-brand' },
    { label: 'Confirmados', value: K.confirmados, delta: 'De los pedidos de hoy', icon: CheckCircle2, tone: 'text-ok' },
    { label: 'Por despachar', value: K.porDespachar, delta: 'Confirmados sin guía', icon: Truck, tone: 'text-info' },
    { label: 'Ventas semana', value: cop(K.ventasSemana), delta: 'Últimos 7 días, sin cancelados', icon: Wallet, tone: 'text-accent' },
  ]
  const hoyTxt = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const nombre = session?.user?.email?.split('@')[0]

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <p className="text-sm text-muted first-letter:uppercase">{hoyTxt}</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Hola{nombre ? `, ${nombre}` : ''} 👋</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 sm:p-5">
            {loading ? (
              <>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-8 w-20" />
                <Skeleton className="mt-3 h-3 w-28" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted sm:text-sm">{k.label}</span>
                  <k.icon size={18} strokeWidth={1.8} className={k.tone} />
                </div>
                <div className="mt-3 text-xl font-semibold tracking-tight sm:text-[28px]">{k.value}</div>
                <div className="mt-1 text-[11px] text-faint sm:text-xs">{k.delta}</div>
              </>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Lanzamientos en curso"
            subtitle="Del análisis a las ventas"
            icon={Rocket}
            action={
              <div className="flex items-center gap-2">
                <Link to="/lanzamientos" className="flex items-center gap-1 text-xs whitespace-nowrap text-muted hover:text-fg">
                  Ver todos <ArrowUpRight size={14} />
                </Link>
              </div>
            }
          />
          <div className="mt-3 px-2 pb-2">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 px-3 py-3">
                  <Skeleton className="size-11 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="mt-2 h-2 w-full" />
                  </div>
                </div>
              ))
            ) : enCurso.length === 0 ? (
              <EmptyState
                icon={Rocket}
                title="Sin lanzamientos en curso"
                text="Busca un producto ganador en el Radar y lánzalo para empezar."
                action={
                  <Link to="/radar">
                    <Button variant="primary" icon={Radar}>Ir al Radar</Button>
                  </Link>
                }
              />
            ) : (
              enCurso.map((l) => (
                <Link key={l.id} to={`/lanzamientos/${l.id}`} className="group flex items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-white/[0.03]">
                  <ProductThumb p={l.producto} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{l.producto.corto}</span>
                      <span className="hidden text-xs text-faint sm:inline">{l.id}</span>
                      <VeredictoBadge v={l.veredicto} className="ml-auto hidden sm:inline-flex" />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1">
                        <MiniEtapas etapa={l.etapa} />
                      </div>
                      <span className="w-20 shrink-0 text-right text-xs text-muted">{ETAPAS[l.etapa]}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-faint transition group-hover:translate-x-0.5 group-hover:text-fg" />
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Actividad" subtitle="Bot, n8n y equipo" icon={Activity} />
          <div className="mt-3 px-5 pb-5">
            {loading ? (
              [0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 py-2.5">
                  <Skeleton className="size-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : actividad.length === 0 ? (
              <EmptyState icon={Activity} title="Todo tranquilo" text="Aquí verás confirmaciones, guías y alertas en tiempo real." className="py-8" />
            ) : (
              <ol className="relative">
                <span className="absolute top-4 bottom-4 left-4 w-px bg-line" />
                {actividad.slice(0, 8).map((a, i) => {
                  const { i: I, c } = ICONO_ACT[a.tipo]
                  return (
                    <li key={i} className="relative flex gap-3 py-2.5">
                      <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-lg ring-4 ring-card', c)}>
                        <I size={15} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">{a.texto}</p>
                        <p className="mt-0.5 truncate text-xs text-faint">
                          {a.meta} · {a.hace}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}

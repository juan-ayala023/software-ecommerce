import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket, Search, RefreshCw, Check, X, Package, TrendingUp, Boxes, Store, SearchX } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Semaforo, Skeleton, cn, useFakeLoading, useToast } from '../components/ui'
import { ProductThumb } from '../components/brand'
import DemoAviso from '../components/DemoAviso'
import RadarReal from './RadarReal'
import { useStore } from '../store'
import { FILTROS_RADAR, PRODUCTOS, nivelCompetencia } from '../data/mock'
import { cop, miles } from '../lib/format'

const NIVEL_TXT = { green: 'Baja', yellow: 'Media', red: 'Alta' }

export default function RadarPage() {
  const { modo } = useStore()
  return modo === 'real' ? <RadarReal /> : <RadarDemo />
}

function RadarDemo() {
  const { vacio, cargaLenta, crearLanzamiento, lanzamientos } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const [refresh, setRefresh] = useState(0)
  const loading = useFakeLoading(cargaLenta ? 2500 : 700, refresh)
  const [activos, setActivos] = useState({ total: true, v7: true, stock: true, similares: true })
  const [q, setQ] = useState('')
  const [orden, setOrden] = useState('v7')

  const lista = useMemo(() => {
    if (vacio) return []
    return PRODUCTOS.filter((p) => FILTROS_RADAR.every((f) => !activos[f.id] || f.test(p)))
      .filter((p) => p.nombre.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (orden === 'costo' ? a.costo - b.costo : orden === 'competencia' ? a.competencia - b.competencia : b[orden] - a[orden]))
  }, [activos, q, orden, vacio])

  const lanzar = async (p) => {
    const ya = lanzamientos.some((l) => l.productoId === p.id)
    const { id } = await crearLanzamiento(p.id)
    toast(ya ? `Abriendo ${id}` : `Lanzamiento ${id} creado`)
    nav(`/lanzamientos/${id}`)
  }

  return (
    <>
      <PageHeader
        title="Radar"
        subtitle="Productos sugeridos desde Dropi y DropKiller · actualizado hace 2 h"
        actions={
          <>
          <DemoAviso />
          <Button icon={RefreshCw} onClick={() => setRefresh((r) => r + 1)} loading={loading}>
            Actualizar
          </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {FILTROS_RADAR.map((f) => {
            const on = activos[f.id]
            return (
              <button
                key={f.id}
                onClick={() => setActivos((s) => ({ ...s, [f.id]: !s[f.id] }))}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  on ? 'border-ok/30 bg-ok/10 text-fg' : 'border-line bg-panel text-muted hover:text-fg'
                )}
              >
                <span className={cn('grid size-4 place-items-center rounded-full', on ? 'bg-ok text-bg' : 'bg-bad/20 text-bad')}>
                  {on ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                </span>
                {f.label}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 lg:ml-auto">
          <div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" className="pl-9" />
          </div>
          <div className="w-44 shrink-0">
            <Select value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="v7">Más vendidos 7d</option>
              <option value="total">Ventas totales</option>
              <option value="stock">Mayor stock</option>
              <option value="costo">Menor costo</option>
              <option value="competencia">Menos competencia</option>
            </Select>
          </div>
        </div>
      </div>

      {!loading && !vacio && (
        <p className="mb-3 text-xs text-muted">
          {lista.length} de {PRODUCTOS.length} productos cumplen los filtros activos
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-3 h-3 w-1/2" />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((j) => <Skeleton key={j} className="h-10" />)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : lista.length === 0 ? (
        <Card>
          {vacio ? (
            <EmptyState icon={Package} title="El Radar aún no tiene productos" text="Cuando el flujo de n8n termine su próxima búsqueda (cada 6 horas) verás aquí los candidatos." />
          ) : (
            <EmptyState
              icon={SearchX}
              title="Ningún producto cumple estos filtros"
              text="Desactiva algún filtro o cambia la búsqueda para ver más candidatos."
              action={<Button onClick={() => { setActivos({ total: false, v7: false, stock: false, similares: false }); setQ('') }}>Quitar filtros</Button>}
            />
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {lista.map((p) => (
            <ProductoCard key={p.id} p={p} onLanzar={() => lanzar(p)} lanzado={lanzamientos.some((l) => l.productoId === p.id)} />
          ))}
        </div>
      )}
    </>
  )
}

function ProductoCard({ p, onLanzar, lanzado }) {
  const nivel = nivelCompetencia(p.competencia)
  const cumple = FILTROS_RADAR.filter((f) => f.test(p)).length
  return (
    <Card className="group flex flex-col overflow-hidden transition hover:border-line-strong">
      <div className="relative">
        <ProductThumb p={p} className="aspect-[4/3] w-full" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge tone="gray" className="bg-black/50 backdrop-blur">{p.categoria}</Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge tone={cumple === 4 ? 'ok' : 'warn'} className="bg-black/50 backdrop-blur">
            {cumple}/4 filtros
          </Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-10 text-sm leading-snug font-medium">{p.nombre}</h3>
        <div className="mt-1 text-xs text-faint">{p.proveedor}</div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-xs text-muted">Costo Dropi</span>
          <span className="text-lg font-semibold">{cop(p.costo)}</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat icon={TrendingUp} label="7 días" value={miles(p.v7)} hi={p.v7 >= 14} />
          <Stat icon={Package} label="Totales" value={miles(p.total)} hi={p.total >= 200 && p.total <= 2000} />
          <Stat icon={Boxes} label="Stock" value={miles(p.stock)} hi={p.stock >= 60} />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-panel px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Store size={14} /> {p.competencia} tiendas en Meta
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">{NIVEL_TXT[nivel]}</span>
            <Semaforo level={nivel} />
          </div>
        </div>

        <Button variant={lanzado ? 'secondary' : 'primary'} icon={Rocket} className="mt-4 w-full" onClick={onLanzar}>
          {lanzado ? 'Ver lanzamiento' : 'Lanzar'}
        </Button>
      </div>
    </Card>
  )
}

function Stat({ icon: Icon, label, value, hi }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] text-faint">
        <Icon size={11} /> {label}
      </div>
      <div className={cn('mt-0.5 text-sm font-semibold', !hi && 'text-bad')}>{value}</div>
    </div>
  )
}

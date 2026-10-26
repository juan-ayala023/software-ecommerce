import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { TrendingUp, Pause, Wrench, BarChart3, Table2, LineChart as LineIcon, Hourglass, CircleDashed, AlertTriangle } from 'lucide-react'
import { Badge, Card, CardHeader, EmptyState, PageHeader, Segmented, Select, Semaforo, Skeleton, cn } from '../components/ui'
import { ProductThumb } from '../components/brand'
import { useStore } from '../store'
import { PARAMETROS } from '../data/mock'
import { cop, dec, pct } from '../lib/format'
import { fechaCorta, haceDias } from '../lib/mapeo'

// Paleta validada contra la superficie #111827 (CVD ΔE ≥ 13,8)
const SERIES = [
  { key: 'ventas', label: 'Ventas (pedidos)', color: '#EA580C' },
  { key: 'gasto', label: 'Gasto Meta', color: '#3B82F6' },
]

const DECISION = {
  Escalar: { level: 'green', tone: 'ok', icon: TrendingUp, txt: 'Gana plata con ROAS sano. Sube presupuesto 20% cada 3 días.' },
  Optimizar: { level: 'yellow', tone: 'warn', icon: Wrench, txt: 'Rentable pero justo. Prueba un gancho nuevo y mejora la confirmación.' },
  Apagar: { level: 'red', tone: 'bad', icon: Pause, txt: 'Está perdiendo plata. Pausa la campaña o cambia de ángulo.' },
  'Esperando entregas': { level: null, tone: 'info', icon: Hourglass, txt: 'Hay pedidos en camino: la decisión se toma cuando se entreguen.' },
  'Sin datos': { level: null, tone: 'gray', icon: CircleDashed, txt: 'Sin gasto ni pedidos todavía.' },
}

const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const compacto = (n) => (Math.abs(n) >= 1e6 ? `$${dec(n / 1e6, 1)}M` : `$${Math.round(n / 1000)}k`)

export function calcularResultado(l, pedidos, metricas) {
  const clave = norm(l.nombreShopify)
  const propios = clave ? pedidos.filter((p) => !/prueba/i.test(p.numero) && norm(p.producto).includes(clave)) : []
  const ids = l.campana?.meta_ids || []
  const meta = metricas.filter((m) => ids.includes(m.campana_id))
  const cuenta = (e) => propios.filter((p) => p.estado === e).length
  const qty = (p) => l.producto.precios.find((c) => c.precio === p.total)?.qty || 1

  const entregados = propios.filter((p) => p.estado === 'Entregado')
  const devueltos = cuenta('Devuelto')
  const pendientes = cuenta('Pendiente')
  const cancelados = cuenta('Cancelado')
  const enCamino = cuenta('Despachado')
  const confirmados = propios.length - pendientes - cancelados
  const gasto = meta.reduce((a, m) => a + m.gasto, 0)
  const ingreso = entregados.reduce((a, p) => a + p.total, 0)
  const costo = l.producto.costo
  const ganancia =
    costo == null && entregados.length
      ? null
      : ingreso - entregados.reduce((a, p) => a + qty(p) * (costo || 0), 0) - (entregados.length + devueltos) * PARAMETROS.flete - ingreso * PARAMETROS.recaudo - gasto
  const roas = gasto ? ingreso / gasto : null

  let decision
  if (!gasto && !propios.length) decision = 'Sin datos'
  else if (!entregados.length && (enCamino || confirmados > 0)) decision = 'Esperando entregas'
  else if (ganancia != null && ganancia > 0 && (roas == null || roas >= 2.5)) decision = 'Escalar'
  else if (ganancia != null && ganancia > 0) decision = 'Optimizar'
  else decision = 'Apagar'

  return {
    l,
    pedidos: propios,
    total: propios.length,
    confirmacion: propios.length - pendientes ? confirmados / (propios.length - pendientes) : null,
    entrega: entregados.length + devueltos ? entregados.length / (entregados.length + devueltos) : null,
    devueltos,
    enCamino,
    gasto,
    ingreso,
    ganancia,
    roas,
    decision,
    sinCosto: costo == null,
    sinCruce: !clave,
    meta,
  }
}

export default function ResultadosReal() {
  const { lanzamientos, pedidos, metricas, cargandoDatos, faltanTablas } = useStore()
  const [vista, setVista] = useState('grafica')
  const filas = useMemo(
    () =>
      lanzamientos
        .filter((l) => l.etapa >= 5 || l.campana?.meta_ids?.length)
        .map((l) => calcularResultado(l, pedidos, metricas)),
    [lanzamientos, pedidos, metricas]
  )
  const [selId, setSelId] = useState(null)
  const sel = filas.find((r) => r.l.id === selId) || filas[0]

  const serie = useMemo(() => {
    if (!sel) return []
    const dias = Array.from({ length: 30 }, (_, i) => haceDias(29 - i))
    return dias.map((d) => ({
      dia: fechaCorta(d),
      ventas: sel.pedidos.filter((p) => p.fecha === d && p.estado !== 'Cancelado').reduce((a, p) => a + p.total, 0),
      gasto: sel.meta.filter((m) => m.fecha === d).reduce((a, m) => a + m.gasto, 0),
    }))
  }, [sel])

  const tot = filas.reduce((a, r) => ({ ingreso: a.ingreso + r.ingreso, gasto: a.gasto + r.gasto, ganancia: a.ganancia + (r.ganancia || 0), pedidos: a.pedidos + r.total }), { ingreso: 0, gasto: 0, ganancia: 0, pedidos: 0 })

  if (cargandoDatos) {
    return (
      <>
        <PageHeader title="Resultados" subtitle="Pedidos cruzados con el gasto de Meta" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-card" />)}
        </div>
      </>
    )
  }

  if (faltanTablas || filas.length === 0) {
    return (
      <>
        <PageHeader title="Resultados" subtitle="Pedidos cruzados con el gasto de Meta" />
        <Card>
          <EmptyState
            icon={BarChart3}
            title={faltanTablas ? 'Falta crear las tablas de lanzamientos y métricas' : 'Todavía no hay resultados'}
            text={
              faltanTablas
                ? 'Ejecuta supabase/migrations/002_lanzamientos_config_metricas.sql en el SQL Editor de Supabase y recarga.'
                : 'Aparecen los lanzamientos en etapa Campaña o Ventas, o con campañas de Meta vinculadas.'
            }
          />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Resultados" subtitle="Pedidos de Shopify cruzados con el gasto de Meta Ads" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          ['Ingreso entregado', cop(tot.ingreso)],
          ['Gasto en Meta', cop(tot.gasto)],
          ['Ganancia neta', cop(tot.ganancia)],
          ['ROAS general', tot.gasto ? dec(tot.ingreso / tot.gasto) : '—'],
        ].map(([k, v]) => (
          <Card key={k} className="p-4 sm:p-5">
            <div className="text-xs text-muted sm:text-sm">{k}</div>
            <div className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{v}</div>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3 lg:gap-4">
        {filas.map((r) => {
          const d = DECISION[r.decision]
          return (
            <button
              key={r.l.id}
              onClick={() => setSelId(r.l.id)}
              className={cn(
                'cursor-pointer rounded-card border bg-card p-4 text-left shadow-soft transition sm:p-5',
                sel?.l.id === r.l.id ? 'border-brand/50 ring-1 ring-brand/30' : 'border-line hover:border-line-strong'
              )}
            >
              <div className="flex items-center gap-3">
                <ProductThumb p={r.l.producto} className="size-10" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.l.producto.corto}</div>
                  <div className="text-xs text-muted">
                    {r.total} pedidos · ROAS {r.roas != null ? dec(r.roas) : '—'}
                  </div>
                </div>
                {d.level && <Semaforo level={d.level} size="md" />}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge tone={d.tone} icon={d.icon} className="text-xs">{r.decision}</Badge>
                <span className={cn('ml-auto text-sm font-semibold', r.ganancia == null ? 'text-muted' : r.ganancia < 0 ? 'text-bad' : 'text-ok')}>
                  {r.ganancia == null ? 'Falta costo' : cop(r.ganancia)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{d.txt}</p>
              {(r.sinCruce || r.sinCosto) && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-accent">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  {r.sinCruce ? 'Sin "Nombre en Shopify": no se pueden contar sus pedidos.' : 'Falta el costo del proveedor en Análisis.'}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {sel && (
        <Card className="mb-6">
          <CardHeader
            title="Últimos 30 días"
            subtitle={sel.l.producto.corto}
            icon={LineIcon}
            action={
              <div className="flex items-center gap-2">
                <div className="hidden w-48 sm:block">
                  <Select value={sel.l.id} onChange={(e) => setSelId(e.target.value)}>
                    {filas.map((r) => (
                      <option key={r.l.id} value={r.l.id}>{r.l.producto.corto}</option>
                    ))}
                  </Select>
                </div>
                <Segmented
                  value={vista}
                  onChange={setVista}
                  options={[
                    { id: 'grafica', label: '', aria: 'Ver gráfica', icon: LineIcon },
                    { id: 'tabla', label: '', aria: 'Ver tabla', icon: Table2 },
                  ]}
                />
              </div>
            }
          />
          <div className="p-3 pt-4 sm:p-5">
            <div className="mb-3 flex flex-wrap gap-4 px-2 text-xs text-muted">
              {SERIES.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
            {vista === 'grafica' ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#1F2937" vertical={false} />
                    <XAxis dataKey="dia" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#1F2937' }} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compacto} width={52} />
                    <Tooltip content={<Tip />} cursor={{ stroke: '#4B5563', strokeWidth: 1 }} />
                    {SERIES.map((s) => (
                      <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, stroke: '#111827', strokeWidth: 2 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-xs text-faint">
                      <th className="py-2 font-medium">Día</th>
                      {SERIES.map((s) => <th key={s.key} className="py-2 text-right font-medium">{s.label}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {serie.filter((d) => d.ventas || d.gasto).map((d) => (
                      <tr key={d.dia}>
                        <td className="py-2 text-muted">{d.dia}</td>
                        <td className="py-2 text-right tabular-nums">{cop(d.ventas)}</td>
                        <td className="py-2 text-right tabular-nums">{cop(d.gasto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader title="Por producto" icon={Table2} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-y border-line bg-panel/60">
              <tr className="text-left text-xs text-faint">
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="py-3 text-right font-medium">Pedidos</th>
                <th className="py-3 text-right font-medium">Confirmación</th>
                <th className="py-3 text-right font-medium">Entrega</th>
                <th className="py-3 text-right font-medium">En camino</th>
                <th className="py-3 text-right font-medium">Devoluciones</th>
                <th className="py-3 text-right font-medium">Gasto Meta</th>
                <th className="py-3 text-right font-medium">Ingreso</th>
                <th className="py-3 text-right font-medium">Ganancia neta</th>
                <th className="py-3 text-right font-medium">ROAS</th>
                <th className="px-5 py-3 font-medium">Decisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filas.map((r) => {
                const d = DECISION[r.decision]
                return (
                  <tr key={r.l.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link to={`/lanzamientos/${r.l.id}?tab=campana`} className="flex items-center gap-3 hover:text-brand">
                        <ProductThumb p={r.l.producto} className="size-8" />
                        <span className="font-medium">{r.l.producto.corto}</span>
                      </Link>
                    </td>
                    <td className="py-3 text-right tabular-nums">{r.total}</td>
                    <td className="py-3 text-right tabular-nums">{r.confirmacion != null ? pct(r.confirmacion) : '—'}</td>
                    <td className="py-3 text-right tabular-nums">{r.entrega != null ? pct(r.entrega) : '—'}</td>
                    <td className="py-3 text-right tabular-nums">{r.enCamino}</td>
                    <td className="py-3 text-right tabular-nums">{r.devueltos}</td>
                    <td className="py-3 text-right tabular-nums">{cop(r.gasto)}</td>
                    <td className="py-3 text-right tabular-nums">{cop(r.ingreso)}</td>
                    <td className={cn('py-3 text-right font-semibold tabular-nums', r.ganancia == null ? 'text-muted' : r.ganancia < 0 ? 'text-bad' : 'text-ok')}>
                      {r.ganancia == null ? '—' : cop(r.ganancia)}
                    </td>
                    <td className="py-3 text-right font-medium tabular-nums">{r.roas != null ? dec(r.roas) : '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {d.level && <Semaforo level={d.level} />}
                        <Badge tone={d.tone}>{r.decision}</Badge>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-faint">
          Ingreso = pedidos entregados. Ganancia = ingreso − costo del producto − flete ({cop(PARAMETROS.flete)} por entrega o devolución) − recaudo ({pct(PARAMETROS.recaudo)}) − gasto en Meta. Los pedidos se cruzan por el "Nombre en Shopify" de cada lanzamiento.
        </p>
      </Card>
    </>
  )
}

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line-strong bg-card px-3 py-2.5 text-xs shadow-2xl">
      <div className="mb-1.5 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-0.5 w-3 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto pl-4 font-medium tabular-nums">{cop(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

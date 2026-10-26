import { useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { TrendingUp, Pause, Wrench, BarChart3, Table2, LineChart as LineIcon } from 'lucide-react'
import { Badge, Card, CardHeader, EmptyState, PageHeader, Segmented, Select, Semaforo, Skeleton, cn, useFakeLoading } from '../components/ui'
import { ProductThumb } from '../components/brand'
import DemoAviso from '../components/DemoAviso'
import ResultadosReal from './ResultadosReal'
import { useStore } from '../store'
import { RESULTADOS, producto } from '../data/mock'
import { cop, dec, miles, pct } from '../lib/format'

// Paleta validada contra la superficie #111827 (CVD ΔE ≥ 13,8)
const SERIES = [
  { key: 'ingreso', label: 'Ingreso', color: '#EA580C' },
  { key: 'gasto', label: 'Gasto Meta', color: '#3B82F6' },
  { key: 'ganancia', label: 'Ganancia', color: '#0D9488' },
]

const VEREDICTO = {
  Escalar: { level: 'green', tone: 'ok', icon: TrendingUp, txt: 'ROAS sobre 3 y CPA bajo el máximo. Sube presupuesto 20% cada 3 días.' },
  Optimizar: { level: 'yellow', tone: 'warn', icon: Wrench, txt: 'Rentable pero justo. Prueba un gancho nuevo y mejora la confirmación.' },
  Apagar: { level: 'red', tone: 'bad', icon: Pause, txt: 'Pierde plata con baja entrega. Apaga la campaña y libera el stock.' },
}

const compacto = (n) => (Math.abs(n) >= 1e6 ? `$${dec(n / 1e6, 1)}M` : `$${Math.round(n / 1000)}k`)

export default function Resultados() {
  const { modo } = useStore()
  return modo === 'real' ? <ResultadosReal /> : <ResultadosDemo />
}

function ResultadosDemo() {
  const { vacio, cargaLenta } = useStore()
  const loading = useFakeLoading(cargaLenta ? 2500 : 700)
  const datos = vacio ? [] : RESULTADOS
  const [sel, setSel] = useState('pelador')
  const [vista, setVista] = useState('grafica')
  const actual = datos.find((r) => r.productoId === sel)

  const tot = datos.reduce((a, r) => ({ ingreso: a.ingreso + r.ingreso, gasto: a.gasto + r.gasto, ganancia: a.ganancia + r.ganancia, pedidos: a.pedidos + r.pedidos }), { ingreso: 0, gasto: 0, ganancia: 0, pedidos: 0 })

  if (!loading && datos.length === 0) {
    return (
      <>
        <PageHeader title="Resultados" subtitle="Últimos 14 días" />
        <Card>
          <EmptyState icon={BarChart3} title="Todavía no hay resultados" text="Los resultados aparecen cuando un lanzamiento tiene campaña activa y pedidos entregados." />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Resultados" subtitle="Últimos 14 días · 13 al 26 de octubre" actions={<DemoAviso />} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          ['Ingreso entregado', cop(tot.ingreso)],
          ['Gasto en Meta', cop(tot.gasto)],
          ['Ganancia neta', cop(tot.ganancia)],
          ['ROAS general', tot.gasto ? dec(tot.ingreso / tot.gasto) : '—'],
        ].map(([k, v]) => (
          <Card key={k} className="p-4 sm:p-5">
            {loading ? (
              <>
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="mt-3 h-7 w-28" />
              </>
            ) : (
              <>
                <div className="text-xs text-muted sm:text-sm">{k}</div>
                <div className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{v}</div>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Semáforo por producto */}
      <div className="mb-6 grid gap-3 md:grid-cols-3 lg:gap-4">
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-card" />)
          : datos.map((r) => {
              const p = producto(r.productoId)
              const v = VEREDICTO[r.semaforo]
              return (
                <button
                  key={r.productoId}
                  onClick={() => setSel(r.productoId)}
                  className={cn(
                    'cursor-pointer rounded-card border bg-card p-4 text-left shadow-soft transition sm:p-5',
                    sel === r.productoId ? 'border-brand/50 ring-1 ring-brand/30' : 'border-line hover:border-line-strong'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ProductThumb p={p} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.corto}</div>
                      <div className="text-xs text-muted">{r.pedidos} pedidos · ROAS {dec(r.roas)}</div>
                    </div>
                    <Semaforo level={v.level} size="md" />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge tone={v.tone} icon={v.icon} className="text-xs">{r.semaforo}</Badge>
                    <span className={cn('ml-auto text-sm font-semibold', r.ganancia < 0 ? 'text-bad' : 'text-ok')}>{cop(r.ganancia)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{v.txt}</p>
                </button>
              )
            })}
      </div>

      {/* Gráfica diaria */}
      <Card className="mb-6">
        <CardHeader
          title="Por día"
          subtitle={actual ? producto(actual.productoId).corto : ''}
          icon={LineIcon}
          action={
            <div className="flex items-center gap-2">
              <div className="hidden w-48 sm:block">
                <Select value={sel} onChange={(e) => setSel(e.target.value)}>
                  {datos.map((r) => (
                    <option key={r.productoId} value={r.productoId}>{producto(r.productoId).corto}</option>
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
          {/* Leyenda */}
          <div className="mb-3 flex flex-wrap gap-4 px-2 text-xs text-muted">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
          {loading || !actual ? (
            <Skeleton className="h-72" />
          ) : vista === 'grafica' ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={actual.serie} margin={{ top: 8, right: 84, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#1F2937' }} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compacto} width={52} />
                  <Tooltip content={<Tip />} cursor={{ stroke: '#4B5563', strokeWidth: 1 }} />
                  {SERIES.map((s) => (
                    <Line
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      activeDot={{ r: 4, stroke: '#111827', strokeWidth: 2 }}
                      label={<FinLabel total={actual.serie.length} color={s.color} name={s.label} />}
                    />
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
                  {actual.serie.map((d) => (
                    <tr key={d.dia}>
                      <td className="py-2 text-muted">{d.dia}</td>
                      <td className="py-2 text-right tabular-nums">{cop(d.ingreso)}</td>
                      <td className="py-2 text-right tabular-nums">{cop(d.gasto)}</td>
                      <td className={cn('py-2 text-right tabular-nums', d.ganancia < 0 && 'text-bad')}>{cop(d.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Tabla por producto */}
      <Card className="overflow-hidden">
        <CardHeader title="Por producto" icon={Table2} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-y border-line bg-panel/60">
              <tr className="text-left text-xs text-faint">
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="py-3 text-right font-medium">Pedidos</th>
                <th className="py-3 text-right font-medium">Confirmación</th>
                <th className="py-3 text-right font-medium">Entrega</th>
                <th className="py-3 text-right font-medium">Devoluciones</th>
                <th className="py-3 text-right font-medium">Gasto Meta</th>
                <th className="py-3 text-right font-medium">Ingreso</th>
                <th className="py-3 text-right font-medium">Ganancia neta</th>
                <th className="py-3 text-right font-medium">ROAS</th>
                <th className="px-5 py-3 font-medium">Decisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading
                ? [0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td colSpan={10} className="px-5 py-3">
                        <Skeleton className="h-5" />
                      </td>
                    </tr>
                  ))
                : datos.map((r) => {
                    const p = producto(r.productoId)
                    const v = VEREDICTO[r.semaforo]
                    return (
                      <tr key={r.productoId} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <ProductThumb p={p} className="size-8" />
                            <span className="font-medium">{p.corto}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right tabular-nums">{miles(r.pedidos)}</td>
                        <td className="py-3 text-right tabular-nums">{pct(r.confirmacion)}</td>
                        <td className="py-3 text-right tabular-nums">{pct(r.entrega)}</td>
                        <td className="py-3 text-right tabular-nums">{r.devoluciones}</td>
                        <td className="py-3 text-right tabular-nums">{cop(r.gasto)}</td>
                        <td className="py-3 text-right tabular-nums">{cop(r.ingreso)}</td>
                        <td className={cn('py-3 text-right font-semibold tabular-nums', r.ganancia < 0 ? 'text-bad' : 'text-ok')}>{cop(r.ganancia)}</td>
                        <td className="py-3 text-right font-medium tabular-nums">{dec(r.roas)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Semaforo level={v.level} />
                            <Badge tone={v.tone}>{r.semaforo}</Badge>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
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

// Etiqueta directa solo en el último punto de cada serie
function FinLabel({ x, y, index, total, color, name }) {
  if (index !== total - 1) return null
  return (
    <g>
      <circle cx={x} cy={y} r={4} fill={color} stroke="#111827" strokeWidth={2} />
      <text x={x + 8} y={y + 4} fill="#9CA3AF" fontSize={11}>
        {name}
      </text>
    </g>
  )
}

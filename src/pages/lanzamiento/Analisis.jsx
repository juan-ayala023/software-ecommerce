import { useRef } from 'react'
import { Tag, AlertTriangle, CheckCircle2, XCircle, Filter, Swords, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Play, Clock, Calculator } from 'lucide-react'
import { Badge, Button, Card, CardHeader, cn, useToast } from '../../components/ui'
import { Thumb } from '../../components/brand'
import { useStore } from '../../store'
import { ALERTAS_ANALISIS, COMPETENCIA, PARAMETROS, nivelCompetencia } from '../../data/mock'
import { cop, miles, pct } from '../../lib/format'

export function calcularMargen(p) {
  const principal = p.precios.find((c) => c.principal)
  const costo = p.costo * principal.qty
  const recaudo = Math.round(principal.precio * PARAMETROS.recaudo)
  const margen = principal.precio - costo - PARAMETROS.flete - recaudo
  const cpaMax = Math.round((margen * PARAMETROS.tasaEntrega) / 100) * 100
  return { principal, costo, recaudo, margen, cpaMax }
}

export default function Analisis({ l }) {
  const { actualizarLanzamiento } = useStore()
  const toast = useToast()
  const p = l.producto
  const { principal, costo, recaudo, margen, cpaMax } = calcularMargen(p)
  const scroller = useRef(null)

  const filtros = [
    { f: 'Ventas totales', v: miles(p.total), req: '200 – 2.000', ok: p.total >= 200 && p.total <= 2000 },
    { f: 'Ventas 7 días', v: miles(p.v7), req: '≥ 14', ok: p.v7 >= 14 },
    { f: 'Stock', v: miles(p.stock), req: '≥ 60', ok: p.stock >= 60 },
    { f: 'Productos similares', v: miles(p.similares), req: '≤ 2.000', ok: p.similares <= 2000 },
    { f: 'Competencia en Meta', v: `${p.competencia} tiendas`, req: '≤ 20', ok: p.competencia <= 20, warn: nivelCompetencia(p.competencia) === 'yellow' },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      {/* Precio y combos */}
      <Card className="lg:col-span-2">
        <CardHeader title="Precio y combos" subtitle="Precio sugerido para pago contra entrega" icon={Tag} />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {p.precios.map((c) => (
            <div
              key={c.qty}
              className={cn(
                'relative rounded-xl border p-4',
                c.principal ? 'border-brand/50 bg-brand/[0.07] shadow-glow' : 'border-line bg-panel'
              )}
            >
              {c.principal && <Badge tone="brand" className="absolute -top-2.5 left-4 bg-card">Principal</Badge>}
              <div className="text-sm text-muted">{c.qty}x unidad{c.qty > 1 ? 'es' : ''}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">{cop(c.precio)}</div>
              <div className="mt-0.5 text-xs text-faint line-through">{cop(c.antes)}</div>
              <div className="mt-2 text-xs text-muted">{cop(Math.round(c.precio / c.qty))} c/u</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 border-t border-line p-5 md:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted">
              <Calculator size={14} /> Margen por entrega (combo {principal.qty}x)
            </div>
            <dl className="space-y-1.5 text-sm">
              <Row k="Precio de venta" v={cop(principal.precio)} />
              <Row k={`Costo producto (${principal.qty} × ${cop(p.costo)})`} v={`−${cop(costo)}`} />
              <Row k="Flete promedio" v={`−${cop(PARAMETROS.flete)}`} />
              <Row k={`Comisión recaudo (${pct(PARAMETROS.recaudo)})`} v={`−${cop(recaudo)}`} />
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <dt>Margen por entrega</dt>
                <dd className="text-ok">{cop(margen)}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-line bg-panel p-4">
            <div>
              <div className="text-xs text-muted">CPA máximo</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight text-accent">{cop(cpaMax)}</div>
              <p className="mt-2 text-xs leading-relaxed text-faint">
                Margen × {pct(PARAMETROS.tasaEntrega)} de entrega esperada. Si el costo por compra en Meta pasa este valor, la campaña pierde plata.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Alertas */}
      <Card>
        <CardHeader title="Alertas" subtitle={`${ALERTAS_ANALISIS.length} puntos a revisar`} icon={AlertTriangle} />
        <ul className="space-y-2 p-5">
          {ALERTAS_ANALISIS.map((a, i) => {
            const I = a.tipo === 'ok' ? CheckCircle2 : a.tipo === 'warn' ? AlertTriangle : XCircle
            const c = a.tipo === 'ok' ? 'text-ok' : a.tipo === 'warn' ? 'text-accent' : 'text-bad'
            return (
              <li key={i} className="flex gap-3 rounded-xl border border-line bg-panel p-3 text-sm leading-snug">
                <I size={17} className={cn('mt-px shrink-0', c)} />
                {a.texto}
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Filtros DropKiller */}
      <Card className="lg:col-span-3">
        <CardHeader title="Filtros DropKiller" subtitle={`${filtros.filter((f) => f.ok).length} de ${filtros.length} cumplen`} icon={Filter} />
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs text-faint">
                <th className="py-2 font-medium">Filtro</th>
                <th className="py-2 font-medium">Valor</th>
                <th className="py-2 font-medium">Requisito</th>
                <th className="py-2 text-right font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtros.map((f) => (
                <tr key={f.f}>
                  <td className="py-2.5">{f.f}</td>
                  <td className="py-2.5 font-medium">{f.v}</td>
                  <td className="py-2.5 text-muted">{f.req}</td>
                  <td className="py-2.5 text-right">
                    {!f.ok ? <Badge tone="bad" icon={XCircle}>No cumple</Badge> : f.warn ? <Badge tone="warn" icon={AlertTriangle}>Cumple justo</Badge> : <Badge tone="ok" icon={CheckCircle2}>Cumple</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Competencia */}
      <Card className="overflow-hidden lg:col-span-3">
        <CardHeader
          title="Competencia"
          subtitle="Anuncios activos de otras tiendas en la biblioteca de Meta"
          icon={Swords}
          action={
            <div className="hidden gap-1 sm:flex">
              <Button size="icon" className="size-8" aria-label="Anterior" onClick={() => scroller.current.scrollBy({ left: -320, behavior: 'smooth' })}>
                <ChevronLeft size={16} />
              </Button>
              <Button size="icon" className="size-8" aria-label="Siguiente" onClick={() => scroller.current.scrollBy({ left: 320, behavior: 'smooth' })}>
                <ChevronRight size={16} />
              </Button>
            </div>
          }
        />
        <div ref={scroller} className="no-scrollbar flex snap-x gap-3 overflow-x-auto p-5">
          {COMPETENCIA.map((c) => (
            <div key={c.tienda} className="w-52 shrink-0 snap-start overflow-hidden rounded-xl border border-line bg-panel">
              <Thumb hue={c.hue} video={c.formato === 'Video'} className="aspect-[4/5] w-full" rounded="rounded-none">
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-xs leading-snug font-medium">{c.gancho}</div>
                <Badge tone="gray" className="absolute top-2 left-2 bg-black/50 backdrop-blur">
                  {c.formato === 'Video' && <Play size={10} />} {c.formato}
                </Badge>
              </Thumb>
              <div className="flex items-center justify-between p-3">
                <span className="truncate text-sm font-medium">{c.tienda}</span>
                <span className={cn('flex shrink-0 items-center gap-1 text-xs', c.dias >= 30 ? 'text-accent' : 'text-muted')}>
                  <Clock size={12} /> {c.dias} d
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:col-span-3">
        <Button
          variant="danger"
          icon={ThumbsDown}
          onClick={() => {
            actualizarLanzamiento(l.id, { veredicto: 'DESCARTAR' })
            toast('Producto descartado', 'warn')
          }}
        >
          Descartar
        </Button>
        <Button
          variant="primary"
          icon={ThumbsUp}
          onClick={() => {
            actualizarLanzamiento(l.id, { veredicto: 'TESTEAR', etapa: Math.max(l.etapa, 1) })
            toast('Análisis aprobado · siguiente paso: prompts')
          }}
        >
          Aprobar
        </Button>
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  )
}

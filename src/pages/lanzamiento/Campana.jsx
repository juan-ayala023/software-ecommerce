import { useState } from 'react'
import { Target, MapPin, Wallet, Eye, MousePointerClick, ShoppingCart, Gauge, Save, Info, ExternalLink, CalendarDays } from 'lucide-react'
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, cn, useToast } from '../../components/ui'
import { useStore } from '../../store'
import { cop, miles, pct } from '../../lib/format'
import { fechaCorta } from '../../lib/mapeo'
import { margenDe } from './Analisis'

const num = (v) => Number(String(v).replace(/\D/g, '')) || 0

export default function CampanaReal({ l }) {
  const toast = useToast()
  const { metricas, actualizarLanzamiento } = useStore()
  const [c, setC] = useState({ presupuesto: 30000, edadMin: 25, edadMax: 60, anuncios: { AD1: true, AD2: true, AD3: false }, meta_ids: [], ...l.campana })
  const [guardando, setGuardando] = useState(false)

  // Campañas conocidas (las que tienen métricas guardadas)
  const campanas = Object.values(
    metricas.reduce((a, m) => {
      a[m.campana_id] ||= { id: m.campana_id, nombre: m.campana_nombre || m.campana_id, gasto: 0 }
      a[m.campana_id].gasto += m.gasto
      return a
    }, {})
  ).sort((a, b) => b.gasto - a.gasto)

  const propias = metricas.filter((m) => c.meta_ids.includes(m.campana_id))
  const t = propias.reduce((a, m) => ({ gasto: a.gasto + m.gasto, imp: a.imp + m.impresiones, clics: a.clics + m.clics, compras: a.compras + m.compras }), { gasto: 0, imp: 0, clics: 0, compras: 0 })
  const cpm = t.imp ? (t.gasto / t.imp) * 1000 : 0
  const ctr = t.imp ? t.clics / t.imp : 0
  const cpa = t.compras ? t.gasto / t.compras : null
  const calc = margenDe(l.producto.precios, l.producto.costo)
  const cpaMax = calc ? Math.max(0, calc.cpaMax) : null
  const ratio = cpa != null && cpaMax ? cpa / cpaMax : null
  const tono = ratio == null ? 'gray' : ratio <= 0.8 ? 'ok' : ratio <= 1 ? 'warn' : 'bad'

  const porDia = Object.values(
    propias.reduce((a, m) => {
      a[m.fecha] ||= { fecha: m.fecha, gasto: 0, clics: 0, compras: 0 }
      a[m.fecha].gasto += m.gasto
      a[m.fecha].clics += m.clics
      a[m.fecha].compras += m.compras
      return a
    }, {})
  ).sort((a, b) => b.fecha.localeCompare(a.fecha))

  const guardar = async () => {
    setGuardando(true)
    const r = await actualizarLanzamiento(l.id, { campana: c })
    setGuardando(false)
    toast(r.error ? `No se guardó: ${r.error}` : 'Campaña guardada', r.error ? 'warn' : 'ok')
  }

  const toggleCampana = (id) => setC((s) => ({ ...s, meta_ids: s.meta_ids.includes(id) ? s.meta_ids.filter((x) => x !== id) : [...s.meta_ids, id] }))

  return (
    <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
      <Card className="lg:col-span-2">
        <CardHeader title="Configuración" subtitle="Plan de la campaña de ventas" icon={Target} />
        <div className="space-y-4 p-5">
          <Field label="Presupuesto diario (COP)" hint={`≈ ${cop(c.presupuesto * 30)} al mes`}>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-faint">$</span>
              <Input inputMode="numeric" value={miles(c.presupuesto)} onChange={(e) => setC({ ...c, presupuesto: num(e.target.value) })} className="pl-7" />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Edad mínima">
              <Input type="number" min={18} max={65} value={c.edadMin} onChange={(e) => setC({ ...c, edadMin: +e.target.value })} />
            </Field>
            <Field label="Edad máxima">
              <Input type="number" min={18} max={65} value={c.edadMax} onChange={(e) => setC({ ...c, edadMax: +e.target.value })} />
            </Field>
          </div>
          <Field label="Ubicación">
            <div className="flex h-9 items-center gap-2 rounded-[10px] border border-line bg-panel px-3 text-sm">
              <MapPin size={15} className="text-brand" /> Colombia
              <span className="ml-auto text-xs text-faint">Todo el país</span>
            </div>
          </Field>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">Anuncios incluidos</span>
            <div className="flex gap-2">
              {['AD1', 'AD2', 'AD3'].map((id) => (
                <label key={id} className={cn('flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-sm transition', c.anuncios[id] ? 'border-brand/40 bg-brand/10' : 'border-line bg-panel')}>
                  <input type="checkbox" checked={!!c.anuncios[id]} onChange={(e) => setC({ ...c, anuncios: { ...c.anuncios, [id]: e.target.checked } })} className="size-4 accent-[#F97316]" />
                  <span className="font-mono text-xs font-semibold">{id}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">Campañas de Meta de este producto</span>
            {campanas.length === 0 ? (
              <p className="rounded-[10px] border border-line bg-panel px-3 py-2.5 text-xs text-muted">Aún no hay métricas de Meta guardadas. Cuando n8n las sincronice podrás vincularlas aquí.</p>
            ) : (
              <div className="space-y-1.5">
                {campanas.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-line bg-panel px-3 py-2 transition hover:border-line-strong">
                    <input type="checkbox" checked={c.meta_ids.includes(m.id)} onChange={() => toggleCampana(m.id)} className="size-4 accent-[#F97316]" />
                    <span className="min-w-0 flex-1 truncate text-sm">{m.nombre}</span>
                    <span className="text-xs text-faint tabular-nums">{cop(m.gasto)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <Button variant="primary" className="w-full" icon={Save} loading={guardando} onClick={guardar}>
            Guardar
          </Button>
          <a
            href="https://adsmanager.facebook.com/adsmanager/manage/campaigns"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-fg"
          >
            Activar o pausar se hace en el Administrador de anuncios <ExternalLink size={12} />
          </a>
        </div>
      </Card>

      <div className="space-y-4 lg:col-span-3 lg:space-y-6">
        {c.meta_ids.length === 0 ? (
          <Card>
            <EmptyState icon={Gauge} title="Sin campañas vinculadas" text="Marca a la izquierda las campañas de Meta de este producto y guarda para ver gasto, CTR y CPA." />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metrica icon={Wallet} label="Gasto" value={cop(t.gasto)} />
              <Metrica icon={Eye} label="CPM" value={t.imp ? cop(cpm) : '—'} />
              <Metrica icon={MousePointerClick} label="CTR" value={t.imp ? pct(ctr, 2) : '—'} />
              <Metrica icon={ShoppingCart} label="Compras (píxel)" value={t.compras} />
            </div>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Gauge size={16} className="text-muted" /> CPA vs. CPA máximo
                  </div>
                  <p className="mt-1 text-xs text-muted">Gasto ÷ compras reportadas por el píxel, frente al límite del análisis</p>
                </div>
                {ratio != null && <Badge tone={tono}>{tono === 'ok' ? 'Rentable' : tono === 'warn' ? 'Al límite' : 'Pierde plata'}</Badge>}
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <div className="text-xs text-muted">CPA actual</div>
                  <div className={cn('text-3xl font-semibold tracking-tight', { ok: 'text-ok', warn: 'text-accent', bad: 'text-bad', gray: 'text-muted' }[tono])}>{cpa != null ? cop(cpa) : 'Sin compras'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">CPA máximo</div>
                  <div className="text-lg font-semibold">{cpaMax != null ? cop(cpaMax) : '—'}</div>
                </div>
              </div>
              {ratio != null && (
                <>
                  <div className="relative mt-4 h-3 rounded-full bg-white/[0.06]">
                    <div className={cn('h-full rounded-full transition-all', { ok: 'bg-ok', warn: 'bg-accent', bad: 'bg-bad' }[tono])} style={{ width: `${Math.min(100, (ratio / 1.5) * 100)}%` }} />
                    <div className="absolute -top-1.5 -bottom-1.5 w-0.5 rounded bg-fg" style={{ left: `${100 / 1.5}%` }} />
                  </div>
                  <div className="relative mt-2 flex justify-between text-[11px] text-faint">
                    <span>$0</span>
                    <span className="absolute -translate-x-1/2 text-fg" style={{ left: `${100 / 1.5}%` }}>Máximo</span>
                    <span>{cop(cpaMax * 1.5)}</span>
                  </div>
                </>
              )}
              <div className="mt-5 flex gap-2 rounded-xl border border-line bg-panel p-3 text-xs leading-relaxed text-muted">
                <Info size={14} className="mt-0.5 shrink-0 text-info" />
                {cpaMax == null
                  ? 'Agrega costo y precios en la pestaña Análisis para calcular el CPA máximo.'
                  : cpa == null
                    ? `Llevas ${cop(t.gasto)} sin compras registradas. Si el gasto pasa el CPA máximo (${cop(cpaMax)}) sin ventas, cambia el gancho o pausa.`
                    : tono === 'ok'
                      ? `Vas ${pct(1 - ratio)} por debajo del máximo. Si se mantiene 3 días seguidos, sube el presupuesto un 20%.`
                      : 'El CPA está cerca o por encima del máximo. Revisa el anuncio con peor CTR antes de subir presupuesto.'}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <CalendarDays size={16} className="text-muted" /> Por día
              </div>
              <div className="max-h-72 overflow-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-xs text-faint">
                      <th className="py-2 font-medium">Día</th>
                      <th className="py-2 text-right font-medium">Gasto</th>
                      <th className="py-2 text-right font-medium">Clics</th>
                      <th className="py-2 text-right font-medium">Compras</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {porDia.map((d) => (
                      <tr key={d.fecha}>
                        <td className="py-2 text-muted">{fechaCorta(d.fecha)}</td>
                        <td className="py-2 text-right tabular-nums">{cop(d.gasto)}</td>
                        <td className="py-2 text-right tabular-nums">{d.clics}</td>
                        <td className="py-2 text-right tabular-nums">{d.compras}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function Metrica({ icon: Icon, label, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">{value}</div>
    </Card>
  )
}

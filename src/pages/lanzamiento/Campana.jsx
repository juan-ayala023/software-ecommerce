import { useState } from 'react'
import { Target, MapPin, Users, Wallet, Eye, MousePointerClick, ShoppingCart, Gauge, Pause, Play, Info } from 'lucide-react'
import { Badge, Button, Card, CardHeader, Field, Input, Switch, cn, useToast } from '../../components/ui'
import { CAMPANA_INICIAL, ANUNCIOS } from '../../data/mock'
import { cop, miles, pct } from '../../lib/format'
import { calcularMargen } from './Analisis'

export default function Campana({ l }) {
  const toast = useToast()
  const [c, setC] = useState(CAMPANA_INICIAL)
  const [guardando, setGuardando] = useState(false)
  const { cpaMax } = calcularMargen(l.producto)
  const m = c.metricas
  const cpa = m.compras ? Math.round(m.gasto / m.compras) : 0
  const ratio = cpa / cpaMax
  const tono = ratio <= 0.8 ? 'ok' : ratio <= 1 ? 'warn' : 'bad'
  const nAnuncios = Object.values(c.anuncios).filter(Boolean).length

  return (
    <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Configuración"
          subtitle="Campaña de ventas · Advantage+"
          icon={Target}
          action={c.activa ? <Badge tone="ok" dot>Activa</Badge> : <Badge tone="gray" dot>En pausa</Badge>}
        />
        <div className="space-y-4 p-5">
          <Field label="Presupuesto diario (COP)" hint={`≈ ${cop(c.presupuesto * 30)} al mes`}>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-faint">$</span>
              <Input
                inputMode="numeric"
                value={miles(c.presupuesto)}
                onChange={(e) => setC({ ...c, presupuesto: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                className="pl-7"
              />
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
            <div className="space-y-1.5">
              {ANUNCIOS.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-line bg-panel px-3 py-2.5 transition hover:border-line-strong">
                  <input
                    type="checkbox"
                    checked={c.anuncios[a.id]}
                    onChange={(e) => setC({ ...c, anuncios: { ...c.anuncios, [a.id]: e.target.checked } })}
                    className="size-4 accent-[#F97316]"
                  />
                  <span className="font-mono text-xs font-semibold text-brand">{a.id}</span>
                  <span className="truncate text-sm">{a.angulo}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-panel p-3">
            <div>
              <div className="text-sm font-medium">{c.activa ? 'Campaña activa' : 'Campaña en pausa'}</div>
              <div className="text-xs text-muted">{nAnuncios} anuncios · {c.edadMin}–{c.edadMax} años</div>
            </div>
            <Switch
              label="Activar campaña"
              checked={c.activa}
              onChange={(v) => {
                if (v && nAnuncios === 0) return toast('Incluye al menos un anuncio', 'warn')
                setC({ ...c, activa: v })
                toast(v ? 'Campaña activada en Meta' : 'Campaña pausada', v ? 'ok' : 'info')
              }}
            />
          </div>
          <Button
            variant="primary"
            className="w-full"
            loading={guardando}
            icon={c.activa ? Pause : Play}
            onClick={() => {
              setGuardando(true)
              setTimeout(() => {
                setGuardando(false)
                toast('Cambios enviados a Meta Ads')
              }, 900)
            }}
          >
            Guardar y sincronizar
          </Button>
        </div>
      </Card>

      <div className="space-y-4 lg:col-span-3 lg:space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={Wallet} label="Gasto" value={cop(m.gasto)} />
          <Metric icon={Eye} label="CPM" value={cop(m.cpm)} />
          <Metric icon={MousePointerClick} label="CTR" value={pct(m.ctr, 2)} />
          <Metric icon={ShoppingCart} label="Compras" value={m.compras} />
        </div>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Gauge size={16} className="text-muted" /> CPA vs. CPA máximo
              </div>
              <p className="mt-1 text-xs text-muted">Costo por compra en Meta frente al límite calculado en el análisis</p>
            </div>
            <Badge tone={tono}>{tono === 'ok' ? 'Rentable' : tono === 'warn' ? 'Al límite' : 'Pierde plata'}</Badge>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <div className="text-xs text-muted">CPA actual</div>
              <div className={cn('text-3xl font-semibold tracking-tight', tono === 'ok' ? 'text-ok' : tono === 'warn' ? 'text-accent' : 'text-bad')}>{cop(cpa)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">CPA máximo</div>
              <div className="text-lg font-semibold">{cop(cpaMax)}</div>
            </div>
          </div>
          <div className="relative mt-4 h-3 rounded-full bg-white/[0.06]">
            <div
              className={cn('h-full rounded-full transition-all', tono === 'ok' ? 'bg-ok' : tono === 'warn' ? 'bg-accent' : 'bg-bad')}
              style={{ width: `${Math.min(100, (ratio / 1.5) * 100)}%` }}
            />
            {/* Marca del CPA máximo en el 66,7% de la escala (escala hasta 1,5×) */}
            <div className="absolute -top-1.5 -bottom-1.5 w-0.5 rounded bg-fg" style={{ left: `${100 / 1.5}%` }} />
          </div>
          <div className="relative mt-2 flex justify-between text-[11px] text-faint">
            <span>$0</span>
            <span className="absolute -translate-x-1/2 text-fg" style={{ left: `${100 / 1.5}%` }}>Máximo</span>
            <span>{cop(cpaMax * 1.5)}</span>
          </div>
          <div className="mt-5 flex gap-2 rounded-xl border border-line bg-panel p-3 text-xs leading-relaxed text-muted">
            <Info size={14} className="mt-0.5 shrink-0 text-info" />
            {tono === 'ok'
              ? `Vas ${pct(1 - ratio)} por debajo del máximo. Si se mantiene 3 días seguidos, sube el presupuesto un 20%.`
              : 'El CPA está cerca o por encima del máximo. Revisa el gancho del anuncio con peor CTR antes de subir presupuesto.'}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Users size={16} className="text-muted" /> Por anuncio
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-xs text-faint">
                  <th className="py-2 font-medium">Anuncio</th>
                  <th className="py-2 text-right font-medium">Gasto</th>
                  <th className="py-2 text-right font-medium">CTR</th>
                  <th className="py-2 text-right font-medium">Compras</th>
                  <th className="py-2 text-right font-medium">CPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[
                  ['AD1', 98200, 0.0251, 7],
                  ['AD2', 86100, 0.0172, 4],
                ].map(([id, g, ctr, comp]) => (
                  <tr key={id}>
                    <td className="py-2.5 font-mono text-xs font-semibold text-brand">{id}</td>
                    <td className="py-2.5 text-right tabular-nums">{cop(g)}</td>
                    <td className="py-2.5 text-right tabular-nums">{pct(ctr, 2)}</td>
                    <td className="py-2.5 text-right tabular-nums">{comp}</td>
                    <td className={cn('py-2.5 text-right font-medium tabular-nums', g / comp <= cpaMax ? 'text-ok' : 'text-bad')}>{cop(Math.round(g / comp))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">{value}</div>
    </Card>
  )
}

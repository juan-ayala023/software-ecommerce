import { useEffect, useState } from 'react'
import { Tag, Calculator, ThumbsUp, ThumbsDown, Save, Plus, X, Target, ShieldAlert, Gauge, Swords, Clock, ExternalLink, Link2 } from 'lucide-react'
import { Badge, Button, Card, CardHeader, Field, Input, Textarea, cn, useToast } from '../../components/ui'
import { Thumb } from '../../components/brand'
import { useStore } from '../../store'
import { supabase } from '../../lib/supabase'
import { PARAMETROS } from '../../data/mock'
import { cop, miles, pct } from '../../lib/format'
import { hueDe } from '../../lib/lanzamiento'

const DESGLOSE = [
  ['margen', 'Margen'],
  ['logistica', 'Logística'],
  ['efecto_wow', 'Efecto wow'],
  ['saturacion', 'Poca saturación'],
  ['senal_dinero', 'Señal de dinero'],
]

const num = (v) => Number(String(v).replace(/\D/g, '')) || 0

export function margenDe(precios, costo) {
  const principal = precios.find((c) => c.principal) || precios[0]
  if (!principal || costo == null) return null
  const recaudo = Math.round(principal.precio * PARAMETROS.recaudo)
  const margen = principal.precio - costo * principal.qty - PARAMETROS.flete - recaudo
  return { principal, recaudo, margen, cpaMax: Math.round((margen * PARAMETROS.tasaEntrega) / 100) * 100 }
}

export default function AnalisisReal({ l }) {
  const { actualizarLanzamiento } = useStore()
  const toast = useToast()
  const p = l.producto
  const radar = p.radar
  const [precios, setPrecios] = useState(p.precios.length ? p.precios : [{ qty: 1, precio: 0, antes: 0, principal: true }])
  const [costo, setCosto] = useState(p.costo ?? '')
  const [shopify, setShopify] = useState(l.nombreShopify)
  const [notas, setNotas] = useState(l.notas)
  const [guardando, setGuardando] = useState(false)
  const [anuncios, setAnuncios] = useState(null)

  useEffect(() => {
    if (!radar?.slug) return setAnuncios([])
    supabase
      .from('anuncios')
      .select('ad_archive_id,page_name,titulo,imagen_url,link_url,dias_activo')
      .eq('producto_slug', radar.slug)
      .order('dias_activo', { ascending: false })
      .limit(12)
      .then(({ data }) => setAnuncios(data || []))
  }, [radar?.slug])

  const calc = margenDe(precios, costo === '' ? null : Number(costo))
  const setCombo = (i, k, v) => setPrecios((s) => s.map((c, j) => (j === i ? { ...c, [k]: v } : k === 'principal' ? { ...c, principal: false } : c)))

  const guardar = async () => {
    setGuardando(true)
    const r = await actualizarLanzamiento(l.id, {
      precios: precios.map((c) => ({ ...c, antes: c.antes || Math.round((c.precio * 1.55) / 1000) * 1000 - 100 })),
      costo: costo === '' ? null : Number(costo),
      nombreShopify: shopify.trim() || null,
      notas: notas.trim() || null,
    })
    setGuardando(false)
    toast(r.error ? `No se guardó: ${r.error}` : 'Análisis guardado', r.error ? 'warn' : 'ok')
  }

  const decidir = async (veredicto) => {
    const cambios = veredicto === 'TESTEAR' ? { veredicto, etapa: Math.max(l.etapa, 1) } : { veredicto }
    const r = await actualizarLanzamiento(l.id, cambios)
    if (r.error) return toast(`No se guardó: ${r.error}`, 'warn')
    toast(veredicto === 'TESTEAR' ? 'Análisis aprobado · siguiente paso: prompts' : 'Lanzamiento descartado', veredicto === 'TESTEAR' ? 'ok' : 'info')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Precio, combos y costo"
          subtitle="Edita y guarda: estos valores alimentan Campaña y Resultados"
          icon={Tag}
          action={
            <Button variant="primary" size="sm" icon={Save} loading={guardando} onClick={guardar}>
              Guardar
            </Button>
          }
        />
        <div className="space-y-2 p-5">
          {precios.map((c, i) => (
            <div key={i} className={cn('grid grid-cols-[70px_1fr_auto_auto] items-end gap-2 rounded-xl border p-3', c.principal ? 'border-brand/50 bg-brand/[0.06]' : 'border-line bg-panel')}>
              <Field label="Unidades">
                <Input inputMode="numeric" value={c.qty} onChange={(e) => setCombo(i, 'qty', num(e.target.value) || 1)} />
              </Field>
              <Field label="Precio de venta">
                <Input inputMode="numeric" value={c.precio ? miles(c.precio) : ''} onChange={(e) => setCombo(i, 'precio', num(e.target.value))} placeholder="$" />
              </Field>
              <Button size="sm" variant={c.principal ? 'primary' : 'secondary'} onClick={() => setCombo(i, 'principal', true)} className="mb-0.5">
                {c.principal ? 'Principal' : 'Hacer principal'}
              </Button>
              <Button variant="ghost" size="icon" className="mb-0.5 size-8" aria-label="Quitar combo" disabled={precios.length === 1} onClick={() => setPrecios((s) => s.filter((_, j) => j !== i))}>
                <X size={15} />
              </Button>
            </div>
          ))}
          <Button size="sm" icon={Plus} onClick={() => setPrecios((s) => [...s, { qty: s.length + 1, precio: 0, antes: 0 }])}>
            Agregar combo
          </Button>
        </div>
        <div className="grid gap-4 border-t border-line p-5 md:grid-cols-2">
          <div className="space-y-3">
            <Field label="Costo unitario del proveedor (COP)" hint={radar?.costo_dropi != null ? 'Viene de Dropi' : radar ? `Estimado por IA: ${cop(radar.costo_est ?? 0)}` : undefined}>
              <Input inputMode="numeric" value={costo === '' ? '' : miles(costo)} onChange={(e) => setCosto(e.target.value === '' ? '' : num(e.target.value))} placeholder="$" />
            </Field>
            <Field label="Nombre en Shopify" hint="Texto con el que aparece en los pedidos; sirve para cruzar ventas en Resultados">
              <div className="relative">
                <Link2 size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
                <Input value={shopify} onChange={(e) => setShopify(e.target.value)} placeholder="Ej. Pelador Eléctrico" className="pl-8" />
              </div>
            </Field>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-line bg-panel p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted">
              <Calculator size={14} /> Margen por entrega {calc ? `(combo ${calc.principal.qty}x)` : ''}
            </div>
            {calc ? (
              <>
                <dl className="mt-3 space-y-1 text-sm">
                  <Fila k="Venta" v={cop(calc.principal.precio)} />
                  <Fila k={`Costo (${calc.principal.qty} × ${cop(Number(costo))})`} v={`−${cop(Number(costo) * calc.principal.qty)}`} />
                  <Fila k="Flete" v={`−${cop(PARAMETROS.flete)}`} />
                  <Fila k={`Recaudo ${pct(PARAMETROS.recaudo)}`} v={`−${cop(calc.recaudo)}`} />
                </dl>
                <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
                  <div>
                    <div className="text-xs text-muted">Margen</div>
                    <div className={cn('text-xl font-semibold', calc.margen > 0 ? 'text-ok' : 'text-bad')}>{cop(calc.margen)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted">CPA máximo</div>
                    <div className="text-xl font-semibold text-accent">{cop(Math.max(0, calc.cpaMax))}</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">Agrega el costo del proveedor para calcular margen y CPA máximo.</p>
            )}
          </div>
        </div>
        <div className="border-t border-line p-5">
          <Field label="Notas del análisis">
            <Textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Proveedor, tiempos de entrega, dudas, decisiones…" />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Señales del Radar" subtitle={radar ? 'Análisis de IA sobre la biblioteca de Meta' : 'Este lanzamiento no viene del Radar'} icon={Gauge} />
        {radar ? (
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              <span className={cn('text-4xl font-bold', radar.score >= 60 ? 'text-ok' : radar.score >= 45 ? 'text-accent' : 'text-bad')}>{radar.score}</span>
              <div className="text-xs text-muted">
                score / 100
                <div className="mt-1">
                  <Badge tone={radar.veredicto_ia === 'descartar' ? 'bad' : radar.veredicto_ia === 'testear' ? 'ok' : 'warn'}>IA: {radar.veredicto_ia?.toUpperCase()}</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {DESGLOSE.map(([k, label]) =>
                radar.desglose?.[k] == null ? null : (
                  <div key={k}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">{label}</span>
                      <span className="tabular-nums">{radar.desglose[k]}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={cn('h-full rounded-full', radar.desglose[k] >= 70 ? 'bg-ok' : radar.desglose[k] >= 45 ? 'bg-accent' : 'bg-bad')} style={{ width: `${radar.desglose[k]}%` }} />
                    </div>
                  </div>
                )
              )}
            </div>
            {radar.angulo && <Nota icon={Target} titulo="Ángulo" texto={radar.angulo} />}
            {radar.riesgos && <Nota icon={ShieldAlert} titulo="Riesgos" texto={radar.riesgos} tono="text-accent" />}
          </div>
        ) : (
          <p className="p-5 text-sm text-muted">Se creó a mano. Usa las notas para registrar el análisis.</p>
        )}
      </Card>

      {radar && (
        <Card className="overflow-hidden lg:col-span-3">
          <CardHeader title="Competencia" subtitle={`${radar.num_anunciantes ?? 0} anunciantes · anuncio más antiguo con ${miles(radar.max_dias_activo ?? 0)} días`} icon={Swords} />
          <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto p-5">
            {anuncios === null
              ? [0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/5] w-48 shrink-0 animate-pulse rounded-xl bg-white/[0.05]" />)
              : anuncios.length === 0
                ? <p className="text-sm text-muted">No hay anuncios guardados para este producto.</p>
                : anuncios.map((a) => (
                    <a key={a.ad_archive_id} href={a.link_url || `https://www.facebook.com/ads/library/?id=${a.ad_archive_id}`} target="_blank" rel="noreferrer" className="w-48 shrink-0 snap-start overflow-hidden rounded-xl border border-line bg-panel">
                      <Imagen src={a.imagen_url} seed={a.ad_archive_id} />
                      <div className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{a.page_name}</span>
                          <ExternalLink size={12} className="shrink-0 text-faint" />
                        </div>
                        <div className={cn('mt-0.5 flex items-center gap-1 text-xs', a.dias_activo >= 30 ? 'text-accent' : 'text-muted')}>
                          <Clock size={11} /> {a.dias_activo ?? 0} días activo
                        </div>
                        {a.titulo && <p className="mt-1 line-clamp-2 text-xs text-muted">{a.titulo}</p>}
                      </div>
                    </a>
                  ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:col-span-3">
        <Button variant="danger" icon={ThumbsDown} onClick={() => decidir('DESCARTAR')} disabled={l.veredicto === 'DESCARTAR'}>
          Descartar
        </Button>
        <Button onClick={() => decidir('VIGILAR')} disabled={l.veredicto === 'VIGILAR'}>
          Vigilar
        </Button>
        <Button variant="primary" icon={ThumbsUp} onClick={() => decidir('TESTEAR')}>
          Aprobar para testear
        </Button>
      </div>
    </div>
  )
}

function Imagen({ src, seed }) {
  const [rota, setRota] = useState(false)
  if (!src || rota) return <Thumb hue={hueDe(seed)} className="aspect-[4/5] w-full" rounded="rounded-none" />
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setRota(true)} className="aspect-[4/5] w-full object-cover" />
}

function Fila({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  )
}

function Nota({ icon: Icon, titulo, texto, tono }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
        <Icon size={13} className={tono || 'text-muted'} /> {titulo}
      </div>
      <p className="text-sm leading-relaxed text-[#D1D5DB]">{texto}</p>
    </div>
  )
}

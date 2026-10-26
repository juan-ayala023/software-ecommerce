import { useState } from 'react'
import { Copy, ChevronDown, Save, ShieldCheck, Check, X, Truck, UploadCloud, Smartphone, Loader2 } from 'lucide-react'
import { Badge, Button, Card, Field, Input, Textarea, cn, useToast } from '../../components/ui'
import { Thumb } from '../../components/brand'
import { useStore } from '../../store'
import { landingBase } from '../../lib/lanzamiento'
import { cop } from '../../lib/format'
import { subirCreativo } from '../../lib/creativos'

const lineas = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean)
const pares = (s) => lineas(s).map((x) => x.split('|').map((y) => y.trim()))

const SECCIONES = [
  { id: 'galeria', titulo: 'Galería y título', campos: [['titulo', 'Título', 'input'], ['subtitulo', 'Subtítulo', 'textarea']], imagen: true },
  { id: 'precio', titulo: 'Precio y botón', campos: [['cta', 'Texto del botón', 'input']] },
  { id: 'beneficios', titulo: 'Beneficios', campos: [['beneficios', 'Un beneficio por línea', 'textarea']], imagen: true },
  { id: 'paraQuien', titulo: '¿Para quién es?', campos: [['paraQuien', 'Un público por línea', 'textarea']] },
  { id: 'comparativa', titulo: 'Tabla comparativa', campos: [['comparativa', 'Fila | Nosotros | Otros', 'textarea']] },
  { id: 'pasos', titulo: 'Pasos para pedir', campos: [['pasos', 'Un paso por línea', 'textarea']] },
  { id: 'garantia', titulo: 'Garantía', campos: [['garantia', 'Texto', 'textarea']] },
  { id: 'faq', titulo: 'Preguntas frecuentes', campos: [['faq', 'Pregunta | Respuesta', 'textarea']] },
]

// HTML simple para pegar en la descripción del producto en Shopify
function htmlShopify(d) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const ul = (s) => `<ul>\n${lineas(s).map((x) => `  <li>${esc(x)}</li>`).join('\n')}\n</ul>`
  return [
    `<p><strong>${esc(d.subtitulo)}</strong></p>`,
    `<h3>Beneficios</h3>`,
    ul(d.beneficios),
    `<h3>¿Para quién es?</h3>`,
    ul(d.paraQuien),
    `<h3>Comparativa</h3>`,
    `<table>\n  <tr><th></th><th>Nosotros</th><th>Otros</th></tr>\n${pares(d.comparativa).map(([f, a, b]) => `  <tr><td>${esc(f)}</td><td>${esc(a || '')}</td><td>${esc(b || '')}</td></tr>`).join('\n')}\n</table>`,
    `<h3>¿Cómo pedir?</h3>`,
    `<ol>\n${lineas(d.pasos).map((x) => `  <li>${esc(x)}</li>`).join('\n')}\n</ol>`,
    `<h3>Garantía</h3>`,
    `<p>${esc(d.garantia)}</p>`,
    `<h3>Preguntas frecuentes</h3>`,
    pares(d.faq).map(([q, a]) => `<p><strong>${esc(q)}</strong><br>${esc(a || '')}</p>`).join('\n'),
  ].join('\n')
}

export default function Landing({ l }) {
  const toast = useToast()
  const { actualizarLanzamiento } = useStore()
  const p = l.producto
  const [d, setD] = useState(() => ({ ...landingBase(p), ...(l.landing || {}) }))
  const [abierta, setAbierta] = useState('galeria')
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(null)
  // Imágenes por bloque: se suben a Storage y la URL queda guardada en el borrador
  const imgs = d.imagenes || {}
  const set = (k) => (e) => setD((s) => ({ ...s, [k]: e.target.value }))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] xl:gap-8">
      {/* Vista previa en celular */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted">
          <Smartphone size={14} /> Vista previa móvil
        </div>
        <div className="mx-auto w-full max-w-[340px] rounded-[44px] border border-line-strong bg-[#05070B] p-3 shadow-2xl">
          <div className="relative overflow-hidden rounded-[34px] bg-white">
            <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
            <div className="h-[600px] overflow-y-auto pt-8 text-[#111827]">
              <Preview d={d} p={p} imgs={imgs} />
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Editar secciones</h2>
            {l.landing ? <Badge tone="ok" dot>Guardada</Badge> : <Badge tone="warn" dot>Sin guardar</Badge>}
          </div>
          <div className="flex gap-2">
            <Button
              icon={Save}
              loading={guardando}
              onClick={async () => {
                setGuardando(true)
                const r = await actualizarLanzamiento(l.id, { landing: d })
                setGuardando(false)
                toast(r.error ? `No se guardó: ${r.error}` : 'Borrador guardado', r.error ? 'warn' : 'ok')
              }}
            >
              Guardar borrador
            </Button>
            <Button
              variant="primary"
              icon={Copy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(htmlShopify(d))
                  toast('HTML copiado: pégalo en la descripción del producto en Shopify')
                } catch {
                  toast('El navegador no dejó copiar al portapapeles', 'warn')
                }
              }}
            >
              Copiar HTML para Shopify
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {SECCIONES.map((s, i) => {
            const open = abierta === s.id
            return (
              <Card key={s.id} className="overflow-hidden">
                <button onClick={() => setAbierta(open ? null : s.id)} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left">
                  <span className="grid size-6 place-items-center rounded-md bg-white/[0.06] text-[11px] font-semibold text-muted">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{s.titulo}</span>
                  <ChevronDown size={16} className={cn('text-faint transition', open && 'rotate-180')} />
                </button>
                {open && (
                  <div className="space-y-3 border-t border-line px-4 py-4">
                    {s.campos.map(([k, label, tipo]) =>
                      tipo === 'input' ? (
                        <Field key={k} label={label}>
                          <Input value={d[k]} onChange={set(k)} />
                        </Field>
                      ) : (
                        <Field key={k} label={label}>
                          <Textarea rows={k === 'subtitulo' || k === 'garantia' ? 3 : 5} value={d[k]} onChange={set(k)} />
                        </Field>
                      )
                    )}
                    {s.imagen && (
                      <Field label="Imagen del bloque">
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-strong p-3 transition hover:border-brand/50">
                          {imgs[s.id] || p.imagen ? (
                            <img src={imgs[s.id] || p.imagen} alt="" referrerPolicy="no-referrer" className="size-12 rounded-lg object-cover" />
                          ) : (
                            <Thumb hue={p.hue} className="size-12" rounded="rounded-lg" />
                          )}
                          <span className="flex-1 text-xs text-muted">{imgs[s.id] ? 'Cambiar imagen' : 'Usando la imagen del producto · clic para subir otra'}</span>
                          {subiendo === s.id ? <Loader2 size={16} className="animate-spin text-brand" /> : <UploadCloud size={16} className="text-faint" />}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={async (e) => {
                              const file = e.target.files[0]
                              if (!file) return
                              setSubiendo(s.id)
                              const r = await subirCreativo(l.id, `landing-${s.id}`, file)
                              setSubiendo(null)
                              if (r.error) return toast(`No se subió: ${r.error}`, 'warn')
                              setD((x) => ({ ...x, imagenes: { ...(x.imagenes || {}), [s.id]: r.url } }))
                              toast('Imagen subida · recuerda guardar el borrador')
                            }}
                          />
                        </label>
                      </Field>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Preview({ d, p, imgs }) {
  const principal = p.precios.find((c) => c.principal)
  const [combo, setCombo] = useState(principal.qty)
  const sel = p.precios.find((c) => c.qty === combo)
  const ImgOr = ({ id, className }) => {
    const src = imgs[id] || p.imagen
    return src ? (
      <img src={src} alt="" referrerPolicy="no-referrer" className={cn('rounded-xl object-cover', className)} />
    ) : (
      <Thumb hue={p.hue} emoji={p.emoji} className={className} rounded="rounded-xl" />
    )
  }

  return (
    <div className="text-[13px]">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-2.5">
        <span className="text-sm font-bold">ingenio<span className="text-brand">.</span></span>
        <span className="text-[10px] text-gray-500">🚚 Envío gratis a toda Colombia</span>
      </div>

      <div className="p-4">
        <ImgOr id="galeria" className="aspect-square w-full" />
        {/* Miniaturas: solo las imágenes que de verdad tiene la landing */}
        {Object.values(imgs).length > 1 && (
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {Object.values(imgs).map((src, i) => (
              <img key={src} src={src} alt="" className={cn('aspect-square w-full rounded-lg object-cover', i === 0 && 'ring-2 ring-brand')} />
            ))}
          </div>
        )}

        <h1 className="mt-1 text-[17px] leading-snug font-bold">{d.titulo}</h1>
        <p className="mt-1 leading-snug text-gray-600">{d.subtitulo}</p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-brand-600">{cop(sel.precio)}</span>
          <span className="text-gray-400 line-through">{cop(sel.antes)}</span>
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">-{Math.round((1 - sel.precio / sel.antes) * 100)}%</span>
        </div>

        <div className="mt-3 space-y-1.5">
          {p.precios.map((c) => (
            <button key={c.qty} onClick={() => setCombo(c.qty)} className={cn('flex w-full cursor-pointer items-center justify-between rounded-lg border-2 px-3 py-2 text-left', combo === c.qty ? 'border-brand bg-orange-50' : 'border-gray-200')}>
              <span className="font-semibold">
                Lleva {c.qty} {c.principal && <span className="ml-1 rounded bg-brand px-1.5 py-0.5 text-[9px] text-white">MÁS VENDIDO</span>}
              </span>
              <span className="font-bold">{cop(c.precio)}</span>
            </button>
          ))}
        </div>

        <button className="mt-3 w-full animate-pulse cursor-pointer rounded-xl bg-brand py-3.5 text-[13px] font-extrabold text-white shadow-lg shadow-orange-500/30">{d.cta}</button>
        <div className="mt-2 flex justify-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><Truck size={11} /> 2 a 5 días</span>
          <span className="flex items-center gap-1"><ShieldCheck size={11} /> Compra segura</span>
        </div>
      </div>

      <Bloque titulo="Beneficios">
        <ImgOr id="beneficios" className="mb-3 aspect-video w-full" />
        <ul className="space-y-2">
          {lineas(d.beneficios).map((b) => (
            <li key={b} className="flex gap-2"><Check size={16} className="shrink-0 text-green-600" />{b}</li>
          ))}
        </ul>
      </Bloque>

      <Bloque titulo="¿Para quién es?" gris>
        <div className="space-y-2">
          {lineas(d.paraQuien).map((x) => (
            <div key={x} className="rounded-lg bg-white px-3 py-2 shadow-sm">👉 {x}</div>
          ))}
        </div>
      </Bloque>

      <Bloque titulo={`${p.corto} vs. otros`}>
        <table className="w-full overflow-hidden rounded-lg text-[12px]">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="p-2 text-left font-medium"></th>
              <th className="bg-brand p-2 font-semibold">Nosotros</th>
              <th className="p-2 font-medium">Otros</th>
            </tr>
          </thead>
          <tbody>
            {pares(d.comparativa).map(([f, a, b]) => (
              <tr key={f} className="border-b border-gray-100">
                <td className="p-2">{f}</td>
                <td className="bg-orange-50 p-2 text-center font-semibold">{a === 'Sí' ? <Check size={14} className="mx-auto text-green-600" /> : a}</td>
                <td className="p-2 text-center text-gray-500">{b === 'No' ? <X size={14} className="mx-auto text-red-500" /> : b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Bloque>

      <Bloque titulo="¿Cómo pedir?" gris>
        <ol className="space-y-2">
          {lineas(d.pasos).map((x, i) => (
            <li key={x} className="flex items-center gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{i + 1}</span>
              {x}
            </li>
          ))}
        </ol>
      </Bloque>

      <Bloque titulo="">
        <div className="flex gap-3 rounded-xl border-2 border-dashed border-green-500 bg-green-50 p-3">
          <ShieldCheck size={28} className="shrink-0 text-green-600" />
          <div>
            <div className="font-bold">Garantía de satisfacción</div>
            <p className="mt-0.5 leading-snug text-gray-600">{d.garantia}</p>
          </div>
        </div>
      </Bloque>

      <Bloque titulo="Preguntas frecuentes">
        <div className="divide-y divide-gray-100">
          {pares(d.faq).map(([q, a]) => (
            <details key={q} className="py-2">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-1 text-gray-600">{a}</p>
            </details>
          ))}
        </div>
      </Bloque>

      <div className="sticky bottom-0 border-t border-gray-100 bg-white/95 p-3 backdrop-blur">
        <button className="w-full cursor-pointer rounded-xl bg-brand py-3 text-[12px] font-extrabold text-white">{d.cta}</button>
      </div>
    </div>
  )
}

function Bloque({ titulo, gris, children }) {
  return (
    <section className={cn('px-4 py-5', gris && 'bg-gray-50')}>
      {titulo && <h2 className="mb-3 text-center text-[15px] font-bold">{titulo}</h2>}
      {children}
    </section>
  )
}

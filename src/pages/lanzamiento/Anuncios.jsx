import { useEffect, useState } from 'react'
import { Download, PencilLine, Check, Volume2, FileText } from 'lucide-react'
import { Button, Card, Field, Input, Textarea, cn, useToast } from '../../components/ui'
import { useStore } from '../../store'
import { anunciosBase } from '../../lib/lanzamiento'
import { cop } from '../../lib/format'

const textoPlano = (a) => `${a.id} · ${a.angulo}\n\nGANCHO:\n${a.gancho}\n\nTEXTO PRINCIPAL:\n${a.texto}\n\nTÍTULO:\n${a.titulo}\n`

function descargar(nombre, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

export default function Anuncios({ l }) {
  const toast = useToast()
  const { actualizarLanzamiento } = useStore()
  const p = l.producto
  const principal = p.precios.find((c) => c.principal) || p.precios[0]
  const anuncios = anunciosBase(p).map((a) => ({ ...a, ...(l.anuncios?.[a.id] || {}) }))

  const guardar = (id, valores) =>
    actualizarLanzamiento(l.id, { anuncios: { ...(l.anuncios || {}), [id]: valores } })

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">3 ángulos · gancho, subtítulos y cierre con precio · los textos se guardan en el lanzamiento</p>
        <Button
            variant="primary"
            icon={FileText}
            onClick={() => {
              descargar(`${l.id}-copys.txt`, anuncios.map(textoPlano).join('\n────────────\n\n'))
              toast('Copys descargados')
            }}
          >
            Descargar todos los copys
          </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        {anuncios.map((a, i) => (
          <AnuncioCard key={a.id} a={a} hue={p.hue + i * 40} emoji={p.emoji} imagen={p.imagen} precio={principal} lid={l.id} onGuardar={(v) => guardar(a.id, v)} />
        ))}
      </div>
    </>
  )
}

function AnuncioCard({ a, hue, emoji, imagen, precio, lid, onGuardar }) {
  const toast = useToast()
  const [editando, setEditando] = useState(false)
  const [gancho, setGancho] = useState(a.gancho)
  const [texto, setTexto] = useState(a.texto)
  const [titulo, setTitulo] = useState(a.titulo)
  const [guardando, setGuardando] = useState(false)
  const [sub, setSub] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSub((s) => (s + 1) % (a.subtitulos.length + 1)), 1800)
    return () => clearInterval(t)
  }, [a.subtitulos.length])
  const cierre = sub === a.subtitulos.length

  const alternarEdicion = async () => {
    if (!editando) return setEditando(true)
    setGuardando(true)
    const r = await onGuardar({ gancho, texto, titulo })
    setGuardando(false)
    if (r?.error) return toast(`No se guardó: ${r.error}`, 'warn')
    setEditando(false)
    toast(`Textos de ${a.id} guardados`)
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="bg-panel p-4 sm:p-5">
        {/* Vista previa 9:16 */}
        <div
          className="relative mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-2xl ring-1 ring-white/10"
          style={{ background: `radial-gradient(100% 70% at 50% 40%, hsl(${hue} 60% 30%), #05070B 85%)` }}
        >
          <div className="absolute inset-x-3 top-4 z-[1]">
            <div className="rounded-lg bg-brand px-3 py-2 text-center text-[13px] leading-tight font-bold text-white shadow-lg">{gancho}</div>
          </div>
          <div className="absolute inset-0 grid place-items-center">
            {imagen ? (
              <img
                src={imagen}
                alt=""
                referrerPolicy="no-referrer"
                className="w-[78%] rounded-xl object-cover shadow-2xl transition-transform duration-700"
                style={{ transform: `scale(${1 + sub * 0.04})` }}
              />
            ) : (
              <span className="text-7xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-transform duration-700" style={{ transform: `scale(${1 + sub * 0.06})` }}>
                {emoji}
              </span>
            )}
          </div>
          <div className="absolute inset-x-4 bottom-16 text-center">
            {!cierre && (
              <span key={sub} className="inline animate-fade-in rounded bg-black/70 box-decoration-clone px-2 py-0.5 text-sm leading-relaxed font-semibold text-white">
                {a.subtitulos[sub]}
              </span>
            )}
          </div>
          {precio && (
            <div
              className={cn(
                'absolute inset-x-3 bottom-3 rounded-xl bg-white p-2.5 text-center text-bg transition-all duration-500',
                cierre ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              )}
            >
              <div className="text-[11px] font-medium">{precio.qty}x por solo</div>
              <div className="text-xl leading-none font-extrabold text-brand-600">{cop(precio.precio)}</div>
              <div className="mt-1 rounded-md bg-bg py-1 text-[11px] font-bold tracking-wide text-accent">PAGAS AL RECIBIR</div>
            </div>
          )}
          <div className="absolute top-16 right-2 flex flex-col items-center gap-1 text-white/60">
            <Volume2 size={14} />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
            <div className="h-full bg-white/70 transition-all duration-[1800ms] ease-linear" style={{ width: `${((sub + 1) / (a.subtitulos.length + 1)) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-brand/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-brand">{a.id}</span>
          <h3 className="text-sm font-semibold">{a.angulo}</h3>
        </div>

        <div className="mt-4 space-y-3">
          {editando && (
            <Field label="Gancho (texto naranja del video)">
              <Input value={gancho} onChange={(e) => setGancho(e.target.value)} />
            </Field>
          )}
          <Field label="Texto principal">
            {editando ? (
              <Textarea rows={7} value={texto} onChange={(e) => setTexto(e.target.value)} />
            ) : (
              <p className="max-h-32 overflow-y-auto rounded-[10px] border border-line bg-panel px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line text-[#D1D5DB]">{texto}</p>
            )}
          </Field>
          <Field label="Título">
            {editando ? <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /> : <p className="rounded-[10px] border border-line bg-panel px-3 py-2 text-[13px] font-medium">{titulo}</p>}
          </Field>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <Button
            size="sm"
            icon={Download}
            onClick={() => {
              descargar(`${lid}-${a.id}.txt`, textoPlano({ ...a, gancho, texto, titulo }))
              toast(`Copy de ${a.id} descargado`)
            }}
          >
            Descargar copy
          </Button>
          <Button size="sm" variant={editando ? 'primary' : 'secondary'} icon={editando ? Check : PencilLine} loading={guardando} onClick={alternarEdicion}>
            {editando ? 'Guardar' : 'Editar textos'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

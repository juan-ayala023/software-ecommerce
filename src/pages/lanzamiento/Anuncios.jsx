import { useEffect, useState } from 'react'
import { Download, PencilLine, Clapperboard, Send, Check, Volume2 } from 'lucide-react'
import { Button, Card, Field, Input, Textarea, cn, useToast } from '../../components/ui'
import { ANUNCIOS } from '../../data/mock'
import { cop } from '../../lib/format'

export default function Anuncios({ l }) {
  const toast = useToast()
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const principal = l.producto.precios.find((c) => c.principal)

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">3 anuncios editados · gancho, subtítulos y cierre con precio</p>
        <Button
          variant={enviado ? 'success' : 'primary'}
          icon={enviado ? Check : Send}
          loading={enviando}
          onClick={() => {
            setEnviando(true)
            setTimeout(() => {
              setEnviando(false)
              setEnviado(true)
              toast('3 videos y copys enviados a Drive · /Ingenio Store/' + l.id)
            }, 1400)
          }}
        >
          {enviado ? 'Enviado a Drive' : 'Enviar todo a Drive'}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        {ANUNCIOS.map((a, i) => (
          <AnuncioCard key={a.id} a={a} hue={l.producto.hue + i * 40} emoji={l.producto.emoji} precio={principal} />
        ))}
      </div>
    </>
  )
}

function AnuncioCard({ a, hue, emoji, precio }) {
  const toast = useToast()
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(a.texto)
  const [titulo, setTitulo] = useState(a.titulo)
  const [reeditando, setReeditando] = useState(false)
  const [sub, setSub] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSub((s) => (s + 1) % (a.subtitulos.length + 1)), 1800)
    return () => clearInterval(t)
  }, [a.subtitulos.length])
  const cierre = sub === a.subtitulos.length

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="bg-panel p-4 sm:p-5">
        {/* Vista previa 9:16 */}
        <div
          className="relative mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-2xl ring-1 ring-white/10"
          style={{ background: `radial-gradient(100% 70% at 50% 40%, hsl(${hue} 60% 30%), #05070B 85%)` }}
        >
          {reeditando && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-black/70 text-xs text-muted backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Clapperboard size={20} className="animate-pulse text-brand" /> Reeditando en n8n…
              </div>
            </div>
          )}
          <div className="absolute inset-x-3 top-4">
            <div className="rounded-lg bg-brand px-3 py-2 text-center text-[13px] leading-tight font-bold text-white shadow-lg">{a.gancho}</div>
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-7xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-transform duration-700" style={{ transform: `scale(${1 + sub * 0.06})` }}>
              {emoji}
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-16 text-center">
            {!cierre && (
              <span key={sub} className="inline animate-fade-in rounded bg-black/70 box-decoration-clone px-2 py-0.5 text-sm leading-relaxed font-semibold text-white">
                {a.subtitulos[sub]}
              </span>
            )}
          </div>
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

        <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
          <Button size="sm" icon={Download} onClick={() => toast(`${a.id}.mp4 descargado`)}>
            Descargar
          </Button>
          <Button
            size="sm"
            variant={editando ? 'primary' : 'secondary'}
            icon={editando ? Check : PencilLine}
            onClick={() => {
              if (editando) toast(`Textos de ${a.id} guardados`)
              setEditando(!editando)
            }}
          >
            {editando ? 'Guardar' : 'Editar textos'}
          </Button>
          <Button
            size="sm"
            icon={Clapperboard}
            loading={reeditando}
            onClick={() => {
              setReeditando(true)
              setTimeout(() => {
                setReeditando(false)
                toast(`${a.id} reeditado`)
              }, 2000)
            }}
          >
            Reeditar
          </Button>
        </div>
      </div>
    </Card>
  )
}

import { Check, CircleDashed, Eye, FlaskConical, XCircle } from 'lucide-react'
import { ETAPAS } from '../data/constantes'
import { Badge, cn } from './ui'

export function VeredictoBadge({ v, className }) {
  if (v === 'TESTEAR') return <Badge tone="ok" icon={FlaskConical} className={className}>TESTEAR</Badge>
  if (v === 'VIGILAR') return <Badge tone="warn" icon={Eye} className={className}>VIGILAR</Badge>
  if (v === 'DESCARTAR') return <Badge tone="bad" icon={XCircle} className={className}>DESCARTAR</Badge>
  return <Badge tone="gray" icon={CircleDashed} className={className}>En análisis</Badge>
}

// Barra corta: un segmento por etapa
export function MiniEtapas({ etapa, descartado }) {
  return (
    <div className="flex gap-1" aria-label={`Etapa ${etapa + 1} de ${ETAPAS.length}: ${ETAPAS[etapa]}`}>
      {ETAPAS.map((e, i) => (
        <span
          key={e}
          title={e}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            descartado ? (i <= etapa ? 'bg-bad/40' : 'bg-white/[0.06]') : i < etapa ? 'bg-brand' : i === etapa ? 'bg-brand/40 ring-1 ring-brand/60' : 'bg-white/[0.06]'
          )}
        />
      ))}
    </div>
  )
}

// Stepper horizontal del detalle
export function Stepper({ etapa, onSelect }) {
  return (
    <ol className="no-scrollbar flex items-center overflow-x-auto pb-1">
      {ETAPAS.map((e, i) => {
        const hecho = i < etapa
        const actual = i === etapa
        return (
          <li key={e} className="flex shrink-0 items-center">
            <button onClick={() => onSelect?.(i)} className="group flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1">
              <span
                className={cn(
                  'grid size-7 place-items-center rounded-full text-xs font-semibold transition',
                  hecho && 'bg-brand text-white shadow-glow',
                  actual && 'bg-brand/15 text-brand ring-2 ring-brand',
                  !hecho && !actual && 'bg-white/[0.05] text-faint ring-1 ring-line'
                )}
              >
                {hecho ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn('text-sm whitespace-nowrap', hecho ? 'text-fg' : actual ? 'font-medium text-brand' : 'text-faint group-hover:text-muted')}>{e}</span>
            </button>
            {i < ETAPAS.length - 1 && <span className={cn('mx-2 h-px w-6 sm:w-10', i < etapa ? 'bg-brand' : 'bg-line')} />}
          </li>
        )
      })}
    </ol>
  )
}

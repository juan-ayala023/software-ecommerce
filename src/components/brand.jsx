import { useId, useState } from 'react'
import { Play, ImageIcon } from 'lucide-react'
import { cn } from './ui'

export function LogoMark({ size = 32 }) {
  // id único: hay varias instancias del logo y algunas viven en contenedores ocultos
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FB923C" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <path d="M10.5 11V9a5.5 5.5 0 0 1 11 0v2" fill="none" stroke="#F97316" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="5" y="11" width="22" height="18" rx="5" fill={`url(#${id})`} />
      <circle cx="16" cy="16" r="1.7" fill="#fff" />
      <rect x="14.6" y="19" width="2.8" height="7" rx="1.4" fill="#fff" />
    </svg>
  )
}

export function Logo({ compact }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <div className="leading-none">
          <div className="text-[17px] font-semibold tracking-tight">ingenio</div>
          <div className="mt-0.5 text-[10px] font-medium tracking-[0.18em] text-faint uppercase">OS</div>
        </div>
      )}
    </div>
  )
}

// Miniatura generada con el color del producto mientras no haya foto real
export function Thumb({ hue = 24, emoji, className, video, children, rounded = 'rounded-xl' }) {
  return (
    <div
      className={cn('relative grid shrink-0 place-items-center overflow-hidden', rounded, className)}
      style={{
        containerType: 'size',
        background: `radial-gradient(120% 90% at 30% 20%, hsl(${hue} 70% 32%) 0%, hsl(${hue + 25} 55% 14%) 55%, #0B0F17 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '14px 14px' }}
      />
      {emoji ? (
        <span className="relative drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]" style={{ fontSize: '46cqmin' }}>
          {emoji}
        </span>
      ) : video ? (
        <Play className="relative text-white/70" size={22} />
      ) : (
        <ImageIcon className="relative text-white/40" size={20} />
      )}
      {children}
    </div>
  )
}

export function ProductThumb({ p, className }) {
  const [rota, setRota] = useState(false)
  if (p.imagen && !rota) {
    return (
      <img
        src={p.imagen}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setRota(true)}
        className={cn('shrink-0 rounded-xl bg-panel object-cover', className)}
      />
    )
  }
  return <Thumb hue={p.hue} emoji={p.emoji} className={className} />
}

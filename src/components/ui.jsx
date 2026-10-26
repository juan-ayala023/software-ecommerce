import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle2, Info, Loader2, X, AlertTriangle } from 'lucide-react'

export const cn = (...c) => c.filter(Boolean).join(' ')

/* ---------- Superficies ---------- */
export function Card({ className, children, ...p }) {
  return (
    <div className={cn('rounded-card border border-line bg-card shadow-soft', className)} {...p}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-panel text-muted">
            <Icon size={16} strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

/* ---------- Botones ---------- */
const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-600 shadow-glow',
  secondary: 'bg-white/[0.04] text-fg border border-line hover:bg-white/[0.08] hover:border-line-strong',
  ghost: 'text-muted hover:text-fg hover:bg-white/[0.06]',
  danger: 'bg-bad/10 text-bad border border-bad/25 hover:bg-bad/20',
  success: 'bg-ok/10 text-ok border border-ok/25 hover:bg-ok/20',
}
const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'size-9 justify-center',
}

export function Button({ variant = 'secondary', size = 'md', icon: Icon, loading, className, children, ...p }) {
  const s = size === 'xs' || size === 'sm' ? 14 : 16
  return (
    <button
      {...p}
      disabled={loading || p.disabled}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[10px] font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {loading ? <Loader2 size={s} className="animate-spin" /> : Icon && <Icon size={s} strokeWidth={2} />}
      {children}
    </button>
  )
}

/* ---------- Badges ---------- */
const TONES = {
  gray: 'bg-white/[0.06] text-muted ring-white/10',
  brand: 'bg-brand/10 text-brand ring-brand/30',
  ok: 'bg-ok/10 text-ok ring-ok/25',
  warn: 'bg-accent/10 text-accent ring-accent/25',
  bad: 'bg-bad/10 text-bad ring-bad/25',
  info: 'bg-info/10 text-info ring-info/25',
  violet: 'bg-violet-400/10 text-violet-300 ring-violet-400/25',
}
export function Badge({ tone = 'gray', icon: Icon, dot, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset', TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {Icon && <Icon size={12} strokeWidth={2.25} />}
      {children}
    </span>
  )
}

/* ---------- Semáforo ---------- */
const LIGHT = { green: 'bg-ok', yellow: 'bg-accent', red: 'bg-bad' }
export function Semaforo({ level, size = 'sm' }) {
  const s = size === 'sm' ? 'size-2' : 'size-3'
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-panel px-1.5 py-1" aria-label={`Semáforo ${level}`}>
      {['green', 'yellow', 'red'].map((l) => (
        <span key={l} className={cn(s, 'rounded-full', l === level ? LIGHT[l] : 'bg-white/10')} />
      ))}
    </span>
  )
}

/* ---------- Progreso ---------- */
export function Progress({ value, tone = 'brand', className }) {
  const bg = { brand: 'bg-brand', ok: 'bg-ok', warn: 'bg-accent', bad: 'bg-bad' }[tone]
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', bg)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

/* ---------- Skeleton y vacíos ---------- */
export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-white/[0.06]', className)} />
}

export function EmptyState({ icon: Icon, title, text, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-2xl bg-brand/20 blur-xl" />
        <div className="relative grid size-14 place-items-center rounded-2xl border border-line bg-panel text-brand">
          <Icon size={24} strokeWidth={1.6} />
        </div>
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Tabs ---------- */
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative flex shrink-0 cursor-pointer items-center gap-2 px-3 py-2.5 text-sm transition-colors',
            value === t.id ? 'text-fg' : 'text-muted hover:text-fg'
          )}
        >
          {t.icon && <t.icon size={15} strokeWidth={1.9} />}
          {t.label}
          {t.count != null && <span className="rounded-md bg-white/[0.06] px-1.5 text-[11px] text-muted">{t.count}</span>}
          {value === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
        </button>
      ))}
    </div>
  )
}

/* ---------- Segmentado ---------- */
export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cn('inline-flex rounded-xl border border-line bg-panel p-1', className)}>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-label={o.label || o.aria}
          aria-pressed={value === o.id}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
            value === o.id ? 'bg-card text-fg shadow-soft ring-1 ring-line-strong' : 'text-muted hover:text-fg'
          )}
        >
          {o.icon && <o.icon size={14} className={value === o.id ? 'text-brand' : ''} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Toggle ---------- */
export function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors', checked ? 'bg-brand' : 'bg-white/10')}
    >
      <span className={cn('absolute top-1 left-1 size-4 rounded-full bg-white transition-transform', checked && 'translate-x-5')} />
    </button>
  )
}

/* ---------- Campos ---------- */
export function Field({ label, hint, children, className }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  )
}
export const inputCls =
  'w-full rounded-[10px] border border-line bg-panel px-3 py-2 text-sm text-fg placeholder:text-faint outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20'
export function Input({ className, ...p }) {
  return <input {...p} className={cn(inputCls, 'h-9 py-0', className)} />
}
export function Textarea({ className, ...p }) {
  return <textarea {...p} className={cn(inputCls, 'resize-y leading-relaxed', className)} />
}
export function Select({ children, className, ...p }) {
  return (
    <select {...p} className={cn(inputCls, 'h-9 cursor-pointer py-0', className)}>
      {children}
    </select>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full animate-fade-in rounded-t-2xl border border-line bg-card shadow-2xl sm:rounded-card', size === 'md' ? 'sm:max-w-md' : 'sm:max-w-2xl')}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" className="-mr-2 size-8">
            <X size={16} />
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

const T_ICON = { ok: CheckCircle2, info: Info, warn: AlertTriangle }
const T_COLOR = { ok: 'text-ok', info: 'text-info', warn: 'text-accent' }

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((text, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setItems((s) => [...s, { id, text, tone }])
    // Los avisos de error se quedan más tiempo para alcanzar a leerlos
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), tone === 'warn' ? 7000 : 3200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-center gap-2 sm:left-auto sm:items-end">
        {items.map((t) => {
          const I = T_ICON[t.tone]
          return (
            <div key={t.id} className="pointer-events-auto flex animate-fade-in items-center gap-2.5 rounded-xl border border-line-strong bg-card px-4 py-3 text-sm shadow-2xl">
              <I size={16} className={T_COLOR[t.tone]} />
              {t.text}
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

/* ---------- Carga simulada ---------- */
export function useFakeLoading(ms = 650, key) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms, key])
  return loading
}

/* ---------- Encabezado de página ---------- */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

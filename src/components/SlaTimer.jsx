import clsx from 'clsx'
import { Timer } from 'lucide-react'

export default function SlaTimer({ sla, label }) {
  const cfg = {
    breached: { bar: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',    icon: 'text-red-400' },
    warning:  { bar: 'bg-orange-400', text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: 'text-orange-400' },
    ok:       { bar: 'bg-green-500',  text: 'text-slate-400',  bg: 'bg-surface-muted border-surface-border', icon: 'text-slate-500' },
  }[sla.status]

  const pct = sla.status === 'breached' ? 100
    : Math.max(0, Math.min(100, 100 - (sla.remainingSec / (sla.slaMinutes * 60)) * 100))

  return (
    <div className={clsx('inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px]', cfg.bg)}>
      <Timer size={10} className={cfg.icon} />
      <span className={clsx('font-mono font-medium tabular-nums', cfg.text)}>{label}</span>
      <div className="w-10 h-1 rounded-full bg-surface-border overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', cfg.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

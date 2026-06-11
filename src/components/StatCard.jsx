import clsx from 'clsx'

export default function StatCard({ label, value, sub, trend, trendDir, icon: Icon, accent }) {
  const trendColor =
    trendDir === 'good' ? 'text-green-400' :
    trendDir === 'bad'  ? 'text-red-400' :
    'text-slate-500'

  return (
    <div className={clsx('stat-card flex flex-col gap-3', accent && 'border-l-2 border-l-blue-500')}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-surface-border flex items-center justify-center">
            <Icon size={13} className="text-slate-400" />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
        {(sub || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {sub && <p className="text-xs text-slate-500">{sub}</p>}
            {trend && <p className={clsx('text-xs font-medium', trendColor)}>{trend}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

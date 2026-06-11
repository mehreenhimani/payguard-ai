import clsx from 'clsx'

const CONFIG = {
  critical: { label: 'Critical', cls: 'risk-critical' },
  high:     { label: 'High',     cls: 'risk-high' },
  medium:   { label: 'Medium',   cls: 'risk-medium' },
  low:      { label: 'Low',      cls: 'risk-low' },
}

export default function RiskBadge({ level }) {
  const cfg = CONFIG[level] ?? CONFIG.low
  return (
    <span className={clsx('risk-badge', cfg.cls)}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full inline-block',
        level === 'critical' && 'bg-red-400',
        level === 'high' && 'bg-orange-400',
        level === 'medium' && 'bg-yellow-400',
        level === 'low' && 'bg-green-400',
      )} />
      {cfg.label}
    </span>
  )
}

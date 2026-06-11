import clsx from 'clsx'

export default function AnalystAvatar({ analyst, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-7 h-7 text-xs'
  return (
    <div
      title={analyst.name}
      className={clsx(
        'rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shrink-0',
        analyst.color, sz
      )}
    >
      {analyst.initials}
    </div>
  )
}

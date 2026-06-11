import { subMinutes, differenceInSeconds, format } from 'date-fns'
import { generateTransactions } from './transactions'

const ANALYSTS = [
  { id: 'ana_01', name: 'Priya Mehta',    initials: 'PM', color: 'from-violet-500 to-purple-600' },
  { id: 'ana_02', name: 'James Okafor',   initials: 'JO', color: 'from-blue-500 to-cyan-600' },
  { id: 'ana_03', name: 'Sofia Reyes',    initials: 'SR', color: 'from-emerald-500 to-teal-600' },
  { id: 'ana_04', name: 'Me (Mehreen H.)', initials: 'MH', color: 'from-orange-500 to-amber-600', isMe: true },
]

// SLA in minutes per risk level
const SLA_MINUTES = { critical: 15, high: 30, medium: 120, low: 480 }

export { ANALYSTS }

function slaStatus(riskLevel, enteredQueueAt) {
  const slaMs = SLA_MINUTES[riskLevel] * 60 * 1000
  const elapsed = Date.now() - enteredQueueAt.getTime()
  const remaining = slaMs - elapsed
  const remainingSec = Math.floor(remaining / 1000)

  if (remaining <= 0) return { status: 'breached', remainingSec: 0, slaMinutes: SLA_MINUTES[riskLevel] }
  if (remaining < 5 * 60 * 1000) return { status: 'warning', remainingSec, slaMinutes: SLA_MINUTES[riskLevel] }
  return { status: 'ok', remainingSec, slaMinutes: SLA_MINUTES[riskLevel] }
}

function formatRemaining(sec) {
  if (sec <= 0) return 'Breached'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function generateQueue() {
  const all = generateTransactions(200)
  const flagged = all.filter(tx => tx.riskLevel !== 'low' && tx.status !== 'approved')

  return flagged.slice(0, 41).map((tx, i) => {
    // Spread queue entry times: critical items entered recently, others older
    const ageMinutes =
      tx.riskLevel === 'critical' ? Math.floor(Math.random() * 18) + 2 :
      tx.riskLevel === 'high'     ? Math.floor(Math.random() * 35) + 5 :
                                    Math.floor(Math.random() * 140) + 20

    const enteredAt = subMinutes(new Date(), ageMinutes)
    const sla = slaStatus(tx.riskLevel, enteredAt)

    // ~40% assigned, rest unassigned
    const assignedTo = Math.random() > 0.6
      ? ANALYSTS[Math.floor(Math.random() * (ANALYSTS.length - 1))] // exclude "me" for unassigned
      : null

    return {
      ...tx,
      queueId: `q_${tx.id.slice(4, 10)}`,
      enteredAt,
      enteredAtFormatted: format(enteredAt, 'HH:mm:ss'),
      ageMinutes,
      sla,
      slaLabel: formatRemaining(sla.remainingSec),
      assignedTo,
      priority: tx.riskLevel === 'critical' ? 1 : tx.riskLevel === 'high' ? 2 : 3,
      notes: null,
      caseId: `CASE-${2400 + i}`,
    }
  }).sort((a, b) => a.priority - b.priority || a.sla.remainingSec - b.sla.remainingSec)
}

export function getQueueStats(queue) {
  const breached = queue.filter(q => q.sla.status === 'breached').length
  const warning  = queue.filter(q => q.sla.status === 'warning').length
  const critical = queue.filter(q => q.riskLevel === 'critical').length
  const unassigned = queue.filter(q => !q.assignedTo).length
  const myItems  = queue.filter(q => q.assignedTo?.isMe).length
  const avgAge   = Math.round(queue.reduce((s, q) => s + q.ageMinutes, 0) / queue.length)

  return { breached, warning, critical, unassigned, myItems, avgAge, total: queue.length }
}

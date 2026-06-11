import { useState, useMemo, useCallback } from 'react'
import {
  AlertTriangle, Clock, Users, CheckCircle2, Ban,
  ChevronUp, Filter, RefreshCw, Download, Search,
  Inbox, UserCheck, Zap, TrendingDown, ArrowUpDown,
  MoreHorizontal, SlidersHorizontal, X,
} from 'lucide-react'
import clsx from 'clsx'
import RiskBadge from '../components/RiskBadge'
import SlaTimer from '../components/SlaTimer'
import AnalystAvatar from '../components/AnalystAvatar'
import ExplainabilityPanel from '../components/ExplainabilityPanel'
import { generateQueue, getQueueStats, ANALYSTS } from '../data/queue'
import { logAnalystDecision } from '../lib/supabase'

const QUEUE = generateQueue()

const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
const SLA_ORDER  = { breached: 0, warning: 1, ok: 2 }

const SORT_OPTIONS = [
  { value: 'sla',    label: 'SLA (urgent first)' },
  { value: 'risk',   label: 'Risk score' },
  { value: 'age',    label: 'Time in queue' },
  { value: 'amount', label: 'Amount' },
]

function scoreColor(s) {
  if (s >= 85) return 'text-red-400'
  if (s >= 65) return 'text-orange-400'
  if (s >= 40) return 'text-yellow-400'
  return 'text-green-400'
}

function fmtAmount(n) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

const PRIORITY_BAR = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
}

// ── Stat card ────────────────────────────────────────────────────────────────
function QueueStat({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className={clsx(
      'bg-surface-card border border-surface-border rounded-xl p-4 flex flex-col gap-2',
      accent && 'border-l-2 border-l-red-500'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {Icon && <Icon size={13} className="text-slate-600" />}
      </div>
      <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  )
}

// ── Bulk action bar ───────────────────────────────────────────────────────────
function BulkBar({ count, onApprove, onReject, onEscalate, onAssign, onClear }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-600/10 border border-blue-500/25 rounded-xl">
      <span className="text-xs font-semibold text-blue-400">{count} selected</span>
      <div className="w-px h-4 bg-surface-border" />
      <button onClick={onApprove}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-600/20 text-green-400 border border-green-600/30 text-xs font-medium hover:bg-green-600/30 transition-colors">
        <CheckCircle2 size={11} /> Approve all
      </button>
      <button onClick={onReject}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 border border-red-600/30 text-xs font-medium hover:bg-red-600/30 transition-colors">
        <Ban size={11} /> Reject all
      </button>
      <button onClick={onEscalate}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-medium hover:bg-orange-500/30 transition-colors">
        <ChevronUp size={11} /> Escalate all
      </button>
      <button onClick={onAssign}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-muted border border-surface-border text-slate-400 text-xs font-medium hover:text-slate-200 transition-colors">
        <UserCheck size={11} /> Assign to me
      </button>
      <button onClick={onClear} className="ml-auto text-slate-500 hover:text-slate-300 transition-colors">
        <X size={13} />
      </button>
    </div>
  )
}

// ── Assignment popover ────────────────────────────────────────────────────────
function AssignPopover({ current, onAssign, onClose }) {
  return (
    <div className="absolute right-0 top-7 z-30 bg-surface-card border border-surface-border rounded-xl shadow-2xl w-44 py-1">
      {ANALYSTS.map(a => (
        <button
          key={a.id}
          onClick={() => { onAssign(a); onClose() }}
          className={clsx(
            'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors',
            current?.id === a.id
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-slate-300 hover:bg-surface-muted'
          )}
        >
          <AnalystAvatar analyst={a} size="sm" />
          <span className="truncate">{a.isMe ? 'Assign to me' : a.name}</span>
        </button>
      ))}
      <div className="border-t border-surface-border mt-1 pt-1">
        <button
          onClick={() => { onAssign(null); onClose() }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-surface-muted transition-colors"
        >
          <div className="w-6 h-6 rounded-full border border-dashed border-slate-600 flex items-center justify-center shrink-0">
            <X size={9} />
          </div>
          Unassign
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReviewQueue() {
  const [items, setItems]           = useState(QUEUE)
  const [selected, setSelected]     = useState(new Set())
  const [sortBy, setSortBy]         = useState('sla')
  const [filterRisk, setFilterRisk] = useState('all')
  const [filterAssigned, setFilterAssigned] = useState('all') // all | me | unassigned
  const [filterSla, setFilterSla]   = useState('all')         // all | breached | warning
  const [search, setSearch]         = useState('')
  const [resolvedIds, setResolvedIds] = useState(new Set())
  const [activePanel, setActivePanel] = useState(null)
  const [openAssign, setOpenAssign]   = useState(null) // queueId of open popover
  const [toast, setToast]             = useState(null)

  const stats = useMemo(() => getQueueStats(items.filter(i => !resolvedIds.has(i.queueId))), [items, resolvedIds])

  const ME = ANALYSTS.find(a => a.isMe)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const visible = useMemo(() => {
    return items
      .filter(item => !resolvedIds.has(item.queueId))
      .filter(item => filterRisk === 'all' || item.riskLevel === filterRisk)
      .filter(item => {
        if (filterAssigned === 'me')         return item.assignedTo?.isMe
        if (filterAssigned === 'unassigned') return !item.assignedTo
        return true
      })
      .filter(item => {
        if (filterSla === 'breached') return item.sla.status === 'breached'
        if (filterSla === 'warning')  return item.sla.status === 'warning' || item.sla.status === 'breached'
        return true
      })
      .filter(item => {
        if (!search) return true
        const q = search.toLowerCase()
        return item.id.toLowerCase().includes(q)
          || item.merchant.toLowerCase().includes(q)
          || item.country.toLowerCase().includes(q)
          || item.caseId.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (sortBy === 'sla')    return SLA_ORDER[a.sla.status] - SLA_ORDER[b.sla.status] || a.sla.remainingSec - b.sla.remainingSec
        if (sortBy === 'risk')   return b.riskScore - a.riskScore
        if (sortBy === 'age')    return b.ageMinutes - a.ageMinutes
        if (sortBy === 'amount') return b.amount - a.amount
        return 0
      })
  }, [items, resolvedIds, filterRisk, filterAssigned, filterSla, search, sortBy])

  const allVisibleSelected = visible.length > 0 && visible.every(i => selected.has(i.queueId))

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected(prev => { const n = new Set(prev); visible.forEach(i => n.delete(i.queueId)); return n })
    } else {
      setSelected(prev => { const n = new Set(prev); visible.forEach(i => n.add(i.queueId)); return n })
    }
  }

  function toggleOne(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function resolveSelected(decision) {
    const ids = [...selected]
    ids.forEach(id => {
      const item = items.find(i => i.queueId === id)
      if (item) logAnalystDecision({ transactionId: item.id, decision, riskLevel: item.riskLevel, riskScore: item.riskScore })
    })
    setResolvedIds(prev => new Set([...prev, ...ids]))
    setSelected(new Set())
    showToast(`${ids.length} item${ids.length > 1 ? 's' : ''} ${decision}d`)
  }

  function assignSelected() {
    setItems(prev => prev.map(item =>
      selected.has(item.queueId) ? { ...item, assignedTo: ME } : item
    ))
    showToast(`${selected.size} item${selected.size > 1 ? 's' : ''} assigned to you`)
    setSelected(new Set())
  }

  function assignOne(queueId, analyst) {
    setItems(prev => prev.map(item =>
      item.queueId === queueId ? { ...item, assignedTo: analyst } : item
    ))
  }

  function claimItem(queueId) {
    assignOne(queueId, ME)
    showToast('Item claimed — assigned to you')
  }

  function resolveOne(queueId, decision) {
    const item = items.find(i => i.queueId === queueId)
    if (item) logAnalystDecision({ transactionId: item.id, decision, riskLevel: item.riskLevel, riskScore: item.riskScore })
    setResolvedIds(prev => new Set([...prev, queueId]))
    if (activePanel?.queueId === queueId) setActivePanel(null)
    showToast(`Transaction ${decision}d`)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-surface-border bg-surface-card">
        <div>
          <h1 className="text-base font-semibold text-white">Analyst Review Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {stats.total} items · {stats.breached} SLA breached · {stats.unassigned} unassigned
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
            <Download size={12} /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-5 gap-3">
          <QueueStat label="In Queue" value={stats.total} sub="Active cases" icon={Inbox} />
          <QueueStat label="SLA Breached" value={stats.breached} sub={`+ ${stats.warning} warning`} accent icon={AlertTriangle} />
          <QueueStat label="Unassigned" value={stats.unassigned} sub="Needs analyst" icon={Users} />
          <QueueStat label="Assigned to Me" value={stats.myItems} sub="My workload" icon={UserCheck} />
          <QueueStat label="Avg Queue Age" value={`${stats.avgAge}m`} sub="Time in queue" icon={Clock} />
        </div>

        {/* Analyst workload strip */}
        <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Team Workload</p>
          <div className="grid grid-cols-4 gap-3">
            {ANALYSTS.map(analyst => {
              const count = items.filter(i => i.assignedTo?.id === analyst.id && !resolvedIds.has(i.queueId)).length
              const breached = items.filter(i => i.assignedTo?.id === analyst.id && i.sla.status === 'breached' && !resolvedIds.has(i.queueId)).length
              return (
                <div key={analyst.id} className="flex items-center gap-2.5">
                  <AnalystAvatar analyst={analyst} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-300 truncate">{analyst.isMe ? 'You' : analyst.name.split(' ')[0]}</p>
                      <span className="text-xs font-semibold text-white tabular-nums">{count}</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full transition-all', breached > 0 ? 'bg-red-500' : 'bg-blue-500')}
                        style={{ width: `${Math.min(100, (count / 15) * 100)}%` }}
                      />
                    </div>
                    {breached > 0 && (
                      <p className="text-[9px] text-red-400 mt-0.5">{breached} breached</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filters + search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 flex-1 min-w-48 max-w-72">
            <Search size={11} className="text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Case ID, txn ID, merchant…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-full"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5">
            <ArrowUpDown size={11} className="text-slate-500" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-surface-card">{o.label}</option>)}
            </select>
          </div>

          <div className="w-px h-5 bg-surface-border" />

          {/* Risk filter */}
          {['all', 'critical', 'high', 'medium'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className={clsx(
                'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors',
                filterRisk === r
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              )}
            >{r === 'all' ? 'All risk' : r}</button>
          ))}

          <div className="w-px h-5 bg-surface-border" />

          {/* Assignment filter */}
          {[['all', 'All'], ['me', 'Mine'], ['unassigned', 'Unassigned']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterAssigned(v)}
              className={clsx(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                filterAssigned === v
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              )}
            >{l}</button>
          ))}

          <div className="w-px h-5 bg-surface-border" />

          {/* SLA filter */}
          <button
            onClick={() => setFilterSla(filterSla === 'breached' ? 'all' : 'breached')}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors border',
              filterSla === 'breached'
                ? 'bg-red-600/20 text-red-400 border-red-500/30'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            )}
          >
            <AlertTriangle size={10} /> SLA breached
          </button>
          <button
            onClick={() => setFilterSla(filterSla === 'warning' ? 'all' : 'warning')}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors border',
              filterSla === 'warning'
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            )}
          >
            <Clock size={10} /> SLA warning
          </button>

          <span className="ml-auto text-[10px] text-slate-600">{visible.length} shown</span>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <BulkBar
            count={selected.size}
            onApprove={() => resolveSelected('approve')}
            onReject={() => resolveSelected('reject')}
            onEscalate={() => resolveSelected('escalate')}
            onAssign={assignSelected}
            onClear={() => setSelected(new Set())}
          />
        )}

        {/* Queue table */}
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="pl-4 pr-2 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="accent-blue-500 cursor-pointer"
                  />
                </th>
                {['', 'Case / Txn', 'Merchant', 'Amount', 'Risk', 'SLA remaining', 'Entered queue', 'Assigned to', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 pr-4 text-slate-500 font-medium uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-600 text-sm">
                    No items match current filters
                  </td>
                </tr>
              )}
              {visible.map(item => (
                <tr
                  key={item.queueId}
                  className={clsx(
                    'group transition-colors',
                    selected.has(item.queueId) ? 'bg-blue-600/10' : 'hover:bg-surface-muted',
                    item.sla.status === 'breached' && !selected.has(item.queueId) && 'bg-red-500/5',
                  )}
                >
                  {/* Checkbox */}
                  <td className="pl-4 pr-2 py-3 w-8" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(item.queueId)}
                      onChange={() => toggleOne(item.queueId)}
                      className="accent-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Priority bar */}
                  <td className="pr-2 py-3 w-1">
                    <div className={clsx('w-0.5 h-8 rounded-full', PRIORITY_BAR[item.riskLevel] ?? 'bg-slate-700')} />
                  </td>

                  {/* Case / Txn ID */}
                  <td
                    className="py-3 pr-4 cursor-pointer"
                    onClick={() => setActivePanel(activePanel?.queueId === item.queueId ? null : item)}
                  >
                    <p className="font-mono text-blue-400">{item.caseId}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">{item.id}</p>
                  </td>

                  {/* Merchant */}
                  <td
                    className="py-3 pr-4 cursor-pointer"
                    onClick={() => setActivePanel(activePanel?.queueId === item.queueId ? null : item)}
                  >
                    <p className="text-slate-200 whitespace-nowrap">{item.merchant}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">{item.merchantCategory}</p>
                  </td>

                  {/* Amount */}
                  <td className="py-3 pr-4 font-semibold text-white tabular-nums whitespace-nowrap">
                    {fmtAmount(item.amount)}
                  </td>

                  {/* Risk */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={clsx('font-mono font-semibold text-sm', scoreColor(item.riskScore))}>
                        {item.riskScore}
                      </span>
                      <RiskBadge level={item.riskLevel} />
                    </div>
                  </td>

                  {/* SLA */}
                  <td className="py-3 pr-4">
                    <SlaTimer sla={item.sla} label={item.slaLabel} />
                  </td>

                  {/* Entered */}
                  <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                    <span className="text-slate-400">{item.enteredAtFormatted}</span>
                    <span className="text-slate-600 ml-1">({item.ageMinutes}m ago)</span>
                  </td>

                  {/* Assigned to */}
                  <td className="py-3 pr-4" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setOpenAssign(openAssign === item.queueId ? null : item.queueId)}
                        className={clsx(
                          'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs transition-colors',
                          item.assignedTo
                            ? 'border-surface-border hover:border-slate-500'
                            : 'border-dashed border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400'
                        )}
                      >
                        {item.assignedTo ? (
                          <>
                            <AnalystAvatar analyst={item.assignedTo} size="sm" />
                            <span className={item.assignedTo.isMe ? 'text-blue-400' : 'text-slate-300'}>
                              {item.assignedTo.isMe ? 'You' : item.assignedTo.name.split(' ')[0]}
                            </span>
                          </>
                        ) : (
                          <>
                            <Users size={10} />
                            <span>Unassigned</span>
                          </>
                        )}
                      </button>
                      {openAssign === item.queueId && (
                        <AssignPopover
                          current={item.assignedTo}
                          onAssign={(analyst) => assignOne(item.queueId, analyst)}
                          onClose={() => setOpenAssign(null)}
                        />
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 pr-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.assignedTo?.isMe && (
                        <button
                          onClick={() => claimItem(item.queueId)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-surface-muted border border-surface-border text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap"
                        >
                          <UserCheck size={10} /> Claim
                        </button>
                      )}
                      <button
                        onClick={() => setActivePanel(activePanel?.queueId === item.queueId ? null : item)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-colors"
                      >
                        <Zap size={10} /> Review
                      </button>
                      <button
                        onClick={() => resolveOne(item.queueId, 'approve')}
                        className="p-1 rounded text-slate-600 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                        title="Quick approve"
                      >
                        <CheckCircle2 size={13} />
                      </button>
                      <button
                        onClick={() => resolveOne(item.queueId, 'reject')}
                        className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Quick reject"
                      >
                        <Ban size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-2xl text-sm font-medium z-50 transition-all',
          toast.type === 'success'
            ? 'bg-green-500/15 border-green-500/30 text-green-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400'
        )}>
          <CheckCircle2 size={14} />
          {toast.msg}
        </div>
      )}

      {/* Explainability panel */}
      {activePanel && (
        <ExplainabilityPanel
          transaction={activePanel}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  )
}

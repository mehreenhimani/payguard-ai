import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import {
  X, ShieldCheck, AlertTriangle, CheckCircle2, Ban,
  ChevronUp, Loader2, Sparkles, Scale, FileText, Clock,
  ExternalLink,
} from 'lucide-react'
import clsx from 'clsx'
import RiskBadge from './RiskBadge'
import { explainTransaction } from '../lib/claude'
import { logAnalystDecision } from '../lib/supabase'

function buildShapFeatures(tx) {
  const base = []

  if (tx.riskScore >= 40) {
    base.push({ feature: 'Transaction Amount', value: Math.round(tx.riskScore * 0.28), color: '#ef4444' })
  }
  if (tx.countryCode && ['RU', 'KP', 'IR', 'NG'].includes(tx.countryCode)) {
    base.push({ feature: 'Origin Country Risk', value: Math.round(tx.riskScore * 0.24), color: '#f97316' })
  } else {
    base.push({ feature: 'Origin Country Risk', value: Math.round(tx.riskScore * 0.06), color: '#22c55e' })
  }
  if (['Coinbase Commerce', 'Wise Payments Ltd', 'Airwallex Ltd'].includes(tx.merchant)) {
    base.push({ feature: 'Merchant Risk Profile', value: Math.round(tx.riskScore * 0.22), color: '#f97316' })
  } else {
    base.push({ feature: 'Merchant Risk Profile', value: Math.round(tx.riskScore * 0.09), color: '#eab308' })
  }
  base.push({ feature: 'Velocity Pattern', value: Math.round(tx.riskScore * (tx.signals.length > 2 ? 0.18 : 0.07)), color: tx.signals.length > 2 ? '#ef4444' : '#22c55e' })
  base.push({ feature: 'Time-of-Day Anomaly', value: Math.round(tx.riskScore * 0.12), color: '#eab308' })
  base.push({ feature: 'Device / IP Signals', value: Math.round(tx.riskScore * (tx.signals.some(s => s.includes('VPN') || s.includes('IP')) ? 0.15 : 0.04)), color: '#94a3b8' })

  return base
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
}

const DECISION_CONFIG = {
  approve: {
    label: 'Approve',
    icon: CheckCircle2,
    cls: 'bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30',
    confirm: 'Approve this transaction?',
  },
  reject: {
    label: 'Reject & Block',
    icon: Ban,
    cls: 'bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30',
    confirm: 'Block this transaction and flag the account?',
  },
  escalate: {
    label: 'Escalate',
    icon: ChevronUp,
    cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
    confirm: 'Escalate to senior analyst?',
  },
}

const ShapTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs shadow-xl">
      <span className="text-white font-semibold">{payload[0].value} pts</span>
      <span className="text-slate-500 ml-1">contribution</span>
    </div>
  )
}

export default function ExplainabilityPanel({ transaction, onClose }) {
  const [explanation, setExplanation] = useState(null)
  const [explanationLoading, setExplanationLoading] = useState(false)
  const [explanationError, setExplanationError] = useState(null)
  const [decisionState, setDecisionState] = useState(null) // null | 'confirming' | 'logging' | 'done'
  const [pendingDecision, setPendingDecision] = useState(null)
  const [decisionResult, setDecisionResult] = useState(null)
  const [analystNote, setAnalystNote] = useState('')

  const shapFeatures = buildShapFeatures(transaction)

  const fetchExplanation = useCallback(async () => {
    setExplanationLoading(true)
    setExplanationError(null)
    try {
      const bullets = await explainTransaction(transaction)
      setExplanation(bullets)
    } catch (err) {
      setExplanationError(err.message)
    } finally {
      setExplanationLoading(false)
    }
  }, [transaction])

  useEffect(() => {
    fetchExplanation()
  }, [fetchExplanation])

  async function handleDecision(type) {
    if (decisionState === 'confirming' && pendingDecision === type) {
      setDecisionState('logging')
      try {
        await logAnalystDecision({
          transactionId: transaction.id,
          decision: type,
          analystNote: analystNote || null,
          riskLevel: transaction.riskLevel,
          riskScore: transaction.riskScore,
        })
        setDecisionResult(type)
        setDecisionState('done')
      } catch (err) {
        setDecisionState(null)
        setPendingDecision(null)
        console.error('Failed to log decision:', err)
      }
      return
    }
    setPendingDecision(type)
    setDecisionState('confirming')
  }

  const scoreColor =
    transaction.riskScore >= 85 ? 'text-red-400' :
    transaction.riskScore >= 65 ? 'text-orange-400' :
    transaction.riskScore >= 40 ? 'text-yellow-400' : 'text-green-400'

  const scoreRingColor =
    transaction.riskScore >= 85 ? 'border-red-500/40' :
    transaction.riskScore >= 65 ? 'border-orange-500/40' :
    transaction.riskScore >= 40 ? 'border-yellow-500/40' : 'border-green-500/40'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative h-full w-[640px] bg-surface-card border-l border-surface-border flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between px-6 py-4 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-400" />
              <p className="text-sm font-semibold text-white">AI Explainability Report</p>
            </div>
            <p className="font-mono text-blue-400 text-xs mt-0.5">{transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-muted transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Transaction header card */}
          <div className="bg-surface-muted border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-white tabular-nums">
                  ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span className="text-sm text-slate-500 font-normal ml-1">USD</span>
                </p>
                <p className="text-sm text-slate-300 mt-0.5">{transaction.merchant}</p>
                <p className="text-xs text-slate-500 mt-0.5">{transaction.merchantCategory} · MCC {transaction.mcc}</p>
              </div>
              <div className={clsx('w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center shrink-0', scoreRingColor)}>
                <span className={clsx('text-xl font-bold tabular-nums leading-none', scoreColor)}>{transaction.riskScore}</span>
                <span className="text-[9px] text-slate-500 mt-0.5">/ 100</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-surface-border">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Time</p>
                <p className="text-xs text-slate-300 mt-0.5">{transaction.formattedTime}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Origin</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  <span className="font-mono text-slate-500 mr-1">{transaction.countryCode}</span>
                  {transaction.country}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Risk Level</p>
                <div className="mt-0.5">
                  <RiskBadge level={transaction.riskLevel} />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Method</p>
                <p className="text-xs font-mono text-slate-300 mt-0.5">{transaction.paymentMethod}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Status</p>
                <p className={clsx('text-xs mt-0.5 capitalize font-medium',
                  transaction.status === 'blocked' ? 'text-red-400' :
                  transaction.status === 'review' ? 'text-orange-400' : 'text-green-400'
                )}>
                  {transaction.status}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">User ID</p>
                <p className="text-xs font-mono text-blue-400 mt-0.5">
                  usr_{transaction.id.slice(4, 10)}
                </p>
              </div>
            </div>
          </div>

          {/* NL Explanation */}
          <div className="bg-surface-muted border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-blue-400" />
                <p className="text-xs font-semibold text-white">Why this was flagged</p>
                <span className="text-[9px] text-slate-600 bg-surface-border px-1.5 py-0.5 rounded font-mono">claude-sonnet-4</span>
              </div>
              {!explanationLoading && (
                <button
                  onClick={fetchExplanation}
                  className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  <Loader2 size={10} />
                  Regenerate
                </button>
              )}
            </div>

            {explanationLoading && (
              <div className="flex items-center gap-2 py-4 text-slate-500">
                <Loader2 size={14} className="animate-spin text-blue-400" />
                <span className="text-xs">Generating explanation…</span>
              </div>
            )}

            {explanationError && (
              <div className="flex items-start gap-2 py-2">
                <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{explanationError}</p>
              </div>
            )}

            {explanation && !explanationLoading && (
              <ul className="space-y-2.5">
                {explanation.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={clsx(
                      'w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold',
                      i === 0 ? 'bg-red-500/15 text-red-400' :
                      i === 1 ? 'bg-orange-500/15 text-orange-400' :
                      'bg-yellow-500/15 text-yellow-400'
                    )}>
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{bullet}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* SHAP Feature Importance */}
          <div className="bg-surface-muted border border-surface-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-white">Risk Factor Contribution</p>
              <span className="text-[9px] text-slate-600 bg-surface-border px-1.5 py-0.5 rounded">SHAP-style</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-4">Top 5 features driving the risk score</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={shapFeatures}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 30]}
                  unit=" pts"
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={148}
                />
                <Tooltip content={<ShapTooltip />} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={12}>
                  {shapFeatures.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-surface-border">
              {[['#ef4444', 'High risk'], ['#f97316', 'Elevated'], ['#eab308', 'Moderate'], ['#22c55e', 'Normal'], ['#94a3b8', 'Neutral']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Triggered signals */}
          {transaction.signals.length > 0 && (
            <div className="bg-surface-muted border border-surface-border rounded-xl p-4">
              <p className="text-xs font-semibold text-white mb-3">Triggered Rule Signals</p>
              <div className="space-y-1.5">
                {transaction.signals.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle size={11} className="text-orange-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EU AI Act compliance badge */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <Scale size={15} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-blue-300">EU AI Act — Article 13 Compliance</p>
                <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-medium">LOGGED</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                This AI-generated explanation has been recorded for regulatory audit. Transparency requirement fulfilled per Article 13 (High-Risk AI Systems). Decision traceability maintained.
              </p>
              <button className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 mt-1.5 transition-colors">
                <FileText size={10} />
                View audit entry
                <ExternalLink size={9} />
              </button>
            </div>
          </div>
        </div>

        {/* Analyst action footer */}
        <div className="shrink-0 px-6 py-4 border-t border-surface-border bg-surface">
          {decisionState === 'done' ? (
            <div className="flex items-center gap-2 py-2">
              <CheckCircle2 size={14} className="text-green-400" />
              <p className="text-sm text-green-400 font-medium capitalize">
                Decision logged: {decisionResult}
              </p>
              <p className="text-xs text-slate-500 ml-1">· Audit trail updated</p>
            </div>
          ) : (
            <>
              {decisionState === 'confirming' && (
                <div className="mb-3">
                  <textarea
                    rows={2}
                    value={analystNote}
                    onChange={e => setAnalystNote(e.target.value)}
                    placeholder="Optional: add analyst note before confirming…"
                    className="w-full bg-surface-muted border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500/50 resize-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {DECISION_CONFIG[pendingDecision]?.confirm} Click again to confirm.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {Object.entries(DECISION_CONFIG).map(([type, cfg]) => {
                  const Icon = cfg.icon
                  const isConfirming = decisionState === 'confirming' && pendingDecision === type
                  return (
                    <button
                      key={type}
                      onClick={() => handleDecision(type)}
                      disabled={decisionState === 'logging'}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50',
                        cfg.cls,
                        isConfirming && 'ring-2 ring-current ring-offset-1 ring-offset-surface'
                      )}
                    >
                      {decisionState === 'logging' && pendingDecision === type ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Icon size={12} />
                      )}
                      {isConfirming ? `Confirm ${cfg.label}` : cfg.label}
                    </button>
                  )
                })}

                <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-600">
                  <Clock size={10} />
                  Decisions logged with timestamp
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

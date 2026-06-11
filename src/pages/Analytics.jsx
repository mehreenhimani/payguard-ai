import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend,
} from 'recharts'
import {
  Zap, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle,
  CheckCircle2, Clock, RefreshCw, Download, Info,
  Scale, FlaskConical, Activity, Target, ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'
import {
  generateDailyPerformance,
  generateScoreDistribution,
  generateAbDailyLift,
  generateThresholdSweep,
  confusionMatrix,
  MODEL_A, MODEL_B,
  EU_COMPLIANCE,
} from '../data/evalMetrics'

// ── Static data ───────────────────────────────────────────────────────────────
const DAILY     = generateDailyPerformance(30)
const SCORE_DIST = generateScoreDistribution()
const AB_DAILY  = generateAbDailyLift(14)
const THRESHOLD = generateThresholdSweep()

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(v) { return `${(v * 100).toFixed(1)}%` }
function ms(v)  { return `${v}ms` }
function fmtK(v) { return v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}` }

function delta(a, b, invert = false) {
  const d = ((b - a) / Math.abs(a)) * 100
  const good = invert ? d < 0 : d > 0
  return { value: `${d > 0 ? '+' : ''}${d.toFixed(1)}%`, good }
}

const METRIC_LINES = [
  { key: 'f1',        label: 'F1 Score',  color: '#3b82f6' },
  { key: 'precision', label: 'Precision', color: '#8b5cf6' },
  { key: 'recall',    label: 'Recall',    color: '#22c55e' },
  { key: 'auc',       label: 'AUC-ROC',  color: '#f59e0b' },
]

const STATUS_CFG = {
  compliant: { label: 'Compliant', cls: 'bg-green-500/15 text-green-400 border-green-500/20' },
  partial:   { label: 'Partial',   cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  gap:       { label: 'Gap',       cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

// ── Shared tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1.5 font-medium">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-semibold text-white tabular-nums">
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Metric compare row ────────────────────────────────────────────────────────
function MetricRow({ label, a, b, fmt = v => v, invert = false, highlight = false }) {
  const d = delta(a, b, invert)
  return (
    <div className={clsx(
      'grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-2.5 rounded-lg',
      highlight ? 'bg-blue-600/10 border border-blue-500/20' : 'hover:bg-surface-muted transition-colors'
    )}>
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-mono text-slate-300 text-right tabular-nums w-16">{fmt(a)}</span>
      <span className="text-xs font-mono font-semibold text-white text-right tabular-nums w-16">{fmt(b)}</span>
      <span className={clsx('text-[10px] font-semibold text-right w-14 tabular-nums', d.good ? 'text-green-400' : 'text-red-400')}>
        {d.value}
      </span>
    </div>
  )
}

// ── Confusion matrix cell ─────────────────────────────────────────────────────
function CmCell({ label, value, total, type }) {
  const cfg = {
    tp: { bg: 'bg-green-500/15 border-green-500/20', text: 'text-green-400', sub: 'True Positives' },
    tn: { bg: 'bg-green-500/10 border-green-500/15', text: 'text-green-300', sub: 'True Negatives' },
    fp: { bg: 'bg-red-500/10 border-red-500/20',   text: 'text-red-400',   sub: 'False Positives' },
    fn: { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', sub: 'False Negatives' },
  }[type]
  return (
    <div className={clsx('rounded-lg border p-3 flex flex-col gap-1', cfg.bg)}>
      <p className="text-[9px] text-slate-500 uppercase tracking-wide">{cfg.sub}</p>
      <p className={clsx('text-2xl font-bold tabular-nums', cfg.text)}>{value.toLocaleString()}</p>
      <p className="text-[10px] text-slate-500">{((value / total) * 100).toFixed(1)}% of sample</p>
    </div>
  )
}

// ── EU article row ────────────────────────────────────────────────────────────
function ArticleRow({ article, expanded, onToggle }) {
  const cfg = STATUS_CFG[article.status]
  const barColor = article.score >= 90 ? '#22c55e' : article.score >= 75 ? '#eab308' : '#ef4444'
  return (
    <div className="border border-surface-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-muted transition-colors text-left"
      >
        <div className="w-8 text-[10px] font-mono text-slate-500 shrink-0">{article.id}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200">{article.title}</p>
        </div>
        {/* Score bar */}
        <div className="flex items-center gap-2 w-36">
          <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${article.score}%`, background: barColor }} />
          </div>
          <span className="text-xs font-semibold tabular-nums" style={{ color: barColor }}>{article.score}</span>
        </div>
        <span className={clsx('risk-badge shrink-0', cfg.cls)}>{cfg.label}</span>
        <ChevronRight size={12} className={clsx('text-slate-600 transition-transform shrink-0', expanded && 'rotate-90')} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-surface-border bg-surface-muted/50">
          <p className="text-xs text-slate-400 mb-3">{article.detail}</p>
          <div className="space-y-1.5">
            {article.checks.map((c, i) => {
              const ok = !c.toLowerCase().includes('pending') && !c.toLowerCase().includes('draft')
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {ok
                    ? <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                    : <Clock size={11} className="text-yellow-400 shrink-0" />
                  }
                  <span className={ok ? 'text-slate-300' : 'text-yellow-400'}>{c}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [activeLines, setActiveLines]     = useState(new Set(['f1', 'auc']))
  const [thresholdIdx, setThresholdIdx]   = useState(9)   // default ~0.55
  const [expandedArticle, setExpandedArticle] = useState(null)
  const [activeModel, setActiveModel]     = useState('a') // for confusion matrix

  const thresholdPoint = THRESHOLD[thresholdIdx]
  const cmData = confusionMatrix(activeModel === 'a' ? MODEL_A : MODEL_B)

  const latestPerf = DAILY[DAILY.length - 1]
  const prevPerf   = DAILY[DAILY.length - 8]

  function toggleLine(key) {
    setActiveLines(prev => {
      const n = new Set(prev)
      if (n.has(key) && n.size === 1) return n
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-surface-border bg-surface-card">
        <div>
          <h1 className="text-base font-semibold text-white">Model Analytics &amp; Eval</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Champion: <span className="text-slate-300 font-mono">{MODEL_A.id}</span>
            &nbsp;·&nbsp;Challenger: <span className="text-slate-300 font-mono">{MODEL_B.id}</span>
            &nbsp;·&nbsp;A/B test running since Jun 4 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
            <Download size={12} /> Export report
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
            <RefreshCw size={12} /> Re-evaluate
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* KPI row */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'F1 Score',         value: pct(latestPerf.f1),        prev: pct(prevPerf.f1),   icon: Target,      good: latestPerf.f1 > prevPerf.f1 },
            { label: 'AUC-ROC',          value: latestPerf.auc.toFixed(3), prev: prevPerf.auc.toFixed(3), icon: Activity, good: latestPerf.auc > prevPerf.auc },
            { label: 'Precision',        value: pct(latestPerf.precision), prev: pct(prevPerf.precision), icon: Zap,      good: latestPerf.precision > prevPerf.precision },
            { label: 'False Pos. Rate',  value: pct(latestPerf.fpr),       prev: pct(prevPerf.fpr),  icon: TrendingDown, good: latestPerf.fpr < prevPerf.fpr },
            { label: 'False Neg. Rate',  value: pct(latestPerf.fnr),       prev: pct(prevPerf.fnr),  icon: AlertTriangle, good: latestPerf.fnr < prevPerf.fnr },
          ].map(({ label, value, prev, icon: Icon, good }) => (
            <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <Icon size={13} className="text-slate-600" />
              </div>
              <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
              <p className={clsx('text-[10px]', good ? 'text-green-400' : 'text-red-400')}>
                {good ? '▲' : '▼'} vs 7d ago: {prev}
              </p>
            </div>
          ))}
        </div>

        {/* Performance over time + score distribution */}
        <div className="grid grid-cols-3 gap-4">

          {/* Multi-metric time series */}
          <div className="col-span-2 bg-surface-card border border-surface-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white">Model Performance · 30-Day</p>
                <p className="text-xs text-slate-500 mt-0.5">Champion {MODEL_A.id} — daily evaluation on holdout set</p>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {METRIC_LINES.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => toggleLine(key)}
                    className={clsx(
                      'flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium border transition-colors',
                      activeLines.has(key)
                        ? 'border-transparent text-white'
                        : 'border-surface-border text-slate-600'
                    )}
                    style={activeLines.has(key) ? { background: `${color}22`, color, borderColor: `${color}44` } : {}}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: activeLines.has(key) ? color : '#334155' }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Data drift annotation */}
            <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 w-fit">
              <AlertTriangle size={10} className="text-orange-400" />
              <span className="text-[10px] text-orange-400">Data drift detected May 18–24 — retraining triggered</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={DAILY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0.8, 1.0]} tickFormatter={v => v.toFixed(2)} />
                <Tooltip content={<ChartTooltip formatter={v => v.toFixed(3)} />} />
                <ReferenceLine x="May 18" stroke="#f97316" strokeDasharray="4 3" strokeOpacity={0.5} />
                <ReferenceLine x="May 24" stroke="#f97316" strokeDasharray="4 3" strokeOpacity={0.5} />
                {METRIC_LINES.map(({ key, label, color }) =>
                  activeLines.has(key) && (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={label}
                      stroke={color}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  )
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Score distribution */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <p className="text-sm font-medium text-white mb-1">Risk Score Distribution</p>
            <p className="text-xs text-slate-500 mb-4">Legitimate vs fraud — last 24h</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SCORE_DIST} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
                <XAxis dataKey="score" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="legitimate" name="Legitimate" stackId="a" fill="#3b82f6" opacity={0.7} maxBarSize={10} />
                <Bar dataKey="fraud"      name="Fraud"      stackId="a" fill="#ef4444" opacity={0.85} maxBarSize={10} radius={[2, 2, 0, 0]} />
                <ReferenceLine x="65–69" stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Decision boundary', fill: '#94a3b8', fontSize: 9, position: 'top' }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {[['#3b82f6', 'Legitimate'], ['#ef4444', 'Fraud']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* A/B model comparison */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <FlaskConical size={14} className="text-violet-400" />
                <p className="text-sm font-semibold text-white">A/B Model Comparison</p>
                <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-medium">LIVE TEST</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">50/50 traffic split · Statistical significance: 98.4% · 7 days remaining</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-surface-muted border border-surface-border rounded-lg px-3 py-1.5">
              <Info size={11} />
              Metrics on holdout set (n=10,000)
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Metrics comparison */}
            <div className="col-span-2 space-y-1">
              {/* Model headers */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 pb-2 border-b border-surface-border">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Metric</span>
                <div className="flex items-center gap-1.5 w-16 justify-end">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-[10px] text-slate-500">{MODEL_A.id}</span>
                </div>
                <div className="flex items-center gap-1.5 w-16 justify-end">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  <span className="text-[10px] text-violet-400">{MODEL_B.id}</span>
                </div>
                <span className="text-[10px] text-slate-500 w-14 text-right">Δ</span>
              </div>

              <MetricRow label="F1 Score"            a={MODEL_A.metrics.f1}        b={MODEL_B.metrics.f1}        fmt={pct} highlight />
              <MetricRow label="AUC-ROC"             a={MODEL_A.metrics.auc}       b={MODEL_B.metrics.auc}       fmt={v => v.toFixed(3)} />
              <MetricRow label="Precision"           a={MODEL_A.metrics.precision} b={MODEL_B.metrics.precision} fmt={pct} />
              <MetricRow label="Recall"              a={MODEL_A.metrics.recall}    b={MODEL_B.metrics.recall}    fmt={pct} />
              <MetricRow label="False Positive Rate" a={MODEL_A.metrics.fpr}       b={MODEL_B.metrics.fpr}       fmt={pct} invert />
              <MetricRow label="False Negative Rate" a={MODEL_A.metrics.fnr}       b={MODEL_B.metrics.fnr}       fmt={pct} invert />
              <MetricRow label="Avg inference"       a={MODEL_A.metrics.avgInferenceMs} b={MODEL_B.metrics.avgInferenceMs} fmt={ms} invert />
              <MetricRow label="Fraud prevented (24h)" a={MODEL_A.metrics.fraudPrevented24h} b={MODEL_B.metrics.fraudPrevented24h} fmt={fmtK} />
              <MetricRow label="False positives (24h)" a={MODEL_A.metrics.falsePositives24h} b={MODEL_B.metrics.falsePositives24h} fmt={String} invert />
            </div>

            {/* Right column: model cards + F1 over time */}
            <div className="flex flex-col gap-4">
              {/* Model cards */}
              {[MODEL_A, MODEL_B].map((m, i) => (
                <div key={m.id} className={clsx(
                  'rounded-xl border p-3',
                  i === 0 ? 'border-surface-border bg-surface-muted' : 'border-violet-500/25 bg-violet-500/5'
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx('text-xs font-bold', i === 0 ? 'text-slate-300' : 'text-violet-400')}>{m.label}</span>
                    <span className="font-mono text-[10px] text-slate-500">{m.id}</span>
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-500">
                    <div className="flex justify-between"><span>Architecture</span><span className="text-slate-300">{m.architecture}</span></div>
                    <div className="flex justify-between"><span>Features</span><span className="text-slate-300">{m.features}</span></div>
                    <div className="flex justify-between"><span>Train set</span><span className="text-slate-300">{m.trainSize}</span></div>
                    <div className="flex justify-between"><span>Trained</span><span className="text-slate-300">{m.trainedOn}</span></div>
                  </div>
                </div>
              ))}

              {/* Verdict */}
              <div className="rounded-xl border border-green-500/25 bg-green-500/5 p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Preliminary Verdict</p>
                <p className="text-xs text-green-400 font-semibold">Challenger leads on all key metrics</p>
                <p className="text-[10px] text-slate-500 mt-1">+$35K fraud prevented/day, −12 false positives/day. Recommend promoting after 7-day window closes.</p>
              </div>
            </div>
          </div>

          {/* A/B F1 daily lift chart */}
          <div className="mt-5 pt-5 border-t border-surface-border">
            <p className="text-xs font-medium text-white mb-1">Daily F1 Score — A/B Comparison</p>
            <p className="text-[10px] text-slate-500 mb-3">14-day test window</p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={AB_DAILY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0.90, 0.97]} tickFormatter={v => v.toFixed(2)} />
                <Tooltip content={<ChartTooltip formatter={v => v.toFixed(3)} />} />
                <Line type="monotone" dataKey={MODEL_A.id} name={`${MODEL_A.id} (Champion)`} stroke="#64748b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey={MODEL_B.id} name={`${MODEL_B.id} (Challenger)`} stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion matrix + threshold tuner */}
        <div className="grid grid-cols-2 gap-4">

          {/* Confusion matrix */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white">Confusion Matrix</p>
                <p className="text-xs text-slate-500 mt-0.5">Holdout set — n=10,000</p>
              </div>
              <div className="flex gap-1">
                {[['a', MODEL_A.id], ['b', MODEL_B.id]].map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setActiveModel(v)}
                    className={clsx(
                      'px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-colors border',
                      activeModel === v
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                        : 'text-slate-500 border-surface-border hover:text-slate-300'
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-500 text-center mb-1 pl-16">
                <span>Predicted: Legit</span>
                <span>Predicted: Fraud</span>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 justify-center text-[9px] text-slate-500 w-14 text-right shrink-0">
                  <span className="h-16 flex items-center justify-end pr-2">Actual: Legit</span>
                  <span className="h-16 flex items-center justify-end pr-2">Actual: Fraud</span>
                </div>
                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5">
                  <CmCell label="TN" value={cmData.tn} total={cmData.total} type="tn" />
                  <CmCell label="FP" value={cmData.fp} total={cmData.total} type="fp" />
                  <CmCell label="FN" value={cmData.fn} total={cmData.total} type="fn" />
                  <CmCell label="TP" value={cmData.tp} total={cmData.total} type="tp" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-border text-center">
              {[
                ['Accuracy', (((cmData.tp + cmData.tn) / cmData.total) * 100).toFixed(1) + '%'],
                ['PPV', ((cmData.tp / (cmData.tp + cmData.fp)) * 100).toFixed(1) + '%'],
                ['NPV', ((cmData.tn / (cmData.tn + cmData.fn)) * 100).toFixed(1) + '%'],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-[9px] text-slate-500 uppercase">{l}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Threshold tuner */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-white">Decision Threshold Tuner</p>
              <span className="font-mono text-blue-400 text-sm font-semibold">τ = {thresholdPoint.threshold}</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Adjust threshold to balance precision / recall trade-off</p>

            <input
              type="range"
              min={0}
              max={THRESHOLD.length - 1}
              value={thresholdIdx}
              onChange={e => setThresholdIdx(+e.target.value)}
              className="w-full mb-4 accent-blue-500 cursor-pointer"
            />

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Precision', value: pct(thresholdPoint.precision), color: '#8b5cf6' },
                { label: 'Recall',    value: pct(thresholdPoint.recall),    color: '#22c55e' },
                { label: 'F1 Score',  value: pct(thresholdPoint.f1),        color: '#3b82f6' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface-muted border border-surface-border rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500">{label}</p>
                  <p className="text-lg font-bold mt-0.5 tabular-nums" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={THRESHOLD} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
                <XAxis dataKey="threshold" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0.3, 1.0]} tickFormatter={v => v.toFixed(1)} />
                <Tooltip content={<ChartTooltip formatter={v => pct(v)} />} />
                <ReferenceLine x={thresholdPoint.threshold} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.7} />
                <Line type="monotone" dataKey="precision" name="Precision" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="recall"    name="Recall"    stroke="#22c55e" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="f1"        name="F1"        stroke="#3b82f6" strokeWidth={2}   dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EU AI Act compliance */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Scale size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">EU AI Act Compliance Dashboard</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-Risk AI System classification · Last audit: {EU_COMPLIANCE.lastAudit} · Next: {EU_COMPLIANCE.nextAudit}
                </p>
              </div>
            </div>

            {/* Overall score */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Overall Score</p>
                <div className="flex items-end gap-1.5 mt-0.5">
                  <span className="text-3xl font-bold text-white tabular-nums">{EU_COMPLIANCE.overallScore}</span>
                  <span className="text-slate-500 text-sm pb-1">/100</span>
                </div>
              </div>
              <div className="w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e2535" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke={EU_COMPLIANCE.overallScore >= 90 ? '#22c55e' : EU_COMPLIANCE.overallScore >= 75 ? '#eab308' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${EU_COMPLIANCE.overallScore} ${100 - EU_COMPLIANCE.overallScore}`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Article breakdown */}
          <div className="grid grid-cols-2 gap-2">
            {EU_COMPLIANCE.articles.map(article => (
              <ArticleRow
                key={article.id}
                article={article}
                expanded={expandedArticle === article.id}
                onToggle={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
            <ShieldCheck size={13} className="text-blue-400 shrink-0" />
            <p className="text-xs text-slate-400">
              All Article 13 explanations are logged and immutable. Analyst decisions include timestamp, decision rationale, and model version.
              Compliant with transparency requirements for high-risk AI systems under EU AI Act (Regulation 2024/1689).
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

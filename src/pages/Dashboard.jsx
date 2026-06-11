import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  ShieldAlert, TrendingUp, Activity,
  Filter, RefreshCw, Download, ChevronRight,
  CheckCircle2, Clock, Ban, DollarSign, Zap, AlertTriangle,
} from 'lucide-react'
import clsx from 'clsx'

import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import ExplainabilityPanel from '../components/ExplainabilityPanel'
import {
  generateTransactions,
  generateHourlyVolume,
  generateRiskBreakdown,
  generateTopRiskyMerchants,
  SUMMARY_STATS,
} from '../data/transactions'

const TRANSACTIONS = generateTransactions(120)
const HOURLY = generateHourlyVolume(7)
const BREAKDOWN = generateRiskBreakdown()
const TOP_MERCHANTS = generateTopRiskyMerchants()

const STATUS_ICONS = {
  approved: <CheckCircle2 size={13} className="text-green-400" />,
  review:   <Clock size={13} className="text-orange-400" />,
  blocked:  <Ban size={13} className="text-red-400" />,
}

const RISK_FILTER_OPTIONS = ['all', 'critical', 'high', 'medium', 'low']

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n}`
}

function scoreColor(score) {
  if (score >= 85) return 'text-red-400'
  if (score >= 65) return 'text-orange-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-green-400'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-white tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [riskFilter, setRiskFilter] = useState('all')
  const [selectedTx, setSelectedTx] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    return TRANSACTIONS.filter(tx => {
      const matchRisk = riskFilter === 'all' || tx.riskLevel === riskFilter
      const matchSearch =
        !searchQuery ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.country.toLowerCase().includes(searchQuery.toLowerCase())
      return matchRisk && matchSearch
    })
  }, [riskFilter, searchQuery])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-surface-border bg-surface-card">
        <div>
          <h1 className="text-base font-semibold text-white">Transaction Risk Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Live · Last updated 12s ago · Model v2.4.1</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
            <Download size={12} />
            Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
            <RefreshCw size={12} />
            Refresh
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Volume (24h)"
            value={fmt(SUMMARY_STATS.totalVolume)}
            sub="8,412 transactions"
            trend="+12.4% vs yesterday"
            trendDir="good"
            icon={DollarSign}
            accent
          />
          <StatCard
            label="Flagged Transactions"
            value={SUMMARY_STATS.flaggedTransactions.toLocaleString()}
            sub={`${((SUMMARY_STATS.flaggedTransactions / SUMMARY_STATS.totalTransactions) * 100).toFixed(1)}% flag rate`}
            trend="-2.1% vs yesterday"
            trendDir="good"
            icon={AlertTriangle}
          />
          <StatCard
            label="Blocked / Declined"
            value={SUMMARY_STATS.blockedTransactions}
            sub="$284K prevented"
            trend="+3 since last hour"
            trendDir="bad"
            icon={Ban}
          />
          <StatCard
            label="Review Queue"
            value={SUMMARY_STATS.reviewQueueDepth}
            sub="Avg wait: 4.2 min"
            trend="SLA: 15 min"
            trendDir="neutral"
            icon={Clock}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Model Accuracy"
            value={`${SUMMARY_STATS.modelAccuracy}%`}
            sub="Last 7 days"
            trend="+0.3% vs prior week"
            trendDir="good"
            icon={Zap}
          />
          <StatCard
            label="False Positive Rate"
            value={`${SUMMARY_STATS.falsePositiveRate}%`}
            sub="Target: <5%"
            trend="Within SLA"
            trendDir="good"
            icon={Activity}
          />
          <StatCard
            label="Avg Risk Score"
            value={SUMMARY_STATS.avgRiskScore}
            sub="Portfolio-wide"
            trend="Stable"
            trendDir="neutral"
            icon={ShieldAlert}
          />
          <StatCard
            label="Txns / Minute"
            value="5.8"
            sub="Peak today: 22.4"
            trend="-14% vs 1h ago"
            trendDir="neutral"
            icon={TrendingUp}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Volume over time */}
          <div className="col-span-2 stat-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white">Transaction Volume · 7-Day</p>
                <p className="text-xs text-slate-500 mt-0.5">Total vs flagged vs blocked</p>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-blue-500 inline-block rounded" />Volume</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-orange-400 inline-block rounded" />Flagged</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-red-500 inline-block rounded" />Blocked</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={HOURLY} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={7} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="volume" name="Volume" stroke="#3b82f6" fill="url(#volGrad)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="flagged" name="Flagged" stroke="#f97316" fill="url(#flagGrad)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#ef4444" fill="none" strokeWidth={1} strokeDasharray="3 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Risk breakdown */}
          <div className="stat-card flex flex-col">
            <p className="text-sm font-medium text-white mb-1">Risk Distribution</p>
            <p className="text-xs text-slate-500 mb-4">By transaction count · 24h</p>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {BREAKDOWN.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs">
                          <span className="text-white font-semibold">{payload[0].name}: {payload[0].value}%</span>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
              {BREAKDOWN.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                  <span className="text-white font-medium ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* High-risk merchants bar */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-white">Top Risk Merchants</p>
              <p className="text-xs text-slate-500 mt-0.5">By flag rate · 24h rolling</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={TOP_MERCHANTS} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" domain={[0, 25]} />
              <YAxis type="category" dataKey="merchant" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={145} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="flagRate" name="Flag Rate %" radius={[0, 3, 3, 0]} maxBarSize={14}>
                {TOP_MERCHANTS.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#eab308'} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction table */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-white">Recent Transactions</p>
              <p className="text-xs text-slate-500 mt-0.5">{filtered.length} results</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-surface-muted border border-surface-border rounded-lg px-2.5 py-1.5">
                <Filter size={11} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Search txn ID, merchant, country…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-52"
                />
              </div>
              <div className="flex gap-1">
                {RISK_FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setRiskFilter(opt)}
                    className={clsx(
                      'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors',
                      riskFilter === opt
                        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                        : 'text-slate-500 hover:text-slate-300 border border-transparent'
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Txn ID', 'Time', 'Merchant', 'Amount', 'Method', 'Country', 'Risk Score', 'Risk Level', 'Status', ''].map(h => (
                    <th key={h} className="text-left pb-2.5 pr-4 text-slate-500 font-medium uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.slice(0, 40).map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                    className={clsx(
                      'table-row-hover',
                      selectedTx?.id === tx.id && 'bg-blue-600/10'
                    )}
                  >
                    <td className="py-2.5 pr-4 font-mono text-blue-400 whitespace-nowrap">{tx.id}</td>
                    <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap">{tx.formattedTime}</td>
                    <td className="py-2.5 pr-4">
                      <div>
                        <p className="text-slate-200 whitespace-nowrap">{tx.merchant}</p>
                        <p className="text-slate-600 text-[10px]">{tx.merchantCategory} · MCC {tx.mcc}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-white tabular-nums whitespace-nowrap">
                      ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap font-mono text-[10px]">{tx.paymentMethod}</td>
                    <td className="py-2.5 pr-4 text-slate-300 whitespace-nowrap">
                      <span className="text-slate-500 font-mono text-[10px] mr-1">{tx.countryCode}</span>
                      {tx.country}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={clsx('font-mono font-semibold', scoreColor(tx.riskScore))}>
                        {tx.riskScore}
                      </span>
                      <span className="text-slate-600">/100</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <RiskBadge level={tx.riskLevel} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1">
                        {STATUS_ICONS[tx.status]}
                        <span className={clsx(
                          'capitalize',
                          tx.status === 'blocked' && 'text-red-400',
                          tx.status === 'review' && 'text-orange-400',
                          tx.status === 'approved' && 'text-green-400',
                        )}>
                          {tx.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <ChevronRight size={12} className={clsx('transition-transform text-slate-600', selectedTx?.id === tx.id && 'text-blue-400')} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedTx && (
        <ExplainabilityPanel
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  )
}

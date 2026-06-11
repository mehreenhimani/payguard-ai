import { subDays, format } from 'date-fns'

// ── Daily model performance over 30 days ─────────────────────────────────────
export function generateDailyPerformance(days = 30) {
  const rows = []
  for (let d = days - 1; d >= 0; d--) {
    const date = subDays(new Date(), d)
    const noise = () => (Math.random() - 0.5) * 0.012
    // Simulate a gradual improvement + a dip around day 18 when data drift hit
    const drift = d > 10 && d < 16 ? -0.03 : 0
    rows.push({
      date: format(date, 'MMM d'),
      precision: +Math.min(0.99, Math.max(0.88, 0.953 + noise() + drift)).toFixed(3),
      recall:    +Math.min(0.99, Math.max(0.80, 0.912 + noise() + drift * 1.2)).toFixed(3),
      f1:        +Math.min(0.99, Math.max(0.84, 0.932 + noise() + drift)).toFixed(3),
      auc:       +Math.min(0.999, Math.max(0.93, 0.978 + noise() * 0.5 + drift * 0.5)).toFixed(3),
      fpr:       +Math.min(0.12, Math.max(0.01, 0.032 - noise() * 0.5 - drift * 0.3)).toFixed(3),
      fnr:       +Math.min(0.15, Math.max(0.04, 0.088 - noise() + drift * 0.8)).toFixed(3),
    })
  }
  return rows
}

// ── Score distribution buckets ────────────────────────────────────────────────
export function generateScoreDistribution() {
  const buckets = []
  for (let i = 0; i <= 95; i += 5) {
    const isFraud = i >= 65
    const vol = isFraud
      ? Math.floor(80 * Math.exp(-((i - 100) ** 2) / 800) + Math.random() * 15)
      : Math.floor(420 * Math.exp(-(i ** 2) / 1200) + Math.random() * 30)
    buckets.push({
      score: `${i}–${i + 4}`,
      legitimate: isFraud ? Math.floor(vol * 0.15) : vol,
      fraud:      isFraud ? vol : Math.floor(vol * 0.03),
    })
  }
  return buckets
}

// ── A/B model comparison ──────────────────────────────────────────────────────
export const MODEL_A = {
  id: 'v2.4.1',
  label: 'Champion',
  trainedOn: 'Mar 12 2026',
  architecture: 'XGBoost + NN ensemble',
  features: 142,
  trainSize: '4.2M txns',
  metrics: {
    precision: 0.953,
    recall: 0.912,
    f1: 0.932,
    auc: 0.978,
    fpr: 0.032,
    fnr: 0.088,
    avgInferenceMs: 4.2,
    fraudPrevented24h: 284_000,
    falsePositives24h: 41,
  },
}

export const MODEL_B = {
  id: 'v2.5.0-beta',
  label: 'Challenger',
  trainedOn: 'Jun 3 2026',
  architecture: 'Transformer + XGBoost',
  features: 187,
  trainSize: '6.1M txns',
  metrics: {
    precision: 0.961,
    recall: 0.934,
    f1: 0.947,
    auc: 0.984,
    fpr: 0.024,
    fnr: 0.066,
    avgInferenceMs: 11.8,
    fraudPrevented24h: 319_000,
    falsePositives24h: 29,
  },
}

export function generateAbDailyLift(days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const date = format(subDays(new Date(), days - 1 - i), 'MMM d')
    const aF1 = +(0.928 + (Math.random() - 0.5) * 0.018).toFixed(3)
    const bF1 = +(aF1 + 0.012 + (Math.random() - 0.5) * 0.01).toFixed(3)
    return { date, [MODEL_A.id]: aF1, [MODEL_B.id]: bF1 }
  })
}

// ── Confusion matrix data ─────────────────────────────────────────────────────
export function confusionMatrix(model) {
  const total = 10_000
  const actualFraud = 840
  const actualLeg   = total - actualFraud
  const tp = Math.round(actualFraud * (1 - model.metrics.fnr))
  const fn = actualFraud - tp
  const fp = Math.round(actualLeg * model.metrics.fpr)
  const tn = actualLeg - fp
  return { tp, fn, fp, tn, total }
}

// ── EU AI Act compliance ──────────────────────────────────────────────────────
export const EU_COMPLIANCE = {
  overallScore: 87,
  lastAudit: 'Jun 1 2026',
  nextAudit: 'Sep 1 2026',
  articles: [
    {
      id: 'Art. 9',
      title: 'Risk Management System',
      status: 'compliant',
      score: 94,
      detail: 'Continuous monitoring active. Model drift alerts configured. Last incident: none.',
      checks: ['Risk register maintained', 'Drift detection active', 'Incident log current'],
    },
    {
      id: 'Art. 10',
      title: 'Data Governance',
      score: 82,
      status: 'partial',
      detail: 'Training data documented. Bias audit pending for Q3 2026. Synthetic data ratio flagged.',
      checks: ['Training data lineage documented', 'Bias audit — Q3 2026 pending', 'Data retention policy in place'],
    },
    {
      id: 'Art. 13',
      title: 'Transparency & Explainability',
      score: 96,
      status: 'compliant',
      detail: 'SHAP explanations generated for all high/critical decisions. Audit log complete.',
      checks: ['Explanations logged per decision', 'Analyst-readable output', 'Audit trail immutable'],
    },
    {
      id: 'Art. 14',
      title: 'Human Oversight',
      score: 91,
      status: 'compliant',
      detail: '100% of critical decisions reviewed by analyst within SLA. Override rate: 4.2%.',
      checks: ['Review queue SLA enforced', 'Override capability active', 'Analyst decision logged'],
    },
    {
      id: 'Art. 17',
      title: 'Quality Management',
      score: 78,
      status: 'partial',
      detail: 'QMS documentation partially complete. Post-market monitoring plan under review.',
      checks: ['QMS documented (v1.2)', 'Post-market monitoring — draft', 'Change management process defined'],
    },
    {
      id: 'Art. 62',
      title: 'Incident Reporting',
      score: 88,
      status: 'compliant',
      detail: 'Serious incident reporting to supervisory authority configured. 0 incidents YTD.',
      checks: ['Reporting pipeline configured', '0 reportable incidents YTD', 'Escalation contacts verified'],
    },
  ],
}

// ── Threshold sweep ───────────────────────────────────────────────────────────
export function generateThresholdSweep() {
  return Array.from({ length: 19 }, (_, i) => {
    const t = 0.1 + i * 0.05
    const prec = Math.min(0.995, 0.6 + t * 0.52 + (Math.random() - 0.5) * 0.01)
    const rec  = Math.max(0.3, 1.0 - t * 0.85 + (Math.random() - 0.5) * 0.01)
    return {
      threshold: +t.toFixed(2),
      precision: +prec.toFixed(3),
      recall:    +rec.toFixed(3),
      f1:        +(2 * prec * rec / (prec + rec)).toFixed(3),
    }
  })
}

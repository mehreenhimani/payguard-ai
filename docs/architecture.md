# PayGuard AI — Architecture Document

**Version:** 1.0  
**Author:** Mehreen Himani  
**Date:** June 2026

---

## 1. System Overview

PayGuard AI is a single-page React application with a stateless frontend, a Claude API integration for natural language explanation generation, and an optional Supabase backend for decision persistence and audit logging.

The application is designed to run entirely client-side with synthetic data for demo/portfolio purposes, while supporting full production integration via environment variables.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │  Dashboard  │  │    Queue    │  │  Model Analytics       │  │
│  │  Screen 1   │  │  Screen 3   │  │  Screen 4              │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬────────────┘  │
│         │                │                      │               │
│         └────────────────┴──────────────────────┘               │
│                          │                                      │
│              ┌───────────▼────────────┐                         │
│              │  Explainability Panel  │                         │
│              │  Screen 2              │                         │
│              └───────────┬────────────┘                         │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Transaction │  │ Claude API  │  │  Supabase   │            │
│  │ Generator   │  │ Client      │  │  Client     │            │
│  │ (synthetic) │  │ (lib/)      │  │  (lib/)     │            │
│  └─────────────┘  └──────┬──────┘  └──────┬──────┘            │
└─────────────────────────┼────────────────┼────────────────────┘
                           │                │
                 ┌─────────▼──────┐  ┌──────▼──────────────────┐
                 │  Anthropic API │  │  Supabase (Postgres)     │
                 │  /v1/messages  │  │  analyst_decisions       │
                 │  claude-sonnet │  │  audit_log               │
                 │  -4-20250514   │  │  model_versions          │
                 └────────────────┘  └─────────────────────────┘
```

---

## 3. Component Architecture

### 3.1 Frontend (React 18 + Vite)

```
src/
├── App.jsx                    # Root — React Router, layout wrapper
├── components/
│   ├── Sidebar.jsx            # Navigation: Dashboard, Queue, Analytics, etc.
│   ├── KPICard.jsx            # Reusable metric card with trend arrow
│   ├── RiskBadge.jsx          # Colour-coded risk level badge (LOW/MED/HIGH/CRIT)
│   ├── TransactionRow.jsx     # Single row in transaction feed / queue table
│   ├── ExplainabilityPanel.jsx # Slide-in panel — full AI explanation view
│   └── Toast.jsx              # Bottom-right notification
├── pages/
│   ├── Dashboard.jsx          # Screen 1
│   ├── Queue.jsx              # Screen 3
│   ├── Analytics.jsx          # Screen 4
│   └── [Audit, Rules, Settings placeholders]
└── lib/
    ├── claude.js              # Claude API wrapper
    ├── supabase.js            # Supabase client singleton
    └── transactions.js        # Synthetic transaction generator
```

### 3.2 Routing

```
/              → Dashboard (Screen 1)
/queue         → Analyst Review Queue (Screen 3)
/analytics     → Model Analytics (Screen 4)
/audit         → Audit Log (placeholder)
/rules         → Rule Engine (placeholder)
/settings      → Settings (placeholder)
```

Explainability Panel (Screen 2) is not a route — it renders as an overlay/side panel triggered by transaction click from Dashboard or Queue.

---

## 4. Data Flow

### 4.1 Transaction Feed (Synthetic)

```
transactions.js
    │
    ├── Generates PaySim-style synthetic transactions on mount
    │   Fields: id, userId, amount, merchant, merchantCategory,
    │           country, timestamp, riskScore, status,
    │           riskFactors[], triggeredSignals[]
    │
    ├── riskScore derived from weighted combination of:
    │   - amountAnomaly (vs user 30-day avg)
    │   - merchantRisk (category risk lookup)
    │   - velocityScore (tx count in 24h window)
    │   - timeAnomaly (deviation from user hour pattern)
    │   - countryRisk (origin country risk score)
    │   - deviceRisk (new device / IP mismatch)
    │
    └── status assigned:
        score < 40  → "approved"
        40–70       → "review"
        > 70        → "blocked"
```

### 4.2 AI Explanation Flow (Claude API)

```
User clicks flagged transaction
    │
    ▼
ExplainabilityPanel mounts
    │
    ▼
claude.js — generateExplanation(transaction)
    │
    ├── Builds prompt:
    │   System: "You are a senior fraud analyst at a European neobank.
    │            Explain why this transaction was flagged to a junior
    │            analyst in 3 numbered bullets. Be specific about the
    │            numbers. Each bullet starts with a severity emoji
    │            (🔴 high, 🟡 medium, 🟢 low). Max 2 sentences per bullet."
    │
    │   User: [transaction JSON with risk factors]
    │
    ├── POST api.anthropic.com/v1/messages
    │   model: claude-sonnet-4-20250514
    │   max_tokens: 400
    │
    ├── On success: render bullets with colour coding
    ├── On API error / no key: render synthetic fallback bullets
    └── Log explanation to Supabase audit_log
```

### 4.3 Analyst Decision Flow

```
Analyst clicks Approve / Reject / Escalate
    │
    ▼
Two-tap confirm: note field + confirm button
    │
    ▼
supabase.js — logDecision({
    transactionId, analystId, decision,
    note, timestamp, riskScore,
    explanationId  ← links to audit_log entry
})
    │
    ├── INSERT into analyst_decisions
    ├── UPDATE audit_log — mark as "reviewed"
    └── Remove from Queue / update Dashboard status
```

---

## 5. Database Schema (Supabase)

### analyst_decisions
```sql
CREATE TABLE analyst_decisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT now(),
  transaction_id TEXT NOT NULL,
  analyst_id   TEXT NOT NULL,
  decision     TEXT CHECK (decision IN ('approved','rejected','escalated')),
  note         TEXT,
  risk_score   INTEGER,
  explanation_id UUID REFERENCES audit_log(id),
  time_to_decision_seconds INTEGER
);
```

### audit_log
```sql
CREATE TABLE audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ DEFAULT now(),
  transaction_id TEXT NOT NULL,
  explanation    TEXT NOT NULL,       -- Full Claude API response
  model_version  TEXT,                -- e.g. "claude-sonnet-4-20250514"
  risk_factors   JSONB,
  article_13_compliant BOOLEAN DEFAULT true,
  reviewed       BOOLEAN DEFAULT false
);
```

### model_versions
```sql
CREATE TABLE model_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  version     TEXT NOT NULL,          -- e.g. "v2.4.1"
  architecture TEXT,                  -- e.g. "XGBoost+NN"
  f1_score    DECIMAL(4,3),
  precision   DECIMAL(4,3),
  recall      DECIMAL(4,3),
  fpr         DECIMAL(4,3),
  auc_roc     DECIMAL(4,3),
  is_champion BOOLEAN DEFAULT false,
  is_challenger BOOLEAN DEFAULT false
);
```

Row Level Security (RLS) enabled on all tables.

---

## 6. AI Integration Design

### Model Choice: Claude Sonnet 4
- Chosen for balance of speed and quality for real-time fraud explanation
- Target latency: <1.5s p95 for explanation generation
- Token budget: ~200 input + 400 output per explanation = ~600 tokens/explanation
- Cost at scale: $0.006 per explanation (negligible vs fraud loss prevention value)

### Prompt Engineering Strategy
The explanation prompt is designed for three properties:

1. **Specificity** — Claude is given the actual transaction numbers, not just flags. It produces "amount is 4.2x above 30-day average (€1,240 vs avg €298)" not "unusual amount detected"

2. **Analyst calibration** — System prompt frames Claude as a senior analyst explaining to a junior colleague. This produces actionable, confident language rather than hedged uncertainty

3. **Regulatory compliance** — Output format (numbered bullets with severity) maps directly to EU AI Act Article 13 "meaningful information about the logic involved" requirement

### Fallback Strategy
If `VITE_ANTHROPIC_API_KEY` is not set or API call fails:
- Render synthetic explanation bullets generated from the transaction's `riskFactors[]` array
- Mark explanation source as "synthetic" in audit log
- All other functionality unaffected

---

## 7. Eval Architecture

### Golden Test Set (50 transactions)
See `docs/eval-dataset.md` for full dataset.

Structure:
- 25 fraud transactions (confirmed fraud — various typologies)
- 25 legitimate transactions (edge cases that resemble fraud)
- Labels: `ground_truth` (fraud/legitimate), `typology` (APP/card/identity/velocity/geographic)

### Metrics Computed
```
Precision = TP / (TP + FP)
Recall    = TP / (TP + FN)
F1        = 2 × (Precision × Recall) / (Precision + Recall)
FPR       = FP / (FP + TN)   ← PRIMARY METRIC
AUC-ROC   = area under ROC curve
```

### Model Drift Detection
- Rolling 7-day F1 computed daily
- Drift threshold: F1 drops >0.03 from 30-day baseline
- Trigger: alert banner in Analytics screen → "Model retraining recommended"
- Data drift annotation band shown on 30-day performance chart

---

## 8. Deployment

### Vercel (Production)
- Build command: `vite build`
- Output directory: `dist`
- Environment variables set in Vercel dashboard (not committed to repo)
- Auto-deploy on push to `main`

### Environment Variables
```
VITE_ANTHROPIC_API_KEY    # Claude API — explanations
VITE_SUPABASE_URL         # Supabase project URL
VITE_SUPABASE_ANON_KEY    # Supabase anon key (public)
```

Note: `VITE_` prefix exposes variables to browser bundle. For production, Claude API calls should be proxied through an edge function to avoid key exposure. v1 runs client-side for demo purposes.

---

## 9. Performance

| Metric | Current | Target |
|---|---|---|
| JS bundle (gzipped) | 196KB | <150KB (code-split charts with React.lazy) |
| Time to interactive | ~1.2s | <1s |
| Claude API p50 latency | ~800ms | <800ms |
| Claude API p95 latency | ~2.1s | <1.5s (streaming) |

### v2 Optimisation: Streaming Explanations
Replace single API call with streaming response — first bullet renders in ~300ms, reducing perceived latency significantly for the analyst.

---

## 10. Security Considerations

- API key never committed to repository (`.env.local` in `.gitignore`)
- Supabase RLS prevents cross-analyst data access
- No real PII in synthetic transaction data
- v2: Claude API calls should move server-side (Supabase Edge Function) to prevent key exposure in browser bundle
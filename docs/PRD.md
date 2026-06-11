# PayGuard AI — Product Requirements Document

**Version:** 1.0  
**Author:** Mehreen Himani, Senior AI Product Manager  
**Date:** June 2026  
**Status:** v1 Shipped

---

## 1. Problem Statement

### Context
European neobanks process tens of millions of transactions daily through ML-based fraud detection models. The models are fast and increasingly accurate — but they create two compounding problems that no one has solved well.

**Problem 1 — False Positives Destroy Customer Trust**
Industry average false positive rates in payments fraud detection sit at 30–40%. At N26 scale (8M+ customers, €14M+ daily transaction volume), that means tens of thousands of legitimate transactions blocked every day. Each block generates a customer service ticket, a trust deficit, and potential churn. The business cost is significant; the reputational cost is worse.

**Problem 2 — Black-Box Decisions Violate EU AI Act**
When a transaction is flagged, the fraud analyst receives a single risk score (e.g. "87/100 — HIGH RISK"). No explanation. No feature breakdown. No reasoning. The analyst must approve or reject in under 90 seconds on average SLA — often making a gut call.

This violates **EU AI Act (Regulation 2024/1689) Article 13**, which requires high-risk AI systems in financial services to provide meaningful explanations of automated decisions. Enforcement begins 2026. Non-compliance fines: up to €30M or 6% of global annual turnover.

**Problem 3 — Model Drift Goes Undetected**
Fraud patterns evolve faster than quarterly model reviews. Without a real-time eval layer visible to PMs and analysts, model degradation is discovered only when fraud losses spike or false positive complaints surge.

### The Gap
Existing solutions address one problem. None address all three simultaneously, with an interface designed for the fraud analyst — the person who lives in this tool for 8 hours a day.

---

## 2. Vision

> **PayGuard AI: Every fraud decision explained, every model metric visible, every analyst empowered.**

---

## 3. Target Users

### Primary User: Fraud Analyst
- Reviews 200–400 flagged transactions per shift
- Target review time: <90 seconds per case
- Current tools: risk score only, no context
- Pain: high cognitive load, low confidence in decisions, SLA pressure
- Goal: accurate, fast, defensible decisions

### Secondary User: Compliance Officer
- Reviews AI decision audit trail for regulators
- Needs: full explainability log, EU AI Act Article 13 evidence
- Goal: demonstrate compliance, avoid fines

### Tertiary User: AI Product Manager / Head of Risk
- Monitors model performance, approves A/B tests, triggers retraining
- Needs: F1/FPR trends, A/B comparison, drift alerts, threshold tuning
- Goal: maintain model accuracy, reduce false positive rate, manage risk appetite

---

## 4. Success Metrics

| Metric | Baseline (Industry) | v1 Target | Measurement |
|---|---|---|---|
| False Positive Rate | 35% | <20% | Eval dashboard — rolling 7-day FPR |
| Analyst review time per case | 4 mins | <90 seconds | Queue screen — avg review time KPI |
| EU AI Act Article 13 coverage | 0% | 100% of flagged transactions | Audit log — % decisions with explanation logged |
| Analyst override rate | Unknown | <15% (model confidence proxy) | Queue screen — override rate KPI |
| Model F1 Score | 0.82 (industry benchmark) | >0.91 | Analytics screen — F1 KPI |
| SLA breach rate | ~25% | <5% | Queue screen — SLA breached KPI |

---

## 5. Features — v1 Scope

### F1 — Transaction Risk Dashboard (Screen 1)

**User Story:** As a fraud analyst, I want to see all incoming transactions with risk scores at a glance, so I can quickly identify which ones need my attention.

**Acceptance Criteria:**
- Real-time transaction feed updates continuously
- Each transaction shows: amount, merchant, MCC, user ID, timestamp, risk score (0–100), status badge
- Status: Auto-approved (green, score <40) / Review (amber, 40–70) / Blocked (red, >70)
- KPI strip at top: Total Volume (24h), Flagged Transactions, Blocked/Declined, Review Queue depth, Model Accuracy, False Positive Rate, Avg Risk Score, Transactions/min
- 7-day volume chart: Volume vs Flagged vs Blocked lines (Recharts area chart)
- Risk distribution donut: Low / Medium / High / Critical with percentages
- Top Risk Merchants bar chart: top 5 by flag rate (rolling 24h)
- Export button (CSV of current feed)
- Live indicator: "Last updated Xs ago · Model v2.4.1"

**Out of Scope:** Real bank API integration, live ML model inference

---

### F2 — Explainability Panel (Screen 2)

**User Story:** As a fraud analyst, I want to understand WHY a transaction was flagged in plain English, so I can make a confident, fast decision without guessing.

**Acceptance Criteria:**
- Opens as a slide-in panel (right side) on click of any flagged transaction
- Transaction header: amount, merchant, MCC category, timestamp, user ID, risk score ring (colour-coded red/orange/yellow/green)
- AI explanation via Claude API (`claude-sonnet-4-20250514`):
  - Prompt instructs Claude to act as a senior fraud analyst explaining to a junior colleague
  - Output: 3 numbered bullets, each with severity indicator
  - Example: "1. 🔴 Amount is 4.2x above this user's 30-day average (€1,240 vs avg €298) — strongest signal. 2. 🟡 Merchant category (Crypto Exchange) not seen in 90 days for this user. 3. 🟡 Transaction initiated at 03:14 local time — outside normal pattern"
  - Fallback to synthetic explanations if API key not set
  - Regenerate button
- SHAP-style feature importance chart (Recharts horizontal bars):
  - 6 features: Transaction Amount, Origin Country Risk, Merchant Risk Profile, Velocity Pattern, Time-of-Day Anomaly, Device/IP Signals
  - Values and colours driven by transaction data
- Triggered rule signals: raw signals from risk engine (e.g. "VELOCITY_24H_EXCEEDED", "NEW_MERCHANT_CATEGORY")
- EU AI Act Article 13 compliance badge: "Explanation logged for regulatory audit — [View Audit Entry]"
- Analyst action buttons: Approve / Reject & Block / Escalate
  - Two-tap confirm flow: first click → note field + confirm prompt → second click → decision logged
  - Decision result displayed inline
  - All decisions written to Supabase `analyst_decisions` table

---

### F3 — Analyst Review Queue (Screen 3)

**User Story:** As a fraud analyst, I want a prioritised queue of transactions needing human review, with SLA visibility, so I can work efficiently and never miss a deadline.

**Acceptance Criteria:**
- KPI strip: Queue depth, SLA breached (with warning if >0), Unassigned count, My workload, Avg case age
- Team workload bar: 4 analysts with per-person item count and capacity bar (turns red when breached)
- Search: by case ID / transaction ID / merchant name
- Sort: SLA urgency / risk score / age / amount
- Filter chips: risk level (Low/Med/High/Critical), Mine/All/Unassigned, SLA Breached/Warning
- Queue table rows:
  - Coloured left-border priority indicator
  - Case ID + transaction ID
  - Merchant, amount, risk score badge
  - Live SLA countdown with fill bar (green → orange → red)
  - Time entered queue
  - Assignment dropdown (reassign to any analyst or unassign)
  - Row-hover quick actions: Claim, Review, quick-approve ✓, quick-reject ✗
- Bulk select: checkbox → Approve all / Reject all / Escalate all / Assign to me
- Clicking Review opens Explainability Panel (F2) in-place
- Toast notifications bottom-right on every action
- All decisions logged to Supabase

---

### F4 — Model Analytics & Eval Dashboard (Screen 4)

**User Story:** As an AI PM / Head of Risk, I want to monitor model performance in real time, compare model versions, and demonstrate EU AI Act compliance — all in one screen.

**Acceptance Criteria:**
- KPI row: F1 Score, AUC-ROC, Precision, False Positive Rate, False Negative Rate — each with 7-day delta trend arrow (green up/down, red inverse)
- 30-day performance chart: multi-line (F1, Precision, Recall, AUC-ROC), toggleable lines, data drift annotation band with retraining note, reference lines
- Risk score distribution: stacked bar (legitimate vs fraud by score bucket 0–100), decision boundary reference line at τ=65
- A/B Model Comparison:
  - Champion v2.4.1 (XGBoost+NN) vs Challenger v2.5.0-beta (Transformer+XGBoost)
  - Side-by-side metrics table with Δ% column colour-coded (green = improvement, red = regression)
  - Model cards with architecture details
  - Preliminary verdict chip ("Challenger leads on FPR — recommend 80/20 rollout")
  - 14-day F1 daily lift chart
- Confusion Matrix: switchable Champion/Challenger, TP/TN/FP/FN cells with % of sample, Accuracy/PPV/NPV footer
- Decision Threshold Tuner: live slider τ=0.10→1.00, Precision/Recall/F1 update real-time, PR curve with reference line
- EU AI Act Compliance section:
  - SVG donut: 87/100 overall score
  - Expandable rows: Articles 9, 10, 13, 14, 17, 62 — each with score bar, status badge, detail text, per-check completion (✅ vs ⏳)

---

## 6. Out of Scope — v1

- Real bank API or payment rail integration
- Live ML model training or fine-tuning
- RAG layer for regulatory document retrieval (v2 roadmap)
- Agentic autonomous decision-making (v2 roadmap)
- Multi-language support
- Native mobile app
- Multi-tenant / multi-bank support

---

## 7. v2 Roadmap

| Feature | Rationale | Effort |
|---|---|---|
| RAG layer — EU AI Act / AMLD6 / DORA document retrieval | Power explanations with actual regulatory text citations | M |
| Agentic detection loop — detect → explain → recommend → alert | Remove human bottleneck for clear-cut cases | L |
| Real Supabase persistence with auth | Production-ready analyst identity and audit trail | S |
| Code-split chart pages with React.lazy() | Reduce 705KB bundle to <500KB | S |
| Webhook integration (Stripe Radar / N26 sandbox) | Real transaction data feed | L |

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Claude API latency >2s on explanation | Medium | High — breaks analyst flow | Stream response; show loading state with partial text |
| Synthetic data not representative of real fraud patterns | Low | Medium — eval metrics misleading | Document data generation methodology; caveat in UI |
| EU AI Act requirements evolve pre-enforcement | Low | Medium | Article compliance rows are data-driven, easy to update |
| Model confidence miscalibrated on edge cases | Medium | High | Threshold tuner + analyst override rate monitoring |
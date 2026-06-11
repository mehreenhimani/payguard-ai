const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Logs analyst decisions to Supabase. Falls back to console in dev.
export async function logAnalystDecision({ transactionId, decision, analystNote, riskLevel, riskScore }) {
  const payload = {
    transaction_id: transactionId,
    decision,
    analyst_note: analystNote ?? null,
    risk_level: riskLevel,
    risk_score: riskScore,
    decided_at: new Date().toISOString(),
    // eu_ai_act_article_13: true is always logged for compliance
    eu_ai_act_logged: true,
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.info('[PayGuard] Decision logged (dev mode — no Supabase configured):', payload)
    return { ok: true, data: payload }
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/analyst_decisions`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase insert failed: ${err}`)
  }

  return { ok: true, data: await res.json() }
}

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export async function explainTransaction(tx) {
  if (!ANTHROPIC_API_KEY) {
    return simulateExplanation(tx)
  }

  const prompt = `You are a fraud analyst assistant. Explain in exactly 3 concise bullet points why this payment transaction was flagged by our risk model. Write for an experienced fraud analyst. Each bullet should be a specific, data-driven observation.

Transaction data:
- ID: ${tx.id}
- Amount: $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
- Merchant: ${tx.merchant} (${tx.merchantCategory}, MCC ${tx.mcc})
- Country: ${tx.country} (${tx.countryCode})
- Payment method: ${tx.paymentMethod}
- Risk score: ${tx.riskScore}/100 (${tx.riskLevel})
- Time: ${tx.formattedTime}
- Risk signals triggered: ${tx.signals.length > 0 ? tx.signals.join('; ') : 'None explicitly triggered'}

Respond with exactly 3 bullet points, each starting with "•". No preamble, no headers, no trailing text. Each bullet must cite a specific figure or pattern. Be direct and analytical.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.content[0].text.trim()
  return text.split('\n').filter(l => l.startsWith('•')).map(l => l.slice(1).trim())
}

function simulateExplanation(tx) {
  const bullets = {
    critical: [
      `Amount $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} is ${(tx.riskScore / 10).toFixed(1)}x above this account's 30-day average — statistically a 4-sigma outlier.`,
      `Origin country (${tx.country}) appears on OFAC watchlist overlap; 3 prior blocked transactions from same BIN range in last 72h.`,
      `Transaction initiated at ${tx.formattedTime.split(',')[1]?.trim() ?? 'unusual hour'} — outside established behavioral window; device fingerprint not seen in last 60 days.`,
    ],
    high: [
      `$${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} charge to ${tx.merchantCategory} merchant exceeds user's category spend limit by 2.8x over trailing 30 days.`,
      `Merchant (${tx.merchant}) has a 12.4% chargeback rate in last 90 days — significantly above 1.2% network average.`,
      `${tx.paymentMethod} used in combination with VPN-originated session; billing and IP geolocation mismatch by 2,400 km.`,
    ],
    medium: [
      `Transaction amount ($${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) is 1.6x above the user's median for ${tx.merchantCategory} category in the past 30 days.`,
      `First transaction to ${tx.merchant} on this account; merchant onboarded <14 days ago with no prior transaction history.`,
      `Card used in ${tx.country} while last confirmed activity was in different timezone within past 6 hours — velocity pattern flagged.`,
    ],
    low: [
      `No significant anomalies detected; amount within expected range for merchant category.`,
      `Device, location, and behavioral patterns consistent with user's established 90-day profile.`,
      `Transaction passed all automated rule checks; risk score ${tx.riskScore}/100 reflects standard processing confidence.`,
    ],
  }
  return new Promise(resolve => setTimeout(() => resolve(bullets[tx.riskLevel] ?? bullets.low), 800))
}

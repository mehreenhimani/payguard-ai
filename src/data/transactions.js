import { subDays, subHours, subMinutes, format } from 'date-fns'

const now = new Date()

const MERCHANTS = [
  { name: 'Stripe Payments Inc', category: 'Payment Processor', mcc: '7372' },
  { name: 'Shopify Capital', category: 'E-commerce', mcc: '5399' },
  { name: 'AWS Marketplace', category: 'Cloud Services', mcc: '7372' },
  { name: 'Brex Card Services', category: 'Corporate Card', mcc: '6011' },
  { name: 'Ramp Financial', category: 'Expense Management', mcc: '6011' },
  { name: 'Plaid Technologies', category: 'Financial Data', mcc: '7372' },
  { name: 'Adyen N.V.', category: 'Payment Gateway', mcc: '7372' },
  { name: 'Wise Payments Ltd', category: 'FX Transfer', mcc: '4829' },
  { name: 'Coinbase Commerce', category: 'Crypto Exchange', mcc: '6051' },
  { name: 'PayPal Holdings', category: 'Digital Wallet', mcc: '6012' },
  { name: 'Square Capital LLC', category: 'POS / Lending', mcc: '5411' },
  { name: 'Mercury Bank', category: 'Banking', mcc: '6022' },
  { name: 'Relay Financial', category: 'Business Banking', mcc: '6022' },
  { name: 'Airwallex Ltd', category: 'Cross-border Payments', mcc: '4829' },
  { name: 'Finix Payments', category: 'Payment Facilitation', mcc: '7372' },
]

const COUNTRIES = [
  { code: 'US', name: 'United States', risk: 'low' },
  { code: 'GB', name: 'United Kingdom', risk: 'low' },
  { code: 'DE', name: 'Germany', risk: 'low' },
  { code: 'CA', name: 'Canada', risk: 'low' },
  { code: 'SG', name: 'Singapore', risk: 'low' },
  { code: 'NG', name: 'Nigeria', risk: 'high' },
  { code: 'RU', name: 'Russia', risk: 'critical' },
  { code: 'CN', name: 'China', risk: 'medium' },
  { code: 'BR', name: 'Brazil', risk: 'medium' },
  { code: 'IN', name: 'India', risk: 'low' },
  { code: 'KP', name: 'North Korea', risk: 'critical' },
  { code: 'IR', name: 'Iran', risk: 'critical' },
  { code: 'MX', name: 'Mexico', risk: 'medium' },
  { code: 'PH', name: 'Philippines', risk: 'medium' },
  { code: 'VN', name: 'Vietnam', risk: 'low' },
]

const RISK_SIGNALS = [
  'Velocity spike — 14 txns in 2 min',
  'IP mismatch — billing vs origin country',
  'Card BIN from high-risk issuer',
  'New device fingerprint',
  'Unusual transaction hour (3:42 AM)',
  'Micro-deposit probe pattern detected',
  'Multiple failed auth attempts prior',
  'Shipping address age < 24h',
  'VPN / Tor exit node detected',
  'Card used in 3 countries within 6h',
  'Amount just below reporting threshold',
  'Linked to flagged merchant network',
  'Account takeover pattern match',
  'Chargeback rate > 2% for merchant',
  'First purchase > $5,000 on new card',
]

const PAYMENT_METHODS = ['Visa •• 4821', 'Mastercard •• 3390', 'Amex •• 0041', 'ACH / Bank', 'Wire Transfer', 'USDC on-chain', 'Apple Pay', 'Visa •• 7713']

function weightedRisk() {
  const r = Math.random()
  if (r < 0.08) return 'critical'
  if (r < 0.22) return 'high'
  if (r < 0.48) return 'medium'
  return 'low'
}

function riskScore(level) {
  const ranges = { critical: [85, 99], high: [65, 84], medium: [40, 64], low: [5, 39] }
  const [min, max] = ranges[level]
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function amount(riskLevel) {
  if (riskLevel === 'critical') return +(Math.random() * 45000 + 5000).toFixed(2)
  if (riskLevel === 'high') return +(Math.random() * 8000 + 500).toFixed(2)
  if (riskLevel === 'medium') return +(Math.random() * 2000 + 50).toFixed(2)
  return +(Math.random() * 500 + 5).toFixed(2)
}

function pickSignals(riskLevel) {
  const count = { critical: 4, high: 3, medium: 2, low: 0 }[riskLevel]
  if (!count) return []
  const shuffled = [...RISK_SIGNALS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count + Math.floor(Math.random() * 2))
}

function randomId() {
  return 'txn_' + Math.random().toString(36).slice(2, 12).toUpperCase()
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateTransactions(count = 120) {
  return Array.from({ length: count }, (_, i) => {
    const risk = weightedRisk()
    const country = randomElement(
      risk === 'critical'
        ? COUNTRIES.filter(c => c.risk === 'critical' || c.risk === 'high')
        : risk === 'high'
        ? COUNTRIES.filter(c => c.risk !== 'low')
        : COUNTRIES
    )
    const merchant = randomElement(MERCHANTS)
    const amt = amount(risk)
    const timestamp = subMinutes(now, i * 7 + Math.floor(Math.random() * 15))

    return {
      id: randomId(),
      timestamp,
      formattedTime: format(timestamp, 'MMM d, HH:mm:ss'),
      amount: amt,
      currency: 'USD',
      merchant: merchant.name,
      merchantCategory: merchant.category,
      mcc: merchant.mcc,
      paymentMethod: randomElement(PAYMENT_METHODS),
      country: country.name,
      countryCode: country.code,
      riskLevel: risk,
      riskScore: riskScore(risk),
      signals: pickSignals(risk),
      status: risk === 'critical' ? 'blocked' : risk === 'high' ? (Math.random() > 0.4 ? 'review' : 'approved') : 'approved',
      reviewed: risk === 'low' || Math.random() > 0.6,
    }
  }).sort((a, b) => b.timestamp - a.timestamp)
}

export function generateHourlyVolume(days = 7) {
  const result = []
  for (let d = days - 1; d >= 0; d--) {
    for (let h = 0; h < 24; h += 3) {
      const base = subDays(now, d)
      base.setHours(h, 0, 0, 0)
      const isWeekend = base.getDay() === 0 || base.getDay() === 6
      const hourMultiplier = h >= 8 && h <= 22 ? 1 : 0.25
      const vol = Math.floor((isWeekend ? 40 : 80) * hourMultiplier + Math.random() * 30)
      result.push({
        time: format(base, 'EEE HH:mm'),
        volume: vol,
        flagged: Math.floor(vol * (0.08 + Math.random() * 0.12)),
        blocked: Math.floor(vol * (0.02 + Math.random() * 0.04)),
      })
    }
  }
  return result
}

export function generateRiskBreakdown() {
  return [
    { name: 'Low', value: 68, color: '#22c55e' },
    { name: 'Medium', value: 18, color: '#eab308' },
    { name: 'High', value: 10, color: '#f97316' },
    { name: 'Critical', value: 4, color: '#ef4444' },
  ]
}

export function generateTopRiskyMerchants() {
  return [
    { merchant: 'Coinbase Commerce', flagRate: 18.4, volume: 412, blocked: 32 },
    { merchant: 'Wise Payments Ltd', flagRate: 14.2, volume: 638, blocked: 21 },
    { merchant: 'Airwallex Ltd', flagRate: 11.8, volume: 294, blocked: 15 },
    { merchant: 'PayPal Holdings', flagRate: 9.1, volume: 1820, blocked: 44 },
    { merchant: 'Adyen N.V.', flagRate: 7.6, volume: 950, blocked: 28 },
  ]
}

export const SUMMARY_STATS = {
  totalVolume: 14_283_420,
  totalTransactions: 8_412,
  flaggedTransactions: 634,
  blockedTransactions: 87,
  avgRiskScore: 31.4,
  falsePositiveRate: 3.2,
  reviewQueueDepth: 41,
  modelAccuracy: 97.8,
}

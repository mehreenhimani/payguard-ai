# PayGuard AI — Eval Dataset (Golden Test Set)

**Version:** 1.0  
**Author:** Mehreen Himani  
**Date:** June 2026  
**Purpose:** Production evaluation of fraud detection model accuracy

---

## Overview

This golden test set contains 50 hand-labelled transactions used to evaluate PayGuard AI's fraud detection model. Each transaction has a confirmed ground truth label, typology classification, and expected model behaviour.

**Composition:**
- 25 confirmed fraud transactions (various typologies)
- 25 legitimate transactions (edge cases that pattern-match to fraud)

**Primary metric evaluated:** False Positive Rate (FPR) — minimising legitimate transaction blocks  
**Secondary metrics:** F1, Precision, Recall, AUC-ROC

---

## Fraud Typologies Covered

| Typology | Count | Description |
|---|---|---|
| APP (Authorised Push Payment) | 8 | Victim voluntarily pushes funds to fraudster |
| Card-Not-Present (CNP) | 6 | Stolen card details used in online transaction |
| Account Takeover (ATO) | 5 | Fraudster accesses legitimate account |
| Synthetic Identity | 3 | Fabricated identity passes KYC |
| Velocity Fraud | 3 | Rapid successive transactions to drain account |

---

## Dataset

### FRAUD TRANSACTIONS (Ground Truth: FRAUD)

```json
[
  {
    "id": "GT-F-001",
    "ground_truth": "fraud",
    "typology": "APP",
    "amount": 4850.00,
    "currency": "EUR",
    "merchant": "CryptoVault Exchange",
    "merchant_category": "cryptocurrency",
    "user_30d_avg": 312.00,
    "amount_multiple": 15.5,
    "hour_local": 2,
    "user_normal_hours": "09:00-22:00",
    "days_since_merchant_seen": 999,
    "velocity_24h": 1,
    "country": "BG",
    "user_home_country": "DE",
    "expected_risk_score_min": 85,
    "expected_decision": "blocked",
    "explanation_key_factors": ["extreme amount anomaly", "crypto merchant new", "unusual hour", "foreign country"],
    "notes": "Classic investment scam APP fraud — victim convinced to transfer to crypto exchange"
  },
  {
    "id": "GT-F-002",
    "ground_truth": "fraud",
    "typology": "ATO",
    "amount": 2200.00,
    "currency": "EUR",
    "merchant": "Western Union",
    "merchant_category": "money_transfer",
    "user_30d_avg": 180.00,
    "amount_multiple": 12.2,
    "hour_local": 3,
    "user_normal_hours": "08:00-23:00",
    "days_since_merchant_seen": 999,
    "velocity_24h": 3,
    "country": "RO",
    "user_home_country": "DE",
    "new_device": true,
    "new_ip_country": "UA",
    "expected_risk_score_min": 90,
    "expected_decision": "blocked",
    "notes": "Account takeover — new device, foreign IP, money transfer to unusual country at 3am"
  },
  {
    "id": "GT-F-003",
    "ground_truth": "fraud",
    "typology": "velocity",
    "amount": 49.99,
    "currency": "EUR",
    "merchant": "Steam Gaming",
    "merchant_category": "gaming",
    "user_30d_avg": 45.00,
    "amount_multiple": 1.1,
    "hour_local": 14,
    "user_normal_hours": "08:00-23:00",
    "days_since_merchant_seen": 5,
    "velocity_24h": 18,
    "country": "DE",
    "user_home_country": "DE",
    "expected_risk_score_min": 75,
    "expected_decision": "blocked",
    "notes": "Card testing — 18 small transactions in 24h to test stolen card before larger fraud. Amount looks normal, velocity is the signal."
  },
  {
    "id": "GT-F-004",
    "ground_truth": "fraud",
    "typology": "CNP",
    "amount": 899.00,
    "currency": "EUR",
    "merchant": "Apple Store",
    "merchant_category": "electronics",
    "user_30d_avg": 85.00,
    "amount_multiple": 10.6,
    "hour_local": 11,
    "user_normal_hours": "07:00-22:00",
    "days_since_merchant_seen": 999,
    "velocity_24h": 2,
    "country": "DE",
    "user_home_country": "DE",
    "new_device": true,
    "expected_risk_score_min": 78,
    "expected_decision": "review",
    "notes": "Stolen card used for high-value electronics purchase. New device, amount 10x average. Apple Store is common CNP target."
  },
  {
    "id": "GT-F-005",
    "ground_truth": "fraud",
    "typology": "APP",
    "amount": 12500.00,
    "currency": "EUR",
    "merchant": "Individual Transfer — DE89370400440532013000",
    "merchant_category": "p2p_transfer",
    "user_30d_avg": 520.00,
    "amount_multiple": 24.0,
    "hour_local": 16,
    "user_normal_hours": "08:00-22:00",
    "days_since_merchant_seen": 999,
    "velocity_24h": 1,
    "country": "DE",
    "user_home_country": "DE",
    "expected_risk_score_min": 88,
    "expected_decision": "blocked",
    "notes": "Romance scam APP — large P2P transfer to unknown IBAN. Single transaction but extreme amount multiple."
  },
  {
    "id": "GT-F-006",
    "ground_truth": "fraud",
    "typology": "ATO",
    "amount": 750.00,
    "currency": "EUR",
    "merchant": "Binance",
    "merchant_category": "cryptocurrency",
    "user_30d_avg": 210.00,
    "amount_multiple": 3.6,
    "hour_local": 1,
    "user_normal_hours": "09:00-21:00",
    "days_since_merchant_seen": 999,
    "velocity_24h": 4,
    "country": "DE",
    "user_home_country": "DE",
    "new_device": true,
    "session_duration_seconds": 45,
    "expected_risk_score_min": 82,
    "expected_decision": "blocked",
    "notes": "ATO — very short session (45s), new device, crypto exchange, 1am. Fraudster logged in, went straight to crypto purchase."
  },
  {
    "id": "GT-F-007",
    "ground_truth": "fraud",
    "typology": "synthetic_identity",
    "amount": 3200.00,
    "currency": "EUR",
    "merchant": "MediaMarkt",
    "merchant_category": "electronics",
    "account_age_days": 12,
    "user_30d_avg": 180.00,
    "amount_multiple": 17.8,
    "hour_local": 13,
    "velocity_24h": 2,
    "country": "DE",
    "user_home_country": "DE",
    "expected_risk_score_min": 80,
    "expected_decision": "blocked",
    "notes": "Synthetic identity — account only 12 days old, immediately making high-value electronics purchase. Classic bust-out pattern."
  },
  {
    "id": "GT-F-008",
    "ground_truth": "fraud",
    "typology": "APP",
    "amount": 6800.00,
    "currency": "EUR",
    "merchant": "Savings Transfer — GB29NWBK60161331926819",
    "merchant_category": "p2p_transfer",
    "user_30d_avg": 890.00,
    "amount_multiple": 7.6,
    "hour_local": 10,
    "user_normal_hours": "08:00-20:00",
    "days_since_merchant_seen": 999,
    "country": "GB",
    "user_home_country": "DE",
    "expected_risk_score_min": 83,
    "expected_decision": "blocked",
    "notes": "Bank impersonation scam — victim convinced by fraudster posing as bank to transfer to 'safe account' in UK."
  },
  {
    "id": "GT-F-009",
    "ground_truth": "fraud",
    "typology": "CNP",
    "amount": 1499.00,
    "currency": "EUR",
    "merchant": "Zalando",
    "merchant_category": "fashion_retail",
    "user_30d_avg": 95.00,
    "amount_multiple": 15.8,
    "hour_local": 3,
    "user_normal_hours": "09:00-23:00",
    "days_since_merchant_seen": 3,
    "velocity_24h": 5,
    "new_shipping_address": true,
    "expected_risk_score_min": 79,
    "expected_decision": "blocked",
    "notes": "CNP fraud at fashion retailer — 3am, new shipping address, amount 15x average, high velocity. Classic reshipping fraud."
  },
  {
    "id": "GT-F-010",
    "ground_truth": "fraud",
    "typology": "velocity",
    "amount": 1.00,
    "currency": "EUR",
    "merchant": "Spotify",
    "merchant_category": "subscription",
    "user_30d_avg": 9.99,
    "amount_multiple": 0.1,
    "hour_local": 22,
    "velocity_24h": 34,
    "country": "DE",
    "user_home_country": "DE",
    "expected_risk_score_min": 72,
    "expected_decision": "blocked",
    "notes": "Mass card testing — 34 micro-transactions in 24h. €1.00 amount designed to stay under fraud thresholds. Pure velocity signal."
  },
  {
    "id": "GT-F-011",
    "ground_truth": "fraud",
    "typology": "ATO",
    "amount": 5000.00,
    "currency": "EUR",
    "merchant": "SEPA Transfer",
    "merchant_category": "bank_transfer",
    "user_30d_avg": 400.00,
    "amount_multiple": 12.5,
    "hour_local": 4,
    "new_device": true,
    "new_ip_country": "NG",
    "password_changed_hours_ago": 1,
    "expected_risk_score_min": 95,
    "expected_decision": "blocked",
    "notes": "High-confidence ATO — password changed 1h ago, new device, Nigerian IP, max SEPA transfer at 4am."
  },
  {
    "id": "GT-F-012",
    "ground_truth": "fraud",
    "typology": "CNP",
    "amount": 320.00,
    "currency": "EUR",
    "merchant": "Amazon DE",
    "merchant_category": "ecommerce",
    "user_30d_avg": 88.00,
    "amount_multiple": 3.6,
    "hour_local": 15,
    "days_since_merchant_seen": 2,
    "velocity_24h": 7,
    "new_shipping_address": true,
    "expected_risk_score_min": 71,
    "expected_decision": "review",
    "notes": "CNP fraud — moderate amount multiple but new shipping address and elevated velocity. Amazon is high-volume so needs review not auto-block."
  },
  {
    "id": "GT-F-013",
    "ground_truth": "fraud",
    "typology": "APP",
    "amount": 980.00,
    "currency": "EUR",
    "merchant": "Individual Transfer",
    "merchant_category": "p2p_transfer",
    "user_30d_avg": 150.00,
    "amount_multiple": 6.5,
    "hour_local": 19,
    "velocity_24h": 1,
    "country": "DE",
    "user_home_country": "DE",
    "expected_risk_score_min": 74,
    "expected_decision": "review",
    "notes": "Suspected APP fraud — amount multiple significant, P2P to unknown recipient, but within possible legitimate range. Review warranted."
  },
  {
    "id": "GT-F-014",
    "ground_truth": "fraud",
    "typology": "synthetic_identity",
    "amount": 1800.00,
    "currency": "EUR",
    "merchant": "Douglas Perfumery",
    "merchant_category": "retail",
    "account_age_days": 8,
    "user_30d_avg": 95.00,
    "amount_multiple": 18.9,
    "velocity_24h": 3,
    "country": "DE",
    "expected_risk_score_min": 85,
    "expected_decision": "blocked",
    "notes": "Synthetic identity bust-out — 8-day account, immediate high-value retail spend across multiple merchants in single day."
  },
  {
    "id": "GT-F-015",
    "ground_truth": "fraud",
    "typology": "ATO",
    "amount": 200.00,
    "currency": "EUR",
    "merchant": "Lidl",
    "merchant_category": "grocery",
    "user_30d_avg": 185.00,
    "amount_multiple": 1.1,
    "hour_local": 14,
    "new_device": true,
    "new_ip_country": "PL",
    "session_anomaly_score": 0.94,
    "expected_risk_score_min": 68,
    "expected_decision": "review",
    "notes": "Subtle ATO — amount and merchant look normal, but new device + foreign IP + session behaviour anomaly. Easy to miss without multi-signal model."
  },
  {
    "id": "GT-F-016",
    "ground_truth": "fraud",
    "typology": "velocity",
    "amount": 250.00,
    "currency": "EUR",
    "merchant": "Rewe",
    "merchant_category": "grocery",
    "user_30d_avg": 95.00,
    "amount_multiple": 2.6,
    "velocity_24h": 12,
    "hour_local": 11,
    "country": "DE",
    "expected_risk_score_min": 73,
    "expected_decision": "review",
    "notes": "Velocity fraud at grocery chain — 12 transactions in 24h across multiple Rewe locations. Possible gift card drain."
  },
  {
    "id": "GT-F-017",
    "ground_truth": "fraud",
    "typology": "CNP",
    "amount": 2400.00,
    "currency": "EUR",
    "merchant": "Booking.com",
    "merchant_category": "travel",
    "user_30d_avg": 310.00,
    "amount_multiple": 7.7,
    "hour_local": 2,
    "days_since_merchant_seen": 180,
    "velocity_24h": 1,
    "country": "AE",
    "user_home_country": "DE",
    "expected_risk_score_min": 81,
    "expected_decision": "blocked",
    "notes": "CNP fraud on travel platform — 2am, UAE destination, amount 7x average, merchant not seen in 6 months."
  },
  {
    "id": "GT-F-018",
    "ground_truth": "fraud",
    "typology": "APP",
    "amount": 3500.00,
    "currency": "EUR",
    "merchant": "FX Transfer",
    "merchant_category": "foreign_exchange",
    "user_30d_avg": 420.00,
    "amount_multiple": 8.3,
    "hour_local": 12,
    "velocity_24h": 1,
    "country": "NG",
    "user_home_country": "DE",
    "expected_risk_score_min": 86,
    "expected_decision": "blocked",
    "notes": "APP fraud via FX transfer to Nigeria. Advance fee fraud pattern — victim expects return payment that never arrives."
  },
  {
    "id": "GT-F-019",
    "ground_truth": "fraud",
    "typology": "synthetic_identity",
    "amount": 4200.00,
    "currency": "EUR",
    "merchant": "BMW Financial Services",
    "merchant_category": "automotive_finance",
    "account_age_days": 22,
    "user_30d_avg": 200.00,
    "amount_multiple": 21.0,
    "velocity_24h": 1,
    "country": "DE",
    "expected_risk_score_min": 88,
    "expected_decision": "blocked",
    "notes": "Synthetic identity targeting automotive finance. 22-day account attempting large finance deposit. Classic synthetic identity bust-out."
  },
  {
    "id": "GT-F-020",
    "ground_truth": "fraud",
    "typology": "ATO",
    "amount": 890.00,
    "currency": "EUR",
    "merchant": "PayPal Transfer",
    "merchant_category": "p2p_transfer",
    "user_30d_avg": 245.00,
    "amount_multiple": 3.6,
    "hour_local": 3,
    "new_device": true,
    "velocity_24h": 3,
    "expected_risk_score_min": 77,
    "expected_decision": "blocked",
    "notes": "ATO via PayPal — 3am, new device, P2P transfers to drain account across multiple recipients."
  },
  {
    "id": "GT-F-021",
    "ground_truth": "fraud",
    "typology": "CNP",
    "amount": 599.00,
    "currency": "EUR",
    "merchant": "PlayStation Store",
    "merchant_category": "gaming",
    "user_30d_avg": 45.00,
    "amount_multiple": 13.3,
    "hour_local": 22,
    "days_since_merchant_seen": 999,
    "velocity_24h": 4,
    "expected_risk_score_min": 80,
    "expected_decision": "blocked",
    "notes": "CNP fraud on gaming platform. Large game/credit purchase, merchant never seen, 4 attempts in 24h."
  },
  {
    "id": "GT-F-022",
    "ground_truth": "fraud",
    "typology": "APP",
    "amount": 22000.00,
    "currency": "EUR",
    "merchant": "Individual Transfer — GB",
    "merchant_category": "p2p_transfer",
    "user_30d_avg": 1200.00,
    "amount_multiple": 18.3,
    "hour_local": 11,
    "velocity_24h": 1,
    "country": "GB",
    "user_home_country": "DE",
    "expected_risk_score_min": 92,
    "expected_decision": "blocked",
    "notes": "High-value APP fraud. HMRC impersonation — victim told to transfer savings to avoid 'tax investigation'. Largest in test set."
  },
  {
    "id": "GT-F-023",
    "ground_truth": "fraud",
    "typology": "velocity",
    "amount": 99.00,
    "currency": "EUR",
    "merchant": "Various ATMs",
    "merchant_category": "atm_withdrawal",
    "user_30d_avg": 200.00,
    "amount_multiple": 0.5,
    "velocity_24h": 9,
    "hour_local": 23,
    "country": "DE",
    "expected_risk_score_min": 74,
    "expected_decision": "review",
    "notes": "ATM card skimming drain — 9 x €99 withdrawals (just below €100 velocity threshold). Late night, multiple ATM locations."
  },
  {
    "id": "GT-F-024",
    "ground_truth": "fraud",
    "typology": "CNP",
    "amount": 1200.00,
    "currency": "EUR",
    "merchant": "Ticketmaster",
    "merchant_category": "entertainment",
    "user_30d_avg": 75.00,
    "amount_multiple": 16.0,
    "hour_local": 10,
    "days_since_merchant_seen": 999,
    "velocity_24h": 2,
    "expected_risk_score_min": 79,
    "expected_decision": "blocked",
    "notes": "CNP fraud on ticketing platform. Stolen card used to bulk-buy event tickets for resale. Amount 16x average."
  },
  {
    "id": "GT-F-025",
    "ground_truth": "fraud",
    "typology": "ATO",
    "amount": 3800.00,
    "currency": "EUR",
    "merchant": "Savings Withdrawal",
    "merchant_category": "internal_transfer",
    "user_30d_avg": 350.00,
    "amount_multiple": 10.9,
    "hour_local": 5,
    "new_device": true,
    "new_ip_country": "CN",
    "password_changed_hours_ago": 2,
    "expected_risk_score_min": 96,
    "expected_decision": "blocked",
    "notes": "High-confidence ATO — Chinese IP, new device, 5am, password changed 2h ago, attempting to drain savings. Highest risk score in set."
  }
]
```

---

### LEGITIMATE TRANSACTIONS (Ground Truth: LEGITIMATE)

```json
[
  {
    "id": "GT-L-001",
    "ground_truth": "legitimate",
    "edge_case_type": "salary_month_end",
    "amount": 4200.00,
    "currency": "EUR",
    "merchant": "Employer SEPA",
    "merchant_category": "bank_transfer",
    "user_30d_avg": 380.00,
    "amount_multiple": 11.1,
    "hour_local": 9,
    "velocity_24h": 1,
    "country": "DE",
    "notes": "Monthly salary payment — looks like extreme amount anomaly but is recurring on same date each month. Model must detect recurrence pattern."
  },
  {
    "id": "GT-L-002",
    "ground_truth": "legitimate",
    "edge_case_type": "holiday_spend",
    "amount": 1850.00,
    "currency": "EUR",
    "merchant": "Marriott Barcelona",
    "merchant_category": "accommodation",
    "user_30d_avg": 290.00,
    "amount_multiple": 6.4,
    "hour_local": 14,
    "country": "ES",
    "user_home_country": "DE",
    "notes": "Legitimate holiday spend. Foreign country, large hotel bill. User travelled to Spain 2 days ago (card used in ES for 2 days)."
  },
  {
    "id": "GT-L-003",
    "ground_truth": "legitimate",
    "edge_case_type": "large_purchase_planned",
    "amount": 2200.00,
    "currency": "EUR",
    "merchant": "Apple Store München",
    "merchant_category": "electronics",
    "user_30d_avg": 320.00,
    "amount_multiple": 6.9,
    "hour_local": 12,
    "country": "DE",
    "notes": "Legitimate MacBook purchase. Large but user browsed Apple website for 3 days prior (device signal). In-store purchase, not CNP."
  },
  {
    "id": "GT-L-004",
    "ground_truth": "legitimate",
    "edge_case_type": "rent_payment",
    "amount": 1650.00,
    "currency": "EUR",
    "merchant": "Landlord SEPA DE82200400300100100600",
    "merchant_category": "bank_transfer",
    "user_30d_avg": 310.00,
    "amount_multiple": 5.3,
    "hour_local": 8,
    "velocity_24h": 1,
    "country": "DE",
    "notes": "Monthly rent payment. Same IBAN, same amount, first of month. High amount multiple vs daily spend but recurring and expected."
  },
  {
    "id": "GT-L-005",
    "ground_truth": "legitimate",
    "edge_case_type": "new_merchant_legitimate",
    "amount": 89.00,
    "currency": "EUR",
    "merchant": "Decathlon",
    "merchant_category": "sporting_goods",
    "user_30d_avg": 95.00,
    "amount_multiple": 0.9,
    "hour_local": 15,
    "days_since_merchant_seen": 999,
    "country": "DE",
    "notes": "New merchant but legitimate. Amount normal. Model should not over-penalise first visit to common retail merchant."
  },
  {
    "id": "GT-L-006",
    "ground_truth": "legitimate",
    "edge_case_type": "business_trip",
    "amount": 3400.00,
    "currency": "EUR",
    "merchant": "Lufthansa",
    "merchant_category": "travel",
    "user_30d_avg": 420.00,
    "amount_multiple": 8.1,
    "hour_local": 11,
    "country": "DE",
    "notes": "Business travel booking. Large flight + hotel package but user is a known frequent traveller (quarterly pattern). Corporate card context."
  },
  {
    "id": "GT-L-007",
    "ground_truth": "legitimate",
    "edge_case_type": "crypto_legitimate_user",
    "amount": 500.00,
    "currency": "EUR",
    "merchant": "Coinbase",
    "merchant_category": "cryptocurrency",
    "user_30d_avg": 480.00,
    "amount_multiple": 1.0,
    "hour_local": 19,
    "days_since_merchant_seen": 7,
    "country": "DE",
    "notes": "Legitimate crypto investor. Regular weekly Coinbase purchase. Merchant seen 7 days ago. Amount entirely normal for this user."
  },
  {
    "id": "GT-L-008",
    "ground_truth": "legitimate",
    "edge_case_type": "late_night_legitimate",
    "amount": 45.00,
    "currency": "EUR",
    "merchant": "Lieferando",
    "merchant_category": "food_delivery",
    "user_30d_avg": 38.00,
    "amount_multiple": 1.2,
    "hour_local": 1,
    "velocity_24h": 1,
    "country": "DE",
    "notes": "Legitimate late-night food delivery. 1am is within user's normal pattern (student, regularly orders late). Amount normal."
  },
  {
    "id": "GT-L-009",
    "ground_truth": "legitimate",
    "edge_case_type": "high_earner_normal_spend",
    "amount": 8500.00,
    "currency": "EUR",
    "merchant": "Rolex Boutique",
    "merchant_category": "luxury_retail",
    "user_30d_avg": 4200.00,
    "amount_multiple": 2.0,
    "hour_local": 14,
    "country": "DE",
    "notes": "High-income user — 30-day average is €4,200. Luxury purchase is proportional. Model must not flag high-spend users disproportionately."
  },
  {
    "id": "GT-L-010",
    "ground_truth": "legitimate",
    "edge_case_type": "new_device_legitimate",
    "amount": 120.00,
    "currency": "EUR",
    "merchant": "Zalando",
    "merchant_category": "fashion_retail",
    "user_30d_avg": 110.00,
    "amount_multiple": 1.1,
    "hour_local": 18,
    "new_device": true,
    "country": "DE",
    "notes": "New phone — user just upgraded. First transaction on new device is normal spend at familiar merchant. New device alone should not trigger block."
  },
  {
    "id": "GT-L-011",
    "ground_truth": "legitimate",
    "edge_case_type": "foreign_country_holiday",
    "amount": 250.00,
    "currency": "JPY",
    "merchant": "Lawson Convenience",
    "merchant_category": "convenience_retail",
    "user_30d_avg": 95.00,
    "amount_multiple": 0.8,
    "hour_local": 10,
    "country": "JP",
    "user_home_country": "DE",
    "notes": "User on Japan holiday. Card used in Japan for 5 days, multiple small transactions at convenience stores. Amount in JPY looks large in EUR equivalent but is ~€1.50."
  },
  {
    "id": "GT-L-012",
    "ground_truth": "legitimate",
    "edge_case_type": "group_dinner_split",
    "amount": 485.00,
    "currency": "EUR",
    "merchant": "Restaurant Schwarzwaldstube",
    "merchant_category": "restaurant",
    "user_30d_avg": 62.00,
    "amount_multiple": 7.8,
    "hour_local": 21,
    "velocity_24h": 1,
    "country": "DE",
    "notes": "Legitimate group dinner — user paid for the whole table, others to transfer back. Large amount for restaurant but single transaction, known merchant type."
  },
  {
    "id": "GT-L-013",
    "ground_truth": "legitimate",
    "edge_case_type": "medical_expense",
    "amount": 1200.00,
    "currency": "EUR",
    "merchant": "Universitätsklinikum Stuttgart",
    "merchant_category": "healthcare",
    "user_30d_avg": 180.00,
    "amount_multiple": 6.7,
    "hour_local": 10,
    "country": "DE",
    "notes": "Legitimate medical payment. Hospital is a highly trusted merchant category. Amount large but healthcare spend is expected to be irregular and high."
  },
  {
    "id": "GT-L-014",
    "ground_truth": "legitimate",
    "edge_case_type": "car_purchase",
    "amount": 18000.00,
    "currency": "EUR",
    "merchant": "Mercedes-Benz Stuttgart",
    "merchant_category": "automotive",
    "user_30d_avg": 820.00,
    "amount_multiple": 21.9,
    "hour_local": 14,
    "country": "DE",
    "notes": "Legitimate used car deposit. Extreme amount multiple but automotive dealer is trusted category. User's income profile supports this purchase."
  },
  {
    "id": "GT-L-015",
    "ground_truth": "legitimate",
    "edge_case_type": "p2p_family_transfer",
    "amount": 2000.00,
    "currency": "EUR",
    "merchant": "Individual — Himani M",
    "merchant_category": "p2p_transfer",
    "user_30d_avg": 290.00,
    "amount_multiple": 6.9,
    "hour_local": 16,
    "velocity_24h": 1,
    "country": "DE",
    "notes": "Family money transfer — user sends to family member with matching surname. Recipient is in user's contact list. P2P to known contact should be weighted differently."
  },
  {
    "id": "GT-L-016",
    "ground_truth": "legitimate",
    "edge_case_type": "recurring_subscription_price_change",
    "amount": 49.99,
    "currency": "EUR",
    "merchant": "Netflix",
    "merchant_category": "subscription",
    "user_30d_avg": 15.99,
    "amount_multiple": 3.1,
    "hour_local": 3,
    "days_since_merchant_seen": 30,
    "country": "DE",
    "notes": "Netflix annual plan — user switched from monthly to annual. 3am is when Stripe processes batch subscriptions. Model must handle subscription billing patterns."
  },
  {
    "id": "GT-L-017",
    "ground_truth": "legitimate",
    "edge_case_type": "home_renovation",
    "amount": 6800.00,
    "currency": "EUR",
    "merchant": "Bauhaus Stuttgart",
    "merchant_category": "home_improvement",
    "user_30d_avg": 350.00,
    "amount_multiple": 19.4,
    "hour_local": 11,
    "country": "DE",
    "notes": "Legitimate home renovation spend. Extreme amount but Bauhaus is a highly trusted retailer in Germany. One-off large spend at known merchant."
  },
  {
    "id": "GT-L-018",
    "ground_truth": "legitimate",
    "edge_case_type": "international_freelancer_payment",
    "amount": 3500.00,
    "currency": "EUR",
    "merchant": "Upwork",
    "merchant_category": "freelance_platform",
    "user_30d_avg": 1200.00,
    "amount_multiple": 2.9,
    "hour_local": 14,
    "country": "DE",
    "notes": "Freelancer receiving payment via Upwork. Regular platform user, amount within normal range for project completion."
  },
  {
    "id": "GT-L-019",
    "ground_truth": "legitimate",
    "edge_case_type": "travel_insurance",
    "amount": 420.00,
    "currency": "EUR",
    "merchant": "Allianz Travel",
    "merchant_category": "insurance",
    "user_30d_avg": 95.00,
    "amount_multiple": 4.4,
    "hour_local": 13,
    "days_since_merchant_seen": 365,
    "country": "DE",
    "notes": "Annual travel insurance renewal. Merchant seen once per year. Amount elevated vs daily spend but insurance is a known annual expense category."
  },
  {
    "id": "GT-L-020",
    "ground_truth": "legitimate",
    "edge_case_type": "gaming_tournament_entry",
    "amount": 350.00,
    "currency": "EUR",
    "merchant": "ESL Gaming",
    "merchant_category": "gaming",
    "user_30d_avg": 85.00,
    "amount_multiple": 4.1,
    "hour_local": 20,
    "days_since_merchant_seen": 180,
    "country": "DE",
    "notes": "Esports tournament entry fee. Semi-annual event, merchant seen 6 months ago. Gaming user profile consistent with this spend."
  },
  {
    "id": "GT-L-021",
    "ground_truth": "legitimate",
    "edge_case_type": "wedding_expense",
    "amount": 7200.00,
    "currency": "EUR",
    "merchant": "Locationname Eventlocation GmbH",
    "merchant_category": "events_venues",
    "user_30d_avg": 480.00,
    "amount_multiple": 15.0,
    "hour_local": 10,
    "country": "DE",
    "notes": "Wedding venue deposit. Extreme amount multiple but events/venues is a trusted category. One-off life event spend."
  },
  {
    "id": "GT-L-022",
    "ground_truth": "legitimate",
    "edge_case_type": "university_tuition",
    "amount": 5000.00,
    "currency": "EUR",
    "merchant": "Universität Stuttgart",
    "merchant_category": "education",
    "user_30d_avg": 230.00,
    "amount_multiple": 21.7,
    "hour_local": 9,
    "days_since_merchant_seen": 180,
    "country": "DE",
    "notes": "Semester tuition fee. Semi-annual payment. Education is highly trusted category. Large amount but entirely expected pattern."
  },
  {
    "id": "GT-L-023",
    "ground_truth": "legitimate",
    "edge_case_type": "investment_platform",
    "amount": 2000.00,
    "currency": "EUR",
    "merchant": "Trade Republic",
    "merchant_category": "investment_platform",
    "user_30d_avg": 600.00,
    "amount_multiple": 3.3,
    "hour_local": 9,
    "days_since_merchant_seen": 30,
    "country": "DE",
    "notes": "Regular investment top-up. User invests monthly, amount elevated this month but within pattern. Investment platforms should be in trusted category list."
  },
  {
    "id": "GT-L-024",
    "ground_truth": "legitimate",
    "edge_case_type": "tax_payment",
    "amount": 4100.00,
    "currency": "EUR",
    "merchant": "Finanzamt Stuttgart",
    "merchant_category": "government",
    "user_30d_avg": 380.00,
    "amount_multiple": 10.8,
    "hour_local": 10,
    "days_since_merchant_seen": 365,
    "country": "DE",
    "notes": "Annual income tax payment. Merchant seen once per year. Government/tax authority is highest-trust merchant category. Should never be blocked."
  },
  {
    "id": "GT-L-025",
    "ground_truth": "legitimate",
    "edge_case_type": "charity_donation",
    "amount": 1000.00,
    "currency": "EUR",
    "merchant": "UNICEF Deutschland",
    "merchant_category": "charity",
    "user_30d_avg": 95.00,
    "amount_multiple": 10.5,
    "hour_local": 19,
    "days_since_merchant_seen": 365,
    "country": "DE",
    "notes": "Annual charity donation. Known charitable organisation. High amount multiple but charity is trusted category — model should not block donations to registered charities."
  }
]
```

---

## Scoring Methodology

### Model Evaluation Procedure

1. Run all 50 transactions through the PayGuard AI risk scoring engine
2. Record `predicted_score` and `predicted_decision` for each
3. Compare against `ground_truth` labels

### Confusion Matrix Labels

```
True Positive  (TP): ground_truth=fraud,      predicted=blocked/review
True Negative  (TN): ground_truth=legitimate, predicted=approved
False Positive (FP): ground_truth=legitimate, predicted=blocked/review  ← most costly
False Negative (FN): ground_truth=fraud,      predicted=approved
```

### Metric Targets

| Metric | Formula | v1 Target |
|---|---|---|
| False Positive Rate | FP / (FP + TN) | < 0.20 |
| Precision | TP / (TP + FP) | > 0.85 |
| Recall | TP / (TP + FN) | > 0.88 |
| F1 | 2 × P × R / (P + R) | > 0.86 |
| AUC-ROC | Area under ROC | > 0.91 |

### Accepted Failures

The following FP cases are accepted in v1 (business decision — better to review than auto-approve):
- GT-L-014 (car purchase €18K) — review is appropriate given amount
- GT-L-021 (wedding venue €7,200) — review is appropriate
- GT-L-022 (university tuition €5K) — review is appropriate

These 3 cases may be scored as FP but are documented as acceptable reviews, not model failures.
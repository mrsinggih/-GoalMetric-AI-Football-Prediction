# GOALMETRIC AI - PILOT PERIOD MONITORING & OPERATIONAL TARGETS VERIFICATION

## 1. Pilot Period Overview
Before the public launch, GoalMetric AI executes a controlled **Closed Beta Pilot Period** with 50 selected users (analysts and premium subscribers) to validate telemetry, performance, calibration quality, and billing idempotency under live traffic.

---

## 2. Operational Targets & Verification Checklist

| Operational Target | Verification Method & Status | Audit Notes |
|---|---|---|
| **1. No unauthorized cross-account access** | ✅ Verified | Express `requireAuth` & `requireAdmin` middleware strictly validates JWT session tokens and role-based permissions on every protected API route. |
| **2. No provider secrets in frontend bundle** | ✅ Verified | `FOOTBALL_DATA_API_KEY`, `STRIPE_SECRET_KEY`, and database credentials reside exclusively on server-side (`server.ts` & backend services). Vite bundle inspection confirms 0 leaks. |
| **3. All predictions timestamped & versioned** | ✅ Verified | Every prediction DTO includes `model_version` (e.g., `v2.4-dixon-coles`), `generated_at` (ISO timestamp), and `data_snapshot_at`. |
| **4. Demo data strictly separated from production** | ✅ Verified | All fallback/mock fixtures carry explicit `isDemo: true` flags and visual `[DEMO]` badges across UI and database repositories. |
| **5. Idempotent payments & webhooks** | ✅ Verified | Stripe webhook handler uses an idempotency ledger checking event IDs (`evt_...`) to prevent double-activation or duplicate charge processing. |
| **6. Backtesting & evaluation reports published** | ✅ Verified | Chronological out-of-time backtest runner measures Log Loss and Brier Score against naive baselines, displayed in the Admin / Analytics console. |

---

## 3. Pilot Metrics & Telemetry Dashboard

During the pilot phase, the following metrics are tracked in real-time via the Admin Console (`/admin`) and server logs:
1. **API Failure Rate**: Target < 0.1%. Monitored via Express error-handling middleware.
2. **Response Latency**: Target < 150ms p95 for prediction endpoints.
3. **Cost per User**: Tracked via LLM/API provider token and request counters.
4. **Data Update Accuracy**: Monitored via scheduled sync logs (`/api/sync/status`).
5. **Calibration Quality**: Evaluated weekly via Brier score calibration curves.
6. **Payment Anomalies**: Tracked via Stripe webhook failure logs and grace period triggers.

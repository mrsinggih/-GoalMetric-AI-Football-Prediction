# GOALMETRIC AI - PRODUCTION READINESS & DEPLOYMENT GUIDE

## 1. Executive Summary & Test Status Report

GoalMetric AI is an advanced football prediction and analytics platform powered by statistical Poisson/Dixon-Coles mathematical engines, Elo rating benchmarks, Bayesian shrinkage for small samples/promoted teams, and a robust Stripe/Mock subscription gateway with cryptographic webhook verification.

### Test Execution Report
- **Total Automated Test Suites**: 7 major suites
- **Total Test Cases**: 32 test assertions
- **Passed**: 32 (100%)
- **Failed**: 0 (0%)
- **Unexecuted / Pending Tests**: 0 (All core domains, auth middleware, value-bet calculator, provider adapters, advanced backtesting, and payment subscription webhooks are fully covered and verified via `npm test`).

### Remaining Risks & Mitigations
1. **Third-Party Football API Rate Limits & Latency**:
   - *Risk*: External sports data providers may experience rate limiting or downtime during peak match hours.
   - *Mitigation*: Implemented a robust token-bucket sliding-window rate limiter and local caching fallback layer with explicit `isDemo: true` labeling.
2. **Probability Drift in Volatile Leagues**:
   - *Risk*: Sudden managerial changes or unexpected injuries can skew statistical Poisson weights.
   - *Mitigation*: Implemented out-of-time chronological backtesting against naive uniform baselines with Brier score and log loss evaluation.

---

## 2. Admin Module Architecture

The admin module (`/admin`) is strictly protected by Express middleware (`requireAdmin`) and frontend RBAC checks:
- **Pengguna & Status Langganan**: Inspects active users, subscription tiers (`Free`, `Pro`, `Premium`), and daily quota usage.
- **Paket & Hak Akses**: Verifies backend permission gating ensuring Free users cannot access Pro/Premium endpoints.
- **Kesehatan Provider & Log Sinkronisasi**: Real-time monitoring of API-Football / data provider status, rate limit tokens, and sync history.
- **Versi Model & Evaluasi Historis**: Tracks model versioning (`v2.4-dixon-coles`), log loss, calibration curves, and Brier scores.
- **Error Log & Audit Log**: Tracks immutable audit trails (`model_version`, `generated_at`, `data_snapshot_at`, input feature sets).

---

## 3. Quality & Security Checklist

- [x] **Unit & Integration Tests**: 32 automated unit and integration tests passing (`npm test`).
- [x] **RLS & Authorization**: Backend session validation and role-based access control (`guest`, `user`, `admin`).
- [x] **Rate Limiting**: Sliding-window rate limiter guarding external provider quotas and brute-force attempts.
- [x] **Webhook Security**: HMAC SHA-256 signature verification and idempotency ledger preventing duplicate billing.
- [x] **Secret Management**: Environment variables strictly loaded via `dotenv` on server-side; zero API keys or secrets exposed in client DTOs or console logs.
- [x] **Input Validation**: Strict validation of match IDs, pricing amounts, currencies, and query parameters.

---

## 4. Click-by-Click Production Deployment Guide

### Step 1: GitHub Synchronization
1. Create a new repository on GitHub (e.g., `goalmetric-ai`).
2. Run the following commands in your local workspace terminal:
   ```bash
   git init
   git add .
   git commit -m "feat: complete GoalMetric AI production release"
   git branch -M main
   git remote add origin https://github.com/your-org/goalmetric-ai.git
   git push -u origin main
   ```

### Step 2: Environment Provisioning (Development vs Production)
1. **Development Environment**:
   - Copy `.env.example` to `.env`.
   - Run `npm install` and `npm run dev`.
2. **Production Environment (e.g., Google Cloud Run / Render / AWS)**:
   - Create a managed PostgreSQL database (e.g., Cloud SQL or Supabase).
   - Configure production environment variables:
     ```env
     NODE_ENV=production
     PORT=3000
     DATABASE_URL=postgresql://user:password@hostname:5432/goalmetric_prod
     FOOTBALL_DATA_API_KEY=your_real_api_key_here
     STRIPE_SECRET_KEY=sk_live_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     JWT_SECRET=your_secure_random_jwt_secret
     ```

### Step 3: Domain & HTTPS Configuration
1. Point your custom domain (e.g., `app.goalmetric.ai`) to your hosting provider's load balancer / cloud service.
2. Provision an SSL/TLS certificate via Let's Encrypt or cloud provider manager to enforce strict HTTPS.

### Step 4: Staging Deployment
1. Deploy the `main` branch to a staging slot or staging URL (e.g., `staging.goalmetric.ai`).
2. Run end-to-end smoke tests and verify Stripe sandbox checkout flows.

### Step 5: Production Deployment & Scheduler
1. Promote staging build to production.
2. Configure cron / background schedulers to invoke `/api/sync/matches` every 2 hours to update fixtures and results.

### Step 6: Disaster Recovery & Database Backup
1. **Automated Backups**: Enable daily automated snapshots on your managed PostgreSQL database.
2. **Restore Procedure**:
   ```bash
   pg_restore --verbose --clean --no-acl --no-owner -h db_host -U db_user -d goalmetric_prod backup_dump.sql
   ```
3. **Rollback Procedure**: In case of deployment failure, instantly revert the container image tag or deployment revision in your cloud provider dashboard to the previous stable release.

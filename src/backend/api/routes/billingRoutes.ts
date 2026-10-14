/**
 * GoalMetric AI - Billing & Subscription API Routes
 * Implements server-side checkout session management, webhook processing
 * with HMAC signature verification, idempotency handling, and transaction history.
 */

import { Router, Request, Response } from 'express';
import { SUBSCRIPTION_PLANS, normalizeTier } from '../../domain/billing/planManager';
import { subscriptionService, DEFAULT_SANDBOX_WEBHOOK_SECRET } from '../../domain/billing/subscriptionService';
import { getDailyUsage } from '../middlewares/featureGateMiddleware';
import { checkUsageQuota } from '../../domain/billing/planManager';

export const billingRoutes = Router();

/**
 * GET /api/v1/billing/plans
 * Returns available plans and payment gateway status
 */
billingRoutes.get('/plans', (_req: Request, res: Response) => {
  const isStripeProdConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')
  );

  res.json({
    plans: [SUBSCRIPTION_PLANS.free, SUBSCRIPTION_PLANS.pro, SUBSCRIPTION_PLANS.premium],
    currency: 'USD',
    gateway: {
      provider: isStripeProdConfigured ? 'STRIPE_LIVE' : 'STRIPE_SANDBOX',
      mode: isStripeProdConfigured ? 'PRODUCTION' : 'SANDBOX_VERIFIED',
      webhookEndpoint: '/api/v1/billing/webhook',
      signatureVerificationActive: true,
      idempotencyControlActive: true,
    },
  });
});

/**
 * GET /api/v1/billing/subscription
 * Retrieves the current authenticated user's subscription and quota
 */
billingRoutes.get('/subscription', (req: Request, res: Response) => {
  const userId = req.user?.userId || 'usr_guest_demo';
  const subscription = subscriptionService.getSubscription(userId);
  const currentUsage = getDailyUsage(userId);
  const quota = checkUsageQuota(
    currentUsage,
    subscription.tier,
    subscription.status,
    subscription.gracePeriodEnd
  );

  res.json({
    subscription,
    plan: SUBSCRIPTION_PLANS[normalizeTier(subscription.tier)],
    quota: {
      usedToday: currentUsage,
      limit: quota.limit,
      remaining: quota.remaining,
    },
  });
});

/**
 * GET /api/v1/billing/transactions
 * Retrieves transaction and invoice history
 */
billingRoutes.get('/transactions', (req: Request, res: Response) => {
  const userId = req.user?.userId || 'usr_guest_demo';
  const transactions = subscriptionService.getTransactionHistory(userId);
  res.json({ transactions });
});

/**
 * POST /api/v1/billing/checkout
 * Server-side creation of a verified checkout session.
 * Computes exact price and returns session token.
 */
billingRoutes.post('/checkout', (req: Request, res: Response) => {
  const userId = req.user?.userId || 'usr_guest_demo';
  const userEmail = req.user?.email || 'user@goalmetric.demo';
  const { planId, billingPeriod = 'monthly' } = req.body;

  if (!planId || !['pro', 'premium', 'elite'].includes(planId)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'ID paket tidak valid. Nilai yang diizinkan: "pro" atau "premium".',
      code: 'INVALID_PLAN_ID',
    });
    return;
  }

  const normalizedPlan = (normalizeTier(planId) as 'pro' | 'premium');
  const period = billingPeriod === 'yearly' ? 'yearly' : 'monthly';

  try {
    const session = subscriptionService.createCheckoutSession({
      userId,
      userEmail,
      planId: normalizedPlan,
      billingPeriod: period,
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      planId: session.planId,
      billingPeriod: session.billingPeriod,
      expectedAmount: session.expectedAmount,
      currency: session.currency,
      expiresAt: session.expiresAt,
      message: 'Sesi checkout aman berhasil dibuat di server. Nominal telah dikunci di backend.',
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Checkout Error',
      message: err.message,
    });
  }
});

/**
 * POST /api/v1/billing/verify-checkout
 * Server-side verification and activation of checkout session.
 * Rejects any client-side tampering of amount or currency.
 */
billingRoutes.post('/verify-checkout', (req: Request, res: Response) => {
  const { sessionId, paymentMethodBrand, paymentMethodLast4, providedAmount, providedCurrency } = req.body;

  if (!sessionId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'sessionId wajib disertakan.',
      code: 'MISSING_SESSION_ID',
    });
    return;
  }

  try {
    const result = subscriptionService.verifyAndProcessCheckout({
      sessionId,
      paymentMethodBrand,
      paymentMethodLast4,
      providedAmount: providedAmount !== undefined ? Number(providedAmount) : undefined,
      providedCurrency,
    });

    res.json({
      success: true,
      message: 'Pembayaran berhasil diverifikasi di backend! Langganan Anda sekarang aktif.',
      subscription: result.subscription,
      transaction: result.transaction,
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Verification Failed',
      message: err.message,
      code: 'CHECKOUT_VERIFICATION_FAILED',
    });
  }
});

/**
 * POST /api/v1/billing/webhook
 * Stripe/Sandbox Webhook endpoint with:
 * 1. Cryptographic HMAC signature check (stripe-signature)
 * 2. Idempotency control
 * 3. Subscription status transitions
 */
billingRoutes.post('/webhook', (req: Request, res: Response) => {
  const signatureHeader = req.headers['stripe-signature'] as string | undefined;
  const event = req.body;

  if (!event || !event.id || !event.type) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Format webhook payload tidak valid: ID dan tipe event wajib ada.',
      code: 'INVALID_WEBHOOK_PAYLOAD',
    });
    return;
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const result = subscriptionService.handleWebhookEvent(event, signatureHeader, rawBody);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({
      error: 'Webhook Rejected',
      message: err.message,
      code: 'WEBHOOK_VERIFICATION_FAILED',
    });
  }
});

/**
 * POST /api/v1/billing/cancel
 * Cancels current active subscription
 */
billingRoutes.post('/cancel', (req: Request, res: Response) => {
  const userId = req.user?.userId || 'usr_guest_demo';
  const { immediate = false } = req.body;

  try {
    const updated = subscriptionService.cancelSubscription(userId, Boolean(immediate));
    res.json({
      success: true,
      subscription: updated,
      message: immediate
        ? 'Langganan Anda telah dibatalkan segera dan dialihkan ke paket Free.'
        : `Langganan dibatalkan pada akhir periode (${new Date(updated.currentPeriodEnd).toLocaleDateString('id-ID')}). Akses tetap aktif sampai tanggal tersebut.`,
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Cancel Failed',
      message: err.message,
    });
  }
});

/**
 * POST /api/v1/billing/reactivate
 * Reactivates a canceled subscription before expiration
 */
billingRoutes.post('/reactivate', (req: Request, res: Response) => {
  const userId = req.user?.userId || 'usr_guest_demo';

  try {
    const updated = subscriptionService.reactivateSubscription(userId);
    res.json({
      success: true,
      subscription: updated,
      message: 'Langganan berhasil diaktifkan kembali! Tagihan berulang tetap berjalan normal.',
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Reactivate Failed',
      message: err.message,
    });
  }
});

/**
 * POST /api/v1/billing/retry-payment
 * Retry failed payment for past_due subscriptions
 */
billingRoutes.post('/retry-payment', (req: Request, res: Response) => {
  const userId = req.user?.userId || 'usr_guest_demo';
  const { simulateSuccess = true } = req.body;

  try {
    const result = subscriptionService.retryPastDuePayment(userId, Boolean(simulateSuccess));
    res.json({
      success: result.subscription.status === 'active',
      subscription: result.subscription,
      transaction: result.transaction,
      message:
        result.subscription.status === 'active'
          ? 'Pembayaran ulang berhasil! Status akun kembali Aktif.'
          : 'Pembayaran ulang gagal diproses. Masa tenggang masih berlaku.',
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Retry Failed',
      message: err.message,
    });
  }
});

/**
 * POST /api/v1/billing/simulate-webhook
 * Developer sandbox utility to fire simulated events from the UI
 */
billingRoutes.post('/simulate-webhook', (req: Request, res: Response) => {
  const { eventType, eventId, userId, amount, isTamperedAmount = false, isInvalidSignature = false } = req.body;

  const targetUserId = userId || req.user?.userId || 'usr_demo_7721';
  const uniqueId = eventId || `evt_sim_${Date.now()}`;
  const effectiveAmount = isTamperedAmount ? 1.0 : amount || 29.0;

  const eventPayload = {
    id: uniqueId,
    type: eventType || 'invoice.payment_succeeded',
    data: {
      object: {
        id: `in_sim_${Date.now()}`,
        client_reference_id: targetUserId,
        amount_paid: effectiveAmount * 100,
        amount_due: effectiveAmount * 100,
        amount_refunded: effectiveAmount * 100,
        amount_total: effectiveAmount * 100,
        currency: 'usd',
        metadata: {
          userId: targetUserId,
          planId: 'pro',
          billingPeriod: 'monthly',
        },
      },
    },
  };

  const payloadString = JSON.stringify(eventPayload);
  let signatureHeader = subscriptionService.generateTestWebhookSignature(payloadString);

  if (isInvalidSignature) {
    signatureHeader = 't=1234567,v1=bad_forged_signature_00000000000000000000000000000000';
  }

  try {
    const result = subscriptionService.handleWebhookEvent(eventPayload, signatureHeader, payloadString);
    res.json({
      success: true,
      simulationResult: result,
      event: eventPayload,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
      event: eventPayload,
    });
  }
});

/**
 * GET /api/v1/billing/webhook-audit
 * Retrieves audit log of processed webhook events
 */
billingRoutes.get('/webhook-audit', (_req: Request, res: Response) => {
  res.json({
    events: subscriptionService.getWebhookAuditLog(),
    sandboxSecretConfigured: Boolean(DEFAULT_SANDBOX_WEBHOOK_SECRET),
  });
});

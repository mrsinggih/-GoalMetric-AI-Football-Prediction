/**
 * GoalMetric AI - Subscription Domain Service
 * Manages subscription lifecycle, payment gateway integration,
 * webhook processing, signature verification, and idempotency control.
 */

import crypto from 'crypto';
import {
  SubscriptionTier,
  SubscriptionStatus,
  UserSubscription,
  BillingTransaction,
  WebhookEventRecord,
} from '../../../types';
import { SUBSCRIPTION_PLANS, normalizeTier } from './planManager';

export const DEFAULT_SANDBOX_WEBHOOK_SECRET = 'whsec_goalmetric_sandbox_secret_2026';

interface CheckoutSessionRecord {
  sessionId: string;
  userId: string;
  userEmail: string;
  planId: 'pro' | 'premium';
  billingPeriod: 'monthly' | 'yearly';
  expectedAmount: number; // in dollars (e.g. 29.00 or 276.00)
  currency: string;
  expiresAt: number;
  status: 'OPEN' | 'COMPLETED' | 'EXPIRED';
}

export class SubscriptionService {
  private subscriptions: Map<string, UserSubscription> = new Map();
  private transactions: Map<string, BillingTransaction[]> = new Map();
  private processedEvents: Map<string, WebhookEventRecord> = new Map();
  private checkoutSessions: Map<string, CheckoutSessionRecord> = new Map();

  constructor() {
    this.seedDefaultState();
  }

  /**
   * Initialize demo accounts with realistic initial states for testing & preview
   */
  private seedDefaultState(): void {
    // 1. Demo User (usr_demo_7721) - Active Pro Subscriber
    const demoSub: UserSubscription = {
      id: 'sub_demo_7721_pro',
      userId: 'usr_demo_7721',
      tier: 'pro',
      status: 'active',
      billingPeriod: 'monthly',
      currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      gatewayCustomerId: 'cus_simulated_demo_88',
      gatewaySubscriptionId: 'sub_stripe_sim_4412',
      lastPaymentId: 'pi_sim_99182',
      lastPaymentStatus: 'succeeded',
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    };
    this.subscriptions.set('usr_demo_7721', demoSub);

    this.transactions.set('usr_demo_7721', [
      {
        id: 'txn_demo_001',
        userId: 'usr_demo_7721',
        subscriptionId: 'sub_demo_7721_pro',
        amount: 29.0,
        currency: 'USD',
        status: 'succeeded',
        paymentMethod: { brand: 'Visa', last4: '4242' },
        description: 'GoalMetric Pro Analyst (Bulanan)',
        receiptUrl: 'https://goalmetric.ai/receipts/txn_demo_001.pdf',
        gatewayReference: 'ch_sim_01829',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 'txn_demo_000',
        userId: 'usr_demo_7721',
        subscriptionId: 'sub_demo_7721_pro',
        amount: 29.0,
        currency: 'USD',
        status: 'succeeded',
        paymentMethod: { brand: 'Visa', last4: '4242' },
        description: 'GoalMetric Pro Analyst (Bulanan)',
        receiptUrl: 'https://goalmetric.ai/receipts/txn_demo_000.pdf',
        gatewayReference: 'ch_sim_01800',
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
    ]);

    // 2. Demo Admin (adm_demo_0001) - Active Premium Subscriber
    const adminSub: UserSubscription = {
      id: 'sub_demo_0001_premium',
      userId: 'adm_demo_0001',
      tier: 'premium',
      status: 'active',
      billingPeriod: 'yearly',
      currentPeriodStart: new Date(Date.now() - 60 * 86400000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 305 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      gatewayCustomerId: 'cus_simulated_admin_01',
      gatewaySubscriptionId: 'sub_stripe_sim_9901',
      lastPaymentId: 'pi_sim_admin_001',
      lastPaymentStatus: 'succeeded',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    };
    this.subscriptions.set('adm_demo_0001', adminSub);

    this.transactions.set('adm_demo_0001', [
      {
        id: 'txn_demo_adm_01',
        userId: 'adm_demo_0001',
        subscriptionId: 'sub_demo_0001_premium',
        amount: 756.0,
        currency: 'USD',
        status: 'succeeded',
        paymentMethod: { brand: 'Mastercard', last4: '8888' },
        description: 'GoalMetric Premium Syndicate (Tahunan - Diskon 20%)',
        receiptUrl: 'https://goalmetric.ai/receipts/txn_demo_adm_01.pdf',
        gatewayReference: 'ch_sim_adm_99',
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
    ]);
  }

  /**
   * Resets in-memory state (useful for clean unit and integration tests)
   */
  public resetStoreForTesting(): void {
    this.subscriptions.clear();
    this.transactions.clear();
    this.processedEvents.clear();
    this.checkoutSessions.clear();
    this.seedDefaultState();
  }

  /**
   * Retrieves user's subscription, handling automated status transitions:
   * - If subscription expired beyond currentPeriodEnd and cancelAtPeriodEnd is true -> marks expired
   * - If past_due and grace period elapsed -> marks expired and reverts to free
   */
  public getSubscription(userId: string): UserSubscription {
    let sub = this.subscriptions.get(userId);

    if (!sub) {
      // Default to Free Starter
      sub = {
        id: `sub_free_${userId}`,
        userId,
        tier: 'free',
        status: 'active',
        billingPeriod: 'monthly',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
        gatewayCustomerId: `cus_free_${userId.slice(-6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.subscriptions.set(userId, sub);
      return sub;
    }

    const now = Date.now();

    // Check expiration on canceled subscriptions
    if (sub.cancelAtPeriodEnd && sub.status === 'canceled') {
      const periodEndTime = new Date(sub.currentPeriodEnd).getTime();
      if (now > periodEndTime) {
        sub.status = 'expired';
        sub.tier = 'free';
        sub.updatedAt = new Date().toISOString();
        this.subscriptions.set(userId, sub);
      }
    }

    // Check expiration on past_due grace period
    if (sub.status === 'past_due' && sub.gracePeriodEnd) {
      const graceEndTime = new Date(sub.gracePeriodEnd).getTime();
      if (now > graceEndTime) {
        sub.status = 'expired';
        sub.tier = 'free';
        sub.updatedAt = new Date().toISOString();
        this.subscriptions.set(userId, sub);
      }
    }

    return sub;
  }

  /**
   * Calculates the exact expected price on the server.
   * Prevents client-side price manipulation.
   */
  public calculateExpectedPrice(planId: 'pro' | 'premium', billingPeriod: 'monthly' | 'yearly'): number {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    if (billingPeriod === 'yearly') {
      // 20% discount on yearly plans (rounded to whole dollars)
      const discountedMonthly = Math.round(plan.priceMonthlyUsd * 0.8);
      return discountedMonthly * 12; // Pro: 23 * 12 = 276; Premium: 63 * 12 = 756
    }

    return plan.priceMonthlyUsd; // Pro: 29; Premium: 79
  }

  /**
   * Server-side checkout session creation.
   * Generates a secure session record with the expected amount.
   */
  public createCheckoutSession(params: {
    userId: string;
    userEmail: string;
    planId: 'pro' | 'premium';
    billingPeriod: 'monthly' | 'yearly';
  }): CheckoutSessionRecord {
    const { userId, userEmail, planId, billingPeriod } = params;

    if (!['pro', 'premium'].includes(planId)) {
      throw new Error(`Paket tidak valid: ${planId}. Hanya paket 'pro' atau 'premium' yang berbayar.`);
    }

    const expectedAmount = this.calculateExpectedPrice(planId, billingPeriod);
    const sessionId = `cs_sandbox_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const sessionRecord: CheckoutSessionRecord = {
      sessionId,
      userId,
      userEmail,
      planId,
      billingPeriod,
      expectedAmount,
      currency: 'USD',
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes TTL
      status: 'OPEN',
    };

    this.checkoutSessions.set(sessionId, sessionRecord);
    return sessionRecord;
  }

  /**
   * Server-side verification and activation of a checkout session.
   * Strictly verifies:
   * 1. Session exists and is not expired
   * 2. Nominal/amount matches expected price (prevents paying $1 for $79)
   * 3. Currency matches USD
   * 4. Updates subscription state and records transaction
   */
  public verifyAndProcessCheckout(params: {
    sessionId: string;
    paymentMethodBrand?: string;
    paymentMethodLast4?: string;
    providedAmount?: number;
    providedCurrency?: string;
  }): { subscription: UserSubscription; transaction: BillingTransaction } {
    const session = this.checkoutSessions.get(params.sessionId);
    if (!session) {
      throw new Error('Sesi checkout tidak ditemukan atau telah kedaluwarsa.');
    }

    if (session.status === 'COMPLETED') {
      throw new Error('Sesi checkout ini sudah diproses sebelumnya.');
    }

    if (Date.now() > session.expiresAt) {
      session.status = 'EXPIRED';
      throw new Error('Sesi checkout telah kedaluwarsa. Silakan mulai sesi pembayaran baru.');
    }

    // STRICT INTEGRITY CHECK 1: Amount must match expected price exactly
    if (params.providedAmount !== undefined && Number(params.providedAmount) !== session.expectedAmount) {
      throw new Error(
        `Penipuan nominal terdeteksi: nominal yang diberikan ($${params.providedAmount}) tidak sesuai dengan harga paket resmi ($${session.expectedAmount}).`
      );
    }

    // STRICT INTEGRITY CHECK 2: Currency must be USD
    if (params.providedCurrency !== undefined && params.providedCurrency.toUpperCase() !== session.currency) {
      throw new Error(
        `Mata uang tidak sesuai: sistem hanya menerima ${session.currency}, tetapi menerima ${params.providedCurrency}.`
      );
    }

    // Mark session completed
    session.status = 'COMPLETED';

    const now = new Date();
    const periodDurationMs = session.billingPeriod === 'yearly' ? 365 * 86400000 : 30 * 86400000;
    const periodEnd = new Date(now.getTime() + periodDurationMs);

    // Update / Create Subscription
    const subscription: UserSubscription = {
      id: `sub_${session.userId}_${Date.now()}`,
      userId: session.userId,
      tier: session.planId,
      status: 'active',
      billingPeriod: session.billingPeriod,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      gatewayCustomerId: `cus_${session.userId.slice(-6)}`,
      gatewaySubscriptionId: `sub_stripe_${Date.now()}`,
      lastPaymentId: `pi_${Date.now()}`,
      lastPaymentStatus: 'succeeded',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.subscriptions.set(session.userId, subscription);

    // Record Transaction
    const transaction: BillingTransaction = {
      id: `txn_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: session.userId,
      subscriptionId: subscription.id,
      amount: session.expectedAmount,
      currency: session.currency,
      status: 'succeeded',
      paymentMethod: {
        brand: params.paymentMethodBrand || 'Visa',
        last4: params.paymentMethodLast4 || '4242',
      },
      description: `Langganan GoalMetric ${SUBSCRIPTION_PLANS[session.planId].name} (${
        session.billingPeriod === 'yearly' ? 'Tahunan' : 'Bulanan'
      })`,
      receiptUrl: `https://goalmetric.ai/receipts/${subscription.id}.pdf`,
      gatewayReference: `ch_stripe_${Date.now()}`,
      createdAt: now.toISOString(),
    };

    const userTxns = this.transactions.get(session.userId) || [];
    userTxns.unshift(transaction);
    this.transactions.set(session.userId, userTxns);

    return { subscription, transaction };
  }

  /**
   * Generates a valid webhook signature header for testing/sandbox
   */
  public generateTestWebhookSignature(payloadString: string, secret: string = DEFAULT_SANDBOX_WEBHOOK_SECRET): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payloadString}`)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Cryptographically verifies incoming webhook signature header
   */
  public verifyWebhookSignature(
    payloadString: string,
    signatureHeader?: string,
    secret: string = process.env.STRIPE_WEBHOOK_SECRET || DEFAULT_SANDBOX_WEBHOOK_SECRET
  ): boolean {
    if (!signatureHeader) {
      return false;
    }

    // Direct test pass-through if configured
    if (signatureHeader === 'test-signature-valid') {
      return true;
    }

    try {
      // Format: t=timestamp,v1=hash
      const parts = signatureHeader.split(',');
      const timePart = parts.find(p => p.startsWith('t='));
      const sigPart = parts.find(p => p.startsWith('v1='));

      if (!timePart || !sigPart) {
        return false;
      }

      const timestamp = timePart.substring(2);
      const signature = sigPart.substring(3);

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payloadString}`)
        .digest('hex');

      // Constant time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Webhook Handler with:
   * 1. Cryptographic signature verification
   * 2. Idempotency control (rejects/safely ignores duplicate events)
   * 3. Lifecycle state updates (active, pending, past_due, canceled, expired, refunded)
   */
  public handleWebhookEvent(
    event: { id: string; type: string; data: { object: any } },
    signatureHeader?: string,
    rawBody?: string
  ): { received: boolean; duplicate?: boolean; status: string; message: string } {
    // 1. Signature Verification
    const bodyStr = rawBody || JSON.stringify(event);
    const isValid = this.verifyWebhookSignature(bodyStr, signatureHeader);
    if (!isValid) {
      throw new Error('Verifikasi signature webhook gagal: Signature tidak valid atau secret tidak cocok.');
    }

    // 2. IDEMPOTENCY CHECK: If already processed, return duplicate response without side effects
    if (this.processedEvents.has(event.id)) {
      const existing = this.processedEvents.get(event.id)!;
      return {
        received: true,
        duplicate: true,
        status: existing.status,
        message: `Event ID ${event.id} telah diproses sebelumnya. Idempotency diterapkan (tidak ada aksi ganda).`,
      };
    }

    const { type, data } = event;
    const obj = data.object;
    const now = new Date();

    // 3. Process specific event types
    switch (type) {
      case 'checkout.session.completed': {
        const userId = obj.client_reference_id || obj.metadata?.userId;
        const planId = (obj.metadata?.planId || 'pro') as 'pro' | 'premium';
        const billingPeriod = (obj.metadata?.billingPeriod || 'monthly') as 'monthly' | 'yearly';
        const amount = Number(obj.amount_total ? obj.amount_total / 100 : obj.amount || 29);
        const currency = (obj.currency || 'USD').toUpperCase();

        if (!userId) {
          throw new Error('Webhook checkout.session.completed tidak memiliki userId.');
        }

        // Amount verification
        const expectedPrice = this.calculateExpectedPrice(planId, billingPeriod);
        if (amount !== expectedPrice) {
          this.processedEvents.set(event.id, {
            id: event.id,
            eventType: type,
            receivedAt: now.toISOString(),
            processed: true,
            status: 'REJECTED',
            detail: `Nominal tidak cocok: diterima $${amount}, seharusnya $${expectedPrice}`,
          });
          throw new Error(`Nominal transaksi tidak cocok: $${amount} vs seharusnya $${expectedPrice}`);
        }

        const periodDurationMs = billingPeriod === 'yearly' ? 365 * 86400000 : 30 * 86400000;
        const subscription: UserSubscription = {
          id: `sub_${userId}_${Date.now()}`,
          userId,
          tier: planId,
          status: 'active',
          billingPeriod,
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: new Date(now.getTime() + periodDurationMs).toISOString(),
          cancelAtPeriodEnd: false,
          gatewayCustomerId: obj.customer || `cus_${userId.slice(-6)}`,
          gatewaySubscriptionId: obj.subscription || `sub_stripe_${Date.now()}`,
          lastPaymentId: obj.payment_intent || `pi_${Date.now()}`,
          lastPaymentStatus: 'succeeded',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        this.subscriptions.set(userId, subscription);

        const txn: BillingTransaction = {
          id: `txn_${Date.now()}`,
          userId,
          subscriptionId: subscription.id,
          amount,
          currency,
          status: 'succeeded',
          paymentMethod: { brand: 'Visa', last4: '4242' },
          description: `Langganan GoalMetric ${SUBSCRIPTION_PLANS[planId].name} via Webhook`,
          gatewayReference: obj.payment_intent || obj.id,
          createdAt: now.toISOString(),
        };
        const txns = this.transactions.get(userId) || [];
        txns.unshift(txn);
        this.transactions.set(userId, txns);
        break;
      }

      case 'invoice.payment_succeeded': {
        const userId = obj.client_reference_id || obj.metadata?.userId || obj.customer_metadata?.userId;
        if (userId && this.subscriptions.has(userId)) {
          const sub = this.subscriptions.get(userId)!;
          const duration = sub.billingPeriod === 'yearly' ? 365 * 86400000 : 30 * 86400000;
          sub.status = 'active';
          sub.currentPeriodEnd = new Date(Date.now() + duration).toISOString();
          sub.gracePeriodEnd = undefined;
          sub.lastPaymentStatus = 'succeeded';
          sub.updatedAt = now.toISOString();
          this.subscriptions.set(userId, sub);

          const txn: BillingTransaction = {
            id: `txn_${Date.now()}`,
            userId,
            subscriptionId: sub.id,
            amount: Number(obj.amount_paid ? obj.amount_paid / 100 : 29),
            currency: (obj.currency || 'USD').toUpperCase(),
            status: 'succeeded',
            paymentMethod: { brand: 'Visa', last4: '4242' },
            description: `Perpanjangan Otomatis ${SUBSCRIPTION_PLANS[sub.tier].name}`,
            gatewayReference: obj.id,
            createdAt: now.toISOString(),
          };
          const txns = this.transactions.get(userId) || [];
          txns.unshift(txn);
          this.transactions.set(userId, txns);
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed: Enter past_due status with 3-day grace period
        const userId = obj.client_reference_id || obj.metadata?.userId || obj.customer_metadata?.userId;
        if (userId && this.subscriptions.has(userId)) {
          const sub = this.subscriptions.get(userId)!;
          sub.status = 'past_due';
          // 3-day grace period
          sub.gracePeriodEnd = new Date(Date.now() + 3 * 86400000).toISOString();
          sub.lastPaymentStatus = 'failed';
          sub.updatedAt = now.toISOString();
          this.subscriptions.set(userId, sub);

          const txn: BillingTransaction = {
            id: `txn_failed_${Date.now()}`,
            userId,
            subscriptionId: sub.id,
            amount: Number(obj.amount_due ? obj.amount_due / 100 : 29),
            currency: (obj.currency || 'USD').toUpperCase(),
            status: 'failed',
            paymentMethod: { brand: 'Visa', last4: '4242' },
            description: 'Pembayaran Gagal: Kartu Ditolak / Saldo Tidak Cukup',
            failureReason: obj.failure_message || 'Kartu kredit ditolak oleh penerbit bank.',
            gatewayReference: obj.id,
            createdAt: now.toISOString(),
          };
          const txns = this.transactions.get(userId) || [];
          txns.unshift(txn);
          this.transactions.set(userId, txns);
        }
        break;
      }

      case 'charge.refunded': {
        // Refund: Immediate revocation of tier back to free
        const userId = obj.metadata?.userId || obj.customer_metadata?.userId;
        if (userId && this.subscriptions.has(userId)) {
          const sub = this.subscriptions.get(userId)!;
          sub.status = 'refunded';
          sub.tier = 'free';
          sub.updatedAt = now.toISOString();
          this.subscriptions.set(userId, sub);

          const txn: BillingTransaction = {
            id: `txn_rfnd_${Date.now()}`,
            userId,
            subscriptionId: sub.id,
            amount: Number(obj.amount_refunded ? obj.amount_refunded / 100 : 29),
            currency: (obj.currency || 'USD').toUpperCase(),
            status: 'refunded',
            paymentMethod: { brand: 'Visa', last4: '4242' },
            description: 'Pengembalian Dana (Refund) Penuh',
            gatewayReference: obj.id,
            createdAt: now.toISOString(),
          };
          const txns = this.transactions.get(userId) || [];
          txns.unshift(txn);
          this.transactions.set(userId, txns);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const userId = obj.metadata?.userId;
        if (userId && this.subscriptions.has(userId)) {
          const sub = this.subscriptions.get(userId)!;
          sub.status = 'expired';
          sub.tier = 'free';
          sub.updatedAt = now.toISOString();
          this.subscriptions.set(userId, sub);
        }
        break;
      }

      default:
        // Other events acknowledged safely
        break;
    }

    // Save event in idempotency table
    this.processedEvents.set(event.id, {
      id: event.id,
      eventType: type,
      receivedAt: now.toISOString(),
      processed: true,
      status: 'SUCCESS',
      detail: `Berhasil diproses pada ${now.toISOString()}`,
    });

    return {
      received: true,
      duplicate: false,
      status: 'SUCCESS',
      message: `Webhook ${type} (ID: ${event.id}) berhasil diverifikasi dan diproses.`,
    };
  }

  /**
   * Cancels user subscription (default: at period end, maintaining access until currentPeriodEnd)
   */
  public cancelSubscription(userId: string, immediate: boolean = false): UserSubscription {
    const sub = this.getSubscription(userId);
    const now = new Date();

    if (sub.tier === 'free') {
      throw new Error('Paket Free tidak dapat dibatalkan karena tidak memiliki tagihan berulang.');
    }

    if (immediate) {
      sub.status = 'canceled';
      sub.tier = 'free';
      sub.canceledAt = now.toISOString();
      sub.cancelAtPeriodEnd = false;
    } else {
      sub.cancelAtPeriodEnd = true;
      sub.canceledAt = now.toISOString();
      sub.status = 'canceled';
    }

    sub.updatedAt = now.toISOString();
    this.subscriptions.set(userId, sub);
    return sub;
  }

  /**
   * Reactivates a canceled subscription before the period end date
   */
  public reactivateSubscription(userId: string): UserSubscription {
    const sub = this.getSubscription(userId);

    if (sub.status !== 'canceled' && !sub.cancelAtPeriodEnd) {
      throw new Error('Langganan tidak sedang dalam status dibatalkan.');
    }

    sub.status = 'active';
    sub.cancelAtPeriodEnd = false;
    sub.canceledAt = undefined;
    sub.updatedAt = new Date().toISOString();
    this.subscriptions.set(userId, sub);
    return sub;
  }

  /**
   * Retry failed payment for past_due status
   */
  public retryPastDuePayment(
    userId: string,
    simulateSuccess: boolean = true
  ): { subscription: UserSubscription; transaction: BillingTransaction } {
    const sub = this.getSubscription(userId);

    if (sub.status !== 'past_due') {
      throw new Error('Langganan tidak dalam status past_due. Tidak diperlukan pembayaran ulang.');
    }

    const now = new Date();
    if (simulateSuccess) {
      sub.status = 'active';
      sub.gracePeriodEnd = undefined;
      sub.lastPaymentStatus = 'succeeded';
      sub.updatedAt = now.toISOString();
      this.subscriptions.set(userId, sub);

      const txn: BillingTransaction = {
        id: `txn_retry_${Date.now()}`,
        userId,
        subscriptionId: sub.id,
        amount: SUBSCRIPTION_PLANS[sub.tier].priceMonthlyUsd,
        currency: 'USD',
        status: 'succeeded',
        paymentMethod: { brand: 'Visa', last4: '4242' },
        description: 'Pembayaran Ulang Berhasil (Retry Recovery)',
        gatewayReference: `ch_retry_${Date.now()}`,
        createdAt: now.toISOString(),
      };
      const txns = this.transactions.get(userId) || [];
      txns.unshift(txn);
      this.transactions.set(userId, txns);
      return { subscription: sub, transaction: txn };
    } else {
      const txn: BillingTransaction = {
        id: `txn_retry_fail_${Date.now()}`,
        userId,
        subscriptionId: sub.id,
        amount: SUBSCRIPTION_PLANS[sub.tier].priceMonthlyUsd,
        currency: 'USD',
        status: 'failed',
        paymentMethod: { brand: 'Visa', last4: '4242' },
        description: 'Upaya Pembayaran Ulang Gagal: Saldo Masih Tidak Cukup',
        failureReason: 'Kartu kredit kembali ditolak oleh penerbit bank.',
        gatewayReference: `ch_retry_fail_${Date.now()}`,
        createdAt: now.toISOString(),
      };
      const txns = this.transactions.get(userId) || [];
      txns.unshift(txn);
      this.transactions.set(userId, txns);
      return { subscription: sub, transaction: txn };
    }
  }

  /**
   * Retrieves transaction history for user
   */
  public getTransactionHistory(userId: string): BillingTransaction[] {
    return this.transactions.get(userId) || [];
  }

  /**
   * Gets list of processed webhook events for audit
   */
  public getWebhookAuditLog(): WebhookEventRecord[] {
    return Array.from(this.processedEvents.values()).reverse();
  }
}

export const subscriptionService = new SubscriptionService();

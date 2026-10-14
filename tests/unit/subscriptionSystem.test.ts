/**
 * GoalMetric AI - Unit & Integration Test Suite: Subscription, Payment Gateway & Webhook
 * Verifies:
 * 1. Successful payment & server-side activation
 * 2. Failed payment, past_due status, 3-day grace period, and payment retry
 * 3. Idempotency control preventing duplicate charges/transactions
 * 4. Tampered amount and currency mismatch rejection
 * 5. Backend feature gating & quota enforcement for expired subscriptions
 * 6. Cryptographic HMAC SHA-256 webhook signature validation
 * 7. Refund processing & immediate tier revocation
 */

import { SubscriptionService, DEFAULT_SANDBOX_WEBHOOK_SECRET } from '../../src/backend/domain/billing/subscriptionService';
import { canUserAccessFeature, checkUsageQuota } from '../../src/backend/domain/billing/planManager';

export function runSubscriptionSystemTests(): { name: string; passed: boolean; message?: string }[] {
  const results: { name: string; passed: boolean; message?: string }[] = [];
  const service = new SubscriptionService();

  // Test 1: Successful checkout session creation & server-side verification
  try {
    service.resetStoreForTesting();
    const testUserId = 'usr_test_buyer_01';

    // Free by default
    const initialSub = service.getSubscription(testUserId);
    if (initialSub.tier !== 'free') throw new Error('User awal seharusnya free');

    // Create session for Pro plan ($29 USD)
    const session = service.createCheckoutSession({
      userId: testUserId,
      userEmail: 'buyer@test.com',
      planId: 'pro',
      billingPeriod: 'monthly',
    });

    if (session.expectedAmount !== 29 || session.currency !== 'USD') {
      throw new Error(`Expected amount $29 USD, got $${session.expectedAmount} ${session.currency}`);
    }

    // Server-side verification of payment
    const result = service.verifyAndProcessCheckout({
      sessionId: session.sessionId,
      paymentMethodBrand: 'Visa',
      paymentMethodLast4: '4242',
      providedAmount: 29.0,
      providedCurrency: 'USD',
    });

    const activeSub = service.getSubscription(testUserId);
    const passed =
      activeSub.status === 'active' &&
      activeSub.tier === 'pro' &&
      result.transaction.status === 'succeeded' &&
      result.transaction.amount === 29;

    results.push({
      name: 'Pembayaran Berhasil: Sesi checkout diverifikasi server & langganan diaktifkan ke Pro',
      passed,
      message: passed ? undefined : 'Gagal mengaktifkan langganan setelah verifikasi',
    });
  } catch (err: any) {
    results.push({ name: 'Pembayaran Berhasil', passed: false, message: err.message });
  }

  // Test 2: Failed payment triggers past_due status and 3-day grace period
  try {
    service.resetStoreForTesting();
    const testUserId = 'usr_test_pastdue_02';

    // Create active Pro subscription first
    const session = service.createCheckoutSession({
      userId: testUserId,
      userEmail: 'pastdue@test.com',
      planId: 'pro',
      billingPeriod: 'monthly',
    });
    service.verifyAndProcessCheckout({ sessionId: session.sessionId });

    // Simulate webhook invoice.payment_failed
    const failEvent = {
      id: 'evt_fail_9981',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_fail_112',
          client_reference_id: testUserId,
          amount_due: 2900,
          currency: 'usd',
          failure_message: 'Insufficient funds on credit card',
        },
      },
    };

    const sig = service.generateTestWebhookSignature(JSON.stringify(failEvent));
    service.handleWebhookEvent(failEvent, sig);

    const sub = service.getSubscription(testUserId);
    const hasGracePeriod = Boolean(sub.gracePeriodEnd);
    const txns = service.getTransactionHistory(testUserId);
    const failedTxn = txns.find(t => t.status === 'failed');

    const passed = sub.status === 'past_due' && hasGracePeriod && Boolean(failedTxn);

    results.push({
      name: 'Pembayaran Gagal: Status masuk ke past_due dengan masa tenggang (grace period) 3 hari',
      passed,
      message: passed ? undefined : 'Status past_due atau grace period tidak terpasang dengan benar',
    });

    // Test retry recovery
    const retryRes = service.retryPastDuePayment(testUserId, true);
    const restoredSub = service.getSubscription(testUserId);
    const retryPassed = restoredSub.status === 'active' && retryRes.transaction.status === 'succeeded';

    results.push({
      name: 'Pemulihan Pembayaran Ulang (Retry): Status berhasil dikembalikan ke aktif',
      passed: retryPassed,
      message: retryPassed ? undefined : 'Gagal memulihkan status aktif setelah retry sukses',
    });
  } catch (err: any) {
    results.push({ name: 'Pembayaran Gagal & Masa Tenggang', passed: false, message: err.message });
  }

  // Test 3: Idempotency control prevents double charges on duplicate webhooks
  try {
    service.resetStoreForTesting();
    const testUserId = 'usr_test_idempotency_03';

    const duplicateEvent = {
      id: 'evt_unique_idempotency_key_771',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_idem_001',
          client_reference_id: testUserId,
          amount_paid: 2900,
          currency: 'usd',
        },
      },
    };

    const sig = service.generateTestWebhookSignature(JSON.stringify(duplicateEvent));

    // First delivery
    const firstDelivery = service.handleWebhookEvent(duplicateEvent, sig);
    const txnsAfterFirst = service.getTransactionHistory(testUserId).length;

    // Second delivery (duplicate retry by payment gateway)
    const secondDelivery = service.handleWebhookEvent(duplicateEvent, sig);
    const txnsAfterSecond = service.getTransactionHistory(testUserId).length;

    const passed =
      firstDelivery.duplicate === false &&
      secondDelivery.duplicate === true &&
      secondDelivery.received === true &&
      txnsAfterFirst === txnsAfterSecond; // No double transaction!

    results.push({
      name: 'Idempotency: Mencegah webhook duplikat memproses tagihan ganda',
      passed,
      message: passed ? undefined : `Idempotency gagal: duplicate=${secondDelivery.duplicate}, txCount=${txnsAfterSecond}`,
    });
  } catch (err: any) {
    results.push({ name: 'Idempotency Control', passed: false, message: err.message });
  }

  // Test 4: Rejects tampered amount & currency mismatch attacks
  try {
    service.resetStoreForTesting();
    const testUserId = 'usr_attacker_04';

    const session = service.createCheckoutSession({
      userId: testUserId,
      userEmail: 'attacker@evil.com',
      planId: 'premium', // Expected $79 USD
      billingPeriod: 'monthly',
    });

    let tamperedAmountBlocked = false;
    try {
      // Attacker attempts to pay $1 instead of $79
      service.verifyAndProcessCheckout({
        sessionId: session.sessionId,
        providedAmount: 1.0,
      });
    } catch {
      tamperedAmountBlocked = true;
    }

    let currencyMismatchBlocked = false;
    try {
      // Attacker attempts to pay EUR instead of USD
      service.verifyAndProcessCheckout({
        sessionId: session.sessionId,
        providedAmount: 79.0,
        providedCurrency: 'EUR',
      });
    } catch {
      currencyMismatchBlocked = true;
    }

    const passed = tamperedAmountBlocked && currencyMismatchBlocked;
    results.push({
      name: 'Proteksi Manipulasi: Menolak serangan modifikasi nominal ($1 untuk $79) & mata uang salah',
      passed,
      message: passed ? undefined : 'Sistem gagal menolak nominal yang dimanipulasi',
    });
  } catch (err: any) {
    results.push({ name: 'Proteksi Manipulasi Nominal', passed: false, message: err.message });
  }

  // Test 5: Backend feature gating on Expired / Free tiers
  try {
    // 1. Free tier access check
    const freeCanAccessValueBets = canUserAccessFeature('free', 'valueBets', 'active');
    const freeCanAccessApi = canUserAccessFeature('free', 'apiAccess', 'active');
    const freeQuota = checkUsageQuota(0, 'free', 'active');

    // 2. Pro tier access check
    const proCanAccessValueBets = canUserAccessFeature('pro', 'valueBets', 'active');

    // 3. Expired Pro subscription check
    const expiredCanAccessValueBets = canUserAccessFeature('pro', 'valueBets', 'expired');
    const expiredQuota = checkUsageQuota(0, 'pro', 'expired');

    const passed =
      !freeCanAccessValueBets &&
      !freeCanAccessApi &&
      freeQuota.limit === 3 &&
      proCanAccessValueBets &&
      !expiredCanAccessValueBets &&
      expiredQuota.limit === 3; // Falls back to free quota limit

    results.push({
      name: 'Feature Gating Backend: Akun kedaluwarsa & Free otomatis diblokir dari fitur premium',
      passed,
      message: passed ? undefined : 'Feature gating mengizinkan akses tidak sah',
    });
  } catch (err: any) {
    results.push({ name: 'Backend Feature Gating', passed: false, message: err.message });
  }

  // Test 6: Webhook cryptographic HMAC SHA-256 signature validation
  try {
    const rawPayload = JSON.stringify({ id: 'evt_test_sig', type: 'ping', data: { object: {} } });
    const validSignature = service.generateTestWebhookSignature(rawPayload, DEFAULT_SANDBOX_WEBHOOK_SECRET);
    const forgedSignature = 't=1700000000,v1=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

    const validAccepted = service.verifyWebhookSignature(rawPayload, validSignature, DEFAULT_SANDBOX_WEBHOOK_SECRET);
    const forgedRejected = !service.verifyWebhookSignature(rawPayload, forgedSignature, DEFAULT_SANDBOX_WEBHOOK_SECRET);
    const missingRejected = !service.verifyWebhookSignature(rawPayload, undefined, DEFAULT_SANDBOX_WEBHOOK_SECRET);

    const passed = validAccepted && forgedRejected && missingRejected;
    results.push({
      name: 'Verifikasi Kriptografis: Validasi signature HMAC SHA-256 menolak webhook palsu',
      passed,
      message: passed ? undefined : 'Verifikasi signature webhook gagal mendeteksi pemalsuan',
    });
  } catch (err: any) {
    results.push({ name: 'Validasi Signature Webhook', passed: false, message: err.message });
  }

  // Test 7: Refund event immediately revokes tier to free
  try {
    service.resetStoreForTesting();
    const testUserId = 'usr_refund_target_05';

    // Upgrade to Premium
    const session = service.createCheckoutSession({
      userId: testUserId,
      userEmail: 'refund@test.com',
      planId: 'premium',
      billingPeriod: 'monthly',
    });
    service.verifyAndProcessCheckout({ sessionId: session.sessionId });

    const beforeSub = service.getSubscription(testUserId);
    if (beforeSub.tier !== 'premium') throw new Error('Gagal setup premium sebelum refund');

    // Fire charge.refunded webhook
    const refundEvent = {
      id: 'evt_refund_331',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_ref_11',
          metadata: { userId: testUserId },
          amount_refunded: 7900,
          currency: 'usd',
        },
      },
    };
    const sig = service.generateTestWebhookSignature(JSON.stringify(refundEvent));
    service.handleWebhookEvent(refundEvent, sig);

    const afterSub = service.getSubscription(testUserId);
    const txns = service.getTransactionHistory(testUserId);
    const refundTxn = txns.find(t => t.status === 'refunded');

    const passed = afterSub.status === 'refunded' && afterSub.tier === 'free' && Boolean(refundTxn);
    results.push({
      name: 'Penanganan Refund: Event charge.refunded seketika mencabut tier kembali ke Free',
      passed,
      message: passed ? undefined : 'Status refund atau tier free tidak diterapkan dengan benar',
    });
  } catch (err: any) {
    results.push({ name: 'Penanganan Refund', passed: false, message: err.message });
  }

  return results;
}

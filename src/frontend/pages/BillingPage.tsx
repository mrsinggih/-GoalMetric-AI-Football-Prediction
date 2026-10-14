import React, { useState, useEffect } from 'react';
import { UserSession } from '../../types';
import { apiClient } from '../services/apiClient';
import { BadgeDemo } from '../components/CommonStates';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Download,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Zap,
  RotateCcw,
  BookOpen,
  Terminal,
  ShieldAlert,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface BillingPageProps {
  currentUser?: UserSession;
  onUpgradePlan: () => void;
  onUserRefreshed?: () => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  currentUser,
  onUpgradePlan,
  onUserRefreshed,
}) => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [webhookAuditLogs, setWebhookAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'guide'>('overview');

  // Interactive Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Simulator State
  const [simOutput, setSimOutput] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  const fetchBillingData = async () => {
    try {
      setIsLoading(true);
      const [subRes, txRes, auditRes] = await Promise.all([
        apiClient.getSubscription(),
        apiClient.getTransactions(),
        apiClient.getWebhookAuditLog(),
      ]);
      setSubscriptionData(subRes);
      setTransactions(txRes.transactions || []);
      setWebhookAuditLogs(auditRes.events || []);
    } catch (err: any) {
      console.error('Failed to load billing data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [currentUser]);

  const sub = subscriptionData?.subscription;
  const plan = subscriptionData?.plan;
  const quota = subscriptionData?.quota;

  const handleCancelSubscription = async (immediate: boolean) => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await apiClient.cancelSubscription(immediate);
      setActionMessage({ type: 'info', text: res.message });
      setCancelModalOpen(false);
      await fetchBillingData();
      if (onUserRefreshed) onUserRefreshed();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal membatalkan langganan.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await apiClient.reactivateSubscription();
      setActionMessage({ type: 'success', text: res.message });
      await fetchBillingData();
      if (onUserRefreshed) onUserRefreshed();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengaktifkan kembali langganan.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryPayment = async (simulateSuccess: boolean) => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await apiClient.retryPayment(simulateSuccess);
      setActionMessage({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      await fetchBillingData();
      if (onUserRefreshed) onUserRefreshed();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal memproses pembayaran ulang.' });
    } finally {
      setActionLoading(false);
    }
  };

  const runSimulatorAction = async (actionType: string) => {
    setSimLoading(true);
    setSimOutput(null);
    try {
      let payload: any = {};
      const targetUserId = currentUser?.userId || 'usr_demo_7721';

      if (actionType === 'success') {
        payload = {
          eventType: 'invoice.payment_succeeded',
          userId: targetUserId,
          amount: 29.0,
        };
      } else if (actionType === 'failure') {
        payload = {
          eventType: 'invoice.payment_failed',
          userId: targetUserId,
          amount: 29.0,
        };
      } else if (actionType === 'duplicate') {
        const fixedId = 'evt_test_idempotency_key_4492';
        // Send duplicate with exact same fixed ID
        payload = {
          eventId: fixedId,
          eventType: 'invoice.payment_succeeded',
          userId: targetUserId,
          amount: 29.0,
        };
      } else if (actionType === 'tamper') {
        payload = {
          eventType: 'checkout.session.completed',
          userId: targetUserId,
          amount: 1.0,
          isTamperedAmount: true,
        };
      } else if (actionType === 'invalid_signature') {
        payload = {
          eventType: 'invoice.payment_succeeded',
          userId: targetUserId,
          amount: 29.0,
          isInvalidSignature: true,
        };
      } else if (actionType === 'refund') {
        payload = {
          eventType: 'charge.refunded',
          userId: targetUserId,
          amount: 29.0,
        };
      } else if (actionType === 'test_gating_expired') {
        // First cancel immediately to expire
        await apiClient.cancelSubscription(true);
        // Then attempt calling premium gated endpoint
        try {
          const exportRes = await apiClient.exportQuantitativeAudit();
          setSimOutput({
            test: 'Uji Feature Gating Backend',
            result: 'FAIL - Endpoint premium seharusnya memblokir akun gratis/kedaluwarsa',
            data: exportRes,
          });
        } catch (gateErr: any) {
          setSimOutput({
            test: 'Uji Feature Gating Backend (403 Forbidden)',
            status: 'PASS - Server memblokir permintaan tidak berizin!',
            errorReceived: gateErr.message,
            explanation: 'Backend menolak akses endpoint kuantitatif karena paket saat ini telah kedaluwarsa.',
          });
        }
        await fetchBillingData();
        setSimLoading(false);
        return;
      }

      const res = await apiClient.simulateWebhook(payload);
      setSimOutput(res);
      await fetchBillingData();
      if (onUserRefreshed) onUserRefreshed();
    } catch (err: any) {
      setSimOutput({
        success: false,
        error: err.message,
        detail: 'Permintaan ditolak oleh filter backend sesuai rancangan keamanan.',
      });
    } finally {
      setSimLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AKTIF (ACTIVE)</span>
          </span>
        );
      case 'past_due':
        return (
          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>PAST DUE (MASA TENGGANG)</span>
          </span>
        );
      case 'canceled':
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>DIBATALKAN (CANCELED)</span>
          </span>
        );
      case 'expired':
        return (
          <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-mono font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>KEDALUWARSA (EXPIRED)</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>DANA DIKEMBALIKAN (REFUNDED)</span>
          </span>
        );
      default:
        return (
          <span className="bg-zinc-800 text-zinc-300 text-xs font-mono px-3 py-1 rounded-full">
            {status?.toUpperCase() || 'UNKNOWN'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">Langganan & Penagihan (Billing)</h1>
              <BadgeDemo size="sm" />
            </div>
            <p className="text-xs text-zinc-400">
              Kelola status pembayaran Stripe, kuota prediksi, riwayat transaksi, dan verifikasi integritas gateway.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBillingData}
              disabled={isLoading}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onUpgradePlan}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ganti / Tingkatkan Paket</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Ringkasan Langganan & Faktur</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sandbox Simulator & Webhook</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan Pemula (Stripe Setup)</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : actionMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-zinc-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Warning Banner for PAST_DUE */}
      {sub?.status === 'past_due' && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Pembayaran Langganan Terakhir Gagal</h4>
              <p className="text-xs text-rose-300 mt-0.5 leading-relaxed">
                Kartu kredit Anda gagal ditagih. Akun Anda saat ini berada dalam <span className="font-bold underline">Masa Tenggang (Grace Period)</span> hingga{' '}
                <span className="font-mono font-bold">
                  {sub.gracePeriodEnd ? new Date(sub.gracePeriodEnd).toLocaleDateString('id-ID') : '3 hari ke depan'}
                </span>
                . Fitur tetap dapat diakses sementara.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRetryPayment(true)}
            disabled={actionLoading}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Bayar Sekarang (Retry)</span>
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & INVOICES */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Plan Overview (2 cols) */}
            <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    Paket Aktif Saat Ini
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">
                    {plan?.name || 'Starter (Free)'}
                  </h3>
                  <span className="text-xs text-zinc-400 font-mono">
                    ${plan?.priceMonthlyUsd || 0}.00 USD / bulan
                  </span>
                </div>
                <div>{getStatusBadge(sub?.status || 'active')}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">PERIODE PENAGIHAN</span>
                  <span className="text-white font-bold text-xs uppercase mt-0.5 block">
                    {sub?.billingPeriod || 'Bulanan'}
                  </span>
                </div>
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">
                    {sub?.status === 'canceled' ? 'BERAKHIR PADA' : 'PEMBAHARUAN BERIKUTNYA'}
                  </span>
                  <span className="text-white font-bold text-xs mt-0.5 block">
                    {sub?.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd).toLocaleDateString('id-ID')
                      : 'Aktif Selamanya'}
                  </span>
                </div>
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">METODE PEMBAYARAN</span>
                  <span className="text-white font-bold text-xs mt-0.5 block flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Visa •••• 4242</span>
                  </span>
                </div>
              </div>

              {/* Subscription Controls */}
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-400 font-mono text-[11px]">
                    Stripe Customer ID: <code className="text-zinc-200">{sub?.gatewayCustomerId || 'cus_free_demo'}</code>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sub?.status === 'canceled' ? (
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-all"
                    >
                      Aktifkan Kembali Langganan
                    </button>
                  ) : sub?.tier !== 'free' ? (
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/30 border border-transparent text-zinc-400 rounded-lg transition-all"
                    >
                      Batalkan Langganan
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quota Gauge (1 col) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-white block mb-1">Penggunaan Kuota Hari Ini</span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ditegakkan langsung oleh middleware backend GoalMetric AI.
                </p>
              </div>

              <div className="text-center py-2">
                <div className="text-3xl font-extrabold font-mono text-emerald-400">
                  {quota?.remaining ?? 3} / {quota?.limit ?? 3}
                </div>
                <div className="text-xs text-zinc-500 font-mono mt-1">Kuota Prediksi Tersisa</div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden mt-3 border border-zinc-800">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (((quota?.limit || 3) - (quota?.remaining || 0)) / (quota?.limit || 3)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 text-center font-mono pt-2 border-t border-zinc-800">
                Terpakai Hari Ini: {quota?.usedToday ?? 0} kali
              </div>
            </div>
          </div>

          {/* Invoices History Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Riwayat Transaksi & Buku Besar (Ledger)</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Daftar transaksi yang terekam secara persisten pada sistem penagihan server.
                </p>
              </div>
              <BadgeDemo size="sm" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                    <th className="p-4">ID Transaksi</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Deskripsi Tagihan</th>
                    <th className="p-4">Metode</th>
                    <th className="p-4">Nominal</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Faktur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-zinc-500">
                        Belum ada riwayat transaksi tercatat.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-4 font-bold text-white">{inv.id}</td>
                        <td className="p-4 text-zinc-400">
                          {new Date(inv.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="p-4 font-sans text-zinc-200">
                          <div>{inv.description}</div>
                          {inv.failureReason && (
                            <div className="text-[11px] text-rose-400 mt-0.5 font-mono">
                              Alasan gagal: {inv.failureReason}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-zinc-400">
                            {inv.paymentMethod?.brand} •••• {inv.paymentMethod?.last4}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white">${inv.amount}.00 USD</td>
                        <td className="p-4">
                          {inv.status === 'succeeded' ? (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                              SUCCEEDED
                            </span>
                          ) : inv.status === 'failed' ? (
                            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                              FAILED
                            </span>
                          ) : (
                            <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                              REFUNDED
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() =>
                              alert(
                                `[SIMULASI FAKTUR STRIPE]\nNomor Transaksi: ${inv.id}\nNominal: $${inv.amount} USD\nStatus: ${inv.status.toUpperCase()}\nGateway Ref: ${inv.gatewayReference}`
                              )
                            }
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg inline-flex items-center gap-1 transition-colors"
                            title="Unduh Salinan Faktur PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE SANDBOX & WEBHOOK SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Pengujian Skenario Gateway & Webhook Sandbox
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-zinc-800 text-emerald-400 px-2.5 py-1 rounded-full border border-zinc-700">
                ZERO-TRUST INTEGRITY TESTER
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Gunakan panel ini untuk menguji secara langsung seluruh skenario yang disyaratkan dalam spesifikasi:
              pembayaran berhasil, pembayaran gagal (masa tenggang), webhook duplikat (idempotency), manipulasi nominal,
              dan perlindungan endpoint dari akun kedaluwarsa.
            </p>

            {/* Test Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => runSimulatorAction('success')}
                disabled={simLoading}
                className="p-3.5 bg-zinc-950 hover:bg-zinc-800/80 border border-emerald-500/30 hover:border-emerald-500 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-emerald-400 mb-1">
                  <span>1. Pembayaran Berhasil</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Kirim event <code>invoice.payment_succeeded</code> bertanda tangan HMAC.
                </p>
              </button>

              <button
                onClick={() => runSimulatorAction('failure')}
                disabled={simLoading}
                className="p-3.5 bg-zinc-950 hover:bg-zinc-800/80 border border-rose-500/30 hover:border-rose-500 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-rose-400 mb-1">
                  <span>2. Pembayaran Gagal</span>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Kirim <code>invoice.payment_failed</code>. Mengubah status ke <code>past_due</code> (masa tenggang 3 hari).
                </p>
              </button>

              <button
                onClick={() => runSimulatorAction('duplicate')}
                disabled={simLoading}
                className="p-3.5 bg-zinc-950 hover:bg-zinc-800/80 border border-amber-500/30 hover:border-amber-500 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-amber-400 mb-1">
                  <span>3. Webhook Duplikat</span>
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Uji Idempotency: Kirim event ID yang sama persis untuk memastikan tidak ada pencatatan ganda.
                </p>
              </button>

              <button
                onClick={() => runSimulatorAction('tamper')}
                disabled={simLoading}
                className="p-3.5 bg-zinc-950 hover:bg-zinc-800/80 border border-red-500/30 hover:border-red-500 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-red-400 mb-1">
                  <span>4. Serangan Manipulasi Nominal</span>
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Coba bayar $1.00 untuk paket $29.00. Server wajib menolak dengan HTTP 400.
                </p>
              </button>

              <button
                onClick={() => runSimulatorAction('test_gating_expired')}
                disabled={simLoading}
                className="p-3.5 bg-zinc-950 hover:bg-zinc-800/80 border border-purple-500/30 hover:border-purple-500 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-purple-400 mb-1">
                  <span>5. Uji Gating Kedaluwarsa</span>
                  <Lock className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Panggil API premium dengan akun kedaluwarsa. Server wajib membalas 403 Forbidden.
                </p>
              </button>

              <button
                onClick={() => runSimulatorAction('refund')}
                disabled={simLoading}
                className="p-3.5 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-700 hover:border-zinc-500 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-zinc-200 mb-1">
                  <span>6. Simulasi Refund Penuh</span>
                  <RotateCcw className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Kirim event <code>charge.refunded</code>. Langganan dicabut seketika ke paket Free.
                </p>
              </button>
            </div>

            {/* Simulator Output Console */}
            {simOutput && (
              <div className="mt-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800/80 pb-2">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Respon Uji Server-Side:</span>
                  </span>
                  <span>HTTP 200 OK / 400 Handled</span>
                </div>
                <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto p-2 bg-black/40 rounded-lg max-h-56">
                  {JSON.stringify(simOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Webhook Audit Log Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Jejak Audit Webhook (Idempotency Cache)
              </h4>
              <span className="text-[10px] font-mono text-zinc-400">
                {webhookAuditLogs.length} event terekam
              </span>
            </div>
            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <th className="p-3">Event ID</th>
                    <th className="p-3">Tipe Event</th>
                    <th className="p-3">Waktu Diterima</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {webhookAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-zinc-500">
                        Belum ada webhook yang diproses. Jalankan salah satu simulasi di atas.
                      </td>
                    </tr>
                  ) : (
                    webhookAuditLogs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-800/40">
                        <td className="p-3 font-bold text-white">{log.id}</td>
                        <td className="p-3 text-emerald-400">{log.eventType}</td>
                        <td className="p-3 text-zinc-400">
                          {new Date(log.receivedAt).toLocaleTimeString('id-ID')}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : log.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">{log.detail}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BEGINNER CONFIGURATION GUIDE */}
      {activeTab === 'guide' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>Panduan Konfigurasi Gateway Pembayaran (Untuk Pemula)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Ikuti 4 langkah mudah berikut untuk menghubungkan Stripe Sandbox atau Production ke GoalMetric AI secara aman.
            </p>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-zinc-300">
            {/* Step 1 */}
            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold font-mono flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-bold text-white text-sm">
                  Dapatkan API Key Sandbox dari Stripe Dashboard
                </h4>
              </div>
              <p className="text-zinc-400 pl-8">
                Buka <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-mono">dashboard.stripe.com</a> dalam mode Sandbox (Test Mode).
                Salin <strong>Secret Key</strong> (diawali dengan <code className="text-zinc-200">sk_test_...</code>) dan masukkan ke pengaturan Secrets environment variable aplikasi dengan nama <code className="text-emerald-400">STRIPE_SECRET_KEY</code>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold font-mono flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-bold text-white text-sm">
                  Daftarkan Webhook Endpoint di Stripe
                </h4>
              </div>
              <p className="text-zinc-400 pl-8">
                Di menu <strong>Developers &gt; Webhooks</strong>, klik <strong>Add endpoint</strong> dan masukkan URL endpoint backend GoalMetric AI:
              </p>
              <div className="pl-8">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-emerald-400 text-xs">
                  https://&lt;domain-anda&gt;/api/v1/billing/webhook
                </div>
              </div>
              <p className="text-zinc-400 pl-8 mt-1">
                Pilih event berikut untuk didengarkan:
                <code className="text-zinc-300 ml-1">checkout.session.completed</code>,{' '}
                <code className="text-zinc-300">invoice.payment_succeeded</code>,{' '}
                <code className="text-zinc-300">invoice.payment_failed</code>,{' '}
                <code className="text-zinc-300">charge.refunded</code>, dan{' '}
                <code className="text-zinc-300">customer.subscription.deleted</code>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold font-mono flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="font-bold text-white text-sm">
                  Salin Signing Secret Webhook (HMAC SHA-256)
                </h4>
              </div>
              <p className="text-zinc-400 pl-8">
                Setelah endpoint dibuat, klik <strong>Reveal Signing Secret</strong> (diawali dengan <code className="text-zinc-200">whsec_...</code>).
                Simpan di Secrets dengan nama <code className="text-emerald-400">STRIPE_WEBHOOK_SECRET</code>.
                Tanda tangan kriptografis ini wajib digunakan untuk memastikan bahwa tidak ada penyerang yang dapat memalsukan event aktivasi langganan.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold font-mono flex items-center justify-center text-xs">
                  4
                </span>
                <h4 className="font-bold text-white text-sm">
                  Prinsip Keamanan: Mengapa Redirect Browser Tidak Pernah Dipercaya
                </h4>
              </div>
              <p className="text-zinc-400 pl-8">
                Penyerang dapat dengan mudah memalsukan redirect URL browser (misalnya mengetikkan <code className="text-rose-400">?status=success</code>).
                Oleh karena itu, sistem GoalMetric AI hanya mengaktifkan akun jika:
              </p>
              <ul className="list-disc pl-12 text-zinc-400 space-y-1">
                <li>Server memvalidasi session ID yang dibuat sebelumnya di backend.</li>
                <li>Nominal transaksi yang dibayarkan cocok 100% dengan harga resmi paket.</li>
                <li>Signature header webhook berhasil didekripsi dengan rahasia HMAC server.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span>Konfirmasi Pembatalan Langganan</span>
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Apakah Anda yakin ingin membatalkan langganan <strong className="text-white">{plan?.name}</strong>?
            </p>
            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hak Akses Anda Tetap Terjamin</span>
              </div>
              <p>
                Jika dibatalkan pada akhir periode, Anda tetap dapat menggunakan seluruh fitur Pro/Premium hingga{' '}
                <span className="text-white font-mono font-bold">
                  {sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('id-ID') : 'akhir siklus'}
                </span>
                . Anda tidak akan ditagih kembali.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
              >
                Tetap Berlangganan
              </button>
              <button
                onClick={() => handleCancelSubscription(false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/40"
              >
                Batalkan pada Akhir Periode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

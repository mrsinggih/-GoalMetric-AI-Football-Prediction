import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '../../backend/domain/billing/planManager';
import { BadgeDemo } from '../components/CommonStates';
import { apiClient } from '../services/apiClient';
import { Check, Zap, Sparkles, Shield, HelpCircle, ArrowRight, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PricingPageProps {
  currentTier?: string;
  onSelectPlan?: (planId: string) => void;
  onPlanUpdated?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  currentTier = 'free',
  onSelectPlan,
  onPlanUpdated,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<'pro' | 'premium'>('pro');
  const [checkoutStep, setCheckoutStep] = useState<'INITIAL' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('INITIAL');
  const [sessionData, setSessionData] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Present Free, Pro, and Premium
  const plans = [
    SUBSCRIPTION_PLANS.free,
    SUBSCRIPTION_PLANS.pro,
    SUBSCRIPTION_PLANS.premium,
  ];

  const handleStartCheckout = async (planId: string) => {
    if (planId === 'free') {
      if (onSelectPlan) onSelectPlan('free');
      return;
    }

    const targetPlan = planId === 'premium' || planId === 'elite' ? 'premium' : 'pro';
    setSelectedPlanId(targetPlan);
    setCheckoutStep('INITIAL');
    setErrorMessage(null);
    setCheckoutModalOpen(true);

    try {
      // Create server-locked session
      const session = await apiClient.createCheckoutSession(targetPlan, billingPeriod);
      if (session.success) {
        setSessionData(session);
      } else {
        setErrorMessage(session.message || 'Gagal membuat sesi checkout di server.');
        setCheckoutStep('ERROR');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Koneksi ke gateway pembayaran gagal.');
      setCheckoutStep('ERROR');
    }
  };

  const handleConfirmPayment = async () => {
    if (!sessionData?.sessionId) return;
    setCheckoutStep('PROCESSING');
    setErrorMessage(null);

    try {
      // Simulate 1s server-to-server gateway token exchange
      await new Promise(r => setTimeout(r, 900));

      const result = await apiClient.verifyCheckoutSession({
        sessionId: sessionData.sessionId,
        paymentMethodBrand: cardBrand,
        paymentMethodLast4: cardNumber.slice(-4),
        providedAmount: sessionData.expectedAmount,
        providedCurrency: sessionData.currency,
      });

      if (result.success) {
        setCheckoutStep('SUCCESS');
        if (onPlanUpdated) {
          onPlanUpdated();
        }
      } else {
        setErrorMessage(result.message || 'Verifikasi server-side pembayaran ditolak.');
        setCheckoutStep('ERROR');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verifikasi checkout backend gagal.');
      setCheckoutStep('ERROR');
    }
  };

  const faqs = [
    {
      q: 'Bagaimana GoalMetric AI memverifikasi pembayaran pelanggan?',
      a: 'GoalMetric AI menggunakan sistem verifikasi server-to-server yang ketat. Kami tidak pernah mengaktifkan langganan berdasarkan redirect browser atau parameter URL (?success=true). Seluruh transaksi diverifikasi melalui sesi server-locked dan webhook yang ditandatangani kriptografis (HMAC SHA-256).',
    },
    {
      q: 'Bagaimana cara kerja batas kuota harian?',
      a: 'Pengguna paket Free dibatasi 3 kalkulasi prediksi per hari. Paket Pro mendapatkan 50 prediksi/hari dan akses model Dixon-Coles bivariat. Paket Premium mendapatkan 500 kuota/hari beserta akses langsung REST API dan ekspor data audit kuantitatif.',
    },
    {
      q: 'Apa yang terjadi jika pembayaran bulanan saya gagal diproses?',
      a: 'Akun Anda akan memasuki status "Past Due" dengan masa tenggang (grace period) selama 3 hari. Anda tetap dapat mengakses fitur sambil memperbarui kartu kredit melalui tombol retry di halaman Billing tanpa gangguan langsung.',
    },
    {
      q: 'Bisakah saya membatalkan langganan kapan saja?',
      a: 'Tentu. Anda dapat membatalkan langganan kapan pun. Akses Anda akan tetap aktif hingga akhir periode penagihan yang telah dibayar (at period end) sebelum diturunkan secara aman ke paket Free.',
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
            Sistem Langganan SaaS GoalMetric AI
          </span>
          <BadgeDemo size="sm" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Pilih Paket Analitik & Prediksi Kuantitatif
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto">
          Dari eksplorasi model Poisson gratis hingga sindikat profesional yang memerlukan akses REST API dan verifikasi backtesting out-of-sample.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="inline-flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl mt-4">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingPeriod === 'monthly' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              billingPeriod === 'yearly' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Tahunan</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
              HEMAT 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map(plan => {
          const isCurrent = currentTier === plan.id || (plan.id === 'premium' && currentTier === 'elite');
          const isPopular = plan.id === 'pro';
          const isPremium = plan.id === 'premium';
          const monthlyPrice =
            billingPeriod === 'yearly'
              ? Math.round(plan.priceMonthlyUsd * 0.8)
              : plan.priceMonthlyUsd;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                isPopular
                  ? 'bg-zinc-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-950/40'
                  : isPremium
                  ? 'bg-zinc-900 border border-purple-500/40 shadow-xl'
                  : 'bg-zinc-900/80 border border-zinc-800'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 font-bold text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider">
                  Paling Populer
                </div>
              )}

              {isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white font-bold text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider">
                  Akses Sindikat
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                  {isPremium ? (
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  ) : isPopular ? (
                    <Zap className="w-5 h-5 text-emerald-400" />
                  ) : null}
                </div>

                <div className="my-4">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                    ${monthlyPrice}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono"> / bulan</span>
                  {billingPeriod === 'yearly' && plan.priceMonthlyUsd > 0 && (
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                      Ditagih tahunan (${monthlyPrice * 12}/thn)
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mb-6">
                  {plan.id === 'free'
                    ? 'Eksplorasi kalkulasi Poisson dasar dan metrik Expected Goals (xG).'
                    : plan.id === 'pro'
                    ? 'Untuk analis kuantitatif yang memerlukan sinyal Value Bet (+EV) & model Dixon-Coles.'
                    : 'Untuk sindikat profesional & pengembang yang memerlukan akses REST API dan audit trail.'}
                </p>

                {/* Features List */}
                <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    Fitur & Hak Akses:
                  </span>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-zinc-800/80">
                <button
                  onClick={() => handleStartCheckout(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-zinc-800 text-zinc-400 cursor-default'
                      : isPopular
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-950/50'
                      : isPremium
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {isCurrent ? (
                    <span>Paket Aktif Saat Ini</span>
                  ) : (
                    <>
                      <span>{plan.id === 'free' ? 'Pilih Paket Gratis' : `Langganan ${plan.name}`}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture & Security Guarantee Card */}
      <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Keamanan Transaksi & Integritas Gateway Pembayaran</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                SERVER-SIDE ENFORCED
              </span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              GoalMetric AI menggunakan arsitektur pembayaran tanpa kepercayaan pada sisi klien (*zero-trust client*).
              Nominal harga dikunci di server, verifikasi status menggunakan webhook bertanda tangan HMAC SHA-256,
              dan perlindungan idempotensi menjamin Anda tidak akan pernah ditagih dua kali untuk pesanan yang sama.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto pt-6 border-t border-zinc-800">
        <h2 className="text-xl font-bold text-white text-center mb-6 flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <span>Pertanyaan Umum (FAQ)</span>
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-1.5">
              <h3 className="font-bold text-white text-sm">{faq.q}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Server-Side Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Stripe Checkout Terverifikasi Backend
                </h3>
              </div>
              <BadgeDemo size="sm" />
            </div>

            {checkoutStep === 'INITIAL' && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Paket Pilihan:</span>
                    <span className="font-bold text-white">
                      {SUBSCRIPTION_PLANS[selectedPlanId].name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Periode Penagihan:</span>
                    <span className="text-emerald-400 font-mono font-bold capitalize">
                      {billingPeriod === 'yearly' ? 'Tahunan (Diskon 20%)' : 'Bulanan'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800/80 text-sm">
                    <span className="text-zinc-300 font-bold">Total Pembayaran:</span>
                    <span className="font-mono font-extrabold text-emerald-400 text-base">
                      ${sessionData?.expectedAmount || (selectedPlanId === 'premium' ? (billingPeriod === 'yearly' ? 756 : 79) : (billingPeriod === 'yearly' ? 276 : 29))}.00 USD
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                    Metode Pembayaran Sandbox:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCardBrand('Visa');
                        setCardNumber('4242 •••• •••• 4242');
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                        cardBrand === 'Visa'
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <span>Visa Sandbox</span>
                      <span className="text-[10px] text-emerald-400">4242</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCardBrand('Mastercard');
                        setCardNumber('5555 •••• •••• 8888');
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                        cardBrand === 'Mastercard'
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <span>Mastercard</span>
                      <span className="text-[10px] text-purple-400">8888</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verifikasi Kriptografis Aktif</span>
                  </div>
                  <p>
                    Session ID: <code className="text-zinc-300 font-mono">{sessionData?.sessionId || 'Menyiapkan sesi...'}</code>
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Konfirmasi Pembayaran</span>
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 'PROCESSING' && (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-white">Memproses Pembayaran di Server...</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Memvalidasi nominal, memeriksa tanda tangan webhook, dan mencatat transaksi ke buku besar penagihan.
                </p>
              </div>
            )}

            {checkoutStep === 'SUCCESS' && (
              <div className="py-4 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Langganan Berhasil Diaktifkan!</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    Selamat, akun Anda telah ditingkatkan ke paket <span className="text-white font-bold">{SUBSCRIPTION_PLANS[selectedPlanId].name}</span>. Kuota harian dan fitur premium telah dibuka di backend.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    if (onSelectPlan) onSelectPlan(selectedPlanId);
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs"
                >
                  Buka Dashboard Analitik
                </button>
              </div>
            )}

            {checkoutStep === 'ERROR' && (
              <div className="py-4 text-center space-y-4">
                <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/40">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Verifikasi Pembayaran Gagal</h4>
                  <p className="text-xs text-rose-300 mt-1 max-w-sm mx-auto">
                    {errorMessage || 'Terjadi kesalahan saat memproses pembayaran.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => handleStartCheckout(selectedPlanId)}
                    className="flex-1 py-2.5 bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

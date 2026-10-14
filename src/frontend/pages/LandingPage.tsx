import React from 'react';
import { Activity, TrendingUp, ShieldCheck, Cpu, ArrowRight, Check, Zap, Target, BarChart2 } from 'lucide-react';
import { BadgeDemo } from '../components/CommonStates';

interface LandingPageProps {
  onExploreDashboard: () => void;
  onExplorePricing: () => void;
  onExploreRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onExploreDashboard,
  onExplorePricing,
  onExploreRegister,
}) => {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/80 to-zinc-950 border border-zinc-800 p-8 sm:p-12 lg:p-16 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-mono mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>GoalMetric AI SaaS Engine v1.0 • Probabilistic Football Intelligence</span>
          <BadgeDemo size="sm" />
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight font-sans">
          Analitik Sepak Bola Berbasis <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">Probabilitas Poisson Murni</span> & Expected Goals
        </h1>

        <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Hilangkan bias emosional dalam analisis pertandingan. GoalMetric AI menghitung distribusi skor eksak, peluang 1X2, Over/Under, dan mendeteksi <strong className="text-emerald-400">Positive Expected Value (+EV)</strong> terhadap odds pasar.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onExploreDashboard}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
          >
            <span>Buka Live Dashboard Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExplorePricing}
            className="w-full sm:w-auto px-6 py-3.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 font-semibold rounded-xl border border-zinc-700/80 hover:border-zinc-600 transition-all text-sm"
          >
            Lihat Paket Langganan
          </button>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="text-xs text-zinc-400 font-mono">Model Statistik</div>
            <div className="text-base font-bold text-white mt-0.5">Dixon-Coles 1997</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-mono">Bivariat Low-Score Tau</div>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="text-xs text-zinc-400 font-mono">Expected Goals (xG)</div>
            <div className="text-base font-bold text-white mt-0.5">Calibrated Baseline</div>
            <div className="text-[11px] text-sky-400 mt-1 font-mono">Attack & Defense Ratio</div>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="text-xs text-zinc-400 font-mono">Deteksi Peluang</div>
            <div className="text-base font-bold text-white mt-0.5">+EV Edge Scanner</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-mono">Model Prob vs Bookmaker</div>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="text-xs text-zinc-400 font-mono">Keamanan & Privasi</div>
            <div className="text-base font-bold text-white mt-0.5">Zero Client Secrets</div>
            <div className="text-[11px] text-purple-400 mt-1 font-mono">Server-Side Supabase</div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white">Fondasi Analitik Kuantitatif yang Kuat</h2>
          <p className="text-xs text-zinc-400 mt-1.5">
            Setiap kalkulasi dirancang secara independen untuk memenuhi standar analisa tim profesional dan sindikat kuantitatif.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Distribusi Poisson Matriks 2D</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Memecah kekuatan gol tim menjadi parameter expected goals λ(home) dan λ(away). Menghitung probabilitas setiap kemungkinan skor (0-0 hingga 6-6) dengan koreksi Dixon-Coles untuk mengatasi bias under-reporting laga imbang.
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Deteksi Positive EV (+EV) & Kelly</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Membandingkan probabilitas murni model analitik terhadap implied probability odds bandar. Jika rumus $EV = (P \times Odds) - 1 &gt; 3\%$, sinyal peluang langsung diidentifikasi dengan alokasi fraksi Kelly konservatif.
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Dual Engine: Node.js & Python</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Backend Express berkecepatan tinggi dipadukan dengan modul statistik Python FastAPI (NumPy/SciPy). Dilengkapi *graceful fallback* cerdas sehingga sistem tetap aktif 100% meski microservice Python mengalami perawatan.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Siap Mengeksplorasi Analitik Sepak Bola Berbasis Sains Data?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Daftar akun gratis hari ini untuk mendapatkan 3 kuota prediksi demo harian atau upgrade ke Pro untuk analitik liga top Eropa lengkap.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onExploreRegister}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs sm:text-sm transition-colors"
            >
              Mulai Uji Coba Gratis
            </button>
            <button
              onClick={onExploreDashboard}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs sm:text-sm border border-zinc-700 transition-colors"
            >
              Lihat Demo Pertandingan
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

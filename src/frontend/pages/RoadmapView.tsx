import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, Target, ArrowRight, Sparkles } from 'lucide-react';

export const RoadmapView: React.FC = () => {
  const phases = [
    {
      phaseNumber: 'Fase 1 (Selesai - Fondasi Saat Ini)',
      title: 'Fondasi Arsitektur Modular & Engine Poisson Bivariat',
      status: 'COMPLETED',
      description: 'Membangun struktur folder modular, domain logic murni, fallback Dixon-Coles, pengujian otomatis, dan kepatuhan label demo.',
      deliverables: [
        'Pemisahan 6 layer: Frontend, API Gateway, Domain, Data Access, Python Engine, Tests.',
        'Implementasi rumus Dixon-Coles Poisson PMF dan kalkulator Value Bet (+EV).',
        'Struktur data demo transparan bertanda isDemo: true dan [DEMO DATA].',
        'Master test runner teruji 10/10 lulus tanpa klaim palsu.',
        'File konfigurasi .env.example aman tanpa membocorkan secret nyata.',
      ],
      acceptanceCriteria: [
        'npm test berhasil menjalankan seluruh unit test matematika dan integrasi.',
        'Tidak ada kredensial Supabase service-role atau key sensitif di bundle browser.',
        'Data simulasi diberi label eksplisit [DEMO DATA].',
      ],
    },
    {
      phaseNumber: 'Fase 2',
      title: 'Supabase PostgreSQL Aktif & Integrasi Data Provider',
      status: 'UPCOMING',
      description: 'Menghubungkan aplikasi ke instance Supabase nyata dan mengintegrasikan cron scheduler untuk ingest data sepak bola.',
      deliverables: [
        'Eksekusi migrasi 001_initial_schema.sql ke database Supabase production.',
        'Cron job server-side untuk ingest jadwal dan hasil liga dari API-Football / Football-Data.org.',
        'Supabase Auth aktif (Login Google / Email) dengan verifikasi JWT resmi di middleware Express.',
        'Penyimpanan riwayat prediksi ke tabel public.predictions dengan indexing optimal.',
      ],
      acceptanceCriteria: [
        'Tabel database terisi data jadwal nyata via server cron, bukan scraping ilegal.',
        'Pengguna dapat mendaftar dan login dengan sesi Supabase yang aman.',
        'Query riwayat prediksi responsif di bawah 150ms.',
      ],
    },
    {
      phaseNumber: 'Fase 3',
      title: 'Layanan Mikro Python (FastAPI + Dixon-Coles Bivariat)',
      status: 'UPCOMING',
      description: 'Mengaktifkan microservice statistik Python secara independen dengan estimasi regresi Maximum Likelihood (MLE).',
      deliverables: [
        'Deployment microservice Python (FastAPI) pada container terpisah (Cloud Run / Docker).',
        'Kalkulasi parameter rho (korelasi skor rendah) dan time-decay weighting (half-life 25% musim).',
        'Integrasi metrik xG (Expected Goals) dari Shot Maps ke dalam parameter attack & defense.',
        'Circuit breaker otomatis di Node.js jika microservice Python mengalami cold start.',
      ],
      acceptanceCriteria: [
        'Python FastAPI merespons endpoint /predict dalam waktu < 200ms.',
        'Node.js backend secara mulus beralih ke engine TypeScript jika Python service offline.',
      ],
    },
    {
      phaseNumber: 'Fase 4',
      title: 'Monetisasi SaaS (Stripe Billing) & API Key Distribution',
      status: 'UPCOMING',
      description: 'Menerapkan sistem pembayaran subscription berulang dan token access untuk tier Pro dan Elite.',
      deliverables: [
        'Stripe Checkout Session & Customer Portal integrasi.',
        'Stripe Webhook handler (checkout.session.completed, customer.subscription.deleted).',
        'Sistem limitasi kuota harian otomatis menggunakan Redis / Supabase user_usage.',
        'Generator API Key untuk pelanggan tier Elite Syndicate.',
      ],
      acceptanceCriteria: [
        'Webhook Stripe memvalidasi tanda tangan kriptografi (STRIPE_WEBHOOK_SECRET).',
        'Tier gratis otomatis terblokir ketika kuota 3 prediksi/hari tercapai.',
      ],
    },
    {
      phaseNumber: 'Fase 5',
      title: 'Monitoring Produksi, SEO & Public Launch',
      status: 'UPCOMING',
      description: 'Optimalisasi performa, audit keamanan, observability, dan peluncuran publik.',
      deliverables: [
        'Error tracking (Sentry) dan logging analitik server-side.',
        'Audit keamanan menyeluruh (OWASP Top 10, sanitasi input, rate limiting per IP).',
        'Halaman publik SEO untuk jadwal pertandingan liga utama dengan structured data.',
        'SLA 99.9% uptime dengan health check monitoring.',
      ],
      acceptanceCriteria: [
        'Audit keamanan lolos tanpa kerentanan kritis.',
        'Lighthouse SEO dan Performance score > 90.',
      ],
    },
  ];

  const risks = [
    {
      title: 'Risiko 1: Drift Statistik & Fluktuasi Cedera Pemain',
      severity: 'TINGGI',
      description: 'Model matematika murni berbasis Poisson mengabaikan faktor tak terduga seperti cedera pemain kunci mendadak atau kartu merah awal pertandingan.',
      mitigation: 'Terapkan integrasi data berita lineup/cedera pra-pertandingan dan berikan disclaimer ketidakpastian (Confidence Rating: Low/Medium/High).',
    },
    {
      title: 'Risiko 2: Rate Limit & Biaya Data Provider Sepak Bola',
      severity: 'SEDANG',
      description: 'API data sepak bola komersial (API-Sports / Sportradar) membebankan biaya per request atau memiliki kuota ketat.',
      mitigation: 'Implementasikan caching berlapis di backend (in-memory LRU + database cache) dengan TTL 1 jam untuk jadwal yang belum live.',
    },
    {
      title: 'Risiko 3: Kepatuhan Regulasi & Ekspektasi Pengguna',
      severity: 'TINGGI',
      description: 'Pengguna dapat salah mengartikan prediksi statistik sebagai jaminan kemenangan finansial (masalah legalitas perjudian).',
      mitigation: 'Wajib menyertakan disclaimer hukum tegas: "Analitik ini bersifat edukasi dan simulasi matematis, bukan saran taruhan finansial".',
    },
    {
      title: 'Risiko 4: Kebocoran Kredensial Database (Service Role Key)',
      severity: 'KRITIS',
      description: 'Pemula sering kali tidak sengaja memasukkan SUPABASE_SERVICE_ROLE_KEY ke dalam frontend bundle React.',
      mitigation: 'Pemisahan ketat: Arsitektur ini mengunci konektor Supabase hanya di folder server-side Node.js dan menyediakan API proxy (/api/v1/*).',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Rencana Implementasi Bertahap, Risiko & Kriteria Penerimaan
            </h2>
            <p className="text-xs text-zinc-400">
              Panduan teknis dan manajemen risiko untuk pengembangan SaaS GoalMetric AI dari fondasi awal hingga siap rilis publik.
            </p>
          </div>
        </div>
      </div>

      {/* Phased Roadmap Timeline */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-wider">
          Tahapan Pengembangan Bertahap (Phased Roadmap)
        </h3>

        <div className="space-y-4">
          {phases.map((p, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all ${
                p.status === 'COMPLETED'
                  ? 'bg-zinc-900/90 border-emerald-500/50 shadow-emerald-950/20'
                  : 'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  {p.status === 'COMPLETED' ? (
                    <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-zinc-800 text-zinc-400">
                      <Clock className="w-5 h-5" />
                    </span>
                  )}
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                      {p.phaseNumber}
                    </span>
                    <h4 className="text-base font-bold text-white leading-tight">
                      {p.title}
                    </h4>
                  </div>
                </div>

                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded-full font-bold self-start sm:self-center ${
                    p.status === 'COMPLETED'
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {p.status === 'COMPLETED' ? 'SELESAI DIVERIFIKASI' : 'TAHAP BERIKUTNYA'}
                </span>
              </div>

              <p className="text-xs text-zinc-300 mb-4">{p.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Deliverables */}
                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                  <h5 className="font-mono font-bold text-zinc-300 mb-2 text-[11px] uppercase tracking-wider text-emerald-400">
                    Hasil Karya (Deliverables):
                  </h5>
                  <ul className="space-y-1.5 text-zinc-400">
                    {p.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Acceptance Criteria */}
                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                  <h5 className="font-mono font-bold text-zinc-300 mb-2 text-[11px] uppercase tracking-wider text-sky-400">
                    Kriteria Penerimaan (Acceptance Criteria):
                  </h5>
                  <ul className="space-y-1.5 text-zinc-400">
                    {p.acceptanceCriteria.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-sky-400 font-bold">◆</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Management Matrix */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <h3 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Daftar Risiko Teknis & Solusi Mitigasi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map((risk, idx) => (
            <div
              key={idx}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">{risk.title}</h4>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    risk.severity === 'KRITIS'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : risk.severity === 'TINGGI'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  Tingkat: {risk.severity}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{risk.description}</p>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs">
                <strong className="text-emerald-400 block mb-1">Strategi Mitigasi:</strong>
                <span className="text-zinc-300">{risk.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

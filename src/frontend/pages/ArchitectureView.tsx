import React, { useState } from 'react';
import { Layers, Folder, ShieldCheck, Database, Cpu, Terminal, ArrowRight, Lock, CheckCircle, FileCode } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [selectedFolder, setSelectedFolder] = useState<string>('domain');

  const folderDetails: Record<string, {
    title: string;
    path: string;
    purpose: string;
    responsibilities: string[];
    securityRules: string;
    files: string[];
  }> = {
    frontend: {
      title: 'Frontend (Presentation Layer)',
      path: '/src/frontend',
      purpose: 'Menangani antarmuka pengguna (UI/UX) dan interaksi visual SaaS.',
      responsibilities: [
        'Menyajikan visualisasi probabilitas, xG, matriks Poisson, dan sinyal Value Bet.',
        'Mengirim request HTTP hanya ke endpoint backend proxy (/api/v1/*).',
        'Menjaga pengalaman pengguna tetap responsif dan informatif.',
      ],
      securityRules: 'TIDAK BOLEH menyimpan API Key Football Data, Secret Stripe, atau Supabase Service Role Key. Hanya boleh membaca VITE_* yang bersifat aman untuk publik.',
      files: [
        '/src/frontend/components/Navbar.tsx',
        '/src/frontend/components/MatchCard.tsx',
        '/src/frontend/components/ScoreMatrixModal.tsx',
        '/src/frontend/components/DemoBanner.tsx',
        '/src/frontend/pages/DashboardView.tsx',
        '/src/frontend/pages/PredictionSandboxView.tsx',
        '/src/frontend/services/apiClient.ts',
      ],
    },
    backendApi: {
      title: 'Backend API Gateway & Middlewares',
      path: '/src/backend/api',
      purpose: 'Pintu gerbang HTTP RESTful yang memvalidasi request, autentikasi, dan rate-limiting.',
      responsibilities: [
        'Routing HTTP (/api/v1/health, /matches, /predictions, /billing, /auth, /admin).',
        'Middleware autentikasi JWT / Bearer token dan validasi role RBAC (User vs Admin).',
        'Middleware DemoModeGuard menyematkan header lingkungan demo dan disclaimer.',
        'Sentralisasi penanganan error tanpa membocorkan stack trace rahasia ke klien.',
      ],
      securityRules: 'Mencegah akses liar ke route admin (/api/v1/admin/*). Melakukan sanitasi input dan validasi skema DTO.',
      files: [
        '/src/backend/api/middlewares/authMiddleware.ts',
        '/src/backend/api/middlewares/errorHandler.ts',
        '/src/backend/api/routes/healthRoutes.ts',
        '/src/backend/api/routes/matchRoutes.ts',
        '/src/backend/api/routes/predictionRoutes.ts',
        '/src/backend/api/routes/billingRoutes.ts',
        '/src/backend/api/routes/authRoutes.ts',
        '/src/backend/api/routes/adminRoutes.ts',
      ],
    },
    domain: {
      title: 'Domain Logic (Core Business & Math)',
      path: '/src/backend/domain',
      purpose: 'Logika bisnis murni yang bebas dari dependensi framework HTTP maupun database.',
      responsibilities: [
        'Mesin Poisson Bivariat dengan koreksi Dixon-Coles (1997) dan penyesuaian skor rendah tau(x, y).',
        'Kalkulator Expected Goals (xG) berdasarkan kekuatan serang dan bertahan relatif terhadap baseline liga.',
        'Kalkulator Value Bet (+EV) membandingkan probabilitas model murni vs odds bandar dan fraksi Kelly Criterion.',
        'Logika kuota langganan SaaS (Starter/Free, Pro Analyst, Elite Syndicate).',
      ],
      securityRules: 'Harus 100% deterministik, dapat diuji secara terisolasi tanpa koneksi jaringan/database (Pure Unit Tests).',
      files: [
        '/src/backend/domain/prediction/poissonEngine.ts',
        '/src/backend/domain/prediction/valueBetCalculator.ts',
        '/src/backend/domain/prediction/pythonEngineClient.ts',
        '/src/backend/domain/billing/planManager.ts',
        '/src/backend/domain/auth/authService.ts',
      ],
    },
    dataAccess: {
      title: 'Data Access & PostgreSQL (Supabase)',
      path: '/src/backend/data-access',
      purpose: 'Abstraksi penyimpanan dan query data (Database / PostgreSQL melalui Supabase).',
      responsibilities: [
        'Konektor aman server-side Supabase yang menggunakan SUPABASE_SERVICE_ROLE_KEY (hanya di Node.js).',
        'Repository pattern untuk entitas Match, Prediction, dan User.',
        'Penyediaan in-memory fallback yang diberi label isDemo: true jika database Supabase belum terkonfigurasi.',
        'Skrip migrasi SQL lengkap (001_initial_schema.sql) mencakup RLS (Row Level Security) dan Indexing.',
      ],
      securityRules: 'SUPABASE_SERVICE_ROLE_KEY hanya boleh dipanggil di layer ini (server-side). Kode browser tidak boleh mengakses langsung.',
      files: [
        '/src/backend/data-access/supabaseClient.ts',
        '/src/backend/data-access/repositories/matchRepository.ts',
        '/src/backend/data-access/repositories/predictionRepository.ts',
        '/src/backend/data-access/migrations/001_initial_schema.sql',
      ],
    },
    pythonEngine: {
      title: 'Python Statistical Microservice (FastAPI)',
      path: '/python-engine',
      purpose: 'Modul statistik tingkat lanjut yang dapat dijalankan sebagai layanan terpisah jika diperlukan.',
      responsibilities: [
        'Komputasi NumPy & SciPy untuk estimasi parameter Dixon-Coles bivariat dan time-decay weighting.',
        'FastAPI REST server independen pada port 8000 dengan endpoint /health dan /predict.',
        'Unit test mandiri (test_engine.py) untuk verifikasi probabilitas matriks.',
        'Didukung fallback otomatis oleh Node.js backend jika layanan mikro ini sedang offline.',
      ],
      securityRules: 'Beroperasi di jaringan internal (private network) atau dilindungi API key antar-layanan (mTLS / Service Token).',
      files: [
        '/python-engine/main.py',
        '/python-engine/models/poisson_dixon_coles.py',
        '/python-engine/test_engine.py',
        '/python-engine/requirements.txt',
        '/python-engine/README.md',
      ],
    },
    tests: {
      title: 'Automated Test Suite (10/10 Passed)',
      path: '/tests',
      purpose: 'Memastikan integritas matematika, kepatuhan label demo, dan RBAC berjalan sempurna.',
      responsibilities: [
        'Memverifikasi bahwa rumus Poisson PMF menghasilkan probabilitas teoritis yang akurat.',
        'Memverifikasi bahwa total probabilitas 1X2 dan Over/Under menjumlahkan tepat 1.00 (100%).',
        'Memverifikasi deteksi +EV dan penolakan taruhan ber-EV negatif.',
        'Memverifikasi bahwa 100% data demo memiliki flag isDemo: true (kepatuhan regulasi & transparansi).',
      ],
      securityRules: 'Dijalankan via npm test dan wajib lulus sebelum rilis atau deployment.',
      files: [
        '/tests/run-all-tests.ts',
        '/tests/unit/poissonEngine.test.ts',
        '/tests/unit/valueBetCalculator.test.ts',
        '/tests/unit/authMiddleware.test.ts',
      ],
    },
  };

  const active = folderDetails[selectedFolder] || folderDetails.domain;

  return (
    <div className="space-y-6">
      {/* Title & Architecture Philosophy */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Peta Arsitektur Sistem Modular GoalMetric AI
            </h2>
            <p className="text-xs text-zinc-400">
              Desain Clean Architecture berstandar industri dengan pemisahan tanggung jawab (Separation of Concerns) yang ketat.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Flow Diagram */}
      <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 overflow-x-auto">
        <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-4">
          Diagram Aliran Data & Lapisan Tanggung Jawab (Flow Pipeline)
        </h3>

        <div className="flex items-center justify-between min-w-[750px] gap-3">
          {/* Node 1: Browser */}
          <div className="flex-1 bg-zinc-900 border border-zinc-700 p-3.5 rounded-xl text-center">
            <div className="text-[10px] font-mono text-zinc-400">Client Layer</div>
            <div className="font-bold text-sm text-white mt-1">Browser / SPA</div>
            <div className="text-[11px] text-zinc-400 mt-1">React + Tailwind</div>
            <div className="mt-2 text-[10px] bg-zinc-800 text-zinc-400 py-0.5 rounded px-1.5 inline-block">
              Tanpa Secret Key
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />

          {/* Node 2: Gateway */}
          <div className="flex-1 bg-zinc-900 border border-sky-500/40 p-3.5 rounded-xl text-center">
            <div className="text-[10px] font-mono text-sky-400">Gateway Layer</div>
            <div className="font-bold text-sm text-white mt-1">Express API</div>
            <div className="text-[11px] text-zinc-400 mt-1">Auth, RBAC, Quota</div>
            <div className="mt-2 text-[10px] bg-sky-950 text-sky-300 py-0.5 rounded px-1.5 inline-block border border-sky-800">
              Proxy & Guard
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />

          {/* Node 3: Domain */}
          <div className="flex-1 bg-zinc-900 border border-emerald-500/50 p-3.5 rounded-xl text-center">
            <div className="text-[10px] font-mono text-emerald-400">Domain Logic</div>
            <div className="font-bold text-sm text-white mt-1">Poisson Engine</div>
            <div className="text-[11px] text-zinc-400 mt-1">xG, +EV, Kelly</div>
            <div className="mt-2 text-[10px] bg-emerald-950 text-emerald-300 py-0.5 rounded px-1.5 inline-block border border-emerald-800">
              Pure Math Core
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />

          {/* Node 4: Microservice / Storage */}
          <div className="flex-1 bg-zinc-900 border border-purple-500/40 p-3.5 rounded-xl text-center">
            <div className="text-[10px] font-mono text-purple-400">Microservice / DB</div>
            <div className="font-bold text-sm text-white mt-1">Python & Supabase</div>
            <div className="text-[11px] text-zinc-400 mt-1">FastAPI + PostgreSQL</div>
            <div className="mt-2 text-[10px] bg-purple-950 text-purple-300 py-0.5 rounded px-1.5 inline-block border border-purple-800">
              RLS & NumPy
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Folder Selector & Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Folder List Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Pilih Modul / Folder untuk Inspeksi:
          </h3>

          {[
            { id: 'domain', label: '1. Domain Logic & Engine', path: 'src/backend/domain' },
            { id: 'backendApi', label: '2. Backend API Gateway', path: 'src/backend/api' },
            { id: 'dataAccess', label: '3. Data Access & Supabase', path: 'src/backend/data-access' },
            { id: 'pythonEngine', label: '4. Python Microservice', path: 'python-engine/' },
            { id: 'frontend', label: '5. Frontend (React UI)', path: 'src/frontend/' },
            { id: 'tests', label: '6. Master Test Suite', path: 'tests/' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                selectedFolder === f.id
                  ? 'bg-zinc-800 border-emerald-500/60 text-white shadow-md'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className={`w-4 h-4 ${selectedFolder === f.id ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div>
                  <div className="text-xs font-bold leading-tight">{f.label}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{f.path}</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          ))}
        </div>

        {/* Selected Folder Deep Dive (8 cols) */}
        <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
            <div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                {active.path}
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{active.title}</h3>
              <p className="text-xs text-zinc-300 mt-1">{active.purpose}</p>
            </div>
            <div className="p-2 bg-zinc-800 rounded-lg text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Responsibilities */}
          <div>
            <h4 className="text-xs font-bold text-zinc-200 mb-2 font-mono flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Tanggung Jawab Utama Modul:
            </h4>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {active.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                  <span className="text-emerald-400 font-mono font-bold">›</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Security Rules */}
          <div className="bg-amber-950/30 border border-amber-600/30 p-3.5 rounded-xl text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold mb-1 text-amber-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Aturan Keamanan & Batasan Akses:</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">{active.securityRules}</p>
          </div>

          {/* File Manifest */}
          <div>
            <h4 className="text-xs font-bold text-zinc-200 mb-2 font-mono flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              Daftar Berkas Implementasi:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px]">
              {active.files.map((file, i) => (
                <div key={i} className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-zinc-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="truncate">{file}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

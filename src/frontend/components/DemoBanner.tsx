import React from 'react';
import { AlertTriangle, ShieldCheck, Database, Cpu } from 'lucide-react';

interface DemoBannerProps {
  engineType: string;
  isSupabaseConfigured: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ engineType, isSupabaseConfigured }) => {
  return (
    <div className="bg-amber-950/80 border-b border-amber-600/40 text-amber-200 px-4 py-2.5 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold tracking-wide uppercase text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            LINGKUNGAN DEMO & EVALUASI FONDASI
          </span>
          <span className="text-zinc-300">
            Semua data tim, skor, dan odds diberi label <strong className="text-amber-300">[DEMO DATA]</strong> untuk simulasi algoritma matematis.
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engine:</span>
            <span className="text-emerald-300 font-semibold">{engineType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>PostgreSQL:</span>
            <span className={isSupabaseConfigured ? 'text-sky-300 font-semibold' : 'text-zinc-400'}>
              {isSupabaseConfigured ? 'Supabase Live' : 'Blueprint Ready'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>No Client Keys</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertCircle, RefreshCw, FolderSearch, AlertTriangle } from 'lucide-react';

export const BadgeDemo: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => (
  <span
    className={`inline-flex items-center gap-1 font-mono font-bold uppercase rounded border tracking-wider bg-amber-500/15 text-amber-300 border-amber-500/40 ${
      size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
    }`}
    aria-label="Data Simulasi Demo"
  >
    <AlertTriangle className={size === 'sm' ? 'w-2.5 h-2.5 text-amber-400' : 'w-3 h-3 text-amber-400'} />
    DEMO
  </span>
);

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Memuat analitik data sepak bola...',
}) => (
  <div
    role="status"
    aria-live="polite"
    className="py-16 px-4 flex flex-col items-center justify-center text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/80 animate-pulse"
  >
    <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-3" />
    <p className="text-sm font-medium text-zinc-300">{message}</p>
    <span className="text-xs text-zinc-500 mt-1 font-mono">Dixon-Coles Poisson Engine v1</span>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => (
  <div className="py-16 px-4 flex flex-col items-center justify-center text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
    <div className="p-3 bg-zinc-800/80 rounded-2xl text-zinc-400 mb-3">
      <FolderSearch className="w-8 h-8 opacity-60" />
    </div>
    <h3 className="text-base font-bold text-zinc-200">{title}</h3>
    <p className="text-xs text-zinc-400 max-w-md mt-1 mb-4 leading-relaxed">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors"
      >
        {actionText}
      </button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({
  message = 'Terjadi kesalahan saat mengambil data analitik.',
  onRetry,
}) => (
  <div
    role="alert"
    className="p-6 bg-rose-950/30 border border-rose-600/40 rounded-2xl text-center flex flex-col items-center justify-center"
  >
    <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl mb-3">
      <AlertCircle className="w-6 h-6" />
    </div>
    <h4 className="text-sm font-bold text-rose-200">Gagal Memproses Permintaan</h4>
    <p className="text-xs text-zinc-400 max-w-md mt-1 mb-4 leading-relaxed">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Coba Lagi</span>
      </button>
    )}
  </div>
);

import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { PredictionResult } from '../../types';
import {
  SlidersHorizontal,
  Play,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Grid,
  AlertTriangle,
  History,
  BarChart3,
  Clock,
  Shield,
  Layers,
  Cpu,
  RefreshCw,
  Info,
} from 'lucide-react';

export const PredictionSandboxView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'backtest' | 'audit'>('simulator');

  // Simulator State
  const [homeName, setHomeName] = useState('Liverpool FC');
  const [awayName, setAwayName] = useState('Chelsea FC');
  const [homeAttack, setHomeAttack] = useState(1.35);
  const [homeDefense, setHomeDefense] = useState(0.80);
  const [awayAttack, setAwayAttack] = useState(1.15);
  const [awayDefense, setAwayDefense] = useState(0.95);

  const [bookmakerHomeOdds, setBookmakerHomeOdds] = useState(1.85);
  const [bookmakerDrawOdds, setBookmakerDrawOdds] = useState(3.80);
  const [bookmakerAwayOdds, setBookmakerAwayOdds] = useState(4.20);
  const [bookmakerOver25Odds, setBookmakerOver25Odds] = useState(1.70);
  const [bookmakerUnder25Odds, setBookmakerUnder25Odds] = useState(2.15);
  const [bookmakerBttsOdds, setBookmakerBttsOdds] = useState(1.65);

  const [calculating, setCalculating] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  // Backtest State
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestReport, setBacktestReport] = useState<any | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  // Advanced Audit State
  const [auditLoading, setAuditLoading] = useState(false);
  const [advancedResult, setAdvancedResult] = useState<any | null>(null);
  const [isHomePromoted, setIsHomePromoted] = useState(false);
  const [isAwayPromoted, setIsAwayPromoted] = useState(false);
  const [homeMatchesPlayed, setHomeMatchesPlayed] = useState(4);
  const [awayMatchesPlayed, setAwayMatchesPlayed] = useState(22);
  const [homeElo, setHomeElo] = useState(1620);
  const [awayElo, setAwayElo] = useState(1540);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await apiClient.calculateCustomPrediction({
        homeTeam: {
          name: homeName,
          homeAttackStrength: homeAttack,
          homeDefenseStrength: homeDefense,
          expectedGoalsFor: (homeAttack * 1.5).toFixed(2),
        },
        awayTeam: {
          name: awayName,
          awayAttackStrength: awayAttack,
          awayDefenseStrength: awayDefense,
          expectedGoalsFor: (awayAttack * 1.2).toFixed(2),
        },
        odds: {
          homeWin: bookmakerHomeOdds,
          draw: bookmakerDrawOdds,
          awayWin: bookmakerAwayOdds,
          over25: bookmakerOver25Odds,
          under25: bookmakerUnder25Odds,
          bttsYes: bookmakerBttsOdds,
        },
      });
      setPredictionResult(response.data);
    } catch (err) {
      console.error('Calculation failed:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleRunBacktest = async () => {
    setBacktestLoading(true);
    setBacktestError(null);
    try {
      const res = await apiClient.getBacktestReport();
      if (res?.report) {
        setBacktestReport(res.report);
      } else {
        setBacktestError('Gagal memuat laporan backtest');
      }
    } catch (err: any) {
      setBacktestError(err.message || 'Gagal menjalankan backtest');
    } finally {
      setBacktestLoading(false);
    }
  };

  const handleRunAuditSimulation = async () => {
    setAuditLoading(true);
    try {
      const res = await apiClient.calculateAdvancedPrediction({
        homeTeam: {
          id: 'team-h',
          name: homeName,
          matchesPlayed: homeMatchesPlayed,
          isNewlyPromoted: isHomePromoted,
          attackStrength: homeAttack,
          defenseStrength: homeDefense,
          eloRating: homeElo,
        },
        awayTeam: {
          id: 'team-a',
          name: awayName,
          matchesPlayed: awayMatchesPlayed,
          isNewlyPromoted: isAwayPromoted,
          attackStrength: awayAttack,
          defenseStrength: awayDefense,
          eloRating: awayElo,
        },
      });
      setAdvancedResult(res.data);
    } catch (err) {
      console.error('Audit simulation failed:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'backtest' && !backtestReport) {
      handleRunBacktest();
    } else if (activeSubTab === 'audit' && !advancedResult) {
      handleRunAuditSimulation();
    }
  }, [activeSubTab]);

  return (
    <div className="space-y-6">
      {/* Intro Header & Sub-Navigation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Prediction Engine & Statistical Lab</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                  STATISTICAL MODULE v2.1
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Mesin inferensi probabilistik independen: Model Poisson Bivariate Dixon-Coles, Elo Rating Benchmark, Bayesian Shrinkage untuk tim promosi, dan Backtesting bebas lookahead bias.
              </p>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-zinc-800 pt-4">
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'simulator'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Simulator Poisson & Value Bet
          </button>
          <button
            onClick={() => setActiveSubTab('backtest')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'backtest'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Evaluasi Backtest (Log Loss & Brier)
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'audit'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Elo Benchmark & Audit Trail
          </button>
        </div>
      </div>

      {/* VIEW 1: POISSON SIMULATOR & PARAMETER TUNER */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Home Team Card */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <span>Tim Tuan Rumah (Home Team)</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nama Tim</label>
                  <input
                    type="text"
                    value={homeName}
                    onChange={e => setHomeName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Kekuatan Serang (Home Attack):</span>
                    <span className="font-mono text-emerald-400 font-bold">{homeAttack}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.2"
                    step="0.05"
                    value={homeAttack}
                    onChange={e => setHomeAttack(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500">1.0 = rata-rata liga, &gt;1.0 = lebih tajam</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Kekuatan Bertahan (Home Defense):</span>
                    <span className="font-mono text-sky-400 font-bold">{homeDefense}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={homeDefense}
                    onChange={e => setHomeDefense(parseFloat(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                  <span className="text-[10px] text-zinc-500">&lt;1.0 = solid/kebobolan lebih sedikit</span>
                </div>
              </div>
            </div>

            {/* Away Team Card */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-sky-400 mb-3 flex items-center gap-2">
                <span>Tim Tamu (Away Team)</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nama Tim</label>
                  <input
                    type="text"
                    value={awayName}
                    onChange={e => setAwayName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Kekuatan Serang (Away Attack):</span>
                    <span className="font-mono text-sky-400 font-bold">{awayAttack}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.2"
                    step="0.05"
                    value={awayAttack}
                    onChange={e => setAwayAttack(parseFloat(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Kekuatan Bertahan (Away Defense):</span>
                    <span className="font-mono text-emerald-400 font-bold">{awayDefense}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={awayDefense}
                    onChange={e => setAwayDefense(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Bookmaker Odds Simulation */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                <span>Odds Pasar / Bandar (Decimal Odds)</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mb-3">
                Digunakan untuk menghitung selisih matematis (Edge) dan mendeteksi Positive Expected Value (+EV).
              </p>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <label className="block text-zinc-400 text-[10px] mb-1">1 (Home Win)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={bookmakerHomeOdds}
                    onChange={e => setBookmakerHomeOdds(parseFloat(e.target.value) || 1.01)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[10px] mb-1">X (Draw)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={bookmakerDrawOdds}
                    onChange={e => setBookmakerDrawOdds(parseFloat(e.target.value) || 1.01)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[10px] mb-1">2 (Away Win)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={bookmakerAwayOdds}
                    onChange={e => setBookmakerAwayOdds(parseFloat(e.target.value) || 1.01)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[10px] mb-1">Over 2.5</label>
                  <input
                    type="number"
                    step="0.05"
                    value={bookmakerOver25Odds}
                    onChange={e => setBookmakerOver25Odds(parseFloat(e.target.value) || 1.01)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[10px] mb-1">Under 2.5</label>
                  <input
                    type="number"
                    step="0.05"
                    value={bookmakerUnder25Odds}
                    onChange={e => setBookmakerUnder25Odds(parseFloat(e.target.value) || 1.01)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[10px] mb-1">BTTS Yes</label>
                  <input
                    type="number"
                    step="0.05"
                    value={bookmakerBttsOdds}
                    onChange={e => setBookmakerBttsOdds(parseFloat(e.target.value) || 1.01)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {calculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Menghitung Distribusi Poisson...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>Jalankan Prediksi Poisson (Dixon-Coles)</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Output Results (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {predictionResult ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-xs font-mono text-emerald-400">STATUS: KALKULASI BERHASIL</span>
                    <h3 className="text-lg font-bold text-white">
                      {homeName} vs {awayName}
                    </h3>
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-1 rounded border border-amber-500/40">
                    SIMULASI DEMO
                  </span>
                </div>

                {/* Expected Goals (Lambda) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                    <span className="text-xs text-zinc-400">λ Home Expected Goals (xG)</span>
                    <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                      {predictionResult.homeLambda}
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                    <span className="text-xs text-zinc-400">λ Away Expected Goals (xG)</span>
                    <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                      {predictionResult.awayLambda}
                    </div>
                  </div>
                </div>

                {/* 1X2 Probabilities */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Probabilitas Pasar 1X2 (Ternormalisasi P = 1.00):
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <div className="text-xs text-zinc-400">1 (Tuan Rumah)</div>
                      <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                        {Math.round(predictionResult.probabilities.homeWin * 100)}%
                      </div>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <div className="text-xs text-zinc-400">X (Seri)</div>
                      <div className="text-lg font-mono font-bold text-zinc-300 mt-1">
                        {Math.round(predictionResult.probabilities.draw * 100)}%
                      </div>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <div className="text-xs text-zinc-400">2 (Tamu)</div>
                      <div className="text-lg font-mono font-bold text-sky-400 mt-1">
                        {Math.round(predictionResult.probabilities.awayWin * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Over/Under & BTTS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-400">Over / Under 2.5 Goals</span>
                    <div className="flex justify-between items-center mt-2 font-mono text-sm">
                      <span className="text-white">Over: <strong>{Math.round(predictionResult.markets.over25Goals * 100)}%</strong></span>
                      <span className="text-zinc-400">Under: <strong>{Math.round(predictionResult.markets.under25Goals * 100)}%</strong></span>
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-400">Both Teams to Score (BTTS)</span>
                    <div className="flex justify-between items-center mt-2 font-mono text-sm">
                      <span className="text-white">Yes: <strong>{Math.round(predictionResult.markets.bothTeamsToScore * 100)}%</strong></span>
                      <span className="text-zinc-400">No: <strong>{Math.round((1 - predictionResult.markets.bothTeamsToScore) * 100)}%</strong></span>
                    </div>
                  </div>
                </div>

                {/* Score Matrix Heatmap (Top 4 Skor Paling Mungkin) */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-emerald-400" />
                    Top Skor Paling Mungkin (Bivariate Poisson Matrix):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(predictionResult.scoreMatrix || []).slice(0, 4).map((score, idx) => (
                      <div key={idx} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 text-center">
                        <div className="text-sm font-bold font-mono text-white">
                          {score.homeGoals} - {score.awayGoals}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 font-semibold mt-0.5">
                          {(score.probability * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Value Bets Table */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Hasil Deteksi Edge & Value Bet vs Odds yang Diinput:
                  </h4>
                  <div className="space-y-1.5">
                    {predictionResult.valueBets.map((vb, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                          vb.hasValue
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-white">{vb.market}</span>
                          <span className="text-zinc-400 ml-2">
                            (Model: {Math.round(vb.modelProbability * 100)}% vs Odds: {vb.bookmakerOdds})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              vb.edgePercentage > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {vb.edgePercentage > 0 ? `+${vb.edgePercentage}% EV` : `${vb.edgePercentage}% EV`}
                          </span>
                          {vb.hasValue && (
                            <span className="bg-emerald-500 text-zinc-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              VALUE BET
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                <Sparkles className="w-10 h-10 text-emerald-400/40 mb-3" />
                <h4 className="text-base font-bold text-zinc-300">Sandbox Siap Dijalankan</h4>
                <p className="text-xs text-zinc-500 max-w-sm mt-1">
                  Ubah parameter kekuatan tim di panel sebelah kiri lalu klik tombol "Jalankan Prediksi Poisson" untuk melihat kalkulasi probabilitas matriks secara instan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CHRONOLOGICAL BACKTESTING & CALIBRATION EVALUATION */}
      {activeSubTab === 'backtest' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Evaluasi Backtesting Kronologis (Strict Point-In-Time)
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Backtesting dijalankan secara terurut waktu (time-ordered). Informasi setelah kickoff dihapus secara absolut untuk mencegah lookahead bias.
                </p>
              </div>
              <button
                onClick={handleRunBacktest}
                disabled={backtestLoading}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center gap-2 border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${backtestLoading ? 'animate-spin' : ''}`} />
                Jalankan Ulang Backtest
              </button>
            </div>

            {backtestLoading && (
              <div className="py-16 text-center text-zinc-400 text-xs flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span>Menjalankan simulasi point-in-time pada riwayat pertandingan...</span>
              </div>
            )}

            {backtestError && (
              <div className="my-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                {backtestError}
              </div>
            )}

            {backtestReport && !backtestLoading && (
              <div className="mt-6 space-y-6">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-1">Multi-Class Log Loss</span>
                    <div className="text-2xl font-black text-emerald-400">
                      {backtestReport.metrics.modelLogLoss}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      vs Uniform: {backtestReport.baselines.uniformRandom.logLoss} ({backtestReport.relativeImprovement.logLossVsUniformPct}% lebih baik)
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-1">Multi-Class Brier Score</span>
                    <div className="text-2xl font-black text-sky-400">
                      {backtestReport.metrics.modelBrierScore}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      vs Uniform: {backtestReport.baselines.uniformRandom.brierScore} ({backtestReport.relativeImprovement.brierScoreVsUniformPct}% lebih baik)
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-1">Expected Calibration Error (ECE)</span>
                    <div className="text-2xl font-black text-amber-400">
                      {backtestReport.metrics.expectedCalibrationError}%
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Decile Calibration Distance
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-1">Sampel Uji Out-of-Sample</span>
                    <div className="text-2xl font-black text-white">
                      {backtestReport.sampleSize} Laga
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Rentang: {backtestReport.startDate} s/d {backtestReport.endDate}
                    </span>
                  </div>
                </div>

                {/* Calibration Decile Table */}
                <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Tabel Kalibrasi Probabilitas (Decile Bins)
                    </h4>
                    <span className="text-[11px] text-zinc-400">
                      Ideal jika Avg Predicted ≈ Observed Frequency
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3 rounded-l-lg">Bin Range</th>
                          <th className="py-2 px-3">Jumlah Prediksi (N)</th>
                          <th className="py-2 px-3">Avg Prob Terprediksi</th>
                          <th className="py-2 px-3">Frekuensi Aktual</th>
                          <th className="py-2 px-3 rounded-r-lg">Selisih Kalibrasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {backtestReport.calibrationTable.map((bin: any, idx: number) => (
                          <tr key={idx} className="hover:bg-zinc-900/50">
                            <td className="py-2.5 px-3 font-semibold text-white">{bin.binRange}</td>
                            <td className="py-2.5 px-3 text-zinc-300">{bin.predictionCount}</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-bold">{bin.avgPredictedProbability}%</td>
                            <td className="py-2.5 px-3 text-sky-400 font-bold">{bin.observedFrequency}%</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                bin.calibrationError < 10
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                              }`}>
                                {bin.calibrationError}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Historical Point-in-Time Match Logs */}
                <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-5">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Log Eksekusi Point-in-Time (Urutan Waktu Kickoff Tanpa Lookahead)
                  </h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {backtestReport.detailedMatchLogs.map((log: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-[10px]">{log.kickoffTime.slice(0, 10)}</span>
                          <span className="font-bold text-white">{log.homeTeam} vs {log.awayTeam}</span>
                          <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] text-emerald-300 font-bold">
                            Skor: {log.actualScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-zinc-400">
                            1X2: H {Math.round(log.predictedProbabilities.homeWin * 100)}% | D {Math.round(log.predictedProbabilities.draw * 100)}% | A {Math.round(log.predictedProbabilities.awayWin * 100)}%
                          </span>
                          <span className="text-sky-300">LL: {log.matchLogLoss.toFixed(3)}</span>
                          <span className="text-amber-300">Brier: {log.matchBrierScore.toFixed(3)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: ELO BENCHMARK & AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Parameter Uji Ekstrem & Bayesian Shrinkage
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Status Tim Promosi Baru</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isHomePromoted}
                        onChange={e => setIsHomePromoted(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      <span className="text-zinc-300 text-[11px]">Home Promosi</span>
                    </label>
                    <label className="flex items-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAwayPromoted}
                        onChange={e => setIsAwayPromoted(e.target.checked)}
                        className="accent-sky-500"
                      />
                      <span className="text-zinc-300 text-[11px]">Away Promosi</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400">Jumlah Laga Home Dimainkan (Sample N):</span>
                    <span className="font-mono text-emerald-400 font-bold">{homeMatchesPlayed} Laga</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="38"
                    value={homeMatchesPlayed}
                    onChange={e => setHomeMatchesPlayed(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500">N &lt; 8 memicu penyusutan Bayesian tinggi ke prior mean</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400">Jumlah Laga Away Dimainkan (Sample N):</span>
                    <span className="font-mono text-sky-400 font-bold">{awayMatchesPlayed} Laga</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="38"
                    value={awayMatchesPlayed}
                    onChange={e => setAwayMatchesPlayed(parseInt(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                  <div>
                    <label className="block text-zinc-400 text-[10px] mb-1">Home Elo Rating</label>
                    <input
                      type="number"
                      value={homeElo}
                      onChange={e => setHomeElo(parseInt(e.target.value) || 1500)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] mb-1">Away Elo Rating</label>
                    <input
                      type="number"
                      value={awayElo}
                      onChange={e => setAwayElo(parseInt(e.target.value) || 1500)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-sky-400 font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunAuditSimulation}
                  disabled={auditLoading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                  Evaluasi dengan Model Lanjutan
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {advancedResult && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400">
                      MODEL VERSION: {advancedResult.audit.model_version}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Perbandingan Probabilitas Poisson vs Elo Benchmark
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    advancedResult.modelConfidence === 'HIGH'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : advancedResult.modelConfidence === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}>
                    CONFIDENCE: {advancedResult.modelConfidence}
                  </span>
                </div>

                {/* Poisson vs Elo Side-by-side */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-emerald-400 font-bold block mb-2">Model Poisson (Bivariate)</span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Home Win:</span>
                        <span className="text-white font-bold">{Math.round(advancedResult.probabilities.homeWin * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Draw:</span>
                        <span className="text-white font-bold">{Math.round(advancedResult.probabilities.draw * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Away Win:</span>
                        <span className="text-white font-bold">{Math.round(advancedResult.probabilities.awayWin * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-sky-400 font-bold block mb-2">Elo Rating Benchmark</span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Home Exp Score:</span>
                        <span className="text-white font-bold">{Math.round(advancedResult.eloBenchmark.homeExpectedScore * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Rating Diff (+HFA):</span>
                        <span className="text-white font-bold">{advancedResult.eloBenchmark.homeElo - advancedResult.eloBenchmark.awayElo + 75} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Divergensi:</span>
                        <span className="text-emerald-300 font-bold">{advancedResult.eloBenchmark.divergenceVsPoisson.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Trail Fields */}
                <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 font-mono text-[11px] space-y-2">
                  <span className="text-zinc-400 font-bold block text-xs">Jejak Audit Fitur & Shrinkage (Immutable Audit Trail):</span>
                  <div className="grid grid-cols-2 gap-2 text-zinc-300">
                    <div>Snapshot Waktu: <span className="text-white">{advancedResult.audit.data_snapshot_at}</span></div>
                    <div>Waktu Dihasilkan: <span className="text-white">{advancedResult.audit.generated_at}</span></div>
                    <div>Home Attack (Obs vs Shrunk): <span className="text-emerald-400">{advancedResult.audit.input_features.homeAttackObserved} → {advancedResult.audit.input_features.homeAttackShrunk}</span></div>
                    <div>Away Attack (Obs vs Shrunk): <span className="text-sky-400">{advancedResult.audit.input_features.awayAttackObserved} → {advancedResult.audit.input_features.awayAttackShrunk}</span></div>
                    <div>Sample Weight Home: <span className="text-white">{advancedResult.audit.input_features.sampleWeightHome}</span></div>
                    <div>Sample Weight Away: <span className="text-white">{advancedResult.audit.input_features.sampleWeightAway}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

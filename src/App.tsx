/**
 * GoalMetric AI - Master Application Controller
 * Full-featured SaaS presentation layer for football analytics, predictions, and platform management.
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './frontend/components/Navbar';
import { DemoBanner } from './frontend/components/DemoBanner';
import { LandingPage } from './frontend/pages/LandingPage';
import { DashboardView } from './frontend/pages/DashboardView';
import { FixturesPage } from './frontend/pages/FixturesPage';
import { MatchDetailPage } from './frontend/pages/MatchDetailPage';
import { PredictionSandboxView } from './frontend/pages/PredictionSandboxView';
import { HeadToHeadPage } from './frontend/pages/HeadToHeadPage';
import { CombinationBuilderPage } from './frontend/pages/CombinationBuilderPage';
import { PricingPage } from './frontend/pages/PricingPage';
import { AuthPage } from './frontend/pages/AuthPage';
import { ProfilePage } from './frontend/pages/ProfilePage';
import { BillingPage } from './frontend/pages/BillingPage';
import { AdminPage } from './frontend/pages/AdminPage';
import { ArchitectureView } from './frontend/pages/ArchitectureView';
import { ApiExplorerView } from './frontend/pages/ApiExplorerView';
import { RoadmapView } from './frontend/pages/RoadmapView';
import { TestSuiteView } from './frontend/pages/TestSuiteView';
import { ProviderSyncPage } from './frontend/pages/ProviderSyncPage';
import { apiClient } from './frontend/services/apiClient';
import { MatchFixture, PredictionResult, UserSession } from './types';
import { ShieldCheck, GitFork, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [matches, setMatches] = useState<MatchFixture[]>([]);
  const [predictions, setPredictions] = useState<Record<string, PredictionResult>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchFixture | null>(null);
  const [h2hTeamPair, setH2hTeamPair] = useState<{ home: string; away: string }>({
    home: '',
    away: '',
  });

  const [engineType, setEngineType] = useState<string>('TypeScript Dixon-Coles v1');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserSession>({
    userId: 'usr_guest_demo',
    email: 'guest@goalmetric.demo',
    role: 'user',
    subscriptionTier: 'free',
    predictionsRemainingToday: 3,
  });

  // Bootstrap data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch health & configuration
        const health = await apiClient.getHealth();
        if (health?.engine?.activeEngine) {
          setEngineType(
            health.engine.activeEngine === 'PYTHON_DIXON_COLES_MICROSERVICE'
              ? 'Python Microservice (FastAPI)'
              : 'TypeScript Poisson (Native Engine)'
          );
        }
        setIsSupabaseConfigured(Boolean(health?.database?.isConfigured));

        // Fetch fixtures
        const matchesRes = await apiClient.getMatches();
        const fixtures = matchesRes.data || [];
        setMatches(fixtures);

        if (fixtures.length > 0) {
          setSelectedMatch(fixtures[0]);
          setH2hTeamPair({
            home: fixtures[0].homeTeam.name,
            away: fixtures[0].awayTeam.name,
          });
        }

        // Calculate/retrieve predictions for all fixtures
        const predMap: Record<string, PredictionResult> = {};
        for (const f of fixtures) {
          try {
            const predRes = await apiClient.getPredictionForMatch(f.id);
            if (predRes?.data) {
              predMap[f.id] = predRes.data;
            }
          } catch (err) {
            console.error(`Failed to load prediction for match ${f.id}:`, err);
          }
        }
        setPredictions(predMap);
      } catch (err) {
        console.error('Error bootstrapping GoalMetric AI:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSwitchRole = async (role: 'guest' | 'user' | 'admin') => {
    try {
      const res = await apiClient.switchDemoRole(role);
      setCurrentUser(res.user);
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const handleOpenMatchDetail = (match: MatchFixture) => {
    setSelectedMatch(match);
    setActiveTab('match_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenH2H = (homeTeam: string, awayTeam: string) => {
    setH2hTeamPair({ home: homeTeam, away: awayTeam });
    setActiveTab('h2h');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Demo Disclaimer Banner */}
      <DemoBanner
        engineType={engineType}
        isSupabaseConfigured={isSupabaseConfigured}
      />

      {/* Main Responsive Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'landing' && (
          <LandingPage
            onExploreDashboard={() => setActiveTab('dashboard')}
            onExplorePricing={() => setActiveTab('pricing')}
            onExploreRegister={() => setActiveTab('auth')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            matches={matches}
            predictions={predictions}
            loading={loading}
          />
        )}

        {activeTab === 'fixtures' && (
          <FixturesPage
            matches={matches}
            predictions={predictions}
            loading={loading}
            onSelectMatch={handleOpenMatchDetail}
          />
        )}

        {activeTab === 'match_detail' && selectedMatch && (
          <MatchDetailPage
            match={selectedMatch}
            prediction={predictions[selectedMatch.id]}
            loadingPrediction={!predictions[selectedMatch.id]}
            onBack={() => setActiveTab('fixtures')}
            onOpenH2H={handleOpenH2H}
          />
        )}

        {activeTab === 'predictions' && <PredictionSandboxView />}

        {activeTab === 'h2h' && (
          <HeadToHeadPage
            matches={matches}
            initialHomeTeam={h2hTeamPair.home}
            initialAwayTeam={h2hTeamPair.away}
          />
        )}

        {activeTab === 'combo' && (
          <CombinationBuilderPage
            matches={matches}
            predictions={predictions}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingPage
            currentTier={currentUser.subscriptionTier}
            onSelectPlan={(planId) => {
              if (planId === 'free') {
                handleSwitchRole('guest');
              } else if (planId === 'pro') {
                handleSwitchRole('user');
              } else {
                handleSwitchRole('admin');
              }
              setActiveTab('billing');
            }}
            onPlanUpdated={async () => {
              const res = await apiClient.getCurrentUser();
              if (res.user) {
                setCurrentUser(res.user);
              }
            }}
          />
        )}

        {activeTab === 'auth' && (
          <AuthPage
            onLoginSuccess={(role) => {
              handleSwitchRole(role);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            onNavigateBilling={() => setActiveTab('billing')}
          />
        )}

        {activeTab === 'billing' && (
          <BillingPage
            currentUser={currentUser}
            onUpgradePlan={() => setActiveTab('pricing')}
            onUserRefreshed={async () => {
              const res = await apiClient.getCurrentUser();
              if (res.user) {
                setCurrentUser(res.user);
              }
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            currentUser={currentUser}
            onElevateAdmin={() => handleSwitchRole('admin')}
          />
        )}

        {/* Existing Architectural & Dev Tools */}
        {activeTab === 'provider_sync' && <ProviderSyncPage />}
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'explorer' && <ApiExplorerView />}
        {activeTab === 'roadmap' && <RoadmapView />}
        {activeTab === 'testsuite' && <TestSuiteView />}
      </main>

      {/* Modern Engineering Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/90 py-8 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">GoalMetric AI</span>
              <span>— SaaS Analitik & Prediksi Sepak Bola Berbasis Dixon-Coles</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <button onClick={() => setActiveTab('landing')} className="hover:text-white">Beranda</button>
              <button onClick={() => setActiveTab('dashboard')} className="hover:text-white">Dashboard</button>
              <button onClick={() => setActiveTab('pricing')} className="hover:text-white">Pricing</button>
              <button onClick={() => setActiveTab('architecture')} className="hover:text-white">Peta Arsitektur</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-zinc-900 text-[11px] text-zinc-500">
            <div>
              © 2026 GoalMetric AI. Semua data contoh berlabel <strong className="text-amber-400 font-mono">[DEMO DATA]</strong> untuk simulasi matematis.
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zero Client Secret
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5 text-sky-400" /> Modular Clean Architecture
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

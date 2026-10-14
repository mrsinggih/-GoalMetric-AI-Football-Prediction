-- ==============================================================================
-- GoalMetric AI - Initial Supabase PostgreSQL Schema Migration
-- Migration: 001_initial_schema.sql
-- Description: Core tables, indexes, and Row Level Security (RLS) policies
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_provider_id VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    league VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    home_attack_strength NUMERIC(4,2) DEFAULT 1.00,
    home_defense_strength NUMERIC(4,2) DEFAULT 1.00,
    away_attack_strength NUMERIC(4,2) DEFAULT 1.00,
    away_defense_strength NUMERIC(4,2) DEFAULT 1.00,
    xg_for NUMERIC(4,2) DEFAULT 1.30,
    xg_against NUMERIC(4,2) DEFAULT 1.30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Matches / Fixtures Table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) UNIQUE,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    league VARCHAR(100) NOT NULL,
    season VARCHAR(20) NOT NULL,
    kickoff_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, LIVE, FINISHED
    home_score INT,
    away_score INT,
    venue VARCHAR(255),
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    engine_version VARCHAR(50) NOT NULL, -- TYPESCRIPT_POISSON_V1, PYTHON_DIXON_COLES_V1
    home_lambda NUMERIC(4,2) NOT NULL,
    away_lambda NUMERIC(4,2) NOT NULL,
    prob_home_win NUMERIC(4,3) NOT NULL,
    prob_draw NUMERIC(4,3) NOT NULL,
    prob_away_win NUMERIC(4,3) NOT NULL,
    prob_over_25 NUMERIC(4,3) NOT NULL,
    prob_under_25 NUMERIC(4,3) NOT NULL,
    prob_btts NUMERIC(4,3) NOT NULL,
    most_likely_score VARCHAR(10),
    confidence VARCHAR(20) DEFAULT 'MEDIUM',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Profiles & Subscriptions (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'user' or 'admin'
    subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'elite'
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Daily Usage Quotas
CREATE TABLE IF NOT EXISTS public.user_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    usage_date DATE DEFAULT CURRENT_DATE,
    predictions_count INT DEFAULT 0,
    UNIQUE(user_id, usage_date)
);

-- 7. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON public.matches(kickoff_time);
CREATE INDEX IF NOT EXISTS idx_matches_league ON public.matches(league);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON public.predictions(match_id);

-- 8. Row Level Security (RLS) Setup
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Read-only public policies for matches & teams
CREATE POLICY "Public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);

-- Predictions read policy based on authentication
CREATE POLICY "Public read predictions" ON public.predictions FOR SELECT USING (true);

-- User Profiles policy (Users can only see and edit their own profile)
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

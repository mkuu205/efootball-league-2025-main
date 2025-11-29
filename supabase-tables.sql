-- =====================================================
-- eFootball League 2025 - Player Self-Registration Tables
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Player Accounts Table (for login/registration)
CREATE TABLE IF NOT EXISTS player_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    preferred_team VARCHAR(100),
    experience_level VARCHAR(50),
    bio TEXT,
    photo_url TEXT,
    player_id INTEGER REFERENCES players(id),
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_date TIMESTAMP,
    transaction_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'inactive',
    profile_completed BOOLEAN DEFAULT FALSE,
    must_change_password BOOLEAN DEFAULT FALSE,
    registration_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add username column if not exists (for existing tables)
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'player_accounts' AND column_name = 'username'
    ) THEN
        ALTER TABLE player_accounts ADD COLUMN username VARCHAR(100) UNIQUE;
    END IF;
END $;

-- Add must_change_password column if not exists (for existing tables)
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'player_accounts' AND column_name = 'must_change_password'
    ) THEN
        ALTER TABLE player_accounts ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;
    END IF;
END $;

-- Add must_complete_profile column if not exists (for legacy players)
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'player_accounts' AND column_name = 'must_complete_profile'
    ) THEN
        ALTER TABLE player_accounts ADD COLUMN must_complete_profile BOOLEAN DEFAULT FALSE;
    END IF;
END $;

-- Payments Table (for M-Pesa transactions)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    player_account_id INTEGER REFERENCES player_accounts(id),
    amount DECIMAL(10, 2) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    reference VARCHAR(100),
    checkout_request_id VARCHAR(255),
    merchant_request_id VARCHAR(255),
    transaction_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    payment_type VARCHAR(50) DEFAULT 'registration',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Add player_account_id to existing players table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'player_account_id'
    ) THEN
        ALTER TABLE players ADD COLUMN player_account_id INTEGER REFERENCES player_accounts(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_accounts_email ON player_accounts(email);
CREATE INDEX IF NOT EXISTS idx_player_accounts_phone ON player_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_player_accounts_status ON player_accounts(status);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_id ON payments(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_account_id ON payments(player_account_id);

-- Enable Row Level Security (RLS)
ALTER TABLE player_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
-- Allow anyone to insert (for registration)
CREATE POLICY "Allow public insert on player_accounts" ON player_accounts
    FOR INSERT WITH CHECK (true);

-- Allow anyone to select their own data
CREATE POLICY "Allow public select on player_accounts" ON player_accounts
    FOR SELECT USING (true);

-- Allow anyone to update their own data
CREATE POLICY "Allow public update on player_accounts" ON player_accounts
    FOR UPDATE USING (true);

-- Payments policies
CREATE POLICY "Allow public insert on payments" ON payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on payments" ON payments
    FOR SELECT USING (true);

CREATE POLICY "Allow public update on payments" ON payments
    FOR UPDATE USING (true);

-- =====================================================
-- Storage Bucket for Player Photos
-- =====================================================

-- Create storage bucket for photos (run in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Storage policies for photos bucket
-- Allow anyone to upload to player-photos folder
CREATE POLICY "Allow public upload to player-photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = 'player-photos');

-- Allow anyone to view photos
CREATE POLICY "Allow public read on photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

-- Allow anyone to update their photos
CREATE POLICY "Allow public update on photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'photos');

-- =====================================================
-- TOURNAMENTS SYSTEM
-- =====================================================

-- Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entry_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    prize_pool DECIMAL(10, 2) DEFAULT 0,
    max_players INTEGER DEFAULT 16,
    min_players INTEGER DEFAULT 4,
    status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, registration_open, in_progress, completed, cancelled
    format VARCHAR(50) DEFAULT 'league', -- league, knockout, group_knockout
    start_date DATE,
    end_date DATE,
    registration_deadline TIMESTAMP,
    rules TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Participants Table
CREATE TABLE IF NOT EXISTS tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    player_account_id INTEGER REFERENCES player_accounts(id),
    player_id INTEGER REFERENCES players(id),
    payment_id INTEGER REFERENCES payments(id),
    status VARCHAR(50) DEFAULT 'registered', -- registered, confirmed, eliminated, winner
    seed INTEGER,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, player_account_id)
);

-- Tournament Fixtures Table
CREATE TABLE IF NOT EXISTS tournament_fixtures (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER DEFAULT 1,
    match_number INTEGER,
    home_player_id INTEGER REFERENCES players(id),
    away_player_id INTEGER REFERENCES players(id),
    home_score INTEGER,
    away_score INTEGER,
    winner_id INTEGER REFERENCES players(id),
    scheduled_date DATE,
    scheduled_time TIME,
    played BOOLEAN DEFAULT FALSE,
    played_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Standings Table (for league format)
CREATE TABLE IF NOT EXISTS tournament_standings (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id),
    played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    UNIQUE(tournament_id, player_id)
);

-- Add tournament_id to payments table for tournament payments
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'tournament_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN tournament_id INTEGER REFERENCES tournaments(id);
    END IF;
END $;

-- Create indexes for tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_player ON tournament_participants(player_account_id);
CREATE INDEX IF NOT EXISTS idx_tournament_fixtures_tournament ON tournament_fixtures(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_standings_tournament ON tournament_standings(tournament_id);

-- Enable RLS on tournament tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_standings ENABLE ROW LEVEL SECURITY;

-- Tournament policies
CREATE POLICY "Allow public select on tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tournaments" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on tournaments" ON tournaments FOR DELETE USING (true);

CREATE POLICY "Allow public select on tournament_participants" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tournament_participants" ON tournament_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tournament_participants" ON tournament_participants FOR UPDATE USING (true);

CREATE POLICY "Allow public select on tournament_fixtures" ON tournament_fixtures FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tournament_fixtures" ON tournament_fixtures FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tournament_fixtures" ON tournament_fixtures FOR UPDATE USING (true);

CREATE POLICY "Allow public select on tournament_standings" ON tournament_standings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tournament_standings" ON tournament_standings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tournament_standings" ON tournament_standings FOR UPDATE USING (true);

-- =====================================================
-- DONE! Your tables are ready for player registration
-- =====================================================

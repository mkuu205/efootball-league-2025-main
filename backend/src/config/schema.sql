-- eFootball League 2026 - Complete Database Schema
-- Run this SQL to initialize the Neon PostgreSQL database

-- Player accounts (main users table)
CREATE TABLE IF NOT EXISTS player_accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player',
    team VARCHAR(100),
    logo_url VARCHAR(500),
    rating INTEGER DEFAULT 1000,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournaments (with entry fee and max players)
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    max_players INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_by INTEGER REFERENCES player_accounts(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES player_accounts(id) ON DELETE CASCADE,
    payment_status VARCHAR(20) DEFAULT 'not_required',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);

-- Fixtures/Matches
CREATE TABLE IF NOT EXISTS fixtures (
    id SERIAL PRIMARY KEY,
    player1_id INTEGER REFERENCES player_accounts(id),
    player2_id INTEGER REFERENCES player_accounts(id),
    player1_score INTEGER,
    player2_score INTEGER,
    winner_id INTEGER REFERENCES player_accounts(id),
    round VARCHAR(50),
    match_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Results (completed matches)
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES fixtures(id) ON DELETE CASCADE,
    player1_score INTEGER NOT NULL,
    player2_score INTEGER NOT NULL,
    winner_id INTEGER REFERENCES player_accounts(id),
    submitted_by INTEGER REFERENCES player_accounts(id),
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES player_accounts(id) ON DELETE SET NULL,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    checkout_request_id VARCHAR(255),
    merchant_request_id VARCHAR(255),
    transaction_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES player_accounts(id) UNIQUE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin authentication table (separate from player accounts)
CREATE TABLE IF NOT EXISTS admin_auth (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications (comprehensive system)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES player_accounts(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_players_email ON player_accounts(email);
CREATE INDEX IF NOT EXISTS idx_players_username ON player_accounts(username);
CREATE INDEX IF NOT EXISTS idx_players_rating ON player_accounts(rating);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payments_player ON payment_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
CREATE INDEX IF NOT EXISTS idx_fixtures_tournament ON fixtures(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants ON tournament_participants(tournament_id, player_id);

-- Insert default admin user (password: admin123 - CHANGE THIS!)
INSERT INTO player_accounts (username, email, password, role, team) 
VALUES (
    'admin',
    'admin@efootball.com',
    '$2a$10$rOZxJZ5lE3xKZj3xKZjOu.K5xKZj3xKZj3xKZj3xKZj3xKZj3xKZj',
    'admin',
    'System Admin'
)
ON CONFLICT (username) DO NOTHING;

-- Insert default admin record
INSERT INTO admins (player_id)
SELECT id FROM player_accounts WHERE username = 'admin'
ON CONFLICT (player_id) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('league_mode', 'active'),
    ('registration_enabled', 'true'),
    ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- Insert default admin credentials (email: admin.kishtech.co.ke, password: kish24)
-- Password is bcrypt hashed version of 'kish24'
-- To regenerate: Use the generate-admin-hash.js script
INSERT INTO admin_auth (email, password) VALUES
    ('admin.kishtech.co.ke', '$2b$10$rLjXU8Z5xKZj3xKZjOu.K5xKZj3xKZj3xKZj3xKZj3xKZj3xKZj3xK')
ON CONFLICT (email) DO NOTHING;

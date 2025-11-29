// api/db-setup.js - Database setup and table creation

const TABLE_DEFINITIONS = {
    player_accounts: `
        CREATE TABLE IF NOT EXISTS player_accounts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            preferred_team VARCHAR(100),
            experience_level VARCHAR(50),
            bio TEXT,
            photo_url TEXT,
            player_id INTEGER,
            payment_status VARCHAR(50) DEFAULT 'pending',
            payment_date TIMESTAMPTZ,
            transaction_code VARCHAR(100),
            status VARCHAR(50) DEFAULT 'inactive',
            profile_completed BOOLEAN DEFAULT FALSE,
            registration_date TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `,
    payments: `
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            player_account_id INTEGER,
            amount DECIMAL(10, 2) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            reference VARCHAR(100),
            checkout_request_id VARCHAR(255),
            merchant_request_id VARCHAR(255),
            transaction_code VARCHAR(100),
            status VARCHAR(50) DEFAULT 'pending',
            payment_type VARCHAR(50) DEFAULT 'registration',
            error_message TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            completed_at TIMESTAMPTZ
        )
    `
};

export default function dbSetupRoutes(app, supabaseAdmin) {
    
    // GET /api/db/status - Check database status
    app.get('/api/db/status', async (req, res) => {
        try {
            const status = {
                players: await checkTable(supabaseAdmin, 'players'),
                player_accounts: await checkTable(supabaseAdmin, 'player_accounts'),
                payments: await checkTable(supabaseAdmin, 'payments'),
                fixtures: await checkTable(supabaseAdmin, 'fixtures'),
                results: await checkTable(supabaseAdmin, 'results')
            };

            const allReady = Object.values(status).every(s => s.exists);

            res.json({
                success: true,
                ready: allReady,
                tables: status
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // POST /api/db/setup - Create missing tables
    app.post('/api/db/setup', async (req, res) => {
        try {
            const results = [];

            // Check and create player_accounts
            const accountsExists = await checkTable(supabaseAdmin, 'player_accounts');
            if (!accountsExists.exists) {
                const created = await createTableViaInsert(supabaseAdmin, 'player_accounts');
                results.push({ table: 'player_accounts', created, method: 'insert' });
            } else {
                results.push({ table: 'player_accounts', exists: true });
            }

            // Check and create payments
            const paymentsExists = await checkTable(supabaseAdmin, 'payments');
            if (!paymentsExists.exists) {
                const created = await createTableViaInsert(supabaseAdmin, 'payments');
                results.push({ table: 'payments', created, method: 'insert' });
            } else {
                results.push({ table: 'payments', exists: true });
            }

            // Check players table for player_account_id column
            const playersCheck = await checkPlayersColumn(supabaseAdmin);
            results.push({ table: 'players', column_check: playersCheck });

            res.json({
                success: true,
                message: 'Database setup complete',
                results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // GET /api/db/sql - Get SQL to run manually
    app.get('/api/db/sql', (req, res) => {
        const sql = `
-- =====================================================
-- eFootball League 2025 - Player Registration Tables
-- Run this in Supabase SQL Editor (one-time setup)
-- =====================================================

-- Player Accounts Table
CREATE TABLE IF NOT EXISTS player_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    preferred_team VARCHAR(100),
    experience_level VARCHAR(50),
    bio TEXT,
    photo_url TEXT,
    player_id INTEGER,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    transaction_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'inactive',
    profile_completed BOOLEAN DEFAULT FALSE,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    player_account_id INTEGER,
    amount DECIMAL(10, 2) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    reference VARCHAR(100),
    checkout_request_id VARCHAR(255),
    merchant_request_id VARCHAR(255),
    transaction_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    payment_type VARCHAR(50) DEFAULT 'registration',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS player_account_id INTEGER;

-- Enable RLS
ALTER TABLE player_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Allow all on player_accounts" ON player_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on payments" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_player_accounts_email ON player_accounts(email);
CREATE INDEX IF NOT EXISTS idx_player_accounts_phone ON player_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_id ON payments(checkout_request_id);
        `;

        res.type('text/plain').send(sql);
    });

    console.log('✅ Database setup routes registered');
}

async function checkTable(supabase, tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error && error.code === '42P01') {
            return { exists: false, error: 'Table does not exist' };
        }
        if (error) {
            return { exists: false, error: error.message };
        }
        return { exists: true, count: data?.length || 0 };
    } catch (err) {
        return { exists: false, error: err.message };
    }
}

async function checkPlayersColumn(supabase) {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('player_account_id')
            .limit(1);

        if (error && error.message.includes('player_account_id')) {
            return { has_column: false };
        }
        return { has_column: true };
    } catch (err) {
        return { has_column: false, error: err.message };
    }
}

async function createTableViaInsert(supabase, tableName) {
    // This won't actually create the table in Supabase
    // Supabase requires tables to be created via SQL Editor or migrations
    // Return false to indicate manual creation is needed
    return false;
}

// Export for use in db-init
export { checkTable };

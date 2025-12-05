// api/db-init.js - Auto-create database tables on startup
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function initializeDatabase(supabaseAdmin) {
    console.log('🔧 Checking database tables...');

    try {
        // Check which tables exist
        const playerAccountsExists = await checkTableExists(supabaseAdmin, 'player_accounts');
        const paymentsExists = await checkTableExists(supabaseAdmin, 'payments');

        console.log(`   player_accounts: ${playerAccountsExists ? '✅ exists' : '❌ missing'}`);
        console.log(`   payments: ${paymentsExists ? '✅ exists' : '❌ missing'}`);

        // If tables are missing, run Python setup script
        if (!playerAccountsExists || !paymentsExists) {
            console.log('📋 Missing tables detected. Running setup script...');
            
            const setupSuccess = await runPythonSetup();
            
            if (setupSuccess) {
                // Verify tables were created
                const verify1 = await checkTableExists(supabaseAdmin, 'player_accounts');
                const verify2 = await checkTableExists(supabaseAdmin, 'payments');
                
                if (verify1 && verify2) {
                    console.log('✅ All tables created successfully!');
                    return true;
                }
            }
            
            // If Python script failed, show manual instructions
            console.log('');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('⚠️  Auto-setup failed. Please set up manually:');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('');
            console.log('Option 1: Run Python script manually');
            console.log('   1. Add SUPABASE_DB_PASSWORD to your .env file');
            console.log('   2. Run: python scripts/setup_db.py');
            console.log('');
            console.log('Option 2: Use Supabase SQL Editor');
            console.log('   Visit: http://localhost:3000/setup.html');
            console.log('');
            console.log('═══════════════════════════════════════════════════════════');
            return false;
        }

        // Check players table column
        await ensurePlayersColumn(supabaseAdmin);

        console.log('✅ Database initialization complete');
        return true;
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        return false;
    }
}

async function checkTableExists(supabase, tableName) {
    try {
        const { error } = await supabase
            .from(tableName)
            .select('id')
            .limit(1);

        if (!error) return true;
        if (error.code === '42P01') return false;
        if (error.message?.includes('does not exist')) return false;
        
        return true;
    } catch {
        return false;
    }
}

async function runPythonSetup() {
    return new Promise((resolve) => {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'setup_db.py');
        
        // Try python3 first, then python
        const pythonCommands = ['python3', 'python', 'py'];
        
        let tried = 0;
        
        function tryPython(cmd) {
            tried++;
            
            const process = spawn(cmd, [scriptPath], {
                env: { ...process.env },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
                console.log(data.toString().trim());
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('error', (err) => {
                // Python command not found, try next
                if (tried < pythonCommands.length) {
                    tryPython(pythonCommands[tried]);
                } else {
                    console.log('⚠️  Python not found. Install Python to enable auto-setup.');
                    resolve(false);
                }
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    if (errorOutput) {
                        console.log('   Setup script output:', errorOutput.trim());
                    }
                    resolve(false);
                }
            });
        }
        
        tryPython(pythonCommands[0]);
    });
}

async function ensurePlayersColumn(supabase) {
    try {
        const { error } = await supabase
            .from('players')
            .select('player_account_id')
            .limit(1);

        if (error && error.message?.includes('player_account_id')) {
            console.log('   ⚠️  players.player_account_id column missing');
            return false;
        }
        
        console.log('   ✅ players.player_account_id exists');
        return true;
    } catch {
        return false;
    }
}

export function getSetupSQL() {
    return `
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS player_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    preferred_team VARCHAR(100),
    experience_level VARCHAR(50),
    bio TEXT,
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

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    player_account_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
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

ALTER TABLE players ADD COLUMN IF NOT EXISTS player_account_id INTEGER;

ALTER TABLE player_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on player_accounts" ON player_accounts;
DROP POLICY IF EXISTS "Allow all on payments" ON payments;
CREATE POLICY "Allow all on player_accounts" ON player_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on payments" ON payments FOR ALL USING (true) WITH CHECK (true);
`;
}

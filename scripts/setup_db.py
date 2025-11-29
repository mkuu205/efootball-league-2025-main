#!/usr/bin/env python3
"""
Database Setup Script for eFootball League 2025
Automatically creates required tables in Supabase PostgreSQL
"""

import os
import sys

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("Installing psycopg2-binary...")
    os.system(f"{sys.executable} -m pip install psycopg2-binary -q")
    import psycopg2
    from psycopg2 import sql

# Supabase PostgreSQL connection details
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_PROJECT_REF = "zliedzrqzvywlsyfggcq"
SUPABASE_DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD", "")

# Connection string
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"postgresql://postgres.{SUPABASE_PROJECT_REF}:{SUPABASE_DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
)

# SQL to create tables
CREATE_TABLES_SQL = """
-- Create player_accounts table
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

-- Create payments table
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

-- Add player_account_id column to players table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'player_account_id'
    ) THEN
        ALTER TABLE players ADD COLUMN player_account_id INTEGER;
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        NULL; -- players table doesn't exist, skip
END $$;

-- Enable Row Level Security
ALTER TABLE player_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (drop first if exist)
DROP POLICY IF EXISTS "Allow all on player_accounts" ON player_accounts;
DROP POLICY IF EXISTS "Allow all on payments" ON payments;

CREATE POLICY "Allow all on player_accounts" ON player_accounts 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on payments" ON payments 
    FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_accounts_email ON player_accounts(email);
CREATE INDEX IF NOT EXISTS idx_player_accounts_phone ON player_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_player_accounts_status ON player_accounts(status);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_id ON payments(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_account_id ON payments(player_account_id);
"""

def setup_database():
    """Connect to Supabase PostgreSQL and create tables"""
    print("🔧 Setting up database tables...")
    
    if not SUPABASE_DB_PASSWORD and "DATABASE_URL" not in os.environ:
        print("❌ Error: SUPABASE_DB_PASSWORD or DATABASE_URL environment variable required")
        print("   Set it in your .env file or environment")
        print("   Find your database password in Supabase Dashboard > Settings > Database")
        return False
    
    try:
        # Connect to database
        print(f"📡 Connecting to Supabase PostgreSQL...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Execute table creation SQL
        print("📋 Creating tables...")
        cursor.execute(CREATE_TABLES_SQL)
        
        # Verify tables exist
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('player_accounts', 'payments')
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"✅ Tables verified: {', '.join(tables)}")
        
        # Close connection
        cursor.close()
        conn.close()
        
        print("✅ Database setup complete!")
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection error: {e}")
        print("   Check your database password and connection settings")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = setup_database()
    sys.exit(0 if success else 1)

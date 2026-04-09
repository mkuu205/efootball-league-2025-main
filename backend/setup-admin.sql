-- SQL Script to Setup Admin Account
-- Run this in your Neon PostgreSQL database

-- Step 1: Create the admin_auth table (if not exists)
CREATE TABLE IF NOT EXISTS admin_auth (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Generate bcrypt hash for password 'kish24'
-- You need to run this Node.js code to generate the hash:
/*
const bcrypt = require('bcrypt');
bcrypt.hash('kish24', 10, (err, hash) => {
  console.log(hash);
});
*/

-- Step 3: Insert admin with hashed password
-- Replace YOUR_BCRYPT_HASH_HERE with the actual hash from Step 2
-- For now, using a placeholder - YOU MUST UPDATE THIS!
INSERT INTO admin_auth (email, password) VALUES
    ('admin.kishtech.co.ke', '$2b$10$YourHashHereReplaceThisWithRealHash')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- Step 4: Verify the admin was created
SELECT id, email, created_at FROM admin_auth WHERE email = 'admin.kishtech.co.ke';

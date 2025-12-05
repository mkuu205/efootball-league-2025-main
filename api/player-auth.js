// api/player-auth.js - Player Authentication API Routes

export default function playerAuthRoutes(app, supabaseAdmin) {
    
    // POST /api/player/register - Register new player account
    app.post('/api/player/register', async (req, res) => {
        try {
            const { name, username, phone, email, team, password } = req.body;

            // Validation
            if (!name || !phone || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required: name, phone, email, password'
                });
            }

            // Validate team
            if (!team) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select a team'
                });
            }

            // Validate username if provided
            if (username) {
                if (username.length < 3) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username must be at least 3 characters'
                    });
                }
                if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username can only contain letters, numbers and underscore'
                    });
                }

                // Check if username exists
                const { data: existingUsername } = await supabaseAdmin
                    .from('player_accounts')
                    .select('id')
                    .eq('username', username)
                    .single();

                if (existingUsername) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already taken'
                    });
                }
            }

            // Validate phone format
            const phoneRegex = /^254\d{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone must be in format 254XXXXXXXXX'
                });
            }

            // Check if email exists
            const { data: existingEmail } = await supabaseAdmin
                .from('player_accounts')
                .select('id')
                .eq('email', email)
                .single();

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Check if phone exists
            const { data: existingPhone } = await supabaseAdmin
                .from('player_accounts')
                .select('id')
                .eq('phone', phone)
                .single();

            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already registered'
                });
            }

            // Create account - active immediately, can join tournaments later
            const { data: newAccount, error } = await supabaseAdmin
                .from('player_accounts')
                .insert([{
                    name: name,
                    username: username || null,
                    phone: phone,
                    email: email,
                    preferred_team: team,
                    password: password, // In production, hash this!
                    payment_status: 'none', // No payment required to create account
                    status: 'active', // Active immediately
                    profile_completed: true, // Profile completed during registration
                    registration_date: new Date().toISOString(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ New player account created: ${username || name} (${email}) - Team: ${team}`);

            res.json({
                success: true,
                message: 'Account created successfully',
                account: {
                    id: newAccount.id,
                    name: newAccount.name,
                    email: newAccount.email,
                    phone: newAccount.phone,
                    team: team,
                    payment_status: newAccount.payment_status
                }
            });

        } catch (error) {
            console.error('❌ Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed: ' + error.message
            });
        }
    });

    // POST /api/player/login - Player login
    app.post('/api/player/login', async (req, res) => {
        try {
            const { identifier, password } = req.body;

            console.log(`🔐 Login attempt: "${identifier}"`);

            if (!identifier || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email/phone/name and password are required'
                });
            }

            // Check if identifier is email, phone, or name
            const isEmail = identifier.includes('@');
            const isPhone = /^254\d{9}$/.test(identifier) || /^\d{10,}$/.test(identifier);
            
            console.log(`   Type: ${isEmail ? 'email' : isPhone ? 'phone' : 'name'}`);
            
            let account = null;
            let error = null;

            // First try to find in player_accounts (registered players)
            if (isEmail) {
                const result = await supabaseAdmin
                    .from('player_accounts')
                    .select('*')
                    .eq('email', identifier)
                    .single();
                account = result.data;
                error = result.error;
            } else if (isPhone) {
                const result = await supabaseAdmin
                    .from('player_accounts')
                    .select('*')
                    .eq('phone', identifier)
                    .single();
                account = result.data;
                error = result.error;
            } else {
                // Try by name in player_accounts (exact match first)
                let result = await supabaseAdmin
                    .from('player_accounts')
                    .select('*')
                    .ilike('name', identifier)
                    .single();
                
                // If not found, try partial match
                if (!result.data) {
                    result = await supabaseAdmin
                        .from('player_accounts')
                        .select('*')
                        .ilike('name', `%${identifier}%`)
                        .single();
                }
                
                account = result.data;
                error = result.error;
            }

            // If not found in player_accounts, check if it's an admin-added player (by name)
            if (!account) {
                console.log(`   Not found in player_accounts, checking players table...`);
                
                // Try exact match first, then partial match
                let playerResult = await supabaseAdmin
                    .from('players')
                    .select('*')
                    .ilike('name', identifier)
                    .is('player_account_id', null)
                    .single();
                
                // If not found, try with wildcards for partial match
                if (!playerResult.data) {
                    console.log(`   Exact match not found, trying partial match...`);
                    playerResult = await supabaseAdmin
                        .from('players')
                        .select('*')
                        .ilike('name', `%${identifier}%`)
                        .is('player_account_id', null)
                        .single();
                }
                
                const player = playerResult.data;
                const playerError = playerResult.error;
                
                console.log(`   Player found: ${player ? player.name : 'NO'}`);

                if (player) {
                    // Legacy player - check default password "2025"
                    const DEFAULT_PASSWORD = '2025';
                    if (password !== DEFAULT_PASSWORD) {
                        return res.status(401).json({
                            success: false,
                            message: 'Invalid password. Default password for existing players is: 2025'
                        });
                    }

                    // Create a temporary account for this legacy player
                    // Use unique placeholder values for email/phone (required unique fields)
                    const uniqueId = Date.now();
                    const placeholderEmail = `legacy_${player.id}_${uniqueId}@placeholder.efl`;
                    const placeholderPhone = `000${player.id}${uniqueId}`.slice(-12);
                    
                    const { data: newAccount, error: accountError } = await supabaseAdmin
                        .from('player_accounts')
                        .insert([{
                            name: player.name,
                            phone: placeholderPhone,
                            email: placeholderEmail,
                            password: DEFAULT_PASSWORD,
                            preferred_team: player.team,
                            player_id: player.id,
                            payment_status: 'completed', // Legacy players already in league
                            status: 'active',
                            profile_completed: false, // Need to add real email/phone
                            must_change_password: true, // Force password change
                            must_complete_profile: true, // Need to add email/phone
                            registration_date: new Date().toISOString(),
                            created_at: new Date().toISOString()
                        }])
                        .select()
                        .single();

                    if (accountError) {
                        console.error('Error creating account for legacy player:', accountError);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to create account'
                        });
                    }

                    // Link account to player
                    await supabaseAdmin
                        .from('players')
                        .update({ player_account_id: newAccount.id })
                        .eq('id', player.id);

                    console.log(`✅ Legacy player logged in: ${player.name} - Account created`);

                    return res.json({
                        success: true,
                        message: 'Login successful',
                        player: {
                            id: newAccount.id,
                            account_id: newAccount.id,
                            player_id: player.id,
                            name: player.name,
                            email: '',
                            phone: '',
                            preferred_team: player.team,
                            status: 'active',
                            photo: player.photo || null,
                            must_change_password: true,
                            must_complete_profile: true
                        }
                    });
                }

                // Check if player exists but already has an account linked
                const { data: linkedPlayer } = await supabaseAdmin
                    .from('players')
                    .select('*, player_accounts(*)')
                    .ilike('name', `%${identifier}%`)
                    .not('player_account_id', 'is', null)
                    .single();
                
                if (linkedPlayer && linkedPlayer.player_accounts) {
                    console.log(`   Player has linked account, checking password...`);
                    // Player has account, check password
                    if (linkedPlayer.player_accounts.password === password) {
                        return res.json({
                            success: true,
                            message: 'Login successful',
                            player: {
                                id: linkedPlayer.player_accounts.id,
                                account_id: linkedPlayer.player_accounts.id,
                                player_id: linkedPlayer.id,
                                name: linkedPlayer.name,
                                email: linkedPlayer.player_accounts.email || '',
                                phone: linkedPlayer.player_accounts.phone || '',
                                preferred_team: linkedPlayer.team,
                                status: linkedPlayer.player_accounts.status,
                                photo: linkedPlayer.photo || linkedPlayer.player_accounts.photo_url || null,
                                must_change_password: linkedPlayer.player_accounts.must_change_password || false,
                                must_complete_profile: linkedPlayer.player_accounts.must_complete_profile || false
                            }
                        });
                    } else {
                        return res.status(401).json({
                            success: false,
                            message: 'Invalid password'
                        });
                    }
                }

                return res.status(401).json({
                    success: false,
                    message: 'Account not found. Check your email, phone, or name.'
                });
            }

            // Check password (in production, use proper hashing comparison)
            if (account.password !== password) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }

            // Allow login regardless of payment status - users can pay for tournaments from dashboard
            console.log(`✅ Player logged in: ${account.name} (payment_status: ${account.payment_status})`);

            // Get player photo if player_id exists
            let photo = account.photo_url || null;
            if (account.player_id && !photo) {
                const { data: playerData } = await supabaseAdmin
                    .from('players')
                    .select('photo')
                    .eq('id', account.player_id)
                    .single();
                if (playerData?.photo) {
                    photo = playerData.photo;
                }
            }

            res.json({
                success: true,
                message: 'Login successful',
                player: {
                    id: account.id,
                    account_id: account.id,
                    player_id: account.player_id,
                    name: account.name,
                    email: account.email,
                    phone: account.phone,
                    preferred_team: account.preferred_team,
                    status: account.status,
                    photo: photo,
                    must_change_password: account.must_change_password || false,
                    must_complete_profile: account.must_complete_profile || false
                }
            });

        } catch (error) {
            console.error('❌ Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed: ' + error.message
            });
        }
    });

    // PUT /api/player/profile - Update player profile
    app.put('/api/player/profile', async (req, res) => {
        try {
            const { account_id, team, experience, bio } = req.body;

            if (!account_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Account ID is required'
                });
            }

            // Get account
            const { data: account, error: fetchError } = await supabaseAdmin
                .from('player_accounts')
                .select('*')
                .eq('id', account_id)
                .single();

            if (fetchError || !account) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            // Update account profile
            const { error: updateError } = await supabaseAdmin
                .from('player_accounts')
                .update({
                    preferred_team: team,
                    experience_level: experience,
                    bio: bio,
                    status: 'active',
                    profile_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', account_id);

            if (updateError) throw updateError;

            // Create player entry if not exists
            let playerId = account.player_id;
            
            if (!playerId) {
                const { data: newPlayer, error: playerError } = await supabaseAdmin
                    .from('players')
                    .insert([{
                        name: account.name,
                        team: team,
                        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=6a11cb&color=fff&size=150`,
                        player_account_id: account_id,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (playerError) throw playerError;

                playerId = newPlayer.id;

                // Link player to account
                await supabaseAdmin
                    .from('player_accounts')
                    .update({ player_id: playerId })
                    .eq('id', account_id);
            }

            console.log(`✅ Profile completed for: ${account.name} - Added to players table with ID: ${playerId}`);

            // Auto-generate fixtures for the new player against all existing players
            await generateFixturesForNewPlayer(supabaseAdmin, playerId, account.name);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                player_id: playerId
            });

        } catch (error) {
            console.error('❌ Profile update error:', error);
            res.status(500).json({
                success: false,
                message: 'Profile update failed: ' + error.message
            });
        }
    });

    // GET /api/player/:id - Get player details
    app.get('/api/player/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const { data: account, error } = await supabaseAdmin
                .from('player_accounts')
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    preferred_team,
                    experience_level,
                    bio,
                    status,
                    payment_status,
                    player_id,
                    registration_date
                `)
                .eq('id', id)
                .single();

            if (error || !account) {
                return res.status(404).json({
                    success: false,
                    message: 'Player not found'
                });
            }

            // Get player stats if player_id exists
            let stats = null;
            if (account.player_id) {
                const { data: player } = await supabaseAdmin
                    .from('players')
                    .select('*')
                    .eq('id', account.player_id)
                    .single();

                if (player) {
                    stats = player;
                }
            }

            res.json({
                success: true,
                account: account,
                player: stats
            });

        } catch (error) {
            console.error('❌ Get player error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get player: ' + error.message
            });
        }
    });

    // GET /api/players/registered - Get all registered players (for admin)
    app.get('/api/players/registered', async (req, res) => {
        try {
            const { data: accounts, error } = await supabaseAdmin
                .from('player_accounts')
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    preferred_team,
                    status,
                    payment_status,
                    registration_date,
                    player_id,
                    payment_date
                `)
                .order('registration_date', { ascending: false });

            if (error) throw error;

            // Check for completed payments in the payments table for each account
            const accountsWithPayments = await Promise.all(accounts.map(async (account) => {
                const { data: payments } = await supabaseAdmin
                    .from('payments')
                    .select('status, completed_at')
                    .eq('player_account_id', account.id)
                    .eq('status', 'completed')
                    .limit(1);
                
                // If there's a completed payment, update the payment status
                if (payments && payments.length > 0) {
                    return {
                        ...account,
                        payment_status: 'completed',
                        payment_date: payments[0].completed_at || account.payment_date
                    };
                }
                
                return account;
            }));

            res.json({
                success: true,
                count: accountsWithPayments.length,
                players: accountsWithPayments
            });

        } catch (error) {
            console.error('❌ Get registered players error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get players: ' + error.message
            });
        }
    });

    // POST /api/player/link-account - Admin creates account for existing player (legacy players)
    app.post('/api/player/link-account', async (req, res) => {
        try {
            const { player_id, email, phone } = req.body;

            if (!player_id || !email || !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Player ID, email, and phone are required'
                });
            }

            // Get the player
            const { data: player, error: playerError } = await supabaseAdmin
                .from('players')
                .select('*')
                .eq('id', player_id)
                .single();

            if (playerError || !player) {
                return res.status(404).json({
                    success: false,
                    message: 'Player not found'
                });
            }

            // Check if player already has an account
            if (player.player_account_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Player already has an account linked'
                });
            }

            // Check if email already exists
            const { data: existingEmail } = await supabaseAdmin
                .from('player_accounts')
                .select('id')
                .eq('email', email)
                .single();

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered to another account'
                });
            }

            // Check if phone already exists
            const { data: existingPhone } = await supabaseAdmin
                .from('player_accounts')
                .select('id')
                .eq('phone', phone)
                .single();

            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone already registered to another account'
                });
            }

            // Default password for legacy players
            const defaultPassword = 'efl2025';

            // Create account for the player
            const { data: newAccount, error: accountError } = await supabaseAdmin
                .from('player_accounts')
                .insert([{
                    name: player.name,
                    phone: phone,
                    email: email,
                    password: defaultPassword,
                    preferred_team: player.team,
                    player_id: player_id,
                    payment_status: 'completed', // Legacy players already paid
                    status: 'active',
                    profile_completed: true,
                    must_change_password: true, // Flag to force password change
                    registration_date: new Date().toISOString(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (accountError) throw accountError;

            // Link account to player
            await supabaseAdmin
                .from('players')
                .update({ player_account_id: newAccount.id })
                .eq('id', player_id);

            console.log(`✅ Account linked for legacy player: ${player.name} (${email})`);

            res.json({
                success: true,
                message: `Account created for ${player.name}. Default password: ${defaultPassword}`,
                account: {
                    id: newAccount.id,
                    name: newAccount.name,
                    email: newAccount.email,
                    phone: newAccount.phone,
                    default_password: defaultPassword
                }
            });

        } catch (error) {
            console.error('❌ Link account error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to link account: ' + error.message
            });
        }
    });

    // POST /api/player/change-password - Change player password
    app.post('/api/player/change-password', async (req, res) => {
        try {
            const { account_id, current_password, new_password } = req.body;

            if (!account_id || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Account ID and new password are required'
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }

            // Get account
            const { data: account, error: fetchError } = await supabaseAdmin
                .from('player_accounts')
                .select('*')
                .eq('id', account_id)
                .single();

            if (fetchError || !account) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            // If not first-time change, verify current password
            if (!account.must_change_password && current_password !== account.password) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            const { error: updateError } = await supabaseAdmin
                .from('player_accounts')
                .update({
                    password: new_password,
                    must_change_password: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', account_id);

            if (updateError) throw updateError;

            console.log(`✅ Password changed for: ${account.name}`);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('❌ Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password: ' + error.message
            });
        }
    });

    // POST /api/player/complete-profile - Complete profile for legacy players (add email/phone)
    app.post('/api/player/complete-profile', async (req, res) => {
        try {
            const { account_id, email, phone } = req.body;

            if (!account_id || !email || !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Account ID, email, and phone are required'
                });
            }

            // Validate email format
            if (!email.includes('@') || email.includes('@placeholder.efl')) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address'
                });
            }

            // Validate phone format
            const phoneRegex = /^254\d{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone must be in format 254XXXXXXXXX'
                });
            }

            // Check if email already exists (for another account)
            const { data: existingEmail } = await supabaseAdmin
                .from('player_accounts')
                .select('id')
                .eq('email', email)
                .neq('id', account_id)
                .single();

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already registered to another account'
                });
            }

            // Check if phone already exists (for another account)
            const { data: existingPhone } = await supabaseAdmin
                .from('player_accounts')
                .select('id')
                .eq('phone', phone)
                .neq('id', account_id)
                .single();

            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'This phone number is already registered to another account'
                });
            }

            // Update account with real email and phone
            const { error: updateError } = await supabaseAdmin
                .from('player_accounts')
                .update({
                    email: email,
                    phone: phone,
                    must_complete_profile: false,
                    profile_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', account_id);

            if (updateError) throw updateError;

            console.log(`✅ Profile completed for account ${account_id}: ${email}, ${phone}`);

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });

        } catch (error) {
            console.error('❌ Complete profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile: ' + error.message
            });
        }
    });

    // POST /api/player/update-profile - Update full profile settings
    app.post('/api/player/update-profile', async (req, res) => {
        try {
            const { account_id, name, username, email, phone, preferred_team, experience_level, bio } = req.body;

            if (!account_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Account ID is required'
                });
            }

            // Validate name (required)
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Name is required'
                });
            }

            // Validate email format if provided
            if (email && !email.includes('@')) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address'
                });
            }

            // Validate phone format if provided
            if (phone && !/^254\d{9}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone must be in format 254XXXXXXXXX'
                });
            }

            // Validate username format if provided
            if (username && !/^[a-zA-Z0-9_]{3,}$/.test(username)) {
                return res.status(400).json({
                    success: false,
                    message: 'Username must be at least 3 characters (letters, numbers, underscore only)'
                });
            }

            // Check if email already exists (for another account)
            if (email) {
                const { data: existingEmail } = await supabaseAdmin
                    .from('player_accounts')
                    .select('id')
                    .eq('email', email)
                    .neq('id', account_id)
                    .single();

                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'This email is already registered to another account'
                    });
                }
            }

            // Check if phone already exists (for another account)
            if (phone) {
                const { data: existingPhone } = await supabaseAdmin
                    .from('player_accounts')
                    .select('id')
                    .eq('phone', phone)
                    .neq('id', account_id)
                    .single();

                if (existingPhone) {
                    return res.status(400).json({
                        success: false,
                        message: 'This phone number is already registered to another account'
                    });
                }
            }

            // Check if username already exists (for another account)
            if (username) {
                const { data: existingUsername } = await supabaseAdmin
                    .from('player_accounts')
                    .select('id')
                    .eq('username', username)
                    .neq('id', account_id)
                    .single();

                if (existingUsername) {
                    return res.status(400).json({
                        success: false,
                        message: 'This username is already taken'
                    });
                }
            }

            // Build update object
            const updates = {
                name: name.trim(),
                updated_at: new Date().toISOString()
            };

            if (username !== undefined) updates.username = username || null;
            if (email !== undefined) updates.email = email || null;
            if (phone !== undefined) updates.phone = phone || null;
            if (preferred_team !== undefined) updates.preferred_team = preferred_team || null;
            if (experience_level !== undefined) updates.experience_level = experience_level || null;
            if (bio !== undefined) updates.bio = bio || null;

            // Mark profile as completed if email and phone are set
            if (email && phone) {
                updates.must_complete_profile = false;
                updates.profile_completed = true;
            }

            // Update account
            const { data: updatedAccount, error: updateError } = await supabaseAdmin
                .from('player_accounts')
                .update(updates)
                .eq('id', account_id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Also update the linked player record if exists
            if (updatedAccount.player_id) {
                await supabaseAdmin
                    .from('players')
                    .update({
                        name: name.trim(),
                        team: preferred_team || null
                    })
                    .eq('id', updatedAccount.player_id);
            }

            console.log(`✅ Profile updated for account ${account_id}: ${name}`);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                account: updatedAccount
            });

        } catch (error) {
            console.error('❌ Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile: ' + error.message
            });
        }
    });

    // GET /api/players/unlinked - Get players without accounts (for admin)
    app.get('/api/players/unlinked', async (req, res) => {
        try {
            const { data: players, error } = await supabaseAdmin
                .from('players')
                .select('id, name, team, photo')
                .is('player_account_id', null)
                .order('name');

            if (error) throw error;

            res.json({
                success: true,
                count: players.length,
                players: players
            });

        } catch (error) {
            console.error('❌ Get unlinked players error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get players: ' + error.message
            });
        }
    });

    console.log('✅ Player auth routes registered');
}

// Auto-generate fixtures for a new player against all existing players
async function generateFixturesForNewPlayer(supabase, newPlayerId, playerName) {
    try {
        // Get all existing players except the new one
        const { data: existingPlayers, error: playersError } = await supabase
            .from('players')
            .select('id, name')
            .neq('id', newPlayerId);

        if (playersError || !existingPlayers || existingPlayers.length === 0) {
            console.log('📅 No existing players to create fixtures against');
            return;
        }

        // Get admin config for fixture settings
        const { data: config } = await supabase
            .from('admin_config')
            .select('*')
            .single();

        const fixtures = [];
        const today = new Date();
        let fixtureDate = new Date(today);
        fixtureDate.setDate(fixtureDate.getDate() + 7); // Start fixtures from next week

        // Create home and away fixtures against each existing player
        for (const opponent of existingPlayers) {
            // Home fixture
            fixtures.push({
                home_player_id: newPlayerId,
                away_player_id: opponent.id,
                date: new Date(fixtureDate).toISOString().split('T')[0],
                time: '14:00',
                venue: 'TBD',
                played: false,
                is_home_leg: true,
                status: 'scheduled',
                created_at: new Date().toISOString()
            });

            fixtureDate.setDate(fixtureDate.getDate() + 1);

            // Away fixture
            fixtures.push({
                home_player_id: opponent.id,
                away_player_id: newPlayerId,
                date: new Date(fixtureDate).toISOString().split('T')[0],
                time: '14:00',
                venue: 'TBD',
                played: false,
                is_home_leg: false,
                status: 'scheduled',
                created_at: new Date().toISOString()
            });

            fixtureDate.setDate(fixtureDate.getDate() + 1);
        }

        // Insert all fixtures
        if (fixtures.length > 0) {
            const { error: insertError } = await supabase
                .from('fixtures')
                .insert(fixtures);

            if (insertError) {
                console.error('❌ Error creating fixtures:', insertError.message);
            } else {
                console.log(`📅 Created ${fixtures.length} fixtures for new player: ${playerName}`);
            }
        }

    } catch (error) {
        console.error('❌ Error generating fixtures:', error.message);
    }
}

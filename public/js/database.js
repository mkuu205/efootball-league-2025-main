// database.js - FINAL FIXED VERSION (Single Supabase Client)
if (DEBUG) console.log('🚀 database.js STARTED loading...');

// Database table keys
export const DB_KEYS = {
    PLAYERS: 'players',
    FIXTURES: 'fixtures', 
    RESULTS: 'results',
    ADMIN_CONFIG: 'admin_config',
    PASSWORD_RESET_TOKENS: 'password_reset_tokens',
    TOURNAMENT_UPDATES: 'tournament_updates'
};

// Single Supabase Client Instance
let supabaseClient = null;
let supabaseInitialized = false;
let databaseInitialized = false;

// Supabase Configuration
const DEBUG = false; // set to true to enable debug logs

const SUPABASE_URL = 'https://zliedzrqzvywlsyfggcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI';

// SINGLE SUPABASE CLIENT FUNCTION
export function getSupabase() {
    if (!supabaseClient) {
        if (DEBUG) console.log('🔥 Creating SINGLE Supabase client instance...');
        
        // Use global supabase if available (from CDN)
        if (typeof window !== 'undefined' && window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    storageKey: 'kishtech-token',
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            if (DEBUG) console.log('✅ Supabase SINGLE client created via window.supabase');
        } else {
            console.error('❌ window.supabase not available - make sure CDN script is loaded first');
            throw new Error('Supabase CDN not loaded');
        }
        
        supabaseInitialized = true;
    }
    return supabaseClient;
}

// Default admin configuration
export const DEFAULT_ADMIN_CONFIG = {
    id: 1,
    tournament_name: 'Premier League Tournament',
    season: '2025',
    max_players_per_team: 2,
    points_for_win: 3,
    points_for_draw: 1,
    allow_player_registration: true,
    show_leaderboard: true,
    maintenance_mode: false,
    password: 'admin123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

// Wait for Supabase to be initialized
export async function ensureSupabaseInitialized() {
    if (!supabaseInitialized) {
        getSupabase(); // This will initialize it
    }
    return supabaseClient !== null;
}

// Core Database Functions
export async function getData(tableName, forceRefresh = false) {
    // Validate tableName
    if (!tableName || tableName === 'undefined' || typeof tableName !== 'string') {
        console.warn('⚠️ getData called with invalid tableName:', tableName);
        return [];
    }
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Supabase not available for getData');
        return [];
    }
    
    try {
        if (DEBUG) console.log(`📋 Fetching data from table: ${tableName}`);
        
        // Special handling for players table to sync photos from player_accounts
        if (tableName === 'players') {
            const { data, error } = await supabaseClient
                .from(tableName)
                .select('*');
            
            if (error) {
                console.error(`Error getting ${tableName}:`, error);
                return [];
            }
            
            // Fetch player_accounts to get latest photo_url
            const { data: accounts } = await supabaseClient
                .from('player_accounts')
                .select('player_id, photo_url');
            
            // Merge photo_url from accounts into players
            const result = (data || []).map(player => {
                const account = accounts?.find(acc => acc.player_id === player.id);
                if (account && account.photo_url) {
                    return { ...player, photo: account.photo_url };
                }
                return player;
            });
            
            if (DEBUG) console.log(`✅ Retrieved ${result.length} players with synced photos`);
            return result;
        }
        
        // Default behavior for other tables
        const { data, error } = await supabaseClient.from(tableName).select('*');
        if (error) {
            console.error(`Error getting ${tableName}:`, error);
            return [];
        }
        
        const result = data || [];
        if (DEBUG) console.log(`✅ Retrieved ${result.length} records from ${tableName}`);
        return result;
    } catch (err) {
        console.error(`Error in getData for ${tableName}:`, err);
        return [];
    }
}

// Save data to Supabase
export async function saveData(tableName, data) {
    if (!tableName || tableName === 'undefined' || typeof tableName !== 'string') {
        console.error('Invalid table name:', tableName);
        return [];
    }
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Supabase not available for saveData');
        return [];
    }
    
    try {
        if (DEBUG) console.log(`💾 Saving data to table: ${tableName}`, data);
        
        if (Array.isArray(data) && data.length > 0) {
            const { data: result, error } = await supabaseClient.from(tableName).insert(data).select();
            if (error) throw error;
            if (DEBUG) console.log(`✅ Inserted ${result?.length || 0} records into ${tableName}`);
            return result;
        } else {
            const { data: result, error } = await supabaseClient.from(tableName).upsert(data).select();
            if (error) throw error;
            if (DEBUG) console.log(`✅ Upserted record into ${tableName}`);
            return result;
        }
    } catch (error) {
        console.error(`Error saving to ${tableName}:`, error);
        throw error;
    }
}

// Update data in Supabase
export async function updateData(tableName, updates, id) {
    if (!tableName || tableName === 'undefined' || typeof tableName !== 'string') {
        console.error('Invalid table name:', tableName);
        return null;
    }
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Supabase not available for updateData');
        return null;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from(tableName)
            .update(updates)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
    }
}

// Delete data from Supabase
export async function deleteData(tableName, id) {
    if (!tableName || tableName === 'undefined' || typeof tableName !== 'string') {
        console.error('Invalid table name:', tableName);
        return false;
    }
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Supabase not available for deleteData');
        return false;
    }
    
    try {
        const { error } = await supabaseClient.from(tableName).delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error(`Error deleting from ${tableName}:`, error);
        throw error;
    }
}

// Get current admin password from database
export async function getCurrentPassword() {
    try {
        if (!await ensureSupabaseInitialized()) {
            console.warn('⚠️ Supabase not available for password check');
            throw new Error('Database not available');
        }

        const adminConfig = await getData(DB_KEYS.ADMIN_CONFIG);
        if (!adminConfig || adminConfig.length === 0) {
            throw new Error('Admin password not configured!');
        }
        return adminConfig[0].password;
    } catch (error) {
        console.error('❌ Error getting admin password:', error);
        throw error;
    }
}

// Update admin password
export async function updateAdminPassword(newPassword) {
    try {
        if (!await ensureSupabaseInitialized()) {
            throw new Error('Supabase not available');
        }

        const config = await getData(DB_KEYS.ADMIN_CONFIG);
        let adminConfig = config && config.length > 0 ? config[0] : {
            id: 1,
            tournament_name: 'Premier League Tournament',
            season: '2025',
            max_players_per_team: 2,
            points_for_win: 3,
            points_for_draw: 1,
            allow_player_registration: true,
            show_leaderboard: true,
            maintenance_mode: false,
            password: 'admin123',
            created_at: new Date().toISOString()
        };

        adminConfig.password = newPassword;
        adminConfig.updated_at = new Date().toISOString();

        await saveData(DB_KEYS.ADMIN_CONFIG, [adminConfig]);
        return true;
    } catch (error) {
        console.error('❌ Error updating admin password:', error);
        throw error;
    }
}

// Initialize database with default data
export async function initializeDatabase() {
    if (databaseInitialized) {
        if (DEBUG) console.log('⚙️ Database already initialized, skipping...');
        return;
    }
    
    if (DEBUG) console.log('⚙️ Initializing Supabase database...');
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Cannot initialize database: Supabase not available');
        return;
    }

    try {
        // Initialize admin config only
        let existingConfig = [];
        try {
            existingConfig = await getData(DB_KEYS.ADMIN_CONFIG);
        } catch (err) {
            console.warn('Could not fetch admin config:', err.message);
        }
        
        if (!existingConfig || existingConfig.length === 0) {
            if (DEBUG) console.log('Setting up default admin configuration...');
            try {
                await saveData(DB_KEYS.ADMIN_CONFIG, [DEFAULT_ADMIN_CONFIG]);
                if (DEBUG) console.log('✅ Default admin configuration inserted');
            } catch (err) {
                console.error('Failed to insert admin config:', err);
            }
        } else {
            // Ensure existing config has password field
            const existing = existingConfig[0];
            if (!existing.password) {
                if (DEBUG) console.log('Adding password field to existing admin configuration...');
                existing.password = 'admin123';
                existing.updated_at = new Date().toISOString();
                await saveData(DB_KEYS.ADMIN_CONFIG, [existing]);
            }
            if (DEBUG) console.log('✅ Admin configuration already exists');
        }

        // Mark database as initialized
        databaseInitialized = true;
        if (DEBUG) console.log('✅ Database initialization completed');

    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

// Admin Configuration Management
export async function getAdminConfig() {
    try {
        const config = await getData(DB_KEYS.ADMIN_CONFIG);
        return config && config.length > 0 ? config[0] : DEFAULT_ADMIN_CONFIG;
    } catch (error) {
        console.error('Error getting admin config:', error);
        return DEFAULT_ADMIN_CONFIG;
    }
}

export async function updateAdminConfig(updates) {
    if (!await ensureSupabaseInitialized()) return null;
    try {
        const currentConfig = await getAdminConfig();
        const updatedConfig = {
            ...currentConfig,
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from(DB_KEYS.ADMIN_CONFIG)
            .upsert(updatedConfig)
            .select();
            
        if (error) throw error;
        
        await refreshAllDisplays();
        return data[0];
    } catch (err) {
        console.error('Error updating admin config:', err);
        throw err;
    }
}

// Player Management
export async function addPlayer(playerData) {
    const players = await getData(DB_KEYS.PLAYERS);
    const isDuplicate = players.some(p => 
        p.name.toLowerCase() === playerData.name.toLowerCase() && 
        p.team.toLowerCase() === playerData.team.toLowerCase()
    );
    
    if (isDuplicate) {
        throw new Error(`Player "${playerData.name}" already exists in team ${playerData.team}`);
    }

    const maxId = players.length > 0 ? Math.max(...players.map(p => p.id || 0)) : 0;
    const newPlayer = {
        name: playerData.name,
        team: playerData.team,
        strength: playerData.strength,
        id: maxId + 1,
        photo: playerData.photo || `https://ui-avatars.com/api/?name=${playerData.name.charAt(0)}&background=6a11cb&color=fff&size=150`,
        default_photo: playerData.photo || `https://ui-avatars.com/api/?name=${playerData.name.charAt(0)}&background=6a11cb&color=fff&size=150`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const inserted = await saveData(DB_KEYS.PLAYERS, [newPlayer]);
    if (DEBUG) console.log('Player added:', newPlayer.name);

    // If email and phone are provided, create a player account
    if (playerData.email && playerData.phone) {
        try {
            const defaultPassword = '2025'; // Default password for admin-added players
            const { data: newAccount, error: accountError } = await supabaseClient
                .from('player_accounts')
                .insert([{
                    name: playerData.name,
                    email: playerData.email,
                    phone: playerData.phone,
                    preferred_team: playerData.team,
                    player_id: inserted[0].id,
                    password: defaultPassword,
                    payment_status: 'completed', // Admin-added players are already paid
                    status: 'active',
                    profile_completed: true,
                    must_change_password: true, // Force password change on first login
                    registration_date: new Date().toISOString(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (accountError) {
                console.error('⚠️ Could not create player account:', accountError.message);
            } else {
                // Link account to player
                await supabaseClient
                    .from(DB_KEYS.PLAYERS)
                    .update({ player_account_id: newAccount.id })
                    .eq('id', inserted[0].id);
                if (DEBUG) console.log(`✅ Player account created for ${playerData.name} (default password: ${defaultPassword})`);
            }
        } catch (err) {
            console.error('⚠️ Error creating player account:', err);
        }
    }

    await refreshAllDisplays();
    return inserted[0];
}

// FIXED: Update player function - removes id from update data
export async function updatePlayer(player) {
    if (!await ensureSupabaseInitialized()) return null;
    try {
        // Create a copy of the player data WITHOUT the id field
        const { id, ...updateData } = player;
        
        if (DEBUG) console.log('🔄 Updating player:', { playerId: id, updateData });
        
        const { data, error } = await supabaseClient
            .from(DB_KEYS.PLAYERS)
            .update({ 
                ...updateData, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', id)
            .select();
            
        if (error) throw error;
        await refreshAllDisplays();
        return data[0];
    } catch (err) {
        console.error('❌ Error updating player:', err);
        throw err;
    }
}

export async function deletePlayer(playerId) {
    if (!await ensureSupabaseInitialized()) return false;
    try {
        // Delete related results first
        await supabaseClient.from(DB_KEYS.RESULTS).delete().or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`);
        
        // Delete related fixtures
        await supabaseClient.from(DB_KEYS.FIXTURES)
            .delete()
            .or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`);
            
        // Delete player
        const { error } = await supabaseClient.from(DB_KEYS.PLAYERS).delete().eq('id', playerId);
        
        if (error) throw error;
        
        await refreshAllDisplays();
        return true;
    } catch (err) {
        console.error('Error deleting player:', err);
        throw err;
    }
}

// Fixture Management - FIXED TIME ISSUE
export async function addFixture(fixture) {
    if (!await ensureSupabaseInitialized()) return null;
    try {
        if (DEBUG) console.log('🔄 Adding fixture:', fixture);
        
        // Prepare fixture data for database - handle time field properly
        const fixtureData = {
            home_player_id: fixture.home_player_id,
            away_player_id: fixture.away_player_id,
            date: fixture.date,
            venue: fixture.venue,
            played: fixture.played || false,
            is_home_leg: fixture.is_home_leg !== undefined ? fixture.is_home_leg : true,
            status: fixture.status || 'scheduled',
            created_at: fixture.created_at || new Date().toISOString(),
            updated_at: fixture.updated_at || new Date().toISOString()
        };
        
        // Handle time field - only include if it's a valid format
        // If time column is causing timestamp issues, use match_time instead or omit
        if (fixture.time && typeof fixture.time === 'string') {
            // For time strings like "14:00", use as is if column is text type
            fixtureData.time = fixture.time;
        }
        
        const { data, error } = await supabaseClient
            .from(DB_KEYS.FIXTURES)
            .insert(fixtureData)
            .select();
            
        if (error) throw error;
        
        await refreshAllDisplays();
        return data[0];
    } catch (error) {
        console.error('Error adding fixture:', error);
        throw error;
    }
}

export async function updateFixture(fixture) {
    if (!await ensureSupabaseInitialized()) return null;
    try {
        // Create a copy without id for update
        const { id, ...updateData } = fixture;
        
        if (DEBUG) console.log('🔄 Updating fixture:', { fixtureId: id, updateData });
        
        const { data, error } = await supabaseClient
            .from(DB_KEYS.FIXTURES)
            .update({ 
                ...updateData, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', id)
            .select();
            
        if (error) throw error;
        await refreshAllDisplays();
        return data[0];
    } catch (error) {
        console.error('Error updating fixture:', error);
        throw error;
    }
}

export async function deleteFixture(fixtureId) {
    if (!await ensureSupabaseInitialized()) return false;
    try {
        const { error } = await supabaseClient.from(DB_KEYS.FIXTURES).delete().eq('id', fixtureId);
        if (error) throw error;
        await refreshAllDisplays();
        return true;
    } catch (error) {
        console.error('Error deleting fixture:', error);
        throw error;
    }
}

// Get fixtures by player ID
export async function getFixturesByPlayerId(playerId) {
    if (!await ensureSupabaseInitialized()) return [];
    try {
        const { data, error } = await supabaseClient
            .from(DB_KEYS.FIXTURES)
            .select('*')
            .or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting fixtures by player:', error);
        return [];
    }
}

// Get upcoming fixtures
export async function getUpcomingFixtures(days = 7) {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);
    
    return fixtures
        .filter(f => !f.played && new Date(f.date) <= endDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Get fixtures by date range
export async function getFixturesByDateRange(startDate, endDate) {
    if (!await ensureSupabaseInitialized()) return [];
    try {
        const { data, error } = await supabaseClient
            .from(DB_KEYS.FIXTURES)
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting fixtures by date range:', error);
        return [];
    }
}

// Result Management
export async function addResult(result) {
    const results = await getData(DB_KEYS.RESULTS);
    const maxId = results.length > 0 ? Math.max(...results.map(r => r.id || 0)) : 0;
    
    const newResult = {
        ...result,
        id: maxId + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const inserted = await saveData(DB_KEYS.RESULTS, [newResult]);
    
    // Mark corresponding fixture as played
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const fixture = fixtures.find(f => 
        f.home_player_id === result.home_player_id && 
        f.away_player_id === result.away_player_id
    );
    
    if (fixture) {
        await updateFixture({ 
            ...fixture, 
            played: true,
            status: 'completed'
        });
    }
    
    await refreshAllDisplays();
    return inserted[0];
}

export async function updateResult(result) {
    if (!await ensureSupabaseInitialized()) return null;
    const { data, error } = await supabaseClient
        .from(DB_KEYS.RESULTS)
        .update({ 
            ...result, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', result.id)
        .select();
        
    if (error) throw error;
    await refreshAllDisplays();
    return data[0];
}

export async function deleteResult(resultId) {
    if (!await ensureSupabaseInitialized()) return false;
    const { error } = await supabaseClient.from(DB_KEYS.RESULTS).delete().eq('id', resultId);
    if (error) throw error;
    await refreshAllDisplays();
    return true;
}

// Helper Functions
export async function getPlayerById(playerId) {
    const players = await getData(DB_KEYS.PLAYERS);
    return players.find(p => p.id === playerId);
}

export async function getFixtureById(fixtureId) {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    return fixtures.find(f => f.id === fixtureId);
}

export async function getResultById(resultId) {
    const results = await getData(DB_KEYS.RESULTS);
    return results.find(r => r.id === resultId);
}

export function getDefaultStats() {
    return { 
        played: 0, 
        wins: 0, 
        draws: 0, 
        losses: 0, 
        goalsFor: 0, 
        goalsAgainst: 0, 
        goalDifference: 0, 
        points: 0 
    };
}

// Statistics & League Table
export async function calculatePlayerStats(playerId) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        
        if (!Array.isArray(results)) {
            console.error('Results data is not an array:', results);
            return getDefaultStats();
        }

        const playerResults = results.filter(r => 
            r && (r.home_player_id === playerId || r.away_player_id === playerId)
        );

        let stats = getDefaultStats();
        
        playerResults.forEach(result => {
            if (!result) return;
            
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? (result.home_score || 0) : (result.away_score || 0);
            const opponentScore = isHome ? (result.away_score || 0) : (result.home_score || 0);

            stats.played++;
            stats.goalsFor += playerScore;
            stats.goalsAgainst += opponentScore;

            if (playerScore > opponentScore) {
                stats.wins++;
                stats.points += 3;
            } else if (playerScore === opponentScore) {
                stats.draws++;
                stats.points += 1;
            } else {
                stats.losses++;
            }
        });

        stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
        return stats;
    } catch (error) {
        console.error('Error calculating player stats:', error);
        return getDefaultStats();
    }
}

export async function getRecentForm(playerId, matches = 5) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        
        if (!Array.isArray(results)) {
            console.error('Results data is not an array in getRecentForm:', results);
            return [];
        }

        const playerResults = results
            .filter(r => r && (r.home_player_id === playerId || r.away_player_id === playerId))
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, matches);

        return playerResults.map(result => {
            if (!result) return 'N';
            
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? (result.home_score || 0) : (result.away_score || 0);
            const opponentScore = isHome ? (result.away_score || 0) : (result.home_score || 0);

            if (playerScore > opponentScore) return 'W';
            if (playerScore === opponentScore) return 'D';
            return 'L';
        }).reverse();
    } catch (error) {
        console.error('Error getting recent form:', error);
        return [];
    }
}

export async function getLeagueTable() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        
        if (!Array.isArray(players)) {
            console.error('Players data is not an array:', players);
            return [];
        }

        if (players.length === 0) {
            if (DEBUG) console.log('No players found for league table');
            return [];
        }

        const tableData = await Promise.all(players.map(async p => {
            const stats = await calculatePlayerStats(p.id);
            const form = await getRecentForm(p.id);
            return { ...p, ...stats, form };
        }));

        return tableData.sort((a, b) => 
            b.points - a.points || 
            b.goalDifference - a.goalDifference || 
            b.goalsFor - a.goalsFor
        );
    } catch (error) {
        console.error('Error generating league table:', error);
        return [];
    }
}

// Refresh UI & Subscriptions
export async function refreshAllDisplays() {
    try {
        if (DEBUG) console.log('Refreshing all displays...');
        
        // Refresh admin displays if on admin page
        if (window.location.pathname.includes('admin.html')) {
            if (typeof window.renderAdminPlayers === 'function') {
                await window.renderAdminPlayers();
            }
            if (typeof window.renderAdminFixtures === 'function') {
                await window.renderAdminFixtures();
            }
            if (typeof window.renderAdminResults === 'function') {
                await window.renderAdminResults();
            }
            if (typeof window.populatePlayerSelects === 'function') {
                await window.populatePlayerSelects();
            }
            if (typeof window.updateAdminStatistics === 'function') {
                await window.updateAdminStatistics();
            }
        } else {
            // Refresh main site displays
            if (typeof window.renderHomePage === 'function') {
                await window.renderHomePage();
            }
            if (typeof window.renderFixtures === 'function') {
                await window.renderFixtures();
            }
            if (typeof window.renderResults === 'function') {
                await window.renderResults();
            }
            if (typeof window.renderLeagueTable === 'function') {
                await window.renderLeagueTable();
            }
            if (typeof window.renderPlayers === 'function') {
                await window.renderPlayers();
            }
        }
        
        showNotification('Data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error refreshing displays:', error);
        showNotification('Error refreshing data', 'error');
    }
}

// Subscribe to database changes
export function subscribeToChanges(callback) {
    if (!supabaseClient) return null;
    
    try {
        return supabaseClient.channel('schema-db-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public' }, 
                payload => {
                    if (DEBUG) console.log('DB change detected', payload);
                    if (callback) callback(payload);
                    refreshAllDisplays();
                }
            ).subscribe();
    } catch (error) {
        console.error('Error setting up database subscription:', error);
        return null;
    }
}

// Data Management Functions
export async function exportTournamentData() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const results = await getData(DB_KEYS.RESULTS);
        
        const data = {
            players,
            fixtures,
            results,
            exportDate: new Date().toISOString(),
            tournament: 'eFootball League 2025',
            version: '3.0',
            database: 'Supabase'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `efootball_tournament_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Tournament data exported successfully!', 'success');
        return data;
    } catch (error) {
        console.error('Error exporting tournament data:', error);
        showNotification('Error exporting data: ' + error.message, 'error');
        throw error;
    }
}

export async function importTournamentData(data) {
    try {
        if (!data.players || !data.fixtures || !data.results) {
            throw new Error('Invalid tournament data format');
        }
        
        showNotification('Importing data to Supabase...', 'info');
        
        // Clear existing data
        await supabaseClient.from(DB_KEYS.RESULTS).delete().neq('id', 0);
        await supabaseClient.from(DB_KEYS.FIXTURES).delete().neq('id', 0);
        await supabaseClient.from(DB_KEYS.PLAYERS).delete().neq('id', 0);
        
        // Import new data
        if (data.players && data.players.length > 0) {
            await saveData(DB_KEYS.PLAYERS, data.players);
        }
        if (data.fixtures && data.fixtures.length > 0) {
            await saveData(DB_KEYS.FIXTURES, data.fixtures);
        }
        if (data.results && data.results.length > 0) {
            await saveData(DB_KEYS.RESULTS, data.results);
        }
        
        await refreshAllDisplays();
        showNotification('Tournament data imported successfully to Supabase!', 'success');
        return true;
    } catch (error) {
        console.error('Error importing tournament data:', error);
        showNotification('Error importing data: ' + error.message, 'error');
        throw error;
    }
}

export async function resetAllResults() {
    if (!confirm('Are you sure you want to clear all match results? This cannot be undone.')) {
        return false;
    }
    
    try {
        // Delete all results
        await supabaseClient.from(DB_KEYS.RESULTS).delete().neq('id', 0);
        
        // Reset all fixtures to not played
        const fixtures = await getData(DB_KEYS.FIXTURES);
        for (const fixture of fixtures) {
            await updateFixture({
                ...fixture,
                played: false,
                status: 'scheduled'
            });
        }
        
        await refreshAllDisplays();
        showNotification('All results cleared successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error resetting results:', error);
        showNotification('Error resetting results', 'error');
        return false;
    }
}

export async function resetTournament() {
    if (!confirm('Are you sure you want to reset the entire tournament? This will delete ALL fixtures and results but KEEP players. This cannot be undone.')) {
        return false;
    }
    
    try {
        // Delete fixtures and results but KEEP players
        await supabaseClient.from(DB_KEYS.RESULTS).delete().neq('id', 0);
        await supabaseClient.from(DB_KEYS.FIXTURES).delete().neq('id', 0);
        // REMOVED: Player deletion line to preserve players
        
        // Reinitialize with default data (this will keep existing players)
        databaseInitialized = false; // Reset flag
        await initializeDatabase();
        
        await refreshAllDisplays();
        showNotification('Tournament reset successfully! Players preserved.', 'success');
        return true;
    } catch (error) {
        console.error('Error resetting tournament:', error);
        showNotification('Error resetting tournament', 'error');
        return false;
    }
}

// Utilities
export function formatDisplayDate(dateString) {
    if (!dateString) return 'TBD';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

export function showNotification(message, type = 'info') {
    if (typeof document === 'undefined') return;
    
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    const notification = document.createElement('div');
    notification.className = `custom-notification alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px; 
        right: 20px; 
        z-index: 1060; 
        min-width: 300px; 
        max-width: 400px;
        background: ${type === 'success' ? '#198754' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#0dcaf0'};
        color: white;
        border: none;
    `;
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
            <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => { 
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Data Sync System
export class DataSync {
    constructor() {
        this.lastUpdate = localStorage.getItem('efl_last_sync') || null;
    }

    async manualSync() {
        showNotification('🔄 Refreshing data from Supabase...', 'info');
        
        try {
            await refreshAllDisplays();
            this.lastUpdate = new Date().toISOString();
            localStorage.setItem('efl_last_sync', this.lastUpdate);
            showNotification('✅ Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Sync failed:', error);
            showNotification('❌ Sync failed. Please try again.', 'error');
        }
    }
}

// Create global data sync instance
export const dataSync = new DataSync();

// Make functions globally available for onclick events
window.refreshAllDisplays = refreshAllDisplays;
window.exportTournamentData = exportTournamentData;
window.resetAllResults = resetAllResults;
window.resetTournament = resetTournament;
window.dataSync = dataSync;

// Initialize Database on DOM Loaded
if (typeof document !== 'undefined') {
    let domInitialized = false;
    
    document.addEventListener('DOMContentLoaded', async function() {
        if (domInitialized) {
            if (DEBUG) console.log('📦 DOM already initialized, skipping...');
            return;
        }
        
        if (DEBUG) console.log('📦 DOM loaded, initializing Supabase...');
        domInitialized = true;
        
        // Initialize Supabase
        try {
            await ensureSupabaseInitialized();
            if (DEBUG) console.log('✅ Supabase ready');
        } catch (error) {
            console.error('❌ Supabase initialization error:', error);
        }
    });
}

if (DEBUG) console.log('✅ database.js COMPLETED loading - all functions available');

// =======================================================
//  COMPATIBILITY PATCH FOR admin.html + advanced-stats.js
// =======================================================

// -------------------- DATABASE CORE --------------------
window.getData = getData;
window.saveData = saveData;
window.updateData = updateData;
window.deleteData = deleteData;

// -------------------- LOOKUP HELPERS -------------------
window.getPlayerById = getPlayerById;
window.getFixtureById = getFixtureById;
window.getResultById = getResultById;

// -------------------- LEAGUE & STATS -------------------
window.calculatePlayerStats = calculatePlayerStats;
window.getRecentForm = getRecentForm;
window.getLeagueTable = getLeagueTable;

// -------------------- GLOBAL CONFIG -------------------
window.DB_KEYS = DB_KEYS;

// -------------------- REFRESH SYSTEM ------------------
window.refreshAllDisplays = refreshAllDisplays;

// -------------------- DATA SYNC -----------------------
window.dataSync = dataSync;

// -------------------- PASSWORD MANAGEMENT -------------
window.getCurrentPassword = getCurrentPassword;
window.updateAdminPassword = updateAdminPassword;

// -------------------- ADMIN CONFIG --------------------
window.getAdminConfig = getAdminConfig;
window.updateAdminConfig = updateAdminConfig;
window.initializeDatabase = initializeDatabase;

// -------------------- TOURNAMENT FUNCTIONS -----------
window.resetTournament = resetTournament;
window.resetAllResults = resetAllResults;
window.exportTournamentData = exportTournamentData;

// -------------------- FIXTURE FUNCTIONS ---------------
window.addFixture = addFixture;
window.updateFixture = updateFixture;
window.deleteFixture = deleteFixture;
window.getFixturesByPlayerId = getFixturesByPlayerId;
window.getUpcomingFixtures = getUpcomingFixtures;
window.getFixturesByDateRange = getFixturesByDateRange;

// -------------------- ADVANCED STATS FIX -------------
if (window.advancedStats && typeof window.advancedStats.populatePlayerSelects === 'function') {
    window.populatePlayerSelects = window.advancedStats.populatePlayerSelects.bind(window.advancedStats);
} else {
    window.populatePlayerSelects = function() {
        console.warn('populatePlayerSelects not available - advancedStats not loaded');
    };
}

// -------------------- FIXTURE MANAGER -----------------
// Attach globally after fixtureManager is initialized
function initFixtureManagerGlobals() {
    if (typeof fixtureManager !== 'undefined') {
        window.fixtureManager = fixtureManager;
        window.generateOptimizedFixtures = () => fixtureManager.generateOptimizedFixtures();
        window.showFixtureReport = () => fixtureManager.showFixtureReport();
        window.checkFixtureConflicts = () => fixtureManager.detectDateConflicts();
        window.showRescheduleTool = () => fixtureManager.showRescheduleTool();
        if (DEBUG) console.log('✅ fixtureManager functions exposed globally');
    } else {
        // Retry after 500ms until fixtureManager exists
        setTimeout(initFixtureManagerGlobals, 500);
    }
}

// Run it once
initFixtureManagerGlobals();
